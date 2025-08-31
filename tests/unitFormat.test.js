const fs = require('fs');
const path = require('path');

let withUnit;

beforeAll(() => {
    const file = fs.readFileSync(path.join(__dirname, '../web/src/unitFormat.js'), 'utf8').replace('export ', '');
    // eslint-disable-next-line no-new-func
    withUnit = new Function(file + '\nreturn withUnit;')();
});

describe('withUnit', () => {
    test('fügt geschütztes Leerzeichen ein', () => {
        expect(withUnit(85, '%')).toBe('85\u00A0%');
    });

    test('verwendet deutsches Dezimaltrennzeichen', () => {
        expect(withUnit(1.4, 's', 2)).toBe('1,40\u00A0s');
    });
});
