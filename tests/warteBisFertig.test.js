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

// Testet, ob ein Timeout korrekt ausgeloest wird
test('warteBisFertig bricht nach Ablauf des Timeouts ab', async () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wait-'));
  const file = path.join(tmpDir, 'missing.wav');

  jest.resetModules();
  const { __test: { warteBisFertig } } = require('../watcher.js');

  await expect(warteBisFertig(file, 300)).rejects.toThrow('Timeout');

  fs.rmSync(tmpDir, { recursive: true, force: true });
});
