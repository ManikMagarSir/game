@echo off
REM Voxel Survivor R3F — plug-and-play launcher (native Windows).
REM Usage: start.bat [dev|test|e2e|build|preview]   (default: dev)
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo error: Node.js 20+ is required. Install it from https://nodejs.org then re-run.
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo error: npm is required - it ships with Node.js.
  exit /b 1
)

if not exist node_modules (
  echo node_modules missing - installing dependencies, one-time setup...
  call npm install
  if errorlevel 1 exit /b 1
)

set MODE=%1
if "%MODE%"=="" set MODE=dev

if "%MODE%"=="dev" (
  echo Starting dev server...
  call npm run dev -- --host 127.0.0.1 --port 5173
) else if "%MODE%"=="test" (
  call npm test
) else if "%MODE%"=="e2e" (
  if not exist "%LOCALAPPDATA%\ms-playwright" (
    echo Installing Playwright Chromium, one-time setup...
    call npx playwright install chromium
    if errorlevel 1 exit /b 1
  )
  call npx playwright test
) else if "%MODE%"=="build" (
  call npm run build
) else if "%MODE%"=="preview" (
  call npm run build
  if errorlevel 1 exit /b 1
  call npm run preview -- --host 127.0.0.1 --port 4173
) else (
  echo error: unknown mode '%MODE%'. Use: dev, test, e2e, build, preview
  exit /b 1
)
