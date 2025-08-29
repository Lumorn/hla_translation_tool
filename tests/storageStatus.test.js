/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

test('getProjectStorageStatus und getFileStorageStatus liefern korrekte Infos', async () => {
    const localData = {
        hla_projects: JSON.stringify([{ id: 1 }]),
        hla_textDatabase: JSON.stringify({ 'ordner/datei': { en: 'x' } })
    };
    const newData = {
        hla_projects: JSON.stringify([{ id: 2 }]),
        hla_textDatabase: JSON.stringify({ 'anderer/datei': { en: 'y' } })
    };

    const localBackend = { getItem: k => localData[k] };
    const newBackend = { getItem: k => newData[k] };

    window.createStorage = type => type === 'indexedDB' ? newBackend : localBackend;

    const src = fs.readFileSync(path.join(__dirname, '../web/src/main.js'), 'utf8');
    const start = src.indexOf('async function getProjectStorageStatus');
    const end = src.indexOf('async function visualizeFileStorage', start);
    eval(src.slice(start, end));
    window.getProjectStorageStatus = getProjectStorageStatus;
    window.getFileStorageStatus = getFileStorageStatus;

    await expect(window.getProjectStorageStatus(1)).resolves.toEqual({ local: true, indexedDB: false });
    await expect(window.getProjectStorageStatus(2)).resolves.toEqual({ local: false, indexedDB: true });
    await expect(window.getFileStorageStatus('ordner/datei')).resolves.toEqual({ local: true, indexedDB: false });
    await expect(window.getFileStorageStatus('anderer/datei')).resolves.toEqual({ local: false, indexedDB: true });
});
