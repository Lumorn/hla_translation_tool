const fs = require('fs');
const path = require('path');

// Version aus package.json lesen
const { version } = require('./package.json');

// Dateien mit Platzhalter
const files = [
  'README.md',
  'web/src/main.js',
  'web/hla_translation_tool.html',
  'electron/package.json'
];

for (const file of files) {
  const full = path.join(__dirname, file);
  let content = fs.readFileSync(full, 'utf8');

  if (file === 'electron/package.json') {
    // JSON einlesen, Versionsfeld setzen und formatiert zurückschreiben
    const json = JSON.parse(content);
    json.version = version;
    fs.writeFileSync(full, JSON.stringify(json, null, 2) + '\n');
  } else {
    const updated = content.replace(/__VERSION__/g, version);
    fs.writeFileSync(full, updated);
  }

  console.log(`Aktualisiere ${file} auf Version ${version}`);
}
