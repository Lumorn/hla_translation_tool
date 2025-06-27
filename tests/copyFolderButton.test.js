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
    ({ copyDownloadFolder, showDownloadWaitDialog, __setFiles } = require('../web/src/main.js'));
}

describe('copyDownloadFolder', () => {
    beforeEach(loadMain);

    test('kopiert den Ordner erneut', async () => {
        __setFiles([{ id: 1, folder: 'TestOrdner', enText: '', deText: '' }]);
        document.body.innerHTML = '';
        await showDownloadWaitDialog(1);
        navigator.clipboard.writeText.mockClear();
        await copyDownloadFolder();
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('TestOrdner');
    });

    test('Button im Dialog vorhanden', async () => {
        __setFiles([{ id: 2, folder: 'OrdnerB', enText: '', deText: '' }]);
        document.body.innerHTML = '';
        await showDownloadWaitDialog(2);
        const btn = document.getElementById('copyFolderBtn');
        expect(btn).not.toBeNull();
    });
});
