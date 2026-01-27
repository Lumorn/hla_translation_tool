@echo off
cd /d "%~dp0"
set "VENV_DIR=venv"

echo === HLA Translation Tool V3 Launcher ===
echo.

:: 1. Prüfen, ob Python installiert ist
python --version >nul 2>&1
if %errorlevel% neq 0 (
  echo FEHLER: Python wurde nicht gefunden!
  echo Bitte installiere Python von python.org und setze den Haken bei "Add Python to PATH".
  pause
  exit /b
)

:: 2. Prüfen, ob die virtuelle Umgebung (venv) existiert
if not exist "%VENV_DIR%" (
  echo [INFO] Erste Einrichtung: Erstelle virtuelle Umgebung...
  python -m venv %VENV_DIR%

  if %errorlevel% neq 0 (
    echo [FEHLER] Konnte venv nicht erstellen.
    pause
    exit /b
  )

  echo [INFO] Installiere notwendige Bibliotheken (das dauert kurz)...
  "%VENV_DIR%\Scripts\pip" install --upgrade pip
  "%VENV_DIR%\Scripts\pip" install -r v3\requirements.txt

  if %errorlevel% neq 0 (
    echo [FEHLER] Installation der Bibliotheken fehlgeschlagen.
    pause
    exit /b
  )
  echo [OK] Installation abgeschlossen.
  echo.
)

:: 3. Programm starten (nutzt das Python aus dem venv Ordner)
echo Starte Application...
set PYTHONPATH=%CD%
"%VENV_DIR%\Scripts\python" v3\main.py

:: 4. Falls das Programm abstürzt, Fenster offen lassen
if %errorlevel% neq 0 (
  echo.
  echo ===============================================
  echo DAS PROGRAMM WURDE MIT EINEM FEHLER BEENDET.
  echo Bitte pruefe die Meldung oben.
  echo ===============================================
  pause
)
