import fs from 'fs';
import path from 'path';

// Projektwurzel bestimmen
export const projectRoot = path.resolve(import.meta.dir, '..');
// Pfad zum Download-Ordner relativ zur Projektwurzel
export const DL_WATCH_PATH = path.resolve(projectRoot, 'Download');

// Ordner beim Programmstart sicherstellen
if (!fs.existsSync(DL_WATCH_PATH)) fs.mkdirSync(DL_WATCH_PATH);
