const fs = require('fs');
const path = require('path');

// Version aus package.json lesen
const { version } = require('./package.json');

// Dateien mit Platzhalter
const files = [
  'README.md',
  'src/main.js',
  'hla_translation_tool.html'
];

for (const file of files) {
  const full = path.join(__dirname, file);
  let content = fs.readFileSync(full, 'utf8');
  const updated = content.replace(/__VERSION__/g, version);
  fs.writeFileSync(full, updated);
  console.log(`Aktualisiere ${file} auf Version ${version}`);
}
