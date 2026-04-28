@echo off
setlocal
set SCRIPT_DIR=%~dp0
pwsh -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%start-server.ps1"
endlocal
