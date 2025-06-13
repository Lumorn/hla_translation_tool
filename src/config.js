const fs = require('fs');
const path = require('path');

// Pfad zum Download-Ordner relativ zum Projekt
const DL_WATCH_PATH = path.resolve(__dirname, '..', 'Download');

// Ordner beim Programmstart sicherstellen
if (!fs.existsSync(DL_WATCH_PATH)) fs.mkdirSync(DL_WATCH_PATH);

module.exports = { DL_WATCH_PATH };
