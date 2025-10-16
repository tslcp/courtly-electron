# Changelog

## [0.2.0] - 2025-10-15

### ✨ Major Features Added

#### Court Reservations System
- Added full court reservation management for club members
- Real-time conflict detection with existing reservations and matches
- Respect for court lighting hours (no reservations after 8:30 PM for unlit courts)
- Member contact tracking and notes support
- Easy cancellation of reservations

#### Coaching Management
- Three professional coaches with specialties and hourly rates
  - Sarah Williams (Singles Strategy - $75/hr)
  - Mike Chen (Serve & Volley - $80/hr)
  - Emma Rodriguez (Junior Development - $60/hr)
- Session booking with automatic cost calculation
- Optional court assignment for lessons
- Payment tracking with "Mark Paid" functionality
- Session cancellation with confirmation

#### Enhanced Pro Shop
- Expanded from strings-only to full pro shop inventory:
  - **Racquets**: Wilson Pro Staff, Head Radical, Babolat Pure Drive
  - **Balls**: Penn Championship, Wilson US Open
  - **Apparel**: Nike Polo, Adidas Shorts
  - **Strings**: Maintained original string service with promo
- Category-based navigation
- Individual product cards with inventory tracking
- Low stock warnings (< 5 items)
- Out of stock prevention

### 🔧 Technical Improvements

#### Electron Main Process (`electron/main.js`)
- Fixed ESM imports with proper `import.meta.url` handling
- Added `__dirname` equivalent for ESM modules
- Improved file path handling for production builds
- Enhanced security with `contextIsolation: true` and `nodeIntegration: false`
- Fixed preload script path to use `__dirname`
- Moved `ensureDb()` call to `app.whenReady()` for proper initialization
- Added `reservation:validate` IPC handler for conflict checking

#### Database Schema (`courtly.json`)
- Upgraded version from 1 to 2
- Added `reservations` array for court bookings
- Added `coaches` array with pre-seeded coach data
- Added `coachingSessions` array for lesson tracking
- Expanded `shop` object:
  - `racquets` array
  - `balls` array
  - `apparel` array
  - Maintained `strings` object
- Added `operatingHours` to settings
- Added `reservationDurationMin` to settings

#### TypeScript Types (`src/types.ts`)
- Added `Reservation` type
- Added `Coach` type
- Added `CoachingSession` type
- Added `ShopItem` type
- Expanded `Shop` type with new categories
- Updated `DB` type with all new fields

#### React UI (`src/App.tsx`)
- Reordered tabs to prioritize club features (Reservations, Coaching, Shop first)
- Changed app title from "Tournament Console" to "Tennis Club Management"
- Added `CourtReservations` component (100+ lines)
- Added `Coaching` component (120+ lines)
- Completely rewrote `Shop` component with category tabs
- Added `ShopItemCard` sub-component for product display
- Updated global window interface for new IPC methods
- Added initialization of new DB fields on first load

#### Preload Bridge (`electron/preload.js`)
- Added `reservationValidate` method to IPC bridge
- Maintained security with contextBridge isolation

### 🎨 UI/UX Improvements
- Color-coded buttons and status indicators
- Grid-based layouts for better space utilization
- Inline editing for quick actions
- Success/error messaging for all operations
- Disabled states for sold-out items
- Coach availability badges
- Payment status toggle buttons
- Real-time inventory updates
- Responsive card layouts for shop items

### 📦 Build & Development
- Clean build with no TypeScript errors
- All dependencies up to date
- Production build tested and working
- Dev mode with hot reload functional

### 🐛 Bug Fixes
- Fixed invalid JavaScript syntax in court initialization (Python-like `not in`)
- Fixed Electron failing to load in development mode
- Fixed path resolution for preload script
- Fixed production build dist path
- Ensured database initializes before window creation

### 🔒 Security
- Maintained context isolation between main and renderer processes
- All Node.js operations restricted to main process
- Secure IPC communication via contextBridge
- No direct filesystem access from renderer

---

## [0.1.0] - Initial Release

### Features
- Basic tournament management
- Player registration
- Court configuration
- Match scheduling
- Draw creation
- String shop
- Raffle system
- School leaderboard

