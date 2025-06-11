const fs = require('fs');
const path = require('path');
const os = require('os');
const { saveVersion, listVersions, restoreVersion, switchVersion } = require('../historyUtils');

describe('history utils', () => {
    test('keeps maximal zehn Versionen', () => {
        const historyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hist-'));
        const source = path.join(historyRoot, 'src.wav');
        fs.writeFileSync(source, 'data');
        const relPath = 'test/file.wav';
        for (let i = 0; i < 12; i++) {
            fs.writeFileSync(source, `d${i}`);
            saveVersion(historyRoot, relPath, source, 10);
        }
        const list = listVersions(historyRoot, relPath);
        expect(list.length).toBe(10);
    });

    test('restores a version correctly', () => {
        const historyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hist-'));
        const targetRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'de-'));
        const source = path.join(historyRoot, 'src.wav');
        fs.writeFileSync(source, 'abc');
        const relPath = 'a/b.wav';
        saveVersion(historyRoot, relPath, source, 10);
        const name = listVersions(historyRoot, relPath)[0];
        restoreVersion(historyRoot, relPath, name, targetRoot);
        const restored = fs.readFileSync(path.join(targetRoot, relPath), 'utf8');
        expect(restored).toBe('abc');
    });

    test('switchVersion tauscht Dateien und aktualisiert die Historie', () => {
        const historyRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hist-'));
        const targetRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'de-'));
        const relPath = 'c/d.wav';
        const currentFile = path.join(targetRoot, relPath);
        fs.mkdirSync(path.dirname(currentFile), { recursive: true });
        // aktuelle Datei erstellen
        fs.writeFileSync(currentFile, 'alt');
        // Version in Historie speichern
        saveVersion(historyRoot, relPath, currentFile, 10);
        const histName = listVersions(historyRoot, relPath)[0];
        // Datei ändern
        fs.writeFileSync(currentFile, 'neu');
        // Version wiederherstellen und tauschen
        switchVersion(historyRoot, relPath, histName, targetRoot);
        const inhalt = fs.readFileSync(currentFile, 'utf8');
        expect(inhalt).toBe('alt');
        const histFiles = listVersions(historyRoot, relPath);
        expect(histFiles.length).toBe(1);
        const histInhalt = fs.readFileSync(path.join(historyRoot, relPath, histFiles[0]), 'utf8');
        expect(histInhalt).toBe('neu');
    });
});
