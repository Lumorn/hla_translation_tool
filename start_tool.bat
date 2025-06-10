@echo off
REM Prüfen, ob der Ordner 'hla_translation_tool' vorhanden ist
IF NOT EXIST "hla_translation_tool" (
    REM Repository klonen, falls noch nicht vorhanden
    git clone <REPOSITORY_URL>
    cd hla_translation_tool
) ELSE (
    cd hla_translation_tool
    REM Neueste Änderungen holen
    git pull
)

REM In das Electron-Verzeichnis wechseln
cd electron

REM Abhängigkeiten installieren, falls node_modules fehlt
IF NOT EXIST "node_modules" (
    npm install
)

REM Desktop-App starten
npm start
