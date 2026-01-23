# 🚀 GitHub Actions Deployment Guide for Balance Books Pro

## Overview

This guide explains how to build desktop installers for **all platforms** (Windows, Mac, Linux) using GitHub Actions - even from a Windows laptop.

---

## 📁 What's Included

The `.github/workflows/build-installers.yml` workflow will automatically build:

| Platform | Output Files |
|----------|-------------|
| **Windows** | `Balance Books Pro Setup 1.6.0.exe` (installer), `Balance Books Pro 1.6.0.exe` (portable) |
| **Mac (Intel)** | `Balance Books Pro-1.6.0.dmg` |
| **Mac (Apple Silicon)** | `Balance Books Pro-1.6.0-arm64.dmg` |
| **Linux** | `Balance Books Pro-1.6.0.AppImage` |

---

## 🔧 Setup Instructions

### Step 1: Push Code to GitHub

Make sure your repository contains these files:

```
your-repo/
├── .github/
│   └── workflows/
│       └── build-installers.yml   ← GitHub Actions workflow
├── build/
│   ├── icon.ico                   ← Windows icon
│   ├── icon.png                   ← Mac/Linux icon  
│   ├── license.txt
│   ├── installer.nsh
│   └── entitlements.mac.plist
├── electron/
│   ├── main.js
│   └── preload.js
├── src/
│   └── App.jsx
├── public/
│   └── expense-template.xlsx
├── package.json
└── ... other files
```

### Step 2: Push to GitHub

```bash
# If you haven't initialized git yet:
git init
git remote add origin https://github.com/YOUR_USERNAME/balancebooks-pro.git

# Add all files including .github folder
git add -A
git commit -m "Add GitHub Actions workflow for cross-platform builds"
git push origin main
```

**Important:** Make sure the `.github` folder is pushed! It's a hidden folder, so verify it exists:
```bash
git ls-files | grep ".github"
```

### Step 3: Enable GitHub Actions Permissions

1. Go to your repository on GitHub.com
2. Click **Settings** → **Actions** → **General**
3. Under "Workflow permissions", select: **Read and write permissions**
4. Click **Save**

---

## 🏃 Running the Build

### Option A: Manual Trigger (Recommended for Testing)

1. Go to your repository on GitHub.com
2. Click the **Actions** tab
3. Click **"Build Desktop Installers"** in the left sidebar
4. Click **"Run workflow"** dropdown
5. Click the green **"Run workflow"** button

### Option B: Tag-Based Release (For Production)

```bash
# Create and push a version tag
git tag v1.6.0
git push origin v1.6.0
```

This will:
1. Build all installers
2. Create a GitHub Release
3. Attach all installer files to the release

---

## 📥 Downloading Your Installers

### After Manual Trigger:

1. Go to **Actions** tab
2. Click on the completed workflow run
3. Scroll down to **"Artifacts"** section
4. Download:
   - `windows-installer` - Contains .exe files
   - `mac-installers-all` - Contains .dmg files  
   - `linux-installer` - Contains .AppImage file

### After Tag-Based Release:

1. Go to **Releases** section of your repo
2. Find the release (e.g., `v1.6.0`)
3. All installers are attached as release assets

---

## ⏱️ Build Times

Typical build times:
- Windows: ~3-5 minutes
- Mac: ~5-8 minutes
- Linux: ~3-5 minutes
- **Total:** ~8-15 minutes

---

## 🔍 Troubleshooting

### Issue: "No files were found with the provided path"

**Cause:** Build failed before creating installers

**Solution:** 
1. Click on the failed job
2. Expand the failed step to see error details
3. Common fixes:
   - Make sure `package.json` has correct build config
   - Ensure all source files are committed

### Issue: "Resource not accessible by integration"

**Cause:** Workflow doesn't have write permissions

**Solution:**
1. Go to **Settings** → **Actions** → **General**
2. Select **"Read and write permissions"**
3. Click **Save**
4. Re-run the workflow

### Issue: ".github folder not showing in repo"

**Cause:** Hidden folder not committed

**Solution:**
```bash
# Force add the .github folder
git add .github -f
git commit -m "Add GitHub Actions workflow"
git push
```

### Issue: Build succeeds but no DMG files

**Cause:** Missing Mac icon or build config issue

**Solution:** Ensure `build/icon.png` exists (electron-builder converts it to .icns automatically on macOS)

---

## 📝 Customizing the Workflow

### Change Version Number

Edit `package.json`:
```json
{
  "version": "1.7.0"
}
```

Then create a matching tag:
```bash
git tag v1.7.0
git push origin v1.7.0
```

### Add Code Signing (Optional)

For production releases, add these secrets to your repository:

**Windows:**
- `WIN_CSC_LINK` - Base64-encoded .pfx certificate
- `WIN_CSC_KEY_PASSWORD` - Certificate password

**Mac:**
- `CSC_LINK` - Base64-encoded .p12 certificate
- `CSC_KEY_PASSWORD` - Certificate password
- `APPLE_ID` - Apple Developer ID
- `APPLE_ID_PASSWORD` - App-specific password

---

## ✅ Verification Checklist

After a successful build:

- [ ] Windows `.exe` installer downloads and installs correctly
- [ ] Mac Intel `.dmg` opens on Intel Macs
- [ ] Mac ARM `.dmg` opens on M1/M2/M3 Macs
- [ ] Linux `.AppImage` runs on Ubuntu/Debian
- [ ] App version shows `1.6.0` in About dialog
- [ ] "Import Template" downloads Excel file (not CSV)

---

## 🆘 Getting Help

If builds continue to fail:
1. Check the **Actions** tab for detailed error logs
2. Open an issue with the error message
3. Include the full build log from the failed step
