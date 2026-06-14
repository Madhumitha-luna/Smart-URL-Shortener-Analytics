@echo off
echo ===================================================
echo   SnipURL - Launching Frontend and Backend Servers
echo ===================================================
echo.
echo Starting Backend Server on port 5000...
start "SnipURL Backend" cmd /k "cd backend && npm run dev"
echo.
echo Starting Frontend Server on port 5173...
start "SnipURL Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo ===================================================
echo   Both servers have been launched!
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:5000
echo ===================================================
pause
