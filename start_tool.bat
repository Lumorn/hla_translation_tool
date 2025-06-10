@echo off

REM ======================= Grundverzeichnis setzen ========================
REM Sicherstellen, dass alle Befehle relativ zum Pfad der BAT-Datei laufen
cd /d %~dp0

set "REPO_URL=https://github.com/Lumorn/hla_translation_tool.git"

echo === Starte HLA Translation Tool Setup ===

REM ======================= Git prüfen ====================================
git --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo [Fehler] Git wurde nicht gefunden. Bitte installieren und im PATH verfuegbar machen.
    pause
    exit /b 1
) ELSE (
    FOR /f "tokens=*" %%G in ('git --version') do echo Gefundene Git-Version: %%G
)

REM ======================= Node pruefen ==================================
node --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo [Fehler] Node.js wurde nicht gefunden. Bitte installieren und im PATH verfuegbar machen.
    pause
    exit /b 1
) ELSE (
    FOR /f "tokens=*" %%G in ('node --version') do (
        set "NODE_VERSION=%%G"
        echo Gefundene Node-Version: %%G
    )
)
REM Pruefen, ob Node mindestens Version 18 ist
FOR /f "tokens=2 delims=v." %%G in ('node --version') do set NODE_MAJOR=%%G
IF %NODE_MAJOR% LSS 18 (
    echo [Fehler] Node-Version 18 oder hoeher wird benoetigt.
    pause
    exit /b 1
)

REM ======================= npm pruefen ===================================
npm --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo [Fehler] npm wurde nicht gefunden. Bitte installieren und im PATH verfuegbar machen.
    pause
    exit /b 1
) ELSE (
    FOR /f "tokens=*" %%G in ('npm --version') do echo Gefundene npm-Version: %%G
)

echo.
REM ======================= Repository einrichten ==========================

IF NOT EXIST "hla_translation_tool" (
    echo Repository wird geklont...
    git clone %REPO_URL%
    cd hla_translation_tool
) ELSE (
    cd hla_translation_tool
    echo Neueste Aenderungen werden geholt...
    git pull
)

REM ======================= Electron-Setup ================================
cd electron
IF NOT EXIST "node_modules" (
    echo Abhaengigkeiten werden installiert...
    npm install
)

echo Anwendung wird gestartet...
call npm start

echo.
echo Vorgang abgeschlossen.
pause
