# Balance Books Pro - Installation Guide

## 📋 Table of Contents
1. [Quick Start (Easiest)](#-quick-start-easiest)
2. [Install on Your Phone](#-install-on-your-phone)
3. [Install on Windows](#-install-on-windows)
4. [Install on Mac](#-install-on-mac)
5. [For Developers](#-for-developers)
6. [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start (Easiest)

### Step 1: Install Node.js (One-Time Setup)

**Go to [nodejs.org](https://nodejs.org/)** and download the **LTS** version.

- **Windows:** Run the installer, click "Next" through all steps
- **Mac:** Run the installer package

### Step 2: Extract & Install

1. **Right-click** the `Balance-Books-Pro-v1.5.zip` file
2. Select **"Extract All..."** (Windows) or double-click (Mac)
3. Open a **terminal/command prompt** in the extracted folder

### Step 3: Run These Commands

```bash
npm install
npm run dev
```

### Step 4: Open the App

Go to **http://localhost:5173** in your web browser.

🎉 **Done! Balance Books Pro is running!**

---

## 📱 Install on Your Phone

Balance Books Pro works as a mobile app through your browser!

### iPhone / iPad

1. Open **Safari** and go to your Balance Books URL
2. Tap the **Share button** ⬆️ (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"**
5. ✅ App icon appears on your home screen!

### Android

1. Open **Chrome** and go to your Balance Books URL
2. Look for **"Install Balance Books"** banner at the bottom
   - Or tap **⋮ menu** → **"Add to Home Screen"**
3. Tap **"Install"**
4. ✅ App appears in your app drawer!

### Benefits:
- ✅ Works offline
- ✅ Full-screen (no browser bars)
- ✅ Fast loading
- ✅ Bill reminder notifications

---

## 💻 Install on Windows

### Simple Setup (5 Minutes)

**Step 1:** Download Node.js from [nodejs.org](https://nodejs.org/) (LTS version)

**Step 2:** Extract `Balance-Books-Pro-v1.5.zip`

**Step 3:** Open Command Prompt
- Press `Windows + R`
- Type `cmd` and press Enter

**Step 4:** Navigate to the folder
```
cd C:\Users\YourName\Downloads\Balance-Books-Pro-v1.5\balance-books-fixed
```
*(Replace `YourName` with your actual username)*

**Step 5:** Install and run
```
npm install
npm run dev
```

**Step 6:** Open http://localhost:5173 in your browser

---

### Build Windows Desktop App (.exe)

After completing the Simple Setup:

```bash
npm run electron:build
```

Find the installer at:
```
dist\Balance Books Pro Setup 1.5.0.exe
```

Double-click to install, then find it in your Start Menu!

---

## 🍎 Install on Mac

### Simple Setup (5 Minutes)

**Step 1:** Download Node.js from [nodejs.org](https://nodejs.org/) (LTS version)

**Step 2:** Extract `Balance-Books-Pro-v1.5.zip` (double-click it)

**Step 3:** Open Terminal
- Press `Cmd + Space`
- Type `Terminal` and press Enter

**Step 4:** Navigate to the folder
```bash
cd ~/Downloads/Balance-Books-Pro-v1.5/balance-books-fixed
```

**Step 5:** Install and run
```bash
npm install
npm run dev
```

**Step 6:** Open http://localhost:5173 in your browser

---

### Build Mac Desktop App (.dmg)

After completing the Simple Setup:

```bash
npm run electron:build
```

Find the installer at:
```
dist/Balance Books Pro-1.5.0.dmg
```

Double-click, drag to Applications, done!

---

## 👨‍💻 For Developers

### Prerequisites
- Node.js 18+ 
- npm (comes with Node.js)

### Commands

| Command | What it does |
|---------|--------------|
| `npm install` | Install dependencies |
| `npm run dev` | Development server (hot reload) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run electron:build` | Build desktop installers |

### Project Structure

```
balance-books-fixed/
├── src/
│   ├── App.jsx          # Main React application
│   ├── main.jsx         # Entry point
│   └── index.css        # Styles
├── public/
│   ├── manifest.json    # PWA config
│   ├── sw.js           # Service worker
│   └── expense-template.xlsx
├── electron/           # Desktop app files
├── index.html
└── package.json
```

---

## 🔧 Troubleshooting

### ❌ "npm is not recognized"

**Cause:** Node.js isn't installed.

**Fix:** 
1. Download from [nodejs.org](https://nodejs.org/)
2. Run the installer
3. **Restart** your terminal/command prompt
4. Try again

---

### ❌ "Cannot find module"

**Cause:** Dependencies not installed.

**Fix:**
```bash
npm install
```

---

### ❌ "Port 5173 is already in use"

**Cause:** Something else is using that port.

**Fix:** Use a different port:
```bash
npm run dev -- --port 3000
```
Then open http://localhost:3000

---

### ❌ Blank white screen

**Fix:**
1. Open browser Developer Tools (F12)
2. Check Console for errors
3. Make sure `npm install` completed successfully
4. Try: `rm -rf node_modules && npm install`

---

### ❌ PWA won't install

**Fix:**
- Must use Chrome or Safari
- Page must be served via HTTPS or localhost
- Clear browser cache and refresh

---

### ❌ Mac: "App is damaged"

**Fix:** Open Terminal and run:
```bash
xattr -cr "/Applications/Balance Books Pro.app"
```

---

### ❌ Data not saving

**Fix:**
- Don't use Private/Incognito mode
- Check browser settings allow localStorage
- Try a different browser (Chrome recommended)

---

## 📝 Quick Reference

```
┌────────────────────────────────────────────┐
│     BALANCE BOOKS PRO - CHEAT SHEET        │
├────────────────────────────────────────────┤
│                                            │
│  FIRST TIME:                               │
│    1. Install Node.js from nodejs.org      │
│    2. Extract the zip file                 │
│    3. Open terminal in folder              │
│    4. npm install                          │
│    5. npm run dev                          │
│    6. Open http://localhost:5173           │
│                                            │
│  EVERY TIME AFTER:                         │
│    1. Open terminal in folder              │
│    2. npm run dev                          │
│    3. Open http://localhost:5173           │
│                                            │
│  BUILD DESKTOP APP:                        │
│    npm run electron:build                  │
│                                            │
└────────────────────────────────────────────┘
```

---

*Balance Books Pro v1.5 - Your Money. Your Device. Your Privacy.*
