const fs = require('fs');
const path = require('path');
const os = require('os');

// Schreibt einen Debug-Bericht mit relevanten Umgebungsdaten
// und gibt den Pfad zur gespeicherten Datei zurück.
function writeDebugReport(err, targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(targetDir, `debug-${timestamp}.log`);
  const lines = [
    `Zeit: ${new Date().toString()}`,
    `Node-Version: ${process.version}`,
    `Plattform: ${process.platform} (${os.release()})`,
    `Arbeitsverzeichnis: ${process.cwd()}`,
    `Fehlermeldung: ${err?.message}`,
    `Stacktrace: ${err?.stack}`,
  ];
  fs.writeFileSync(file, lines.join('\n') + '\n');
  return file;
}

module.exports = { writeDebugReport };
