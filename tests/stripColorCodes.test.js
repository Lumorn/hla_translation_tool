let stripColorCodes;

function loadMain() {
    jest.resetModules();
    global.document = { addEventListener: jest.fn() };
    global.window = { addEventListener: jest.fn() };
    global.localStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {}
    };
    ({ stripColorCodes } = require('../web/src/main.js'));
}

beforeEach(loadMain);

describe('stripColorCodes', () => {
    test('ersetzt sb- und cr-Tags durch Leerzeichen', () => {
        const input = 'Er steckt fest.<sb>Als die Combine angreifen.';
        const result = stripColorCodes(input);
        expect(result).toBe('Er steckt fest. Als die Combine angreifen.');
    });

    test('entfernt Farbcodes und fuegt Leerzeichen nach Satzzeichen ein', () => {
        const input = '<clr:255,255,255>Ok.<cr>Los geht\'s.';
        const result = stripColorCodes(input);
        expect(result).toBe('Ok. Los geht\'s.');
    });
});
