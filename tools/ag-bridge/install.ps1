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
if (-not $config.commitAuthorName) { $config | Add-Member -NotePropertyName commitAuthorName -NotePropertyValue 'erichroeseler123-bot' -Force }
if (-not $config.commitAuthorEmail) { $config | Add-Member -NotePropertyName commitAuthorEmail -NotePropertyValue 'erichroeseler123@gmail.com' -Force }
[System.IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json -Depth 12), (New-Object System.Text.UTF8Encoding($false)))

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
$vbsLauncher = Join-Path $bridgeRoot 'Ensure-AG-Bridge.vbs'
$launcherContent = "@echo off`r`nset AG_BRIDGE_SUPERVISED=1`r`n:run`r`n`"$nodeExe`" `"$worker`"`r`nif `"%ERRORLEVEL%`"==`"75`" goto run`r`nif `"%ERRORLEVEL%`"==`"78`" exit /b 0`r`nif `"%ERRORLEVEL%`"==`"0`" exit /b 0`r`ntimeout /t 15 /nobreak >nul`r`ngoto run`r`n"
Set-Content $launcher $launcherContent -Encoding ascii
$vbsContent = "Set WshShell = CreateObject(`"WScript.Shell`")`r`nWshShell.CurrentDirectory = `"$bridgeRoot`"`r`nWshShell.Run `"`"`"$launcher`"`"`", 0, False`r`n"
Set-Content $vbsLauncher $vbsContent -Encoding ascii

if (!$NoStartup) {
    $startup = [Environment]::GetFolderPath('Startup')
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut((Join-Path $startup 'AG Bridge.lnk'))
    $shortcut.TargetPath = 'wscript.exe'
    $shortcut.Arguments = "`"$vbsLauncher`""
    $shortcut.WorkingDirectory = $bridgeRoot
    $shortcut.Description = 'AG Bridge 10-site portfolio worker'
    $shortcut.Save()

    # Standard Windows user accounts cannot register boot-level (-AtStartup) or Highest-privilege tasks
    # without Administrator elevation ("Access is denied"). Register a user-scoped logon + 15-minute
    # watchdog scheduled task instead, which succeeds without elevation.
    try {
        $action = New-ScheduledTaskAction -Execute 'wscript.exe' -Argument "`"$vbsLauncher`"" -WorkingDirectory $bridgeRoot
        $triggerLogon = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
        $triggerWatchdog = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 15)
        $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
        Register-ScheduledTask -TaskName 'AG-Bridge-Worker' -Action $action -Trigger @($triggerLogon, $triggerWatchdog) -Settings $settings -Description 'AG Bridge portfolio worker user-logon and 15-minute watchdog' -Force | Out-Null
    } catch {
        Write-Warning "Could not register Scheduled Task AG-Bridge-Worker: $($_.Exception.Message). Startup folder shortcut remains active."
    }
}
Write-Host 'Setup complete. Starting AG Bridge worker.'
Start-Process 'wscript.exe' -ArgumentList "`"$vbsLauncher`""
