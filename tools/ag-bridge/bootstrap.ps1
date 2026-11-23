param([string]$SourceRef = 'codex/ag-bridge-20261012')
$ErrorActionPreference = 'Stop'
if ($SourceRef -notmatch '^[a-zA-Z0-9/_-]+$') { throw 'Invalid source revision.' }
$bridgeInstallRoot = Join-Path $env:LOCALAPPDATA 'AG-Bridge'
New-Item -ItemType Directory -Force -Path $bridgeInstallRoot | Out-Null
foreach ($bridgeFilename in @('bridge.mjs','config.json','install.ps1','README.md','bridge.test.mjs')) {
    $bridgeUrl = "https://raw.githubusercontent.com/erichroeseler123-bot/destinations-cc/$SourceRef/tools/ag-bridge/$bridgeFilename"
    Invoke-WebRequest -UseBasicParsing -Uri $bridgeUrl -OutFile (Join-Path $bridgeInstallRoot $bridgeFilename)
}
& powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $bridgeInstallRoot 'install.ps1')
if ($LASTEXITCODE -ne 0) { throw 'Setup stopped. Read the message above, resolve it, and run setup again.' }
