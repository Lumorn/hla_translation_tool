const fs = require('fs');
const path = require('path');
const os = require('os');
const { chooseExisting } = require('../pathUtils');

describe('Pfaderkennung', () => {
  test('erkennt Ordner mit großem Anfangsbuchstaben', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'case-'));
    fs.mkdirSync(path.join(tmp, 'Sounds'));
    const name = chooseExisting(tmp, ['Sounds', 'sounds']);
    expect(name).toBe('Sounds');
  });

  test('faellt auf Standard zurueck', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'case-'));
    fs.mkdirSync(path.join(tmp, 'sounds'));
    const name = chooseExisting(tmp, ['Sounds', 'sounds']);
    expect(name).toBe('sounds');
  });

  test('wirft Fehler bei leerer Liste', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'case-'));
    expect(() => chooseExisting(tmp, [])).toThrow('Namen-Liste darf nicht leer sein');
  });
});
