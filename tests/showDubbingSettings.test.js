/**
 * @jest-environment jsdom
 */

// Konsolenausgaben unterdrücken
beforeAll(() => {
    document.addEventListener = jest.fn();
    localStorage.removeItem('hla_voiceSettings');
    localStorage.removeItem('hla_elevenLabsApiKey');
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    ({ showDubbingSettings } = require('../src/main.js'));
});

let showDubbingSettings;

test('Dialog wird mit display flex erstellt', async () => {
    await showDubbingSettings(1);
    const dlg = document.getElementById('dubbingSettingsDialog');
    expect(dlg).not.toBeNull();
    expect(dlg.style.display).toBe('flex');
});
