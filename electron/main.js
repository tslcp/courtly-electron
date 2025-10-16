
import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

// __dirname equivalent for ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isDev = !app.isPackaged

async function createWindow () {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // Log preload path for debugging
  console.log('Preload path:', path.join(__dirname, 'preload.cjs'))
  console.log('File exists:', fs.existsSync(path.join(__dirname, 'preload.cjs')))

  if (isDev) {
    await win.loadURL('http://localhost:5173')
    // DevTools can be opened manually with Cmd+Option+I (Mac) or Ctrl+Shift+I (Windows/Linux)
  } else {
    await win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  ensureDb()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Simple JSON file DB in appData
const dataDir = path.join(app.getPath('userData'), 'data')
const dbFile = path.join(dataDir, 'courtly.json')

function ensureDb() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
  if (!fs.existsSync(dbFile)) {
    const init = {
      meta: { name: 'Courtly DB', version: 2, createdAt: new Date().toISOString() },
      settings: {
        leaveMatchBuffer: 10,
        courts: Array.from({length: 14}, (_,i)=>({ id: i+1, name: `Court ${i+1}`, hasLights: ![11,12,13,14].includes(i+1) })),
        operatingHours: { open: '06:00', close: '22:00' },
        reservationDurationMin: 60
      },
      players: [],
      teams: [],
      schools: [],
      matches: [],
      draws: [],
      reservations: [], // Court reservations for club members
      coaches: [
        { id: '1', name: 'Sarah Williams', specialty: 'Singles Strategy', hourlyRate: 75, available: true },
        { id: '2', name: 'Mike Chen', specialty: 'Serve & Volley', hourlyRate: 80, available: true },
        { id: '3', name: 'Emma Rodriguez', specialty: 'Junior Development', hourlyRate: 60, available: true }
      ],
      coachingSessions: [], // Scheduled coaching sessions
      shop: {
        strings: { price: 12, inventory: 64, promo: 'Buy 2, Get 1 Free' },
        racquets: [
          { id: '1', name: 'Wilson Pro Staff', price: 199, inventory: 8 },
          { id: '2', name: 'Head Radical', price: 189, inventory: 12 },
          { id: '3', name: 'Babolat Pure Drive', price: 209, inventory: 6 }
        ],
        balls: [
          { id: '1', name: 'Penn Championship (can of 3)', price: 4, inventory: 120 },
          { id: '2', name: 'Wilson US Open (can of 3)', price: 5, inventory: 80 }
        ],
        apparel: [
          { id: '1', name: 'Nike Court Polo', price: 45, inventory: 24 },
          { id: '2', name: 'Adidas Tennis Shorts', price: 35, inventory: 30 }
        ]
      },
      raffle: { item: 'Zhang Zhizhen Head Radical racquet', tickets: [] }
    }
    fs.writeFileSync(dbFile, JSON.stringify(init, null, 2))
  }
}
ensureDb()

function readDb() {
  ensureDb()
  const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'))
  
  // Migrate old database to new schema
  if (!db.meta?.version || db.meta.version < 2) {
    console.log('Migrating database to version 2...')
    
    // Add missing fields
    if (!db.reservations) db.reservations = []
    if (!db.coaches) {
      db.coaches = [
        { id: '1', name: 'Sarah Williams', specialty: 'Singles Strategy', hourlyRate: 75, available: true },
        { id: '2', name: 'Mike Chen', specialty: 'Serve & Volley', hourlyRate: 80, available: true },
        { id: '3', name: 'Emma Rodriguez', specialty: 'Junior Development', hourlyRate: 60, available: true }
      ]
    }
    if (!db.coachingSessions) db.coachingSessions = []
    
    // Upgrade shop structure
    if (!db.shop.racquets) {
      db.shop.racquets = [
        { id: '1', name: 'Wilson Pro Staff', price: 199, inventory: 8 },
        { id: '2', name: 'Head Radical', price: 189, inventory: 12 },
        { id: '3', name: 'Babolat Pure Drive', price: 209, inventory: 6 }
      ]
    }
    if (!db.shop.balls) {
      db.shop.balls = [
        { id: '1', name: 'Penn Championship (can of 3)', price: 4, inventory: 120 },
        { id: '2', name: 'Wilson US Open (can of 3)', price: 5, inventory: 80 }
      ]
    }
    if (!db.shop.apparel) {
      db.shop.apparel = [
        { id: '1', name: 'Nike Court Polo', price: 45, inventory: 24 },
        { id: '2', name: 'Adidas Tennis Shorts', price: 35, inventory: 30 }
      ]
    }
    
    // Update settings
    if (!db.settings.operatingHours) {
      db.settings.operatingHours = { open: '06:00', close: '22:00' }
    }
    if (!db.settings.reservationDurationMin) {
      db.settings.reservationDurationMin = 60
    }
    
    // Add clubId to existing players (assign to current club if exists, otherwise first club)
    if (db.players && db.players.length > 0) {
      const defaultClubId = db.currentClub?.id || '1'
      db.players = db.players.map(player => {
        if (!player.clubId) {
          return { ...player, clubId: defaultClubId }
        }
        return player
      })
    }
    
    // Update version
    db.meta = { ...db.meta, version: 2, updatedAt: new Date().toISOString() }
    
    // Save migrated database
    writeDb(db)
    console.log('Database migration complete!')
  }
  
  return db
}

function writeDb(db) {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2))
}

// IPC handlers
ipcMain.handle('db:read', () => {
  return readDb()
})
ipcMain.handle('db:write', (_evt, patch) => {
  const db = readDb()
  const merged = { ...db, ...patch }
  writeDb(merged)
  return merged
})

// Scheduler helper: enforce unlit courts cutoff (20:30 local)
function canUseCourt(slotStartISO, court) {
  const start = new Date(slotStartISO)
  const cutoff = new Date(start)
  cutoff.setHours(20, 30, 0, 0)
  if (court.hasLights) return true
  return start <= cutoff
}

// Validate schedule request
ipcMain.handle('schedule:propose', (_evt, { slotStartISO, durationMin, courtId }) => {
  const db = readDb()
  const court = db.settings.courts.find(c => c.id === courtId)
  if (!court) return { ok: false, error: 'Court not found' }
  if (!canUseCourt(slotStartISO, court)) return { ok: false, error: 'Court has no lights after 8:30 PM' }
  // leave 10 matches buffer rule
  const day = new Date(slotStartISO).toISOString().slice(0,10)
  const matchesThatDay = db.matches.filter(m => m.startISO.slice(0,10) === day)
  const capacity = db.settings.courts.length * Math.floor((24*60)/60) // coarse max per hour
  const buffer = db.settings.leaveMatchBuffer ?? 10
  if (matchesThatDay.length >= capacity - buffer) {
    return { ok: false, error: 'Daily match capacity buffer reached' }
  }
  return { ok: true }
})

// Validate court reservation (check conflicts with matches and other reservations)
ipcMain.handle('reservation:validate', (_evt, { startISO, durationMin, courtId }) => {
  const db = readDb()
  const court = db.settings.courts.find(c => c.id === courtId)
  if (!court) return { ok: false, error: 'Court not found' }
  if (!canUseCourt(startISO, court)) return { ok: false, error: 'Court has no lights after 8:30 PM' }
  
  const start = new Date(startISO)
  const end = new Date(start.getTime() + durationMin * 60000)
  
  // Check conflicts with existing reservations
  const conflicts = db.reservations?.filter(r => {
    if (r.courtId !== courtId) return false
    const rStart = new Date(r.startISO)
    const rEnd = new Date(r.endISO)
    return (start < rEnd && end > rStart)
  }) || []
  
  if (conflicts.length > 0) {
    return { ok: false, error: 'Court already reserved for this time slot' }
  }
  
  return { ok: true }
})
