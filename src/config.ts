import fs from 'fs';
import path from 'path';

// Pfad zum Download-Ordner relativ zum Projekt
export const DL_WATCH_PATH = path.resolve(import.meta.dir, '..', 'Download');

// Ordner beim Programmstart sicherstellen
if (!fs.existsSync(DL_WATCH_PATH)) fs.mkdirSync(DL_WATCH_PATH);
