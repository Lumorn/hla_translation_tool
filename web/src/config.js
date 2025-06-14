const fs = require('fs');
const path = require('path');
const { chooseExisting } = require('../../pathUtils');

// Projektwurzel bestimmen
const projectRoot = path.resolve(__dirname, '..');
// Name des Sounds-Ordners ('sounds' oder 'Sounds') automatisch ermitteln
const soundsDirName = chooseExisting(projectRoot, ['Sounds', 'sounds']);
// Absoluter Pfad zum Sounds-Ordner
const SOUNDS_BASE_PATH = path.resolve(projectRoot, soundsDirName);
// Pfad zum Download-Ordner relativ zur Projektwurzel
const DL_WATCH_PATH = path.resolve(projectRoot, 'Download');

// Ordner beim Programmstart sicherstellen
if (!fs.existsSync(DL_WATCH_PATH)) fs.mkdirSync(DL_WATCH_PATH);

// Export für andere Module
module.exports = { DL_WATCH_PATH, projectRoot, SOUNDS_BASE_PATH, soundsDirName };
