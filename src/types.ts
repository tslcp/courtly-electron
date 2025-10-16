
export type Player = {
  id: string
  firstName: string
  lastName: string
  school?: string
  gender?: 'M' | 'F' | 'X'
  clubId: string  // Track which club this player is registered with
}

export type Club = {
  id: string
  name: string
  selectedAt?: string
}

export type Court = {
  id: number
  name: string
  hasLights: boolean
}

export type MatchFormat = 'RR_PRO8_NOAD_TB10' | 'SE_BO3_MTBTB10'

export type Match = {
  id: string
  startISO: string
  courtId: number
  drawId?: string
  teamA: string[]
  teamB: string[]
  winner?: 'A' | 'B'
  format: MatchFormat
}

export type Draw = {
  id: string
  name: string
  type: 'Singles' | 'Doubles' | 'Mixed'
  stage: 'RoundRobin' | 'SingleElim'
  participants: string[][] // arrays of player IDs (size 1 singles, size 2 doubles)
  matches: string[] // match IDs
}

export type Reservation = {
  id: string
  courtId: number
  startISO: string
  endISO: string
  memberName: string
  memberContact: string
  notes?: string
}

export type Coach = {
  id: string
  name: string
  specialty: string
  hourlyRate: number
  available: boolean
}

export type CoachingSession = {
  id: string
  coachId: string
  studentName: string
  studentContact: string
  startISO: string
  durationMin: number
  courtId?: number
  paid: boolean
  notes?: string
}

export type ShopItem = {
  id: string
  name: string
  price: number
  inventory: number
}

export type Shop = {
  strings: { price: number, inventory: number, promo: string }
  racquets: ShopItem[]
  balls: ShopItem[]
  apparel: ShopItem[]
}

export type DB = {
  meta: any
  currentClub?: Club
  settings: { 
    leaveMatchBuffer: number
    courts: Court[]
    operatingHours: { open: string, close: string }
    reservationDurationMin: number
  }
  players: Player[]
  teams: string[][]
  schools: string[]
  matches: Match[]
  draws: Draw[]
  reservations: Reservation[]
  coaches: Coach[]
  coachingSessions: CoachingSession[]
  shop: Shop
  raffle: { item: string, tickets: { name: string, contact: string }[] }
}
