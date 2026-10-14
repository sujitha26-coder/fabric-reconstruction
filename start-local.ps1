$ErrorActionPreference = 'Stop'

$projectRoot = $PSScriptRoot
$backendDir = Join-Path $projectRoot 'backend'
$frontendDir = Join-Path $projectRoot 'frontend'
$python = Join-Path $backendDir '.venv\Scripts\python.exe'
$nodeModules = Join-Path $frontendDir 'node_modules'

if (-not (Test-Path $python)) {
    throw "Backend Python environment not found at '$python'. Create the backend virtual environment and install backend\requirements.txt first."
}

if (-not (Test-Path $nodeModules)) {
    throw "Frontend dependencies not found at '$nodeModules'. Run 'npm install' in the frontend folder first."
}

$databasePath = Join-Path $backendDir 'weaveai-local.db'
$databaseUrl = 'sqlite:///' + $databasePath.Replace('\', '/')
$backendCommand = "`$env:DATABASE_URL='$databaseUrl'; Set-Location '$projectRoot'; & '$python' -m uvicorn main:app --app-dir '$backendDir' --host 0.0.0.0 --port 8000 --reload"
$frontendCommand = "`$env:VITE_API_BASE_URL='http://localhost:8000'; Set-Location '$frontendDir'; npm run dev -- --host 0.0.0.0"

$backendProcess = Start-Process -PassThru -FilePath 'powershell.exe' -ArgumentList @(
    '-NoExit',
    '-ExecutionPolicy', 'Bypass',
    '-Command', $backendCommand
)
$frontendProcess = Start-Process -PassThru -FilePath 'powershell.exe' -ArgumentList @(
    '-NoExit',
    '-ExecutionPolicy', 'Bypass',
    '-Command', $frontendCommand
)

Write-Host 'Waiting for the local backend to become ready...'
$backendReady = $false
for ($attempt = 0; $attempt -lt 120; $attempt++) {
    if ($backendProcess.HasExited) {
        throw "The backend process exited. Check its PowerShell window for the startup error."
    }

    try {
        $health = Invoke-RestMethod -Uri 'http://localhost:8000/health' -TimeoutSec 2
        if ($health.status -eq 'ok') {
            $backendReady = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $backendReady) {
    throw 'The backend did not become ready within 120 seconds. Check the backend PowerShell window.'
}

Write-Host 'Backend is ready.'

Write-Host 'Waiting for the local frontend to become ready...'
$frontendReady = $false
for ($attempt = 0; $attempt -lt 120; $attempt++) {
    if ($frontendProcess.HasExited) {
        throw 'The frontend process exited. Check its PowerShell window for the startup error.'
    }

    try {
        $page = Invoke-WebRequest -Uri 'http://127.0.0.1:5173/login' -UseBasicParsing -TimeoutSec 2
        if ($page.StatusCode -eq 200) {
            $frontendReady = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $frontendReady) {
    throw 'The frontend did not become ready within 120 seconds. Check the frontend PowerShell window.'
}

Write-Host 'Frontend is ready.'
Write-Host 'Started the backend and frontend in separate PowerShell windows.'
Write-Host 'Open http://127.0.0.1:5173/login and choose Create account to register.'
Write-Host 'Backend API and interactive docs: http://127.0.0.1:8000/docs'
Write-Host 'Use localhost or 127.0.0.1 in a browser; 0.0.0.0 is only the server bind address.'
Write-Host "Local accounts are stored in '$databasePath'."
