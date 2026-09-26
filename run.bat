@echo off
echo ========================================================
echo   KRISHI ALERT (कृषि सचेत) - Hyperlocal Amber System
echo ========================================================
echo.
echo Starting FastAPI Backend and Web Dashboard...
echo Open http://127.0.0.1:8000 in your browser.
echo.
server\venv\Scripts\python.exe -m uvicorn server.main:app --host 127.0.0.1 --port 8000
pause
