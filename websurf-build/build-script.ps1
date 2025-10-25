# WebSurf MCP Launcher
# Checks for Node, downloads if needed, runs main-launcher.js

$ErrorActionPreference = "Stop"

Write-Host "WebSurf MCP Launcher" -ForegroundColor Cyan
Write-Host "====================`n"

$NODE_VERSION = "v22.11.0"
$NODE_BASE_URL = "https://nodejs.org/dist/$NODE_VERSION"
$NODE_ZIP = "node-$NODE_VERSION-win-x64.zip"
$NODE_DIR = ".node-portable"
$NODE_EXE = "$NODE_DIR\node.exe"
$LAUNCHER_SCRIPT = "main-launcher.js"

# Check if main-launcher.js exists
if (-not (Test-Path $LAUNCHER_SCRIPT)) {
    Write-Host "ERROR: $LAUNCHER_SCRIPT not found" -ForegroundColor Red
    Write-Host "Current directory: $PWD" -ForegroundColor Yellow
    exit 1
}

# Check for system Node
$systemNode = $null
try {
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCmd) {
        $version = & node --version 2>$null
        if ($version) {
        Write-Host ">> Found system Node.js: $version" -ForegroundColor Green
            Write-Host "   Path: $($nodeCmd.Source)`n" -ForegroundColor Gray
            $systemNode = "node"
        }
    }
} catch {
    # Node not found
}

# Check for portable Node
if (-not $systemNode -and (Test-Path $NODE_EXE)) {
    Write-Host ">> Found portable Node.js: $NODE_EXE`n" -ForegroundColor Green
    $nodeToUse = $NODE_EXE
}
# Use system Node if available
elseif ($systemNode) {
    $nodeToUse = $systemNode
}
# Download portable Node
else {
    Write-Host "WARNING: Node.js not found. Downloading portable version..." -ForegroundColor Yellow
    Write-Host "   Version: $NODE_VERSION"
    Write-Host "   This is a one-time download (~30MB)`n"
    
    try {
        # Download
        $zipPath = "node-temp.zip"
        Write-Host "Downloading..." -NoNewline
        Invoke-WebRequest "$NODE_BASE_URL/$NODE_ZIP" -OutFile $zipPath -UseBasicParsing
        Write-Host " Done!" -ForegroundColor Green
        
        # Extract
        Write-Host "Extracting..." -NoNewline
        New-Item -ItemType Directory -Path $NODE_DIR -Force | Out-Null
        Expand-Archive $zipPath -DestinationPath "$NODE_DIR\temp" -Force
        
        # Move files from nested folder
        $innerDir = Get-ChildItem "$NODE_DIR\temp" | Select-Object -First 1
        Move-Item "$($innerDir.FullName)\*" $NODE_DIR -Force
        Remove-Item "$NODE_DIR\temp" -Recurse -Force
        Remove-Item $zipPath -Force
        
        Write-Host " Done!" -ForegroundColor Green
        Write-Host ">> Node.js installed to: $NODE_DIR`n" -ForegroundColor Green
        
        $nodeToUse = $NODE_EXE
    } catch {
        Write-Host "`nERROR: Failed to download Node.js" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        Write-Host "`nPlease install Node.js manually from: https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
}

# Create shortcut
Write-Host "Creating launcher shortcut..." -ForegroundColor Cyan

$WshShell = New-Object -ComObject WScript.Shell
$ShortcutPath = Join-Path $PWD "WebSurf.lnk"
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)

# Set target to PowerShell running this script
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`""
$Shortcut.WorkingDirectory = $PWD.Path
$Shortcut.WindowStyle = 1  # Normal window

# Set icon if it exists
$iconPath = Join-Path $PWD "websurf.ico"
if (Test-Path $iconPath) {
    $Shortcut.IconLocation = $iconPath
    Write-Host ">> Applied icon: websurf.ico" -ForegroundColor Green
}

$Shortcut.Save()
Write-Host ">> Shortcut created: WebSurf.lnk`n" -ForegroundColor Green

# Run main-launcher.js
Write-Host "Starting WebSurf MCP...`n" -ForegroundColor Cyan

try {
    & $nodeToUse $LAUNCHER_SCRIPT
} catch {
    Write-Host "`nERROR: Error running launcher" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}