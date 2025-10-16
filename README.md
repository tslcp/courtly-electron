# Courtly — Tennis Club Management App

A beautiful Electron-based desktop application for managing tennis club operations across multiple clubs. Built with React, TypeScript, and Electron.

## 🎾 Overview

Courtly is a comprehensive tennis club management system that allows administrators to manage multiple tennis clubs, handle court reservations, schedule coaching sessions, and maintain player registrations. The app features an elegant Wimbledon-inspired design with a green, purple, and gold color scheme.

## ✨ Features

### Multi-Club Management
- **Club Selection**: Manage three distinct tennis clubs (Li Chaoping Tennis Academy, ANC Tennis Academy, Gorin Tennis)
- **Club-Specific Data**: Players, reservations, and coaching sessions are isolated per club
- **Easy Switching**: Return to home page to switch between clubs

### Court Reservations
- **Visual Calendar**: Grid-based schedule showing all court reservations
- **Time Slots**: 30-minute increments from 6:00 AM to 10:00 PM
- **Member Selection**: Reserve courts only for registered club members
- **Conflict Detection**: Prevents double-booking of courts
- **Court Lighting**: Track which courts have lights for evening play

### Coaching Sessions
- **Multiple Coaches**: Manage different coaches with their own rates
- **Auto-Court Booking**: Automatically reserves a court when booking a coaching session
- **Session Management**: View all coaching sessions with easy cancellation
- **Linked Reservations**: Canceling a coaching session also cancels the associated court reservation

### Player Registration
- **Club-Specific Players**: Players can register with multiple clubs independently
- **Player Information**: Track first name, last name, school, and gender
- **Visual Player List**: Elegant table display of all registered players
- **Multi-Club Support**: Same player can be in different clubs without conflicts

### Court Management
- **14 Courts**: Manage up to 14 tennis courts
- **Lighting Status**: Track which courts have lights (courts 11-14 are unlit)
- **Court Names**: Customize court names as needed

## 🚀 How to Run

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository** (or download the source code)
   ```bash
   cd courtly-electron
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

### Development Mode

**Run the development server:**
```bash
npm run dev
```

This will:
- Start Vite development server on port 5173
- Launch Electron with hot-reload enabled
- Open the application window automatically

The app will reload automatically when you make changes to the code.

### Production Build

**Build the application:**
```bash
npm run build
```

**Package for distribution:**
```bash
npm run dist
```

This creates a distributable Electron app for your platform in the `dist/` directory.

## 🏗️ How It Works

### Application Architecture

```
courtly-electron/
├── electron/           # Electron main process
│   ├── main.js        # Main process entry point
│   └── preload.cjs    # Preload script (bridge to renderer)
├── src/               # React frontend
│   ├── App.tsx        # Main application component
│   ├── main.tsx       # React entry point
│   ├── types.ts       # TypeScript type definitions
│   └── styles.css     # Global styles
└── package.json       # Dependencies and scripts
```

### Technology Stack

- **Electron 30**: Desktop application framework
- **React 18**: UI framework
- **TypeScript**: Type-safe development
- **Vite 5**: Fast build tool and dev server
- **nanoid**: Unique ID generation

### Data Storage

**Location**: Data is stored in a JSON file at:
- **macOS**: `~/Library/Application Support/Courtly/data/courtly.json`
- **Windows**: `%APPDATA%/Courtly/data/courtly.json`
- **Linux**: `~/.config/Courtly/data/courtly.json`

**Database Schema** (v2):
```typescript
{
  version: 2,
  players: Player[],           // All players across clubs
  reservations: Reservation[], // Court bookings
  coaches: Coach[],            // Available coaches
  coachingSessions: CoachingSession[], // Coaching bookings
  currentClub: Club | null,    // Selected club
  settings: {
    courts: Court[],           // 14 courts with lighting info
    leaveMatchBuffer: number
  }
}
```

### Key Components

#### 1. **Home Page**
- Displays club selection interface
- Allows switching between three tennis clubs
- Resets navigation when club is selected

#### 2. **Court Reservations**
- Visual calendar grid showing all reservations
- Dropdown selection for members, courts, dates, and times
- Validates time slots in 30-minute increments
- Prevents overlapping reservations
- Elegant card-based form with gold borders

#### 3. **Coaching**
- Manage coaching sessions with multiple coaches
- Automatically books a court when creating a coaching session
- Canceling a session also cancels the court reservation
- Displays coach information with rates
- Lists all upcoming and past sessions

#### 4. **Registration**
- Register new players for the selected club
- Players are club-specific (multi-club support)
- Displays all registered players in an elegant table
- Form validation for required fields

#### 5. **Courts**
- View and manage all 14 courts
- Toggle lighting status for each court
- Customize court names

### Design System

**Colors** (Wimbledon Theme):
- Deep Green: `#0d3b26`, `#1a5c3e`
- Royal Purple: `#6a1b9a`, `#4a148c`
- Championship Gold: `#d4af37`

**Typography**:
- Headers: **Cinzel** (elegant serif font)
- Body: **Montserrat** (modern sans-serif font)

**UI Patterns**:
- Gold borders (`2px solid #d4af37`) on inputs and cards
- Gradient backgrounds for cards and buttons
- Uppercase labels with letter-spacing
- 4-column grid layouts with proper spacing
- Box-sizing and min-width to prevent overlaps

### Database Migration

The app includes automatic database migration:
- **v1 → v2**: Adds `clubId` field to existing players
- Assigns players to the first available club if no club is selected
- Runs automatically on first load

### IPC Communication

The app uses Electron's IPC (Inter-Process Communication) to safely communicate between the renderer (React) and main process:

**Preload Bridge** (`electron/preload.cjs`):
```javascript
window.courtly = {
  readDb: () => Promise<DB>,
  writeDb: (patch) => Promise<DB>,
  schedulePropose: (payload) => Promise<{ok, error}>,
  reservationValidate: (payload) => Promise<{ok, error}>
}
```

## 🎨 UI/UX Features

- **Elegant Design**: Wimbledon-inspired color scheme
- **Responsive Layout**: Grid-based layouts that adapt to content
- **Form Validation**: Real-time validation with error messages
- **Visual Feedback**: Success/error messages with color coding
- **Smooth Transitions**: CSS transitions for hover and active states
- **Consistent Styling**: Unified design language across all pages

## 📝 Development Notes

### Time Format
- All times use 12-hour format with AM/PM
- Time slots are in 30-minute increments
- Available hours: 6:00 AM to 10:00 PM

### Court Lighting
- Courts 1-10: Have lights (can be used anytime)
- Courts 11-14: No lights (unlit courts)

### Player Management
- Players can register with multiple clubs
- Each club maintains its own player list
- Player dropdowns only show members of the selected club

### Reservation System
- Prevents double-booking of the same court at the same time
- Validates that end time is after start time
- Automatically calculates duration in minutes
- Links coaching sessions to court reservations

## 🐛 Troubleshooting

**App won't start:**
- Make sure all dependencies are installed: `npm install`
- Kill any existing processes: `pkill -9 -f "electron|vite"`
- Rebuild: `npm run build && npm run dev`

**Database issues:**
- Database file location varies by OS (see Data Storage section)
- Delete the database file to start fresh (will lose all data)
- Database migrations run automatically on startup

**Build errors:**
- Ensure Node.js version is 16 or higher
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run build`

## 📄 License

This project is a sample application for tennis club management.

## 🙏 Credits

Built with:
- Electron
- React
- TypeScript
- Vite
- Cinzel & Montserrat fonts
