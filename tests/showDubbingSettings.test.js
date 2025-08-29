/**
 * @jest-environment jsdom
 */

let showDubbingSettings;

// Konsolenausgaben unterdrücken
beforeAll(() => {
    document.addEventListener = jest.fn();
    localStorage.removeItem('hla_voiceSettings');
    localStorage.removeItem('hla_elevenLabsApiKey');
    function createStorage() {
        return {
            getItem: k => localStorage.getItem(k),
            setItem: (k, v) => localStorage.setItem(k, v),
            removeItem: k => localStorage.removeItem(k),
            clear: () => localStorage.clear(),
            keys: () => Object.keys(localStorage)
        };
    }
    global.storage = createStorage();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.currentDubMode = 'beta';
    global.files = [{ id: 1, folder: '', filename: 'a.wav', enText: '', deText: '' }];
    global.folderCustomizations = {};
    global.availableVoices = [];
    global.storedVoiceSettings = null;
    global.elevenLabsApiKey = null;
    global.updateVoiceSettingsDisplay = jest.fn();
    ({ showDubbingSettings } = require('../web/src/dubbing.js'));
});

test('Dialog wird sichtbar angezeigt', async () => {
    await showDubbingSettings(1);
    const dlg = document.getElementById('dubbingSettingsDialog');
    expect(dlg).not.toBeNull();
    // Der Dialog sollte nicht mehr die Klasse "hidden" besitzen
    expect(dlg.classList.contains('hidden')).toBe(false);
});
