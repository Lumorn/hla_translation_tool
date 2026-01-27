@echo off
where python >nul 2>&1
if errorlevel 1 (
  echo Python wurde nicht gefunden. Bitte installiere Python und versuche es erneut.
  exit /b 1
)

python v3\main.py
