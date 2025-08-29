const fs = require('fs');
const { removeUnknownFileIds } = require('./removeUnknownFileIds.js');

// Ein einfaches Skript zum Bereinigen von Projektdateien.
// Erwartet zwei Argumente:
//   1. Pfad zur Projektdatei (JSON mit "files"-Array)
//   2. Pfad zu einer JSON-Datei mit gültigen IDs aus der Oberfläche
// Dateien mit unbekannten IDs werden entfernt und als Fehler protokolliert.

const [,, projectPath, idsPath] = process.argv;

if (!projectPath || !idsPath) {
  console.error('Nutzung: node utils/cleanupProject.js <projekt.json> <ids.json>');
  process.exit(1);
}

let project;
try {
  const raw = fs.readFileSync(projectPath, 'utf8');
  project = JSON.parse(raw);
} catch (err) {
  console.error('Projektdatei konnte nicht gelesen werden:', err.message);
  process.exit(1);
}

let ids;
try {
  const rawIds = fs.readFileSync(idsPath, 'utf8');
  ids = JSON.parse(rawIds);
  if (!Array.isArray(ids)) throw new Error('IDs-Datei muss ein Array enthalten');
} catch (err) {
  console.error('IDs konnten nicht gelesen werden:', err.message);
  process.exit(1);
}

const removed = removeUnknownFileIds(project, ids);

try {
  fs.writeFileSync(projectPath, JSON.stringify(project, null, 2), 'utf8');
} catch (err) {
  console.error('Fehler beim Schreiben der Projektdatei:', err.message);
  process.exit(1);
}

const originalCount = project.files.length + removed;
console.log(`Bereinigung abgeschlossen. ${project.files.length} von ${originalCount} Dateien behalten.`);
