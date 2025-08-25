/**
 * @jest-environment jsdom
 */

let copyAllEmotionsToClipboard, __setFiles, __setGetAudioDuration;

function loadMain() {
    jest.resetModules();
    if (!global.navigator) global.navigator = {};
    global.navigator.clipboard = { writeText: jest.fn().mockResolvedValue() };
    global.safeCopy = async text => { await navigator.clipboard.writeText(text); return true; };
    global.showToast = jest.fn();
    global.files = [];
    ({ copyAllEmotionsToClipboard, __setFiles, __setGetAudioDuration } = require('../web/src/main.js'));
    // nach dem Laden die Toast-Funktion überschreiben und DOM vorbereiten
    global.showToast = jest.fn();
    document.body.innerHTML = '<div id="toastContainer"></div>' +
        '<input type="checkbox" id="copyIncludeTime">' +
        '<input type="checkbox" id="copyAddDashes">';
}

describe('copyAllEmotionsToClipboard', () => {
    beforeEach(loadMain);

    test('bereitet Emotionstexte auf und kopiert sie mit Zeit', async () => {
        const arr = [
            { emotionalText: '[dankbar]\nDanke\n', filename: 'a.wav', folder: 'f1' },
            { emotionalText: 'Hallo Welt!\nWie gehts?\n', filename: 'b.wav', folder: 'f1' }
        ];
        __setFiles(arr);
        __setGetAudioDuration(() => 8.57);
        document.getElementById('copyIncludeTime').checked = true;
        await copyAllEmotionsToClipboard();
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('[8,57sec] [dankbar] Danke\n\n[8,57sec] Hallo Welt! Wie gehts?');
    });

    test('fügt nur Striche an', async () => {
        const arr = [
            { emotionalText: '[dankbar]\nDanke\n', filename: 'a.wav', folder: 'f1' },
            { emotionalText: 'Hallo Welt!\nWie gehts?\n', filename: 'b.wav', folder: 'f1' }
        ];
        __setFiles(arr);
        const durFn = jest.fn();
        __setGetAudioDuration(durFn);
        document.getElementById('copyAddDashes').checked = true;
        await copyAllEmotionsToClipboard();
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('[dankbar] Danke ---\n\nHallo Welt! Wie gehts? ---');
        expect(durFn).not.toHaveBeenCalled();
    });

    test('fügt Zeit und Striche hinzu', async () => {
        const arr = [
            { emotionalText: '[dankbar]\nDanke\n', filename: 'a.wav', folder: 'f1' },
            { emotionalText: 'Hallo Welt!\nWie gehts?\n', filename: 'b.wav', folder: 'f1' }
        ];
        __setFiles(arr);
        __setGetAudioDuration(() => 8.57);
        document.getElementById('copyIncludeTime').checked = true;
        document.getElementById('copyAddDashes').checked = true;
        await copyAllEmotionsToClipboard();
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('[8,57sec] [dankbar] Danke ---\n\n[8,57sec] Hallo Welt! Wie gehts? ---');
    });
});
