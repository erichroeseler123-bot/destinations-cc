param([switch]$NoStartup)
$ErrorActionPreference = 'Stop'
$bridgeRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Invoke-BridgeNative([scriptblock]$Command) {
    # Windows PowerShell 5.1 turns redirected native stderr into error records.
    # Native diagnostics must not bypass our explicit exit-code handling.
    $ErrorActionPreference = 'Continue'
    $PSNativeCommandUseErrorActionPreference = $false
    & $Command
    $script:BridgeNativeExitCode = $LASTEXITCODE
}

function Refresh-BridgePath {
    $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
    $env:Path += ';' + (Join-Path $env:LOCALAPPDATA 'agy\bin')
}
function Ensure-BridgeProgram([string]$Name, [string]$Package) {
    if (!(Get-Command $Name -ErrorAction SilentlyContinue)) {
        if (!(Get-Command winget -ErrorAction SilentlyContinue)) { throw "Install $Name, then run this installer again. Windows App Installer (winget) is unavailable." }
        Invoke-BridgeNative { & winget install --id $Package --exact --accept-source-agreements --accept-package-agreements }
        if ($script:BridgeNativeExitCode -ne 0) { throw "Could not install $Name. Install it manually and rerun setup." }
        Refresh-BridgePath
    }
    if (!(Get-Command $Name -ErrorAction SilentlyContinue)) { throw "$Name is installed but not on PATH. Open a new PowerShell window and rerun setup." }
}

Refresh-BridgePath
Ensure-BridgeProgram 'git' 'Git.Git'
Ensure-BridgeProgram 'gh' 'GitHub.cli'
Ensure-BridgeProgram 'node' 'OpenJS.NodeJS.LTS'
$nodeMajor = Invoke-BridgeNative { & node -p 'process.versions.node.match(/^[0-9]+/)[0]' }
if ($script:BridgeNativeExitCode -ne 0) { throw 'Could not read the Node.js version.' }
if ([int]$nodeMajor -lt 24) { throw 'Node.js 24 or newer is required. Update Node.js and run setup again. Your site checks may specifically require Node 24.' }
if (!(Get-Command agy -ErrorAction SilentlyContinue)) {
    $agyInstaller = Join-Path $env:TEMP 'ag-bridge-agy-install.ps1'
    Invoke-WebRequest 'https://antigravity.google/cli/install.ps1' -OutFile $agyInstaller
    Invoke-BridgeNative { & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $agyInstaller }
    if ($script:BridgeNativeExitCode -ne 0) { throw 'Antigravity CLI installation failed.' }
    Refresh-BridgePath
}
$agyCommand = Get-Command agy -ErrorAction Stop
if ($agyCommand.CommandType -ne 'Application' -or $agyCommand.Source -notmatch '\.exe$') {
    throw 'Setup needs the native Antigravity CLI agy.exe, not the older editor launcher/alias. Install https://antigravity.google/cli/install.ps1, reopen PowerShell and rerun setup.'
}
Invoke-BridgeNative { & gh auth status 2>$null }
if ($script:BridgeNativeExitCode -ne 0) {
    Invoke-BridgeNative { & gh auth login --hostname github.com --git-protocol https --web }
    if ($script:BridgeNativeExitCode -ne 0) { throw 'GitHub sign-in did not complete.' }
}
Invoke-BridgeNative { & gh auth setup-git }
if ($script:BridgeNativeExitCode -ne 0) { throw 'Git authentication setup failed.' }
Invoke-BridgeNative { & gh api repos/erichroeseler123-bot/destinations-cc --jq '.full_name' }
if ($script:BridgeNativeExitCode -ne 0) { throw 'Signed-in GitHub account cannot access the queue repository.' }
Invoke-BridgeNative { & gh api repos/erichroeseler123-bot/wta-renderer --jq '.full_name' }
if ($script:BridgeNativeExitCode -ne 0) { throw 'Signed-in GitHub account cannot access WTA.' }

$configPath = Join-Path $bridgeRoot 'config.json'
$config = Get-Content $configPath -Raw | ConvertFrom-Json
$config | Add-Member -NotePropertyName agyPath -NotePropertyValue $agyCommand.Source -Force
$config | ConvertTo-Json -Depth 12 | Set-Content $configPath -Encoding utf8

Write-Host 'Checking AG sign-in. If requested, sign in with your Google account.'
Invoke-BridgeNative { & $agyCommand.Source -p 'Reply exactly AG_BRIDGE_OK. Do not use tools.' --output-format json --print-timeout 2m }
if ($script:BridgeNativeExitCode -ne 0) {
    Write-Host 'AG needs its one-time interactive sign-in. After sign-in, type /exit to return here.'
    Invoke-BridgeNative { & $agyCommand.Source }
    Invoke-BridgeNative { & $agyCommand.Source -p 'Reply exactly AG_BRIDGE_OK. Do not use tools.' --output-format json --print-timeout 2m }
    if ($script:BridgeNativeExitCode -ne 0) { throw 'AG sign-in check failed; run agy interactively and rerun setup.' }
}

$nodeExe = (Get-Command node).Source
$worker = Join-Path $bridgeRoot 'bridge.mjs'
$launcher = Join-Path $bridgeRoot 'Start-AG-Bridge.cmd'
$launcherContent = "@echo off`r`n`"$nodeExe`" `"$worker`"`r`npause`r`n"
Set-Content $launcher $launcherContent -Encoding ascii
if (!$NoStartup) {
    $startup = [Environment]::GetFolderPath('Startup')
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut((Join-Path $startup 'AG Bridge.lnk'))
    $shortcut.TargetPath = $launcher
    $shortcut.WorkingDirectory = $bridgeRoot
    $shortcut.Description = 'JFD, WNO, WTA and Welcome to the Swamp task worker'
    $shortcut.Save()
}
Write-Host 'Setup complete. Starting the four connection checks. Keep the worker window open while it works.'
Write-Host 'Codex Code Review must be enabled for destinations-cc and wta-renderer before code tasks can finish their review loop.'
Write-Host 'Settings: https://chatgpt.com/codex/settings/code-review'
Start-Process $launcher
