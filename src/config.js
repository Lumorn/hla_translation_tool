const fs = require('fs');
const path = require('path');

// Projektwurzel bestimmen
const projectRoot = path.resolve(__dirname, '..');
// Pfad zum Download-Ordner relativ zur Projektwurzel
const DL_WATCH_PATH = path.resolve(projectRoot, 'Download');

// Ordner beim Programmstart sicherstellen
if (!fs.existsSync(DL_WATCH_PATH)) fs.mkdirSync(DL_WATCH_PATH);

// Export für andere Module
module.exports = { DL_WATCH_PATH, projectRoot };
