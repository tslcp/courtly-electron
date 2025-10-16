# Quick Start Guide — Courtly Tennis Club Management

## 🚀 Running the App

### Development Mode (Recommended for Testing)
```bash
npm run dev
```
This will:
- Start Vite dev server on http://localhost:5173
- Launch Electron with hot reload
- Open DevTools for debugging

### Production Build
```bash
npm run build    # Build React app
npm run electron # Run built app
```

### Create Installer
```bash
npm run dist     # Creates .dmg (macOS), .exe (Windows), or .AppImage (Linux)
```

## 📋 Common Tasks

### Reserve a Court
1. Click **Reservations** tab
2. Enter member name and contact
3. Select court, date/time, and duration
4. Click "Reserve Court"
5. Confirmation message appears

### Book a Coaching Session
1. Click **Coaching** tab
2. Browse available coaches (shows rates and specialties)
3. Enter student name and contact
4. Select coach, date/time, and optional court
5. Click "Book Coaching Session"
6. Total cost is calculated automatically

### Manage Pro Shop
1. Click **Shop** tab
2. Switch between categories: Strings, Racquets, Balls, Apparel
3. For **Strings**: Enter quantity and click "Record Sale"
4. For **Other Items**: Click "Sell" on product cards
5. Inventory updates automatically

### Register Players (for Tournaments)
1. Click **Registration** tab
2. Enter first name, last name, school (optional), gender
3. Click "Add Player"

### Schedule a Match
1. Click **Scheduler** tab
2. Set start time, duration, and select court
3. Click "Create Match Slot"
4. Assign players in the **Matches** tab

## 🎯 Key Features

### Court Lighting Rules
- Courts 1-10 have lights (can be used anytime)
- Courts 11-14 have NO lights (only until 8:30 PM)
- System automatically prevents reservations after hours

### Coaching Rates
- Sarah Williams: $75/hr (Singles Strategy)
- Mike Chen: $80/hr (Serve & Volley)
- Emma Rodriguez: $60/hr (Junior Development)

### Pro Shop Promo
- Strings: "Buy 2, Get 1 Free"
- Charge customers for only 2 out of every 3 string jobs

## 🗂️ Where is My Data?

Your club data is stored locally on your computer:

**macOS**: `~/Library/Application Support/courtly-electron/data/courtly.json`
**Windows**: `%APPDATA%\courtly-electron\data\courtly.json`
**Linux**: `~/.config/courtly-electron/data/courtly.json`

⚠️ **Backup Tip**: Copy this file regularly to backup your data!

## 🐛 Troubleshooting

### App won't start
```bash
# Kill existing processes
pkill -9 -f "vite|electron"

# Try again
npm run dev
```

### Port 5173 in use
```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9

# Restart
npm run dev
```

### Missing node_modules
```bash
npm install
```

### Build errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 💡 Tips & Best Practices

1. **Reservations**: Always check the calendar view before booking
2. **Coaching**: Book courts for coaching sessions to avoid conflicts
3. **Pro Shop**: Update inventory counts after receiving shipments
4. **Matches**: Record winners immediately after matches complete
5. **Leaderboard**: Add +5 points manually for bracket champions
6. **Raffle**: Draw winner after all tickets are entered

## 🔐 Security Notes

- App stores data locally (no cloud sync)
- No user authentication (single-user desktop app)
- All data is in plain JSON (no encryption)
- For multi-user scenarios, consider backing up data regularly

## 📞 Support

For issues or feature requests:
1. Check the CHANGELOG.md for known issues
2. Review the README.md for detailed documentation
3. Contact: JiaYou Tennis development team

---

**Current Version**: 0.2.0
**Last Updated**: October 15, 2025
