const { parseClosecaptionFile } = require('../closecaptionParser');

describe('closecaption parser', () => {
    test('liest IDs korrekt ein', () => {
        const en = `"file"\n{\n    "1"    "Hello"\n    "2"    "World"\n}`;
        const result = parseClosecaptionFile(en);
        expect(result.get('1')).toBe('Hello');
        expect(result.get('2')).toBe('World');
    });
});
