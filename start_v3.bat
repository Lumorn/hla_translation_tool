@echo off

echo Starte HLA Translation Tool V3...
echo.

where python >nul 2>&1
if errorlevel 1 (
  echo FEHLER: Python wurde nicht gefunden.
  echo Bitte installiere Python und starte die Datei erneut.
  pause
  exit /b 1
)

set PYTHONPATH=%CD%

python v3\main.py

if %errorlevel% neq 0 (
  echo.
  echo ----------------------------------------------------
  echo ES IST EIN FEHLER AUFGETRETEN.
  echo Bitte mache einen Screenshot von der Meldung oben.
  echo ----------------------------------------------------
  pause
)
