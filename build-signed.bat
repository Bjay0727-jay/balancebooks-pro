@echo off
echo ============================================
echo   Balance Books Pro - Signed Build Script
echo ============================================
echo.

REM Check if certificate path is provided
if "%WIN_CSC_LINK%"=="" (
    echo WARNING: WIN_CSC_LINK environment variable not set.
    echo.
    echo To build a SIGNED version:
    echo   set WIN_CSC_LINK=C:\path\to\certificate.pfx
    echo   set WIN_CSC_KEY_PASSWORD=your-password
    echo   build-signed.bat
    echo.
    echo Building UNSIGNED version...
    echo.
    set SIGNING_DISABLED=true
) else (
    echo Certificate found: %WIN_CSC_LINK%
    echo Building SIGNED version...
    echo.
)

REM Install dependencies if needed
if not exist node_modules (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed
        pause
        exit /b 1
    )
)

REM Build the web app
echo Building web application...
call npm run build
if errorlevel 1 (
    echo ERROR: Vite build failed
    pause
    exit /b 1
)

REM Build Electron app
echo.
echo Building Electron application...

if "%SIGNING_DISABLED%"=="true" (
    REM Build without signing
    call npx electron-builder --win portable --config.win.certificateFile=""
) else (
    REM Build with signing
    call npx electron-builder --win
)

if errorlevel 1 (
    echo ERROR: Electron build failed
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Build Complete!
echo ============================================
echo.
echo Output files are in the 'release' folder:
dir /b release\*.exe 2>nul
echo.

if "%SIGNING_DISABLED%"=="true" (
    echo NOTE: This build is UNSIGNED and may trigger antivirus warnings.
    echo To sign your builds, set WIN_CSC_LINK and WIN_CSC_KEY_PASSWORD.
)

echo.
pause
