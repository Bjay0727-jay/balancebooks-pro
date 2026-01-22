# Code Signing Guide for Balance Books Pro

This guide covers how to sign your application for Windows, macOS, and distribute without antivirus false positives.

---

## Table of Contents

1. [Windows Code Signing](#windows-code-signing)
2. [macOS Code Signing & Notarization](#macos-code-signing--notarization)
3. [Environment Variables](#environment-variables)
4. [Build Commands](#build-commands)
5. [Certificate Providers](#certificate-providers)
6. [Troubleshooting](#troubleshooting)

---

## Windows Code Signing

### Step 1: Purchase a Certificate

**Recommended: EV (Extended Validation) Code Signing Certificate**

| Provider | EV Certificate | Standard Certificate |
|----------|---------------|---------------------|
| [DigiCert](https://www.digicert.com/signing/code-signing-certificates) | ~$449/year | ~$349/year |
| [Sectigo](https://sectigo.com/ssl-certificates-tls/code-signing) | ~$319/year | ~$179/year |
| [GlobalSign](https://www.globalsign.com/en/code-signing-certificate) | ~$339/year | ~$229/year |
| [SSL.com](https://www.ssl.com/certificates/ev-code-signing/) | ~$239/year | ~$74/year |

> **Why EV?** EV certificates provide **immediate Microsoft SmartScreen reputation**, meaning users won't see "Windows protected your PC" warnings. Standard certificates require building reputation over time (thousands of downloads).

### Step 2: Receive Your Certificate

After identity verification (takes 1-5 business days for EV), you'll receive:

- **Option A: PFX/P12 file** - Contains private key + certificate
- **Option B: Hardware token** (EV certificates) - USB device with certificate

### Step 3: Configure Environment Variables

**For PFX file:**
```cmd
# Windows Command Prompt
set WIN_CSC_LINK=C:\path\to\your\certificate.pfx
set WIN_CSC_KEY_PASSWORD=your-certificate-password

# PowerShell
$env:WIN_CSC_LINK = "C:\path\to\your\certificate.pfx"
$env:WIN_CSC_KEY_PASSWORD = "your-certificate-password"
```

**For Hardware Token (EV):**
```cmd
# The token driver handles signing automatically
# Just ensure the token is plugged in during build
set WIN_CSC_LINK=
set WIN_CSC_KEY_PASSWORD=
```

### Step 4: Build Signed Application

```cmd
npm run build
npx electron-builder --win
```

The builder will automatically sign:
- The main .exe
- The installer .exe
- All DLL files

### Step 5: Verify Signature

Right-click the .exe → Properties → Digital Signatures tab

You should see your company name listed.

---

## macOS Code Signing & Notarization

### Step 1: Apple Developer Account

1. Enroll at [developer.apple.com](https://developer.apple.com/programs/) ($99/year)
2. Create a **Developer ID Application** certificate in Certificates, Identifiers & Profiles

### Step 2: Create App-Specific Password

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign In → Security → App-Specific Passwords
3. Generate password for "electron-notarize"

### Step 3: Configure Environment Variables

```bash
# Add to ~/.zshrc or ~/.bash_profile
export APPLE_ID="your-apple-id@email.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="YOUR_TEAM_ID"
export APPLE_IDENTITY="Developer ID Application: Your Company Name (TEAM_ID)"
```

### Step 4: Build and Notarize

```bash
npm run build
npx electron-builder --mac
```

Notarization happens automatically and takes 2-10 minutes.

---

## Environment Variables

### Windows

| Variable | Description | Example |
|----------|-------------|---------|
| `WIN_CSC_LINK` | Path to .pfx certificate file | `C:\certs\balancebooks.pfx` |
| `WIN_CSC_KEY_PASSWORD` | Certificate password | `MySecurePassword123` |

### macOS

| Variable | Description | Example |
|----------|-------------|---------|
| `APPLE_ID` | Your Apple ID email | `dev@company.com` |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password | `xxxx-xxxx-xxxx-xxxx` |
| `APPLE_TEAM_ID` | 10-character Team ID | `ABC123XYZ9` |
| `APPLE_IDENTITY` | Full certificate name | `Developer ID Application: Company (ABC123XYZ9)` |

### CI/CD (GitHub Actions Example)

```yaml
# .github/workflows/build.yml
name: Build & Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Build Electron (Signed)
        env:
          WIN_CSC_LINK: ${{ secrets.WIN_CSC_LINK }}
          WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CSC_KEY_PASSWORD }}
        run: npx electron-builder --win
        
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: windows-build
          path: release/*.exe

  build-mac:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Build Electron (Signed & Notarized)
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          CSC_LINK: ${{ secrets.MAC_CSC_LINK }}
          CSC_KEY_PASSWORD: ${{ secrets.MAC_CSC_KEY_PASSWORD }}
        run: npx electron-builder --mac
        
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: mac-build
          path: release/*.dmg
```

---

## Build Commands

### Development (Unsigned)

```bash
# Build without signing (for testing)
npm run build
npx electron-builder --win --config.win.certificateFile="" 
```

### Production (Signed)

```bash
# Windows - ensure environment variables are set
npm run build
npx electron-builder --win

# macOS - ensure environment variables are set  
npm run build
npx electron-builder --mac

# All platforms
npm run build
npx electron-builder --win --mac --linux
```

---

## Certificate Providers

### Recommended for Small Business

| Provider | Why | Link |
|----------|-----|------|
| **SSL.com** | Cheapest EV ($239/year) | [ssl.com](https://www.ssl.com/certificates/ev-code-signing/) |
| **Sectigo** | Good balance of price/support | [sectigo.com](https://sectigo.com/ssl-certificates-tls/code-signing) |

### Recommended for Enterprise

| Provider | Why | Link |
|----------|-----|------|
| **DigiCert** | Best support, fastest issuance | [digicert.com](https://www.digicert.com/signing/code-signing-certificates) |
| **GlobalSign** | Strong enterprise features | [globalsign.com](https://www.globalsign.com/en/code-signing-certificate) |

### What You Need to Purchase

1. **EV Code Signing Certificate** for Windows (~$239-449/year)
2. **Apple Developer Account** for macOS ($99/year)

**Total annual cost: ~$340-550/year**

---

## Troubleshooting

### Windows Issues

**"Windows protected your PC" (SmartScreen)**
- This appears for new certificates without reputation
- Solution: Use EV certificate OR wait for reputation to build (1000+ downloads)
- Submit to SmartScreen: https://www.microsoft.com/en-us/wdsi/filesubmission

**"Certificate not found"**
```cmd
# Check if environment variable is set
echo %WIN_CSC_LINK%

# Verify certificate file exists
dir "C:\path\to\certificate.pfx"
```

**"Invalid password"**
- Ensure no special characters that need escaping
- Try wrapping password in quotes

**Antivirus False Positives**
Submit to vendors:
- McAfee: https://www.mcafee.com/enterprise/en-us/threat-center/threat-feedback.html
- Microsoft: https://www.microsoft.com/en-us/wdsi/filesubmission
- Norton: https://submit.norton.com/

### macOS Issues

**"App is damaged and can't be opened"**
- Notarization failed - check Apple credentials
- Run: `spctl --assess --type exec -vv "Balance Books Pro.app"`

**"Developer cannot be verified"**
- Certificate not properly installed
- Run: `security find-identity -v -p codesigning`

**Notarization Timeout**
- Apple's servers may be slow
- Check status: https://developer.apple.com/system-status/

---

## Security Best Practices

1. **Never commit certificates to git**
   ```gitignore
   # .gitignore
   *.pfx
   *.p12
   *.pem
   *.key
   ```

2. **Use environment variables or CI/CD secrets**

3. **Store certificates securely**
   - Use a password manager
   - Keep backups in secure location
   - Set calendar reminder for renewal

4. **Rotate certificates before expiry**
   - Most are valid 1-3 years
   - Start renewal process 30 days before expiry

---

## Quick Start Checklist

- [ ] Purchase EV Code Signing Certificate (~$239-449)
- [ ] Receive and install certificate (1-5 days)
- [ ] Set `WIN_CSC_LINK` environment variable
- [ ] Set `WIN_CSC_KEY_PASSWORD` environment variable
- [ ] Run `npx electron-builder --win`
- [ ] Verify signature (right-click exe → Properties → Digital Signatures)
- [ ] Test on clean Windows machine
- [ ] Submit to Microsoft SmartScreen for reputation

For macOS:
- [ ] Enroll in Apple Developer Program ($99/year)
- [ ] Create Developer ID Application certificate
- [ ] Create app-specific password
- [ ] Set environment variables
- [ ] Run `npx electron-builder --mac`
- [ ] Verify notarization completed

---

## Support

If you encounter issues:
1. Check electron-builder docs: https://www.electron.build/code-signing
2. Check certificate provider support
3. Verify all environment variables are set correctly
