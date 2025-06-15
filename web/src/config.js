const fs = require('fs');
const path = require('path');
const { chooseExisting } = require('../../pathUtils');

// Projektwurzel bestimmen
const projectRoot = path.resolve(__dirname, '..');

// Erst normalen Sounds-Ordner im Web-Verzeichnis suchen
let soundsDirName = chooseExisting(projectRoot, ['Sounds', 'sounds']);
let SOUNDS_BASE_PATH = path.resolve(projectRoot, soundsDirName);

// Falls dort nichts gefunden wird, auch oberhalb suchen
if (!fs.existsSync(SOUNDS_BASE_PATH)) {
    const rootDir = path.resolve(projectRoot, '..');
    soundsDirName = chooseExisting(rootDir, ['Sounds', 'sounds']);
    const altPath = path.resolve(rootDir, soundsDirName);
    if (fs.existsSync(altPath)) {
        SOUNDS_BASE_PATH = altPath;
    }
}

// Download-Ordner analog bestimmen
let downloadDirName = chooseExisting(projectRoot, ['Download', 'Downloads']);
let DL_WATCH_PATH = path.resolve(projectRoot, downloadDirName);

if (!fs.existsSync(DL_WATCH_PATH)) {
    const rootDir = path.resolve(projectRoot, '..');
    downloadDirName = chooseExisting(rootDir, ['Download', 'Downloads']);
    const altPath = path.resolve(rootDir, downloadDirName);
    if (fs.existsSync(altPath)) {
        DL_WATCH_PATH = altPath;
    }
}

// Ordner beim Programmstart sicherstellen
if (!fs.existsSync(DL_WATCH_PATH)) fs.mkdirSync(DL_WATCH_PATH);

// Export für andere Module
module.exports = { DL_WATCH_PATH, projectRoot, SOUNDS_BASE_PATH, soundsDirName, downloadDirName };
