// Tests für die Berechnung der Hüllkurven des EM-Störgeräuschs
function loadMain() {
    jest.resetModules();
    global.window = {
        localStorage: { getItem: () => null, setItem: () => {} },
        addEventListener: () => {}
    };
    global.document = { getElementById: () => null, addEventListener: () => {} };
    global.storage = global.window.localStorage;
    return require('../web/src/main.js');
}
const { __computeEmiEnvelope } = loadMain();

afterAll(() => {
    delete global.window;
    delete global.document;
    delete global.storage;
});

test('Anstieg-und-Abfall erzeugt Dreiecksverlauf', () => {
    const env = __computeEmiEnvelope(10, 1, 0.5, 'updown');
    expect(env).toEqual([
        { time: 0, value: 0 },
        { time: 5, value: 1 },
        { time: 10, value: 0 }
    ]);
});

test('Konstanter Verlauf bleibt gleich', () => {
    const env = __computeEmiEnvelope(8, 0.7, 0.3, 'constant');
    expect(env).toEqual([
        { time: 0, value: 0.7 },
        { time: 8, value: 0.7 }
    ]);
});

test('Abfall startet stark und endet bei null', () => {
    const env = __computeEmiEnvelope(6, 0.8, 0.25, 'down');
    expect(env).toEqual([
        { time: 0, value: 0.8 },
        { time: 1.5, value: 0.8 },
        { time: 6, value: 0 }
    ]);
});
