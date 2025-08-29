const { expect, test } = require('@jest/globals');

function loadMain(store = {}) {
    jest.resetModules();
    global.document = { getElementById: jest.fn(() => null), addEventListener: jest.fn() };
    global.window = { addEventListener: jest.fn() };
    let local = { ...store };
    function createStorage() {
        return {
            getItem: key => local[key] || null,
            setItem: (k, v) => { local[k] = v; },
            removeItem: k => { delete local[k]; },
            clear: () => { local = {}; },
            keys: () => Object.keys(local)
        };
    }
    global.localStorage = {
        getItem: key => local[key] || null,
        setItem: (k, v) => { local[k] = v; },
        removeItem: k => { delete local[k]; },
        clear: () => { local = {}; }
    };
    global.window.localStorage = global.localStorage;
    global.storage = createStorage();
    return require('../web/src/main.js');
}

test('saveRadioPreset legt neues Preset an', () => {
    const { saveRadioPreset, __getRadioPresets } = loadMain({
        hla_radioEffectStrength: '0.5',
        hla_radioHighpass: '200',
        hla_radioLowpass: '3000',
        hla_radioSaturation: '0.3',
        hla_radioNoise: '-20',
        hla_radioCrackle: '0.2'
    });
    saveRadioPreset('Test');
    const presets = __getRadioPresets();
    expect(presets.Test.high).toBe(200);
});

test('loadRadioPreset setzt Werte', () => {
    const { loadRadioPreset, __setRadioPresets } = loadMain();
    __setRadioPresets({ Foo: { strength: 0.8, high: 400, low: 3000, sat: 0.2, noise: -30, crack: 0.1 } });
    loadRadioPreset('Foo');
    expect(global.localStorage.getItem('hla_radioHighpass')).toBe(400);
    expect(global.localStorage.getItem('hla_radioEffectStrength')).toBe(0.8);
});

test('deleteRadioPreset entfernt Eintrag', () => {
    const { saveRadioPreset, deleteRadioPreset, __getRadioPresets } = loadMain({
        hla_radioEffectStrength: '0.4',
        hla_radioHighpass: '100',
        hla_radioLowpass: '3000',
        hla_radioSaturation: '0.3',
        hla_radioNoise: '-20',
        hla_radioCrackle: '0.2'
    });
    saveRadioPreset('Del');
    deleteRadioPreset('Del');
    const presets = __getRadioPresets();
    expect(presets.Del).toBeUndefined();
});
