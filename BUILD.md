# Balance Books Pro - Build Instructions

## Quick Start (Windows)

1. **Extract** the `balance-books-fixed.zip` file

2. **Open Command Prompt** in the extracted folder

3. **Run these commands:**

```cmd
npm install
npm run build
npm run electron:build:win
```

4. **Your installer** will be in: `release/Balance Books Pro-1.1.0-Windows-Setup.exe`

---

## Quick Start (macOS)

```bash
npm install
npm run build
npm run electron:build:mac
```

Your `.dmg` file will be in the `release/` folder.

---

## Test Web Version First

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

---

## Troubleshooting

**If you get errors about missing modules:**
```cmd
npm install --force
```

**If Electron fails to download:**
```cmd
npm cache clean --force
npm install electron --save-dev
```

---

## What's Different in This Version

- ✅ NO Capacitor dependencies (was causing build errors)
- ✅ Clean package.json with only needed dependencies
- ✅ Simplified vite.config.js
- ✅ Works on Windows and macOS

---

## File Structure

```
balance-books-fixed/
├── package.json         # Dependencies (no Capacitor!)
├── vite.config.js       # Build config
├── index.html           # Entry point
├── src/
│   ├── main.jsx        # React entry
│   ├── App.jsx         # Main app
│   └── index.css       # Styles
├── electron/
│   ├── main.js         # Electron main process
│   └── preload.js      # Secure bridge
└── build/
    └── entitlements.mac.plist
```
