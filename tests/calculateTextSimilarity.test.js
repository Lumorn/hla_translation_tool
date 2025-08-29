let calculateTextSimilarity;

function createStorage() {
    return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        keys: () => []
    };
}

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
    global.window.localStorage = global.localStorage;
    global.storage = createStorage();
    ({ calculateTextSimilarity } = require('../web/src/fileUtils.js'));
}

beforeEach(loadMain);

describe('calculateTextSimilarity', () => {
    test('unterschiedliche Texte liefern keine 100% Treffer', () => {
        const a = "Nope. I'm good, I'm good.";
        const b = "Good. I hope they're good.";
        const result = calculateTextSimilarity(a, b);
        expect(result).toBeLessThan(0.95);
    });

    test('identische Texte ergeben 1', () => {
        expect(calculateTextSimilarity('Hallo', 'Hallo')).toBe(1);
    });
});
