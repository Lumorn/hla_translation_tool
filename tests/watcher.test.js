const fs = require('fs');
const path = require('path');
const os = require('os');

// Testet, ob watchDownloadFolder den Callback nur bei unbekannten Dateien auslöst

describe('watchDownloadFolder', () => {
  test('loest Callback bei unbekannter Datei aus', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'watch-'));

    const onAddCallbacks = [];

    // Module-Cache leeren und Abhängigkeiten mocken
    jest.resetModules();
    jest.doMock('../web/src/config.js', () => ({ DL_WATCH_PATH: tmpDir }), { virtual: false });
    const watchMock = jest.fn(() => ({
      on: jest.fn((event, cb) => {
        if (event === 'add') onAddCallbacks.push(cb);
      })
    }));
    jest.doMock('chokidar', () => ({ watch: watchMock }));

    const { watchDownloadFolder } = require('../watcher.js');

    const callback = jest.fn();
    const pending = [
      { id: 'job1', relPath: 'x/job1.wav' },
      { id: 'job2', relPath: 'x/job2.wav' }
    ];
    watchDownloadFolder(callback, { pending });
    expect(watchMock).toHaveBeenCalledWith(
      tmpDir,
      expect.objectContaining({
        ignoreInitial: true,
        awaitWriteFinish: expect.any(Object)
      })
    );

    const file = path.join(tmpDir, 'neu.wav');
    onAddCallbacks.forEach(cb => cb(file));

    expect(callback).toHaveBeenCalledWith(file);

    // Aufräumen des temporären Verzeichnisses
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('ruft Callback bei bekanntem Job nicht auf', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'watch-'));

    const onAddCallbacks = [];

    jest.resetModules();
    jest.doMock('../web/src/config.js', () => ({ DL_WATCH_PATH: tmpDir }), { virtual: false });
    const watchMock = jest.fn(() => ({
      on: jest.fn((event, cb) => {
        if (event === 'add') onAddCallbacks.push(cb);
      })
    }));
    jest.doMock('chokidar', () => ({ watch: watchMock }));

    const { watchDownloadFolder } = require('../watcher.js');

    const callback = jest.fn();
    const pending = [{ id: 'job1', relPath: 'x/job1.wav' }];
    watchDownloadFolder(callback, { pending });

    const file = path.join(tmpDir, 'job1.wav');
    onAddCallbacks.forEach(cb => cb(file));

    expect(callback).not.toHaveBeenCalled();

    fs.rmSync(tmpDir, { recursive: true, force: true });
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

    // Aufräumen des temporären Verzeichnisses
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('pruefeAudiodatei erkennt gueltige WAV', () => {
    const tmp = path.join(os.tmpdir(), 'valid.wav');
    const buf = Buffer.alloc(44);
    buf.write('RIFF', 0, 4, 'ascii');
    buf.writeUInt32LE(36, 4);
    buf.write('WAVE', 8, 4, 'ascii');
    fs.writeFileSync(tmp, buf);

    jest.resetModules();
    const { pruefeAudiodatei } = require('../watcher.js');

    expect(pruefeAudiodatei(tmp)).toBe(true);
    fs.unlinkSync(tmp);
  });

  test('pruefeAudiodatei erkennt falsche Datei', () => {
    const tmp = path.join(os.tmpdir(), 'invalid.bin');
    fs.writeFileSync(tmp, 'abc');

    jest.resetModules();
    const { pruefeAudiodatei } = require('../watcher.js');

    expect(pruefeAudiodatei(tmp)).toBe(false);
    fs.unlinkSync(tmp);
  });

  test('matchPendingJob entfernt Namenszusätze korrekt', () => {
    jest.resetModules();
    const { matchPendingJob } = require('../watcher.js');
    const pending = [{ id: 'abc', relPath: 'x/abc.wav' }];

    const result = matchPendingJob('abc-Max', pending);

    expect(result.idx).toBe(0);
  });
});
