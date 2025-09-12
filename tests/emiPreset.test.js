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

test('saveEmiPreset legt neues Preset an', () => {
    const { saveEmiPreset, __getEmiPresets } = loadMain({
        hla_emiNoiseLevel: '0.4',
        hla_emiRamp: '0.1',
        hla_emiMode: 'up',
        hla_emiDropoutProb: '0.002',
        hla_emiDropoutDur: '0.03',
        hla_emiCrackleProb: '0.004',
        hla_emiCrackleAmp: '0.5',
        hla_emiSpikeProb: '0.006',
        hla_emiSpikeAmp: '0.7',
        hla_emiVoiceDamp: '1'
    });
    saveEmiPreset('Test');
    const presets = __getEmiPresets();
    expect(presets.Test.ramp).toBe(0.1);
});

test('loadEmiPreset setzt Werte', () => {
    const { loadEmiPreset, __setEmiPresets } = loadMain();
    __setEmiPresets({ Foo: { level: 0.2, ramp: 0.3, mode: 'down', dropoutProb: 0.001, dropoutDur: 0.02, crackleProb: 0.003, crackleAmp: 0.4, spikeProb: 0.005, spikeAmp: 0.6, voiceDamp: false } });
    loadEmiPreset('Foo');
    expect(global.localStorage.getItem('hla_emiNoiseLevel')).toBe(0.2);
    expect(global.localStorage.getItem('hla_emiMode')).toBe('down');
});

test('deleteEmiPreset entfernt Eintrag', () => {
    const { saveEmiPreset, deleteEmiPreset, __getEmiPresets } = loadMain({
        hla_emiNoiseLevel: '0.5',
        hla_emiRamp: '0.2',
        hla_emiMode: 'constant',
        hla_emiDropoutProb: '0.003',
        hla_emiDropoutDur: '0.02',
        hla_emiCrackleProb: '0.004',
        hla_emiCrackleAmp: '0.3',
        hla_emiSpikeProb: '0.005',
        hla_emiSpikeAmp: '0.8',
        hla_emiVoiceDamp: '0'
    });
    saveEmiPreset('Del');
    deleteEmiPreset('Del');
    const presets = __getEmiPresets();
    expect(presets.Del).toBeUndefined();
});

