$ErrorActionPreference = "Stop"

Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "🔑 VIATOR PARTNER API CREDENTIAL & CATALOG SYNC" -ForegroundColor Cyan
Write-Host "========================================================================`n"

$secureKey = Read-Host -AsSecureString "Enter active VIATOR_API_KEY (typing hidden)"
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)
$apiKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Error "No API key provided. Operation aborted."
    exit 1
}

$localEnvPath = Join-Path $PSScriptRoot "..\.env.local"
$rootEnvPath = Join-Path $PSScriptRoot "..\..\.env.local"

# Write key into .env.local files safely
$envLine = "VIATOR_API_KEY=$apiKey`n"
[System.IO.File]::AppendAllText($localEnvPath, $envLine)
[System.IO.File]::AppendAllText($rootEnvPath, $envLine)
Write-Host "Saved VIATOR_API_KEY to .env.local`n" -ForegroundColor Green

# Execute node orchestrator
$scriptPath = Join-Path $PSScriptRoot "sync-viator-credentials-and-catalog.mjs"
& node $scriptPath
