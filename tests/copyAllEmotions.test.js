/**
 * @jest-environment jsdom
 */

let copyAllEmotionsToClipboard, __setFiles;

function loadMain() {
    jest.resetModules();
    if (!global.navigator) global.navigator = {};
    global.navigator.clipboard = { writeText: jest.fn().mockResolvedValue() };
    global.safeCopy = async text => { await navigator.clipboard.writeText(text); return true; };
    global.showToast = jest.fn();
    global.files = [];
    ({ copyAllEmotionsToClipboard, __setFiles } = require('../web/src/main.js'));
    // nach dem Laden die Toast-Funktion überschreiben und DOM vorbereiten
    global.showToast = jest.fn();
    document.body.innerHTML = '<div id="toastContainer"></div>';
}

describe('copyAllEmotionsToClipboard', () => {
    beforeEach(loadMain);

    test('bereitet Emotionstexte auf und kopiert sie', async () => {
        const arr = [
            { emotionalText: '[dankbar]\nDanke\n' },
            { emotionalText: 'Hallo Welt!\nWie gehts?\n' }
        ];
        __setFiles(arr);
        await copyAllEmotionsToClipboard();
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('[dankbar] Danke\n\nHallo Welt! Wie gehts?');
    });
});
