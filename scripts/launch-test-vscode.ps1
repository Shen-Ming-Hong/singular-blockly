#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Launch test VS Code with Singular Blockly extension and auto-open Blockly editor.
.DESCRIPTION
    1. Packages the extension as VSIX (uses existing if recent enough)
    2. Installs VSIX to shared extensions dir
    3. Launches test VS Code with test workspace
    4. Waits for window focus, then sends Ctrl+Shift+P → "Open Blockly Edit" to open editor
    5. Monitors AI suggestion logs
.PARAMETER SkipBuild
    Skip VSIX rebuild if the existing one is recent enough
.PARAMETER WaitForAI
    Seconds to wait for AI suggestion response (default: 45)
#>
param(
    [switch]$SkipBuild,
    [int]$WaitForAI = 45
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$projectRoot = 'E:\singular-blockly'
$testWorkspace = 'E:\test\debug_extension'
$vscodePath = "$projectRoot\.vscode-test\vscode-win32-x64-archive-1.109.4"
$codeExe = "$vscodePath\Code.exe"
$codeCli = "$vscodePath\bin\code.cmd"
$extensionsDir = 'C:\Users\User\.vscode\extensions'
$userDataDir = "$projectRoot\.vscode-test\user-data"
$vsixPath = "$projectRoot\singular-blockly-0.65.3.vsix"

# Step 1: Build VSIX if needed
if (-not $SkipBuild) {
    Write-Host '📦 Building VSIX...' -ForegroundColor Cyan
    Push-Location $projectRoot
    npx @vscode/vsce package --no-update-package-json --no-git-tag-version 2>&1 | Select-Object -Last 2
    Pop-Location
}

if (-not (Test-Path $vsixPath)) {
    Write-Error "VSIX not found at $vsixPath"
    exit 1
}

# Step 2: Install VSIX
Write-Host '🔧 Installing extension...' -ForegroundColor Cyan
& $codeCli --extensions-dir=$extensionsDir --user-data-dir=$userDataDir --install-extension $vsixPath --force 2>&1 | Out-Null
$installed = Get-ChildItem $extensionsDir -Directory -Filter '*singular*'
if ($installed) {
    Write-Host "  ✅ Installed: $($installed.Name)" -ForegroundColor Green
} else {
    Write-Error 'Extension installation failed'
    exit 1
}

# Step 3: Launch VS Code
Write-Host '🚀 Launching test VS Code...' -ForegroundColor Cyan
$proc = Start-Process -FilePath $codeExe -ArgumentList @(
    $testWorkspace,
    "--extensions-dir=$extensionsDir",
    "--user-data-dir=$userDataDir",
    "--disable-workspace-trust"
) -PassThru

Write-Host "  PID: $($proc.Id)"

# Step 4: Wait for window and send keyboard commands
Write-Host '⏳ Waiting 15s for VS Code to initialize...' -ForegroundColor Yellow
Start-Sleep -Seconds 15

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName Microsoft.VisualBasic

# Bring VS Code window to foreground
$attempts = 0
$focused = $false
while ($attempts -lt 8 -and -not $focused) {
    $attempts++
    try {
        $wshell = New-Object -ComObject WScript.Shell
        # Find VS Code window by title
        $vscodeProc = Get-Process -Id $proc.Id -ErrorAction SilentlyContinue
        if ($vscodeProc -and $vscodeProc.MainWindowHandle -ne 0) {
            $wshell.AppActivate($proc.Id) | Out-Null
            $focused = $true
            Write-Host "  ✅ VS Code window focused" -ForegroundColor Green
        } else {
            Write-Host "  Attempt $attempts/8: waiting for window..." -ForegroundColor Yellow
            Start-Sleep -Seconds 3
        }
    } catch {
        Start-Sleep -Seconds 3
    }
}

if (-not $focused) {
    Write-Host '  ⚠️ Could not auto-focus window. Trying SendKeys anyway...' -ForegroundColor Yellow
}

# Send Ctrl+Shift+P to open command palette — with retry
$commandSent = $false
for ($retry = 0; $retry -lt 3; $retry++) {
    # Re-focus before each attempt
    try { $wshell.AppActivate($proc.Id) | Out-Null } catch {}
    Start-Sleep -Seconds 1

    # Press Escape first to dismiss any dialog
    [System.Windows.Forms.SendKeys]::SendWait('{ESCAPE}')
    Start-Sleep -Milliseconds 500

    # Open command palette
    [System.Windows.Forms.SendKeys]::SendWait('^+p')
    Start-Sleep -Milliseconds 1200

    # Type the command
    [System.Windows.Forms.SendKeys]::SendWait('Open Blockly Edit')
    Start-Sleep -Milliseconds 1000

    # Press Enter to execute
    [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
    Write-Host "  📝 Sent 'Open Blockly Edit' command (attempt $($retry+1)/3)" -ForegroundColor Green

    # Wait a bit and check if Blockly editor opened (look for shadow suggestion log)
    Start-Sleep -Seconds 8
    $latestLogDir = Get-ChildItem "$userDataDir\logs" -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
    if ($latestLogDir) {
        $singularLog = Get-ChildItem $latestLogDir.FullName -Recurse -Filter 'Singular Blockly.log' -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($singularLog) {
            $logContent = Get-Content $singularLog.FullName -Tail 30 -ErrorAction SilentlyContinue | Out-String
            if ($logContent -match 'Shadow suggestion requested|Blockly editor opened|WebView.*loadWorkspace') {
                $commandSent = $true
                Write-Host "  ✅ Blockly editor opened successfully" -ForegroundColor Green
                break
            }
        }
    }
    Write-Host "  ⚠️ Editor not detected yet, retrying..." -ForegroundColor Yellow
}

if (-not $commandSent) {
    Write-Host "  ⚠️ Could not confirm editor opened after 3 attempts. Waiting for AI anyway..." -ForegroundColor Yellow
}

# Step 4.5: Trigger AI suggestion manually via Ctrl+Shift+.
Write-Host '🤖 Triggering AI suggestion (Ctrl+Shift+.)...' -ForegroundColor Cyan
Start-Sleep -Seconds 5
try { $wshell.AppActivate($proc.Id) | Out-Null } catch {}
Start-Sleep -Milliseconds 500
[System.Windows.Forms.SendKeys]::SendWait('^+.')
Write-Host "  📝 Sent Ctrl+Shift+. to trigger AI suggestion" -ForegroundColor Green

# Step 5: Monitor logs
Write-Host "`n📊 Monitoring AI logs (waiting ${WaitForAI}s)..." -ForegroundColor Cyan
$startTime = Get-Date
$logFound = $false

while ((Get-Date) -lt $startTime.AddSeconds($WaitForAI)) {
    Start-Sleep -Seconds 5
    $latestLogDir = Get-ChildItem "$userDataDir\logs" -Directory | Sort-Object Name -Descending | Select-Object -First 1
    if (-not $latestLogDir) { continue }
    
    $singularLog = Get-ChildItem $latestLogDir.FullName -Recurse -Filter 'Singular Blockly.log' | Select-Object -First 1
    if (-not $singularLog) { continue }
    
    $aiLines = Get-Content $singularLog.FullName | Select-String -Pattern '\[AI Perf\].*Full round|Parsed \d+ suggestions|No valid suggestions'
    if ($aiLines) {
        $logFound = $true
        Write-Host "`n=== AI Suggestion Results ===" -ForegroundColor Cyan
        # Show all AI-related log lines
        Get-Content $singularLog.FullName | Select-String -Pattern '\[AI Perf\]|\[AI Debug\]|Shadow suggestion|Selected model|Model limits|Block dictionary' | ForEach-Object {
            Write-Host "  $($_.Line)"
        }
        break
    }
}

if (-not $logFound) {
    Write-Host "  ⚠️ No AI results found within ${WaitForAI}s" -ForegroundColor Yellow
    # Show whatever logs we have
    $latestLogDir = Get-ChildItem "$userDataDir\logs" -Directory | Sort-Object Name -Descending | Select-Object -First 1
    if ($latestLogDir) {
        $singularLog = Get-ChildItem $latestLogDir.FullName -Recurse -Filter 'Singular Blockly.log' | Select-Object -First 1
        if ($singularLog) {
            Write-Host "`n  Last 10 log lines:"
            Get-Content $singularLog.FullName | Select-Object -Last 10 | ForEach-Object { Write-Host "  $_" }
        }
    }
}

Write-Host "`n✅ Done. Test VS Code is still running (PID: $($proc.Id))." -ForegroundColor Green
