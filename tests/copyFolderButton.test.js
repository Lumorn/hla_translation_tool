/**
 * @jest-environment jsdom
 */

let copyDownloadFolder, showDownloadWaitDialog, __setFiles;

function loadMain() {
    jest.resetModules();
    if (!global.navigator) global.navigator = {};
    global.navigator.clipboard = { writeText: jest.fn().mockResolvedValue() };
    global.updateStatus = jest.fn();
    global.window.electronAPI = {};
    global.files = [];
    global.escapeHtml = t => t;
    global.safeCopy = async text => { await navigator.clipboard.writeText(text); return true; };
    ({ copyDownloadFolder, showDownloadWaitDialog } = require('../web/src/dubbing.js'));
    ({ __setFiles } = require('../web/src/main.js'));
}

describe('copyDownloadFolder', () => {
    beforeEach(loadMain);

    test('kopiert den Ordner erneut', async () => {
        const arr = [{ id: 1, folder: 'TestOrdner', enText: '', deText: '' }];
        __setFiles(arr);
        global.files = arr;
        document.body.innerHTML = '';
        await showDownloadWaitDialog(1);
        navigator.clipboard.writeText.mockClear();
        await copyDownloadFolder();
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TestOrdner');
    });

    test('Button im Dialog vorhanden', async () => {
        const arr2 = [{ id: 2, folder: 'OrdnerB', enText: '', deText: '' }];
        __setFiles(arr2);
        global.files = arr2;
        document.body.innerHTML = '';
        await showDownloadWaitDialog(2);
        const btn = document.getElementById('copyFolderBtn');
        expect(btn).not.toBeNull();
    });
});
