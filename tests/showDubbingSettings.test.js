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
    ({ showDubbingSettings } = require('../web/src/main.js'));
});

let showDubbingSettings;

test('Dialog wird sichtbar angezeigt', async () => {
    await showDubbingSettings(1);
    const dlg = document.getElementById('dubbingSettingsDialog');
    expect(dlg).not.toBeNull();
    // Der Dialog sollte nicht mehr die Klasse "hidden" besitzen
    expect(dlg.classList.contains('hidden')).toBe(false);
});
