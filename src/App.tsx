
import React, { useEffect, useMemo, useState } from 'react'
import { nanoid } from 'nanoid'
import type { DB, Player, Court, Match, Draw, Reservation, Coach, CoachingSession, Club } from './types'

declare global {
  interface Window {
    courtly: {
      readDb: () => Promise<DB>,
      writeDb: (patch: Partial<DB>) => Promise<DB>,
      schedulePropose: (payload: { slotStartISO: string, durationMin: number, courtId: number }) => Promise<{ ok: boolean, error?: string }>,
      reservationValidate: (payload: { startISO: string, durationMin: number, courtId: number }) => Promise<{ ok: boolean, error?: string }>
    }
  }
}

const AVAILABLE_CLUBS: Club[] = [
  { id: '1', name: 'Li Chaoping Tennis Academy' },
  { id: '2', name: 'ANC Tennis Academy' },
  { id: '3', name: 'Gorin Tennis' }
]

const defaultCourts: Court[] = Array.from({length:14}, (_,i)=>{
  const id = i+1
  const unlit = [11,12,13,14] // last 4 no lights
  return { id, name: `Court ${id}`, hasLights: !unlit.includes(id) }
})

function TabButton({label, active, onClick}:{label:string, active:boolean, onClick:()=>void}){
  return <button 
    onClick={onClick} 
    style={{
      padding: '12px 24px', 
      borderRadius: 8, 
      background: active ? 'linear-gradient(135deg, #6a1b9a 0%, #4a148c 100%)' : '#ffffff',
      color: active ? '#ffffff' : '#2d2d2d',
      border: active ? '2px solid #d4af37' : '2px solid #e9ecef',
      fontWeight: active ? 700 : 500,
      fontSize: 14,
      letterSpacing: '0.3px',
      transition: 'all 0.3s ease',
      boxShadow: active ? '0 4px 12px rgba(106, 27, 154, 0.25)' : '0 2px 4px rgba(0,0,0,0.05)'
    }}
  >
    {label}
  </button>
}

export default function App(){
  const [db, setDb] = useState<DB | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'Registration'|'Courts'|'Reservations'|'Coaching'>('Reservations')
  
  // Reset tab to Reservations whenever club changes (including when returning to home)
  useEffect(() => {
    if (db?.currentClub) {
      setTab('Reservations')
    }
  }, [db?.currentClub?.id])
  
  useEffect(()=>{
    console.log('App useEffect running')
    console.log('window.courtly exists?', !!window.courtly)
    
    // Check if window.courtly exists
    if (!window.courtly) {
      console.error('window.courtly is not defined. Check electron/preload.js')
      setError('Electron bridge not available. Running in browser mode is not supported.')
      return
    }
    
    console.log('Calling window.courtly.readDb()')
    window.courtly.readDb()
      .then(d => {
        console.log('Database loaded successfully:', d)
        // Ensure courts exist; seed defaults if empty
        if (!d.settings?.courts || d.settings.courts.length === 0){
          d.settings = d.settings || ({} as any)
          d.settings.courts = defaultCourts
        }
        // Ensure new fields exist
        if (!d.reservations) d.reservations = []
        if (!d.coaches) d.coaches = []
        if (!d.coachingSessions) d.coachingSessions = []
        // Always start at home page (no club selected)
        d.currentClub = undefined
        setDb(d)
      })
      .catch(err => {
        console.error('Failed to load database:', err)
        setError(`Failed to load database: ${err.message}`)
      })
  },[])

  const save = async (patch: Partial<DB>) => {
    const next = await window.courtly.writeDb(patch)
    setDb(next)
  }

  if (error) return <div style={{padding:20, color: 'red'}}>
    <h2>Error Loading Courtly</h2>
    <p>{error}</p>
    <p style={{fontSize:12, color:'#666'}}>Check the console for more details.</p>
  </div>

  if (!db) return <div style={{padding:20}}>Loading Courtly…</div>

  // Show home page if no club is selected
  if (!db.currentClub) {
    return <HomePage db={db} onSave={save} clubs={AVAILABLE_CLUBS} />
  }

  return (
    <div style={{ fontFamily: 'Montserrat, system-ui', background: '#ffffff', minHeight: '100vh' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #0d3b26 0%, #1a5c3e 100%)', 
        padding: '24px 32px',
        borderBottom: '4px solid #d4af37',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1400, margin: '0 auto' }}>
          <div>
            <h1 style={{ fontSize: 42, fontWeight: 700, marginBottom: 4, color: '#ffffff', fontFamily: 'Cinzel, serif', letterSpacing: '2px' }}>
              🎾 COURTLY
            </h1>
            <div style={{ fontSize: 13, color: '#d4af37', fontWeight: 500, letterSpacing: '2.5px', fontFamily: 'Montserrat, sans-serif' }}>
              {db.currentClub.name.toUpperCase()}
            </div>
          </div>
          <button 
            onClick={() => save({ currentClub: undefined })} 
            style={{ 
              padding: '12px 28px', 
              borderRadius: 8, 
              background: 'rgba(255,255,255,0.15)', 
              backdropFilter: 'blur(10px)',
              color: '#ffffff', 
              fontSize: 13,
              border: '2px solid rgba(212, 175, 55, 0.5)',
              fontWeight: 600,
              letterSpacing: '1px',
              fontFamily: 'Montserrat, sans-serif'
            }}
          >
            CHANGE CLUB
          </button>
        </div>
      </div>
      
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '32px' }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom: 32, background: '#f8f9fa', padding: 16, borderRadius: 12, border: '2px solid #e9ecef' }}>
          {['Reservations','Coaching','Registration','Courts'].map(t => (
            <TabButton key={t} label={t} active={tab===t} onClick={()=>setTab(t as any)} />
          ))}
        </div>
      {tab==='Reservations' && <CourtReservations db={db} onSave={save}/>}
      {tab==='Coaching' && <Coaching db={db} onSave={save}/>}
      {tab==='Registration' && <Registration db={db} onSave={save}/>}
      {tab==='Courts' && <Courts db={db} onSave={save}/>}
      </div>
      
      <div style={{ marginTop: 32, padding: '24px 32px', background: 'linear-gradient(135deg, #0d3b26 0%, #1a5c3e 100%)', color: '#d4af37', fontSize: 12, borderTop: '4px solid #d4af37' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ marginBottom: 8, fontWeight: 600, color: '#ffffff' }}>Match Formats</div>
          <div>RR = one pro set to 8, TB10 at 7–7, no-ad. SE = BO3 sets with 10-point match tiebreak as deciding set.</div>
        </div>
      </div>
    </div>
  )
}

function Registration({db, onSave}:{db:DB, onSave:(p:Partial<DB>)=>void}){
  const [p,setP] = useState({ firstName:'', lastName:'', school:'', gender:'M' as Player['gender'] })
  const [msg, setMsg] = useState('')
  
  const add = ()=>{
    if (!p.firstName || !p.lastName) return
    
    // Check if player already exists in THIS club
    const existingInThisClub = db.players.find(player => 
      player.clubId === db.currentClub?.id &&
      player.firstName.toLowerCase() === p.firstName.toLowerCase() && 
      player.lastName.toLowerCase() === p.lastName.toLowerCase()
    )
    
    if (existingInThisClub) {
      setMsg(`⚠️ ${p.firstName} ${p.lastName} is already registered with this club`)
      setTimeout(() => setMsg(''), 5000)
      return
    }
    
    // Check if player exists in other clubs (just for info)
    const existingInOtherClub = db.players.find(player => 
      player.clubId !== db.currentClub?.id &&
      player.firstName.toLowerCase() === p.firstName.toLowerCase() && 
      player.lastName.toLowerCase() === p.lastName.toLowerCase()
    )
    
    const np: Player = { 
      id: nanoid(), 
      ...p,
      clubId: db.currentClub!.id 
    }
    onSave({ players: [...db.players, np], schools: Array.from(new Set([...(db.schools||[]), p.school].filter(Boolean))) })
    setP({ firstName:'', lastName:'', school:p.school, gender:p.gender })
    
    if (existingInOtherClub) {
      const otherClubName = AVAILABLE_CLUBS.find(c => c.id === existingInOtherClub.clubId)?.name || 'another club'
      setMsg(`✓ ${np.firstName} ${np.lastName} registered successfully (also registered with ${otherClubName})`)
    } else {
      setMsg(`✓ ${np.firstName} ${np.lastName} registered successfully`)
    }
    setTimeout(() => setMsg(''), 4000)
  }
  
  const deletePlayer = (id: string) => {
    if (confirm('Delete this player? This cannot be undone.')) {
      onSave({ players: db.players.filter(player => player.id !== id) })
      setMsg('Player deleted')
      setTimeout(() => setMsg(''), 3000)
    }
  }
  
  // Filter players to only show those registered with current club
  const clubPlayers = db.players.filter(player => player.clubId === db.currentClub?.id)
  
  return <div style={{display:'grid', gap:24, maxWidth:1400}}>
    <h2 style={{fontSize:28, fontWeight:700, fontFamily: 'Cinzel, serif', letterSpacing: '1.5px', color:'#0d3b26'}}>
      Register Players
    </h2>
    
    <div style={{
      background: 'linear-gradient(135deg, rgba(13, 59, 38, 0.03) 0%, rgba(106, 27, 154, 0.03) 100%)',
      padding: 24,
      borderRadius: 12,
      border: '2px solid #d4af37',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      <h3 style={{
        fontSize: 18,
        fontWeight: 600,
        marginBottom: 20,
        color: '#0d3b26',
        fontFamily: 'Cinzel, serif',
        letterSpacing: '1px'
      }}>
        Add New Player
      </h3>
      
      {msg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          background: msg.startsWith('⚠️') ? '#fef3c7' : msg.includes('deleted') ? '#fee2e2' : '#d1fae5',
          color: msg.startsWith('⚠️') ? '#92400e' : msg.includes('deleted') ? '#991b1b' : '#065f46',
          marginBottom: 16,
          fontWeight: 500,
          border: `2px solid ${msg.startsWith('⚠️') ? '#fbbf24' : msg.includes('deleted') ? '#fecaca' : '#10b981'}`
        }}>
          {msg}
        </div>
      )}
      
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr 140px', gap:12, marginBottom: 16}}>
        <div style={{minWidth: 0}}>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 13,
            color: '#1a1a1a',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            First Name
          </label>
          <input 
            placeholder="First name" 
            value={p.firstName} 
            onChange={e=>setP({...p, firstName:e.target.value})}
            style={{
              width:'100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 14,
              border: '2px solid #d4af37',
              borderRadius: 8,
              background: '#ffffff',
              minWidth: 0
            }}
          />
        </div>
        <div style={{minWidth: 0}}>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 13,
            color: '#1a1a1a',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Last Name
          </label>
          <input 
            placeholder="Last name" 
            value={p.lastName} 
            onChange={e=>setP({...p, lastName:e.target.value})}
            style={{
              width:'100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 14,
              border: '2px solid #d4af37',
              borderRadius: 8,
              background: '#ffffff',
              minWidth: 0
            }}
          />
        </div>
        <div style={{minWidth: 0}}>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 13,
            color: '#1a1a1a',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            School (Optional)
          </label>
          <input 
            placeholder="School (optional)" 
            value={p.school} 
            onChange={e=>setP({...p, school:e.target.value})}
            style={{
              width:'100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 14,
              border: '2px solid #d4af37',
              borderRadius: 8,
              background: '#ffffff',
              minWidth: 0
            }}
          />
        </div>
        <div style={{minWidth: 0}}>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 13,
            color: '#1a1a1a',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Gender
          </label>
          <select 
            value={p.gender} 
            onChange={e=>setP({...p, gender:e.target.value as any})}
            style={{
              width:'100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 14,
              border: '2px solid #d4af37',
              borderRadius: 8,
              background: '#ffffff',
              minWidth: 0
            }}
          >
            <option value="M">M</option>
            <option value="F">F</option>
            <option value="X">X</option>
          </select>
        </div>
      </div>
      
      <button 
        onClick={add} 
        disabled={!p.firstName || !p.lastName}
        style={{
          padding:'14px 32px', 
          borderRadius:8, 
          background: (p.firstName && p.lastName) ? 'linear-gradient(135deg, #0d3b26 0%, #1a5c3e 100%)' : '#d1d5db', 
          color:'#fff', 
          fontSize: 15,
          fontWeight: 600,
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          cursor: (p.firstName && p.lastName) ? 'pointer' : 'not-allowed',
          border: (p.firstName && p.lastName) ? '2px solid #d4af37' : 'none',
          boxShadow: (p.firstName && p.lastName) ? '0 4px 8px rgba(13, 59, 38, 0.2)' : 'none',
          transition: 'all 0.3s ease'
        }}
      >
        Add Player
      </button>
    </div>
    
    <div>
      <div style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: '2px solid #d4af37'
      }}>
        <h3 style={{fontSize:20, fontWeight:700, fontFamily: 'Cinzel, serif', letterSpacing: '1px'}}>
          Registered Players
        </h3>
        <span style={{fontSize: 14, fontWeight: 600, color: '#6a1b9a'}}>
          {clubPlayers.length} Total
        </span>
      </div>
      
      {clubPlayers.length === 0 ? (
        <div style={{
          padding: 40,
          textAlign: 'center',
          background: '#f9fafb',
          borderRadius: 12,
          border: '2px dashed #e5e7eb',
          color: '#9ca3af'
        }}>
          No players registered yet. Add your first player above.
        </div>
      ) : (
        <div style={{
          background: '#ffffff',
          border: '2px solid #e5e7eb',
          borderRadius: 12,
          overflow: 'hidden'
        }}>
          <table style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr style={{background: 'linear-gradient(135deg, #0d3b26 0%, #1a5c3e 100%)', color: '#ffffff'}}>
                <th style={{padding: '14px 16px', textAlign: 'left', fontWeight: 600, letterSpacing: '0.5px', fontSize: 13}}>
                  NAME
                </th>
                <th style={{padding: '14px 16px', textAlign: 'left', fontWeight: 600, letterSpacing: '0.5px', fontSize: 13}}>
                  SCHOOL
                </th>
                <th style={{padding: '14px 16px', textAlign: 'center', fontWeight: 600, letterSpacing: '0.5px', fontSize: 13}}>
                  GENDER
                </th>
                <th style={{padding: '14px 16px', textAlign: 'center', fontWeight: 600, letterSpacing: '0.5px', fontSize: 13}}>
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {clubPlayers
                .sort((a,b) => a.lastName.localeCompare(b.lastName))
                .map((player, index) => (
                <tr 
                  key={player.id}
                  style={{
                    borderBottom: index < clubPlayers.length - 1 ? '1px solid #e5e7eb' : 'none',
                    background: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                    transition: 'background 0.2s'
                  }}
                >
                  <td style={{padding: '14px 16px', fontWeight: 600, color: '#1a1a1a'}}>
                    {player.lastName}, {player.firstName}
                  </td>
                  <td style={{padding: '14px 16px', color: '#6b7280'}}>
                    {player.school || '—'}
                  </td>
                  <td style={{padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: '#6a1b9a'}}>
                    {player.gender}
                  </td>
                  <td style={{padding: '14px 16px', textAlign: 'center'}}>
                    <button
                      onClick={() => deletePlayer(player.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 6,
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#dc2626'
                        e.currentTarget.style.color = '#ffffff'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#fee2e2'
                        e.currentTarget.style.color = '#dc2626'
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  </div>
}

function Courts({db, onSave}:{db:DB, onSave:(p:Partial<DB>)=>void}){
  const updateCourt = (id:number, patch: Partial<Court>) => {
    const next = db.settings.courts.map(c => c.id===id ? {...c, ...patch} : c)
    onSave({ settings: { ...db.settings, courts: next } as DB['settings'] })
  }
  return <div style={{display:'grid', gap:8}}>
    <h2 style={{fontSize:20, fontWeight:700}}>Courts</h2>
    <div style={{display:'grid', gridTemplateColumns:'60px 1fr 140px', gap:8, alignItems:'center', maxWidth:700}}>
      {db.settings.courts.map(c=>(
        <React.Fragment key={c.id}>
          <div>#{c.id}</div>
          <input value={c.name} onChange={e=>updateCourt(c.id, {name:e.target.value})}/>
          <label style={{display:'flex', gap:6, alignItems:'center'}}>
            <input type="checkbox" checked={c.hasLights} onChange={e=>updateCourt(c.id, {hasLights:e.target.checked})} />
            Has lights
          </label>
        </React.Fragment>
      ))}
    </div>
    <div style={{fontSize:12, color:'#555'}}>Remember: 4 courts (default #11–#14) have no lights and can be used only until 8:30 PM.</div>
  </div>
}

function CourtReservations({db, onSave}:{db:DB, onSave:(p:Partial<DB>)=>void}){
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [courtId, setCourtId] = useState(db.settings.courts[0]?.id ?? 1)
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().slice(0,10))
  const [bookingTime, setBookingTime] = useState('09:00')
  const [duration, setDuration] = useState(60)
  const [notes, setNotes] = useState('')
  const [msg, setMsg] = useState('')
  const [view, setView] = useState<'calendar'|'list'>('calendar')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0,10))

  // Generate time slots in 30-minute increments from 6:00 AM to 10:00 PM
  const generateTimeSlots = () => {
    const slots: string[] = []
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        const period = hour >= 12 ? 'PM' : 'AM'
        const display = `${h}:${minute.toString().padStart(2, '0')} ${period}`
        const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(`${value}|${display}`)
      }
    }
    return slots
  }

  const bookingTimeSlots = generateTimeSlots()

  const reserve = async ()=>{
    if (!selectedPlayerId) { setMsg('Please select a member'); return }
    
    const player = db.players.find(p => p.id === selectedPlayerId)
    if (!player) { setMsg('Member not found'); return }
    
    // Combine date and time
    const startDateTime = `${bookingDate}T${bookingTime}`
    
    const check = await window.courtly.reservationValidate({ startISO: new Date(startDateTime).toISOString(), durationMin: duration, courtId })
    if (!check.ok) { setMsg(check.error || 'Unable to reserve'); return }
    
    const startISO = new Date(startDateTime).toISOString()
    const endISO = new Date(new Date(startDateTime).getTime() + duration * 60000).toISOString()
    const memberName = `${player.firstName} ${player.lastName}`
    const memberContact = player.school || 'N/A'
    const res: Reservation = { id: nanoid(), courtId, startISO, endISO, memberName, memberContact, notes }
    onSave({ reservations: [...(db.reservations||[]), res] })
    
    // Update the calendar view to show the date of the new reservation
    setSelectedDate(bookingDate)
    
    setMsg('Court reserved successfully!')
    setSelectedPlayerId(''); setNotes('')
  }

  const cancel = (id: string) => {
    if (confirm('Cancel this reservation?')) {
      onSave({ reservations: db.reservations.filter(r => r.id !== id) })
    }
  }

  // Generate time slots from 6 AM to 10 PM in 1-hour increments
  const timeSlots = Array.from({ length: 17 }, (_, i) => {
    const hour = i + 6
    return `${hour.toString().padStart(2, '0')}:00`
  })

  // Get reservations for the selected date
  const getReservationsForDateAndCourt = (date: string, courtId: number, timeSlot: string) => {
    const [hour] = timeSlot.split(':').map(Number)
    const slotStart = new Date(`${date}T${timeSlot}:00`)
    const slotEnd = new Date(slotStart.getTime() + 60 * 60000) // 1 hour later

    return (db.reservations || []).filter(r => {
      if (r.courtId !== courtId) return false
      const resStart = new Date(r.startISO)
      const resEnd = new Date(r.endISO)
      
      // Check if reservation overlaps with this time slot
      return resStart < slotEnd && resEnd > slotStart
    })
  }

  // Colors for different reservations
  const colors = ['#6a1b9a', '#1a5c3e', '#d4af37', '#b71c1c', '#1565c0', '#f57c00']

  return <div style={{display:'grid', gap:20, maxWidth:'100%'}}>
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
      <h2 style={{fontSize:28, fontWeight:700, fontFamily: 'Cinzel, serif', letterSpacing: '1.5px', color:'#0d3b26'}}>
        Court Reservations
      </h2>
      <div style={{display:'flex', gap:8}}>
        <button 
          onClick={() => setView('calendar')} 
          style={{
            padding:'10px 20px', 
            borderRadius:8, 
            background: view === 'calendar' ? 'linear-gradient(135deg, #6a1b9a 0%, #4a148c 100%)' : '#ffffff',
            color: view === 'calendar' ? '#fff' : '#2d2d2d',
            fontWeight:600,
            border: view === 'calendar' ? '2px solid #d4af37' : '2px solid #e5e7eb',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            letterSpacing: '0.5px',
            fontFamily: 'Montserrat, sans-serif'
          }}
        >
          Calendar View
        </button>
        <button 
          onClick={() => setView('list')} 
          style={{
            padding:'10px 20px', 
            borderRadius:8, 
            background: view === 'list' ? 'linear-gradient(135deg, #6a1b9a 0%, #4a148c 100%)' : '#ffffff',
            color: view === 'list' ? '#fff' : '#2d2d2d',
            fontWeight:600,
            border: view === 'list' ? '2px solid #d4af37' : '2px solid #e5e7eb',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            letterSpacing: '0.5px',
            fontFamily: 'Montserrat, sans-serif'
          }}
        >
          List View
        </button>
      </div>
    </div>

    <div style={{
      background: 'linear-gradient(135deg, rgba(13, 59, 38, 0.03) 0%, rgba(106, 27, 154, 0.03) 100%)',
      padding: 24,
      borderRadius: 12,
      border: '2px solid #d4af37',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      <h3 style={{
        fontSize: 18,
        fontWeight: 600,
        marginBottom: 20,
        color: '#0d3b26',
        fontFamily: 'Cinzel, serif',
        letterSpacing: '1px'
      }}>
        New Reservation
      </h3>
      
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom: 16}}>
        <div style={{gridColumn: 'span 2', minWidth: 0}}>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 13,
            color: '#1a1a1a',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Select Member
          </label>
          <select 
            value={selectedPlayerId} 
            onChange={e=>setSelectedPlayerId(e.target.value)} 
            style={{
              width:'100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 14,
              border: '2px solid #d4af37',
              borderRadius: 8,
              background: '#ffffff',
              minWidth: 0
            }}
          >
            <option value="">-- Choose a registered member --</option>
            {db.players
              .filter(p => p.clubId === db.currentClub?.id)
              .sort((a,b) => a.lastName.localeCompare(b.lastName))
              .map(p => (
              <option key={p.id} value={p.id}>
                {p.lastName}, {p.firstName} {p.school ? `(${p.school})` : ''}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{gridColumn: 'span 2', minWidth: 0}}>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 13,
            color: '#1a1a1a',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Court
          </label>
          <select 
            value={courtId} 
            onChange={e=>setCourtId(parseInt(e.target.value))} 
            style={{
              width:'100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 14,
              border: '2px solid #d4af37',
              borderRadius: 8,
              background: '#ffffff',
              minWidth: 0
            }}
          >
            {db.settings.courts.map(c=>(<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
        
        <div style={{gridColumn: 'span 2', minWidth: 0}}>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 13,
            color: '#1a1a1a',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Date
          </label>
          <input 
            type="date" 
            value={bookingDate} 
            onChange={e=>setBookingDate(e.target.value)} 
            style={{
              width:'100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 14,
              border: '2px solid #d4af37',
              borderRadius: 8,
              background: '#ffffff',
              minWidth: 0
            }}
          />
        </div>
        
        <div style={{gridColumn: 'span 2', minWidth: 0}}>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 13,
            color: '#1a1a1a',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Time
          </label>
          <select 
            value={bookingTime} 
            onChange={e=>setBookingTime(e.target.value)} 
            style={{
              width:'100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 14,
              border: '2px solid #d4af37',
              borderRadius: 8,
              background: '#ffffff',
              minWidth: 0
            }}
          >
            {bookingTimeSlots.map(slot => {
              const [value, display] = slot.split('|')
              return <option key={value} value={value}>{display}</option>
            })}
          </select>
        </div>
        
        <div style={{gridColumn: 'span 4', minWidth: 0}}>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 13,
            color: '#1a1a1a',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Duration
          </label>
          <select 
            value={duration} 
            onChange={e=>setDuration(parseInt(e.target.value))} 
            style={{
              width:'100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 14,
              border: '2px solid #d4af37',
              borderRadius: 8,
              background: '#ffffff',
              minWidth: 0
            }}
          >
            <option value="30">30 minutes</option>
            <option value="60">60 minutes (1 hour)</option>
            <option value="90">90 minutes (1.5 hours)</option>
            <option value="120">120 minutes (2 hours)</option>
          </select>
        </div>
        
        <div style={{gridColumn:'span 4', minWidth: 0}}>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 13,
            color: '#1a1a1a',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Notes (Optional)
          </label>
          <input 
            value={notes} 
            onChange={e=>setNotes(e.target.value)} 
            placeholder="Add any additional details..."
            style={{
              width:'100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 14,
              border: '2px solid #d4af37',
              borderRadius: 8,
              background: '#ffffff',
              minWidth: 0
            }}
          />
        </div>
      </div>
      
      <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
        <button 
          onClick={reserve} 
          style={{
            padding:'14px 32px', 
            borderRadius:8, 
            background: 'linear-gradient(135deg, #0d3b26 0%, #1a5c3e 100%)', 
            color:'#fff', 
            fontWeight:700,
            border: '2px solid #d4af37',
            cursor: 'pointer',
            fontSize: 14,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            fontFamily: 'Montserrat, sans-serif',
            boxShadow: '0 4px 12px rgba(13, 59, 38, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          Reserve Court
        </button>
        {msg && (
          <div style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: msg.includes('success') ? '#d1fae5' : '#fee2e2',
            color: msg.includes('success') ? '#065f46' : '#991b1b',
            fontWeight: 500,
            border: `2px solid ${msg.includes('success') ? '#10b981' : '#dc2626'}`
          }}>
            {msg}
          </div>
        )}
      </div>
    </div>
    
    {view === 'calendar' ? (
      <>
        <div style={{display:'flex', gap:12, alignItems:'center', marginTop:12}}>
          <h3 style={{fontSize:18, fontWeight:600}}>Schedule</h3>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={e => setSelectedDate(e.target.value)}
            style={{padding:'6px 12px', borderRadius:6, border:'1px solid #d4af37'}}
          />
        </div>
        <div style={{overflowX:'auto', border:'2px solid #d4af37', borderRadius:8}}>
          <table style={{width:'100%', borderCollapse:'collapse', minWidth:800}}>
            <thead>
              <tr style={{background:'linear-gradient(135deg, #0d3b26 0%, #1a5c3e 100%)'}}>
                <th style={{padding:'12px 16px', textAlign:'left', color:'#d4af37', fontWeight:700, borderRight:'1px solid #d4af37', minWidth:100}}>Time</th>
                {db.settings.courts.map(court => (
                  <th key={court.id} style={{padding:'12px 16px', textAlign:'center', color:'#d4af37', fontWeight:700, borderRight:'1px solid rgba(212, 175, 55, 0.3)', minWidth:150}}>
                    {court.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeSlot, idx) => (
                <tr key={timeSlot} style={{background: idx % 2 === 0 ? '#fff' : '#f9fafb'}}>
                  <td style={{padding:'8px 16px', fontWeight:600, borderRight:'1px solid #d4af37', color:'#1a5c3e'}}>
                    {timeSlot}
                  </td>
                  {db.settings.courts.map(court => {
                    const reservations = getReservationsForDateAndCourt(selectedDate, court.id, timeSlot)
                    const reservation = reservations[0] // Take first overlapping reservation
                    const colorIdx = reservation ? Math.abs(reservation.id.split('').reduce((a,c)=>a+c.charCodeAt(0),0)) % colors.length : 0
                    
                    return (
                      <td 
                        key={court.id} 
                        style={{
                          padding:'4px', 
                          borderRight:'1px solid rgba(212, 175, 55, 0.3)',
                          position:'relative'
                        }}
                      >
                        {reservation ? (
                          <div 
                            style={{
                              background: colors[colorIdx],
                              color:'#fff',
                              padding:'8px',
                              borderRadius:6,
                              fontSize:12,
                              fontWeight:600,
                              cursor:'pointer',
                              textAlign:'center',
                              boxShadow:'0 2px 4px rgba(0,0,0,0.1)'
                            }}
                            onClick={() => {
                              if (confirm(`Cancel reservation for ${reservation.memberName}?`)) {
                                cancel(reservation.id)
                              }
                            }}
                            title={`${reservation.memberName}\n${reservation.memberContact}\n${new Date(reservation.startISO).toLocaleTimeString()} - ${new Date(reservation.endISO).toLocaleTimeString()}\n${reservation.notes || ''}\nClick to cancel`}
                          >
                            <div>{reservation.memberName}</div>
                            <div style={{fontSize:10, opacity:0.9}}>
                              {new Date(reservation.startISO).toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'})} - 
                              {new Date(reservation.endISO).toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'})}
                            </div>
                          </div>
                        ) : (
                          <div style={{height:40, background:'transparent'}}></div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ) : (
      <>
        <h3 style={{fontSize:18, fontWeight:600, marginTop:12}}>Upcoming Reservations</h3>
        <div style={{display:'grid', gap:6}}>
          {(db.reservations||[]).sort((a,b)=>a.startISO.localeCompare(b.startISO)).map(r=>{
            const court = db.settings.courts.find(c=>c.id===r.courtId)
            return <div key={r.id} style={{padding:12, border:'1px solid #e5e7eb', borderRadius:8, display:'grid', gridTemplateColumns:'2fr 1fr 1fr 100px', gap:8, alignItems:'center'}}>
              <div><b>{r.memberName}</b> ({r.memberContact}) {r.notes && `— ${r.notes}`}</div>
              <div>{new Date(r.startISO).toLocaleString()}</div>
              <div>{court?.name}</div>
              <button onClick={()=>cancel(r.id)} style={{padding:'4px 8px', borderRadius:6, background:'#dc2626', color:'#fff'}}>Cancel</button>
            </div>
          })}
          {(!db.reservations || db.reservations.length === 0) && <div style={{color:'#9ca3af'}}>No reservations yet.</div>}
        </div>
      </>
    )}
  </div>
}

function Coaching({db, onSave}:{db:DB, onSave:(p:Partial<DB>)=>void}){
  const [selectedPlayerId, setSelectedPlayerId] = useState('')
  const [coachId, setCoachId] = useState(db.coaches?.[0]?.id ?? '1')
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0,10))
  const [sessionTime, setSessionTime] = useState('09:00')
  const [duration, setDuration] = useState(60)
  const [courtId, setCourtId] = useState<number | undefined>(undefined)
  const [notes, setNotes] = useState('')
  const [msg, setMsg] = useState('')

  // Generate time slots in 30-minute increments from 6:00 AM to 10:00 PM
  const generateTimeSlots = () => {
    const slots: string[] = []
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
        const period = hour >= 12 ? 'PM' : 'AM'
        const display = `${h}:${minute.toString().padStart(2, '0')} ${period}`
        const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(`${value}|${display}`)
      }
    }
    return slots
  }

  const coachingTimeSlots = generateTimeSlots()

  const book = async ()=>{
    if (!selectedPlayerId) { setMsg('Please select a student'); return }
    
    const player = db.players.find(p => p.id === selectedPlayerId)
    if (!player) { setMsg('Student not found'); return }
    
    const studentName = `${player.firstName} ${player.lastName}`
    const studentContact = player.school || 'N/A'
    
    // Combine date and time
    const startDateTime = `${sessionDate}T${sessionTime}`
    const startISO = new Date(startDateTime).toISOString()
    const endISO = new Date(new Date(startDateTime).getTime() + duration * 60000).toISOString()
    
    // Find first available court for this time slot
    let availableCourtId = courtId // Use manually selected court if provided
    
    if (!availableCourtId) {
      // Check each court to find the first available one
      for (const court of db.settings.courts) {
        const check = await window.courtly.reservationValidate({ 
          startISO, 
          durationMin: duration, 
          courtId: court.id 
        })
        if (check.ok) {
          availableCourtId = court.id
          break
        }
      }
      
      if (!availableCourtId) {
        setMsg('No courts available for this time slot. Please choose a different time.')
        return
      }
    }
    
    // Create the coaching session
    const session: CoachingSession = {
      id: nanoid(),
      coachId,
      studentName,
      studentContact,
      startISO,
      durationMin: duration,
      courtId: availableCourtId,
      paid: false,
      notes
    }
    
    // Create a court reservation for the coaching session
    const reservation: Reservation = {
      id: nanoid(),
      courtId: availableCourtId,
      startISO,
      endISO,
      memberName: `${studentName} (Coaching with ${(db.coaches||[]).find(c => c.id === coachId)?.name || 'Coach'})`,
      memberContact: studentContact,
      notes: `Coaching session: ${notes || 'Private lesson'}`
    }
    
    // Save both the coaching session and the court reservation
    onSave({ 
      coachingSessions: [...(db.coachingSessions||[]), session],
      reservations: [...(db.reservations||[]), reservation]
    })
    
    const courtName = db.settings.courts.find(c => c.id === availableCourtId)?.name || `Court ${availableCourtId}`
    setMsg(`Coaching session booked on ${courtName}!`)
    setSelectedPlayerId(''); setNotes('')
  }

  const togglePaid = (id: string) => {
    const next = (db.coachingSessions||[]).map(s => s.id===id ? {...s, paid: !s.paid} : s)
    onSave({ coachingSessions: next })
  }

  const cancelSession = (id: string) => {
    if (confirm('Cancel this session?')) {
      const session = (db.coachingSessions||[]).find(s => s.id === id)
      if (!session) return
      
      // Find and remove the associated court reservation
      // The reservation was created with the same startISO and courtId as the coaching session
      const updatedReservations = (db.reservations||[]).filter(r => {
        // Match by court, start time, and check if it's a coaching reservation
        return !(r.courtId === session.courtId && 
                 r.startISO === session.startISO && 
                 r.notes?.includes('Coaching session'))
      })
      
      // Remove the coaching session and its reservation
      onSave({ 
        coachingSessions: (db.coachingSessions||[]).filter(s => s.id !== id),
        reservations: updatedReservations
      })
    }
  }

  const coach = (db.coaches||[]).find(c => c.id === coachId)

  return <div style={{display:'grid', gap:20, maxWidth:'100%'}}>
    <h2 style={{fontSize:28, fontWeight:700, fontFamily: 'Cinzel, serif', letterSpacing: '1.5px', color:'#0d3b26'}}>
      Coaching Sessions
    </h2>
    
    <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom:12}}>
      {(db.coaches||[]).map(c=>(
        <div key={c.id} style={{
          padding:16, 
          border: c.available?'3px solid #10b981':'2px solid #e5e7eb', 
          borderRadius:12, 
          background: c.available ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)' : '#f9fafb',
          transition: 'all 0.3s ease',
          boxShadow: c.available ? '0 4px 12px rgba(16, 185, 129, 0.15)' : 'none'
        }}>
          <div style={{fontWeight:700, fontSize:16, fontFamily: 'Cinzel, serif', letterSpacing: '0.5px'}}>{c.name}</div>
          <div style={{fontSize:13, color:'#6b7280', marginTop:4, letterSpacing: '0.3px'}}>{c.specialty}</div>
          <div style={{fontSize:18, fontWeight:700, marginTop:8, color:'#d4af37'}}>${c.hourlyRate}/hr</div>
          <div style={{
            fontSize:12, 
            color: c.available?'#059669':'#dc2626', 
            marginTop:8, 
            fontWeight:600,
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            {c.available?'Available':'Unavailable'}
          </div>
        </div>
      ))}
    </div>

    <div style={{
      background: 'linear-gradient(135deg, rgba(13, 59, 38, 0.03) 0%, rgba(106, 27, 154, 0.03) 100%)',
      padding: 24,
      borderRadius: 12,
      border: '2px solid #d4af37',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
    }}>
      <h3 style={{
        fontSize: 18,
        fontWeight: 600,
        marginBottom: 20,
        color: '#0d3b26',
        fontFamily: 'Cinzel, serif',
        letterSpacing: '1px'
      }}>
        Book New Session
      </h3>
      
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:16, marginBottom: 16}}>
        <div style={{gridColumn: 'span 2', minWidth: 0}}>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 13,
            color: '#1a1a1a',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Select Student
          </label>
          <select 
            value={selectedPlayerId} 
            onChange={e=>setSelectedPlayerId(e.target.value)} 
            style={{
              width:'100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 14,
              border: '2px solid #d4af37',
              borderRadius: 8,
              background: '#ffffff',
              minWidth: 0
            }}
          >
            <option value="">-- Choose a registered student --</option>
            {db.players
              .filter(p => p.clubId === db.currentClub?.id)
              .sort((a,b) => a.lastName.localeCompare(b.lastName))
              .map(p => (
              <option key={p.id} value={p.id}>
                {p.lastName}, {p.firstName} {p.school ? `(${p.school})` : ''}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{gridColumn: 'span 2', minWidth: 0}}>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 13,
            color: '#1a1a1a',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Coach
          </label>
          <select 
            value={coachId} 
            onChange={e=>setCoachId(e.target.value)} 
            style={{
              width:'100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 14,
              border: '2px solid #d4af37',
              borderRadius: 8,
              background: '#ffffff',
              minWidth: 0
            }}
          >
            {(db.coaches||[]).map(c=>(<option key={c.id} value={c.id}>{c.name} — ${c.hourlyRate}/hr</option>))}
          </select>
        </div>
        
        <div style={{gridColumn: 'span 2', minWidth: 0}}>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 13,
            color: '#1a1a1a',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Date
          </label>
          <input 
            type="date" 
            value={sessionDate} 
            onChange={e=>setSessionDate(e.target.value)} 
            style={{
              width:'100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 14,
              border: '2px solid #d4af37',
              borderRadius: 8,
              background: '#ffffff',
              minWidth: 0
            }}
          />
        </div>
        
        <div style={{gridColumn: 'span 2', minWidth: 0}}>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 13,
            color: '#1a1a1a',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Time
          </label>
          <select 
            value={sessionTime} 
            onChange={e=>setSessionTime(e.target.value)} 
            style={{
              width:'100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 14,
              border: '2px solid #d4af37',
              borderRadius: 8,
              background: '#ffffff',
              minWidth: 0
            }}
          >
            {coachingTimeSlots.map(slot => {
              const [value, display] = slot.split('|')
              return <option key={value} value={value}>{display}</option>
            })}
          </select>
        </div>
        
        <div style={{gridColumn: 'span 2', minWidth: 0}}>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 13,
            color: '#1a1a1a',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Duration
          </label>
          <select 
            value={duration} 
            onChange={e=>setDuration(parseInt(e.target.value))} 
            style={{
              width:'100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 14,
              border: '2px solid #d4af37',
              borderRadius: 8,
              background: '#ffffff',
              minWidth: 0
            }}
          >
            <option value="30">30 minutes</option>
            <option value="60">60 minutes (1 hour)</option>
            <option value="90">90 minutes (1.5 hours)</option>
            <option value="120">120 minutes (2 hours)</option>
          </select>
        </div>
        
        <div style={{gridColumn: 'span 2', minWidth: 0}}>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 13,
            color: '#1a1a1a',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Court (Optional)
          </label>
          <select 
            value={courtId||''} 
            onChange={e=>setCourtId(e.target.value?parseInt(e.target.value):undefined)} 
            style={{
              width:'100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 14,
              border: '2px solid #d4af37',
              borderRadius: 8,
              background: '#ffffff',
              minWidth: 0
            }}
          >
            <option value="">No specific court</option>
            {db.settings.courts.map(c=>(<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        </div>
        
        <div style={{gridColumn:'span 4', minWidth: 0}}>
          <label style={{
            display: 'block',
            marginBottom: 8,
            fontWeight: 600,
            fontSize: 13,
            color: '#1a1a1a',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            Notes (Optional)
          </label>
          <input 
            value={notes} 
            onChange={e=>setNotes(e.target.value)} 
            placeholder="Add any additional details..."
            style={{
              width:'100%',
              boxSizing: 'border-box',
              padding: '12px 14px',
              fontSize: 14,
              border: '2px solid #d4af37',
              borderRadius: 8,
              background: '#ffffff',
              minWidth: 0
            }}
          />
        </div>
      </div>
      
      {coach && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          background: 'rgba(212, 175, 55, 0.1)',
          border: '2px solid #d4af37',
          marginBottom: 16,
          fontSize: 16,
          fontWeight: 600,
          color: '#0d3b26',
          letterSpacing: '0.5px'
        }}>
          Session Total: ${((duration/60) * coach.hourlyRate).toFixed(2)}
        </div>
      )}
      
      <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
        <button 
          onClick={book} 
          style={{
            padding:'14px 32px', 
            borderRadius:8, 
            background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', 
            color:'#fff', 
            fontWeight:700,
            border: '2px solid #d4af37',
            cursor: 'pointer',
            fontSize: 14,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            fontFamily: 'Montserrat, sans-serif',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            transition: 'all 0.3s ease'
          }}
        >
          Book Coaching Session
        </button>
        {msg && (
          <div style={{
            padding: '10px 16px',
            borderRadius: 8,
            background: msg.includes('booked') ? '#dbeafe' : '#fee2e2',
            color: msg.includes('booked') ? '#1e40af' : '#991b1b',
            fontWeight: 500,
            border: `2px solid ${msg.includes('booked') ? '#2563eb' : '#dc2626'}`
          }}>
            {msg}
          </div>
        )}
      </div>
    </div>

    <div style={{marginTop: 32}}>
      <h3 style={{
        fontSize:22, 
        fontWeight:700, 
        marginBottom: 16,
        fontFamily: 'Cinzel, serif',
        letterSpacing: '1px',
        color: '#0d3b26'
      }}>
        Scheduled Sessions
      </h3>
      
      {(!db.coachingSessions || db.coachingSessions.length === 0) ? (
        <div style={{
          padding: 40,
          textAlign: 'center',
          background: '#f9fafb',
          borderRadius: 12,
          border: '2px dashed #e5e7eb',
          color: '#9ca3af'
        }}>
          No sessions scheduled yet. Book your first session above.
        </div>
      ) : (
        <div style={{display:'grid', gap:12}}>
          {(db.coachingSessions||[]).sort((a,b)=>a.startISO.localeCompare(b.startISO)).map(s=>{
            const coach = (db.coaches||[]).find(c=>c.id===s.coachId)
            const court = s.courtId ? db.settings.courts.find(c=>c.id===s.courtId) : null
            return <div 
              key={s.id} 
              style={{
                padding:16, 
                border:'2px solid #e5e7eb', 
                borderRadius:12, 
                display:'grid', 
                gridTemplateColumns:'2fr 1fr 1fr auto auto', 
                gap:12, 
                alignItems:'center',
                background: '#ffffff',
                transition: 'all 0.3s ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <div>
                <div style={{fontWeight:700, fontSize:15, color:'#0d3b26'}}>{s.studentName}</div>
                <div style={{fontSize:13, color:'#6b7280', marginTop:2}}>
                  with {coach?.name} {s.notes && `• ${s.notes}`}
                </div>
              </div>
              <div style={{fontSize:14, color:'#6b7280'}}>
                {new Date(s.startISO).toLocaleDateString()} <br/>
                {new Date(s.startISO).toLocaleTimeString([], {hour: 'numeric', minute: '2-digit'})}
              </div>
              <div style={{
                fontSize:14, 
                fontWeight:600,
                color: court ? '#0d3b26' : '#9ca3af'
              }}>
                {court?.name || 'Court TBD'}
              </div>
              <button 
                onClick={()=>togglePaid(s.id)} 
                style={{
                  padding:'8px 16px', 
                  borderRadius:8, 
                  background: s.paid ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                  color:'#fff',
                  fontWeight:600,
                  border: s.paid ? '2px solid #10b981' : '2px solid #f59e0b',
                  cursor: 'pointer',
                  fontSize: 13,
                  letterSpacing: '0.3px',
                  transition: 'all 0.3s ease'
                }}
              >
                {s.paid?'✓ Paid':'Mark Paid'}
              </button>
              <button 
                onClick={()=>cancelSession(s.id)} 
                style={{
                  padding:'8px 16px', 
                  borderRadius:8, 
                  background: '#fee2e2', 
                  color:'#dc2626',
                  fontWeight:600,
                  border: '2px solid #fecaca',
                  cursor: 'pointer',
                  fontSize: 13,
                  letterSpacing: '0.3px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626'
                  e.currentTarget.style.color = '#ffffff'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fee2e2'
                  e.currentTarget.style.color = '#dc2626'
                }}
              >
                Cancel
              </button>
            </div>
          })}
        </div>
      )}
    </div>
  </div>
}

function HomePage({db, onSave, clubs}:{db:DB, onSave:(p:Partial<DB>)=>void, clubs:Club[]}){
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null)
  
  const selectClub = () => {
    if (!selectedClubId) return
    const club = clubs.find(c => c.id === selectedClubId)
    if (club) {
      onSave({ currentClub: { ...club, selectedAt: new Date().toISOString() } })
    }
  }

  return <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0d3b26 0%, #1a5c3e 50%, #0d3b26 100%)',
    fontFamily: 'Montserrat, system-ui',
    position: 'relative',
    overflow: 'hidden'
  }}>
    {/* Decorative tennis ball pattern */}
    <div style={{
      position: 'absolute',
      top: -100,
      right: -100,
      width: 400,
      height: 400,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(212,175,55,0.1) 0%, transparent 70%)',
      pointerEvents: 'none'
    }} />
    <div style={{
      position: 'absolute',
      bottom: -150,
      left: -150,
      width: 500,
      height: 500,
      borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(106,27,154,0.1) 0%, transparent 70%)',
      pointerEvents: 'none'
    }} />
    
    <div style={{
      background: '#ffffff',
      borderRadius: 20,
      padding: 56,
      maxWidth: 550,
      width: '90%',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      border: '3px solid #d4af37',
      position: 'relative',
      zIndex: 1
    }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🎾</div>
        <h1 style={{ 
          fontSize: 52, 
          fontWeight: 700, 
          background: 'linear-gradient(135deg, #0d3b26 0%, #6a1b9a 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 8,
          fontFamily: 'Cinzel, serif',
          letterSpacing: '3px'
        }}>
          COURTLY
        </h1>
        <p style={{ fontSize: 15, color: '#6b7280', fontWeight: 500, letterSpacing: '1.5px', fontFamily: 'Montserrat, sans-serif' }}>
          TENNIS CLUB MANAGEMENT
        </p>
        <div style={{ 
          width: 80, 
          height: 3, 
          background: 'linear-gradient(90deg, #d4af37 0%, #6a1b9a 100%)', 
          margin: '16px auto',
          borderRadius: 2
        }} />
      </div>

      <div style={{ marginBottom: 32 }}>
        <label style={{ 
          display: 'block', 
          fontWeight: 700, 
          marginBottom: 16, 
          color: '#1a1a1a',
          fontSize: 16,
          letterSpacing: '0.5px'
        }}>
          Select Your Tennis Club
        </label>
        <div style={{ display: 'grid', gap: 14 }}>
          {clubs.map(club => (
            <button
              key={club.id}
              onClick={() => setSelectedClubId(club.id)}
              style={{
                padding: 20,
                borderRadius: 12,
                border: selectedClubId === club.id ? '3px solid #6a1b9a' : '2px solid #e5e7eb',
                background: selectedClubId === club.id 
                  ? 'linear-gradient(135deg, rgba(106,27,154,0.05) 0%, rgba(13,59,38,0.05) 100%)' 
                  : 'white',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: 17,
                fontWeight: 600,
                color: selectedClubId === club.id ? '#6a1b9a' : '#2d2d2d',
                position: 'relative',
                boxShadow: selectedClubId === club.id 
                  ? '0 8px 16px rgba(106,27,154,0.15)' 
                  : '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              {selectedClubId === club.id && (
                <span style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', fontSize: 20 }}>
                  ✓
                </span>
              )}
              {club.name}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={selectClub}
        disabled={!selectedClubId}
        style={{
          width: '100%',
          padding: 18,
          borderRadius: 12,
          background: selectedClubId 
            ? 'linear-gradient(135deg, #0d3b26 0%, #6a1b9a 100%)' 
            : '#d1d5db',
          color: 'white',
          fontSize: 15,
          fontWeight: 600,
          cursor: selectedClubId ? 'pointer' : 'not-allowed',
          border: selectedClubId ? '2px solid #d4af37' : 'none',
          transition: 'all 0.3s ease',
          letterSpacing: '1.5px',
          fontFamily: 'Montserrat, sans-serif',
          boxShadow: selectedClubId ? '0 8px 20px rgba(13,59,38,0.3)' : 'none'
        }}
      >
        ENTER CLUB →
      </button>

      <div style={{ 
        marginTop: 28, 
        textAlign: 'center', 
        fontSize: 11, 
        color: '#9ca3af',
        paddingTop: 24,
        borderTop: '1px solid #e5e7eb',
        fontFamily: 'Montserrat, sans-serif',
        letterSpacing: '0.5px'
      }}>
        <div style={{ fontWeight: 600, color: '#6b7280', marginBottom: 4, letterSpacing: '1px' }}>VERSION 0.2.0</div>
        <div style={{ letterSpacing: '0.8px' }}>COURT RESERVATIONS • COACHING • PRO SHOP • TOURNAMENTS</div>
      </div>
    </div>
  </div>
}
