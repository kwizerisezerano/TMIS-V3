@echo off
echo Starting Ikimina Digital Tontine System...
echo.

echo Installing dependencies...
call npm run install-all

echo.
echo Running database migration...
call npm run migrate

echo.
echo Starting development servers...
echo Backend will run on http://localhost:3000
echo Frontend will run on http://localhost:3001
echo.

echo Starting backend server...
start "Backend" cmd /k "cd backend && npm run dev"

echo Starting frontend server...
start "Frontend" cmd /k "cd frontend && npm start"

echo Both servers are starting in separate windows...