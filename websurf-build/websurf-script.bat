@echo off
setlocal enabledelayedexpansion

echo WebSurf MCP Launcher
echo ====================
echo.

set NODE_VERSION=v22.11.0
set NODE_BASE_URL=https://nodejs.org/dist/%NODE_VERSION%
set NODE_ZIP=node-%NODE_VERSION%-win-x64.zip
set NODE_DIR=.node-portable
set NODE_EXE=%NODE_DIR%\node.exe
set LAUNCHER_SCRIPT=main-launcher.js

REM Check if main-launcher.js exists
if not exist "%LAUNCHER_SCRIPT%" (
    echo ERROR: %LAUNCHER_SCRIPT% not found
    echo Current directory: %CD%
    exit /b 1
)

REM Check for system Node
set SYSTEM_NODE=
where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%i in ('node --version 2^>nul') do set NODE_VER=%%i
    if defined NODE_VER (
        echo ^>^> Found system Node.js: !NODE_VER!
        for /f "tokens=*" %%i in ('where node') do echo    Path: %%i
        echo.
        set SYSTEM_NODE=node
    )
)

REM Check for portable Node
if not defined SYSTEM_NODE (
    if exist "%NODE_EXE%" (
        echo ^>^> Found portable Node.js: %NODE_EXE%
        echo.
        set NODE_TO_USE=%NODE_EXE%
    )
)

REM Use system Node if available
if defined SYSTEM_NODE (
    set NODE_TO_USE=node
)

REM Download portable Node if not found
if not defined NODE_TO_USE (
    echo WARNING: Node.js not found. Downloading portable version...
    echo    Version: %NODE_VERSION%
    echo    This is a one-time download (~30MB^)
    echo.
    
    set ZIP_PATH=node-temp.zip
    
    echo Downloading...
    powershell -Command "& {Invoke-WebRequest '%NODE_BASE_URL%/%NODE_ZIP%' -OutFile '!ZIP_PATH!' -UseBasicParsing}" >nul 2>&1
    if !errorlevel! neq 0 (
        echo ERROR: Failed to download Node.js
        echo Please install Node.js manually from: https://nodejs.org/
        exit /b 1
    )
    echo Done!
    
    echo Extracting...
    if not exist "%NODE_DIR%" mkdir "%NODE_DIR%"
    powershell -Command "& {Expand-Archive '!ZIP_PATH!' -DestinationPath '%NODE_DIR%\temp' -Force}" >nul 2>&1
    
    REM Move files from nested folder
    for /d %%i in (%NODE_DIR%\temp\*) do (
        xcopy "%%i\*" "%NODE_DIR%\" /E /I /Y >nul 2>&1
    )
    rmdir /s /q "%NODE_DIR%\temp" >nul 2>&1
    del /f /q "!ZIP_PATH!" >nul 2>&1
    
    echo Done!
    echo ^>^> Node.js installed to: %NODE_DIR%
    echo.
    
    set NODE_TO_USE=%NODE_EXE%
)

REM Create shortcut
echo Creating launcher shortcut...

powershell -Command "& {$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%CD%\WebSurf.lnk'); $Shortcut.TargetPath = '%~f0'; $Shortcut.WorkingDirectory = '%CD%'; $Shortcut.WindowStyle = 1; if (Test-Path '%CD%\websurf.ico') {$Shortcut.IconLocation = '%CD%\websurf.ico'; Write-Host '^>^> Applied icon: websurf.ico'}; $Shortcut.Save()}" 2>nul

echo ^>^> Shortcut created: WebSurf.lnk
echo.

REM Run main-launcher.js
echo Starting WebSurf MCP...
echo.

"%NODE_TO_USE%" "%LAUNCHER_SCRIPT%"
if !errorlevel! neq 0 (
    echo.
    echo ERROR: Error running launcher
    exit /b 1
)

endlocal