const fs = require('fs');
const path = require('path');
const os = require('os');
const { parseClosecaptionFile, loadClosecaptions } = require('../closecaptionParser');

describe('closecaption parser', () => {
    test('liest IDs korrekt ein', () => {
        const en = `"file"\n{\n    "1"    "Hello"\n    "2"    "World"\n}`;
        const result = parseClosecaptionFile(en);
        expect(result.get('1')).toBe('Hello');
        expect(result.get('2')).toBe('World');
    });

    test('loadClosecaptions liest Dateien korrekt', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-'));
        fs.writeFileSync(path.join(dir, 'closecaption_english.txt'), '"file"\n{\n    "1"    "Hello"\n}');
        fs.writeFileSync(path.join(dir, 'closecaption_german.txt'), '"file"\n{\n    "1"    "Hallo"\n}');
        const result = await loadClosecaptions(dir);
        expect(result).toEqual([{ id: '1', enText: 'Hello', deText: 'Hallo' }]);
    });
});
