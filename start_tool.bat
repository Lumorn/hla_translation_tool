@echo off

REM ======================= Grundverzeichnis setzen ========================
REM Sicherstellen, dass alle Befehle relativ zum Pfad der BAT-Datei laufen
cd /d %~dp0

REM Log-Datei definieren
set LOGFILE=%~dp0setup.log

call :log "Setup gestartet"

echo === Starte HLA Translation Tool Setup ===

REM ======================= Git pruefen ====================================
call :log "Pruefe Git-Version"
git --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo [Fehler] Git wurde nicht gefunden. Bitte installieren und im PATH verfuegbar machen.
    call :log "Git nicht gefunden"
    pause
    exit /b 1
) ELSE (
    FOR /f "tokens=*" %%G in ('git --version') do (
        echo Gefundene Git-Version: %%G
        call :log "Git-Version %%G"
    )
)

REM ======================= Node pruefen ==================================
call :log "Pruefe Node-Version"
node --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo [Fehler] Node.js wurde nicht gefunden. Bitte installieren und im PATH verfuegbar machen.
    call :log "Node.js nicht gefunden"
    pause
    exit /b 1
) ELSE (
    FOR /f "tokens=*" %%G in ('node --version') do (
        echo Gefundene Node-Version: %%G
        call :log "Node-Version %%G"
    )
)

REM ======================= npm pruefen ===================================
call :log "Pruefe npm-Version"
npm --version >nul 2>&1
IF ERRORLEVEL 1 (
    echo [Fehler] npm wurde nicht gefunden. Node 22 enthaelt standardmaessig kein npm. Bitte "npm install -g npm" oder "corepack enable" ausfuehren.
    call :log "npm nicht gefunden"
    pause
    exit /b 1
) ELSE (
    FOR /f "tokens=*" %%G in ('npm --version') do (
        echo Gefundene npm-Version: %%G
        call :log "npm-Version %%G"
    )
)

call :log "Repository-Pruefung"

REM ======================= Repository einrichten ==========================
REM Wenn sich bereits ein .git-Ordner befindet, sind wir schon im Repository
IF NOT EXIST ".git" (
    REM Repository ist noch nicht vorhanden
    IF NOT EXIST "hla_translation_tool" (
        echo Repository wird geklont...
        call :log "Repository wird geklont"
        git clone https://github.com/Lumorn/hla_translation_tool
        IF ERRORLEVEL 1 call :log "git clone fehlgeschlagen" ELSE call :log "git clone erfolgreich"
    )
cd hla_translation_tool
)

REM ----------------------- Lokale Änderungen verwerfen --------------------
call :log "Verwerfe lokale Änderungen"
REM Sounds-Ordner nicht überschreiben
git reset --hard HEAD -- ":!sounds"
IF ERRORLEVEL 1 (
    call :log "git reset fehlgeschlagen"
) ELSE (
    call :log "Lokale Änderungen verworfen"
)

call :log "git pull starten"

echo Neueste Aenderungen werden geholt...
git pull
IF ERRORLEVEL 1 (
    call :log "git pull fehlgeschlagen"
) ELSE (
    call :log "git pull erfolgreich"
)

REM Sicherstellen, dass der Electron-Ordner existiert
IF NOT EXIST "electron" (
    echo 'electron'-Ordner fehlt, wird wiederhergestellt...
    call :log "Electron-Ordner fehlt - versuche Wiederherstellung"
    git checkout -- electron
    IF ERRORLEVEL 1 (
        call :log "Electron-Ordner konnte nicht wiederhergestellt werden"
        exit /b 1
    ) ELSE (
        call :log "Electron-Ordner wiederhergestellt"
    )
)

REM ======================= Electron-Setup ================================
cd electron
call :log "npm install starten"

echo Abhaengigkeiten werden installiert...
npm install
IF ERRORLEVEL 1 (
    call :log "npm install fehlgeschlagen"
    pause
    exit /b 1
) ELSE (
    call :log "npm install erfolgreich"
)

echo Anwendung wird gestartet...
call :log "Starte Anwendung"
call npm start
call :log "Anwendung beendet"

echo Log gespeichert unter %LOGFILE%

echo.
echo Vorgang abgeschlossen.

pause

goto :eof

:log
REM Datum und Uhrzeit zusammen mit der Nachricht an die Log-Datei anhaengen
echo %date% %time% %* >> "%LOGFILE%"
exit /b 0
