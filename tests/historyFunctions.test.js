const fs = require('fs');
const path = require('path');
const os = require('os');
const { saveVersion, listVersions, restoreVersion } = require('../historyUtils');

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
});
