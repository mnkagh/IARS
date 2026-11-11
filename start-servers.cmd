@echo off
REM Detached launcher: survives the calling shell/session.
set ROOT=C:\Users\Monika\Projects\IARS
set NODE=C:\Program Files\nodejs\node.exe

REM Kill anything squatting the ports
for %%P in (4000 5173) do (
  for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%%P " ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
  )
)

start "iars-backend" /MIN "%NODE%" "%ROOT%\backend\dist\server.js" > "%ROOT%\backend\out.log" 2> "%ROOT%\backend\err.log"

cd /d "%ROOT%\frontend"
start "iars-frontend" /MIN "%NODE%" "node_modules\vite\bin\vite.js" --host 127.0.0.1 --port 5173 --strictPort > "%ROOT%\frontend\out.log" 2> "%ROOT%\frontend\err.log"

exit /b 0