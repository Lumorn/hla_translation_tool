const fs = require('fs');
const path = require('path');
const os = require('os');

// Testet, ob watchDownloadFolder den Callback bei einer neuen Datei auslöst

describe('watchDownloadFolder', () => {
  test('reagiert auf angelegte Datei', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'watch-'));

    const onAddCallbacks = [];

    // Module-Cache leeren und Abhängigkeiten mocken
    jest.resetModules();
    jest.doMock('../web/src/config.js', () => ({ DL_WATCH_PATH: tmpDir }), { virtual: false });
    jest.doMock('chokidar', () => ({
      watch: jest.fn(() => ({
        on: jest.fn((event, cb) => {
          if (event === 'add') onAddCallbacks.push(cb);
        })
      }))
    }));

    const { watchDownloadFolder } = require('../watcher.js');

    const callback = jest.fn();
    watchDownloadFolder(callback);

    const file = path.join(tmpDir, 'neu.txt');
    onAddCallbacks.forEach(cb => cb(file));

    expect(callback).toHaveBeenCalledWith(file);
  });

  test('clearDownloadFolder leert den Ordner', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clear-'));
    const file = path.join(tmpDir, 'test.txt');
    fs.writeFileSync(file, 'abc');

    jest.resetModules();
    jest.doMock('../web/src/config.js', () => ({ DL_WATCH_PATH: tmpDir }), { virtual: false });
    const { clearDownloadFolder } = require('../watcher.js');

    clearDownloadFolder(tmpDir);

    const remaining = fs.readdirSync(tmpDir);
    expect(remaining.length).toBe(0);
  });
});
