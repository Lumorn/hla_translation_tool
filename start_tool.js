#!/usr/bin/env node
// start_tool.js
// Plattformunabhängiges Setup-Skript als Ersatz für die Windows-Batch-Datei

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Log-Datei im gleichen Verzeichnis wie dieses Skript
const LOGFILE = path.join(__dirname, 'setup.log');

// Nachricht mit Zeitstempel in die Log-Datei schreiben
function log(msg) {
    const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
    fs.appendFileSync(LOGFILE, `${timestamp} ${msg}\n`);
}

// Kommando ausführen und Ausgabe an das Terminal weiterreichen
function run(cmd) {
    execSync(cmd, { stdio: 'inherit' });
}

log('Setup gestartet');
console.log('=== Starte HLA Translation Tool Setup ===');

// ----------------------- Git prüfen -----------------------
log('Pruefe Git-Version');
try {
    run('git --version');
} catch (err) {
    console.error('[Fehler] Git wurde nicht gefunden. Bitte installieren und im PATH verfuegbar machen.');
    console.error('Weitere Details siehe setup.log');
    log('Git nicht gefunden');
    log(err.toString());
    process.exit(1);
}

// ----------------------- Node prüfen ----------------------
log('Pruefe Node-Version');
try {
    run('node --version');
} catch (err) {
    console.error('[Fehler] Node.js wurde nicht gefunden. Bitte installieren und im PATH verfuegbar machen.');
    console.error('Weitere Details siehe setup.log');
    log('Node.js nicht gefunden');
    log(err.toString());
    process.exit(1);
}

// ----------------------- npm prüfen -----------------------
log('Pruefe npm-Version');
try {
    run('npm --version');
} catch (err) {
    console.error('[Fehler] npm wurde nicht gefunden. Node 22 enthaelt standardmaessig kein npm. Bitte "npm install -g npm" oder "corepack enable" ausfuehren.');
    console.error('Weitere Details siehe setup.log');
    log('npm nicht gefunden');
    log(err.toString());
    process.exit(1);
}

log('Repository-Pruefung');
// Standardpfad ist das Verzeichnis dieses Skripts
let repoPath = __dirname;
// Liegt hier kein Git-Repo, wird in den Unterordner gewechselt bzw. geklont
if (!fs.existsSync(path.join(repoPath, '.git'))) {
    repoPath = path.join(__dirname, 'hla_translation_tool');
    const gitFolder = path.join(repoPath, '.git');
    // Repository klonen, falls es noch nicht vorhanden ist
    if (!fs.existsSync(gitFolder)) {
        if (!fs.existsSync(repoPath)) {
            console.log('Repository wird geklont...');
            log('Repository wird geklont');
            run(`git clone https://github.com/Lumorn/hla_translation_tool "${repoPath}"`);
        }
    }
}

process.chdir(repoPath);

// ----------------------- Lokale Änderungen verwerfen --------------------
log('Verwerfe lokale Änderungen');
try {
    // Sounds- und Backups-Ordner nicht überschreiben
    run('git reset --hard HEAD -- :!web/sounds :!web/backups');
    log('Lokale Änderungen verworfen');
} catch (err) {
    console.error('git reset fehlgeschlagen. Weitere Details siehe setup.log');
    log('git reset fehlgeschlagen');
    log(err.toString());
}

// ----------------------- git pull --------------------------
log('git pull starten');
console.log('Neueste Aenderungen werden geholt...');
try {
    run('git pull');
  log('git pull erfolgreich');
} catch (err) {
  console.error('git pull fehlgeschlagen. Weitere Details siehe setup.log');
  log('git pull fehlgeschlagen');
  log(err.toString());
}

// ----------------------- Haupt-Abhängigkeiten installieren --------------------
log('npm install (root) starten');
console.log('Abhaengigkeiten im Hauptverzeichnis werden installiert...');
try {
    run('npm install');
    log('npm install (root) erfolgreich');
} catch (err) {
    console.error('npm install im Hauptverzeichnis fehlgeschlagen. Weitere Details siehe setup.log');
    log('npm install (root) fehlgeschlagen');
    log(err.toString());
    process.exit(1);
}

// Sicherstellen, dass der Electron-Ordner vorhanden ist
if (!fs.existsSync('electron')) {
    console.log("'electron'-Ordner fehlt, wird wiederhergestellt...");
    log('Electron-Ordner fehlt - versuche Wiederherstellung');
    try {
        run('git checkout -- electron');
        log('Electron-Ordner wiederhergestellt');
    } catch (err) {
        console.error('Electron-Ordner konnte nicht wiederhergestellt werden. Weitere Details siehe setup.log');
        log('Electron-Ordner konnte nicht wiederhergestellt werden');
        log(err.toString());
        process.exit(1);
    }
}

// ----------------------- Electron-Setup --------------------
process.chdir('electron');
log('npm install starten');
console.log('Abhaengigkeiten werden installiert...');
try {
    run('npm install');
    log('npm install erfolgreich');
} catch (err) {
    console.error('npm install fehlgeschlagen. Weitere Details siehe setup.log');
    log('npm install fehlgeschlagen');
    log(err.toString());
    process.exit(1);
}

console.log('Anwendung wird gestartet...');
log('Starte Anwendung');
// Wenn das Skript als root ausgeführt wird, muss Electron ohne Sandbox starten
if (process.getuid && process.getuid() === 0) {
    run('npm start -- --no-sandbox');
} else {
    run('npm start');
}
log('Anwendung beendet');

console.log(`Log gespeichert unter ${LOGFILE}`);
console.log('Vorgang abgeschlossen.');
