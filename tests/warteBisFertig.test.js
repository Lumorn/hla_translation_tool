const fs = require('fs');
const path = require('path');
const os = require('os');

// Testet, ob warteBisFertig auch bei kurzzeitig fehlender Datei funktioniert

test('warteBisFertig ignoriert temporaeres Entfernen', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wait-'));
  const file = path.join(tmpDir, 'test.wav');
  fs.writeFileSync(file, 'a');

  jest.resetModules();
  const { __test: { warteBisFertig } } = require('../watcher.js');

  // Nach kurzer Zeit Datei loeschen und spaeter erneut anlegen
  setTimeout(() => fs.unlinkSync(file), 100);
  setTimeout(() => fs.writeFileSync(file, 'abc'), 200);

  const p = warteBisFertig(file);

  await p;

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
