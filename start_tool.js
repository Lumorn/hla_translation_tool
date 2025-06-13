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
    log(`Fuehre aus: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
}

log('Setup gestartet');
log(`Node-Version: ${process.version} auf ${process.platform}`);
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
    // Version erneut auslesen, um die Hauptversion zu pruefen
    const output = execSync('node --version').toString().trim();
    log(`Gefundene Node-Version: ${output}`);
    const major = parseInt(output.replace(/^v/, '').split('.')[0], 10);
    if (isNaN(major) || major < 18 || major >= 22) {
        console.error(`[Fehler] Node.js Version ${output} wird nicht unterstuetzt. Bitte Node 18–21 installieren.`);
        log('Unpassende Node-Version');
        process.exit(1);
    }
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
// UID ermitteln und Start-Parameter entsprechend setzen
const uid = process.getuid ? process.getuid() : null;
if (uid !== null) {
    log(`Aktuelle UID: ${uid}`);
} else {
    log('Keine UID verfügbar (Windows?)');
}
if (uid === 0) {
    log('Starte Electron ohne Sandbox');
    run('npm start -- --no-sandbox');
} else {
    log('Starte Electron mit Sandbox');
    run('npm start');
}
log('Anwendung beendet');

console.log(`Log gespeichert unter ${LOGFILE}`);
console.log('Vorgang abgeschlossen.');
