let markDubAsReady, cleanupDubCache, __setFiles, __setDeAudioCache, __setRenderFileTable, __setSaveCurrentProject;

function createStorage() {
    return {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
        keys: () => []
    };
}

function loadMain() {
    jest.resetModules();
    global.document = { addEventListener: jest.fn() };
    global.window = { addEventListener: jest.fn() };
    global.localStorage = {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {}
    };
    global.window.localStorage = global.localStorage;
    global.storage = createStorage();
    ({ markDubAsReady, cleanupDubCache, __setFiles, __setDeAudioCache, __setRenderFileTable, __setSaveCurrentProject } = require('../web/src/main.js'));
    __setRenderFileTable(() => {});
    __setSaveCurrentProject(() => {});
}

describe('markDubAsReady', () => {
    beforeEach(loadMain);

    test('entfernt Prefix unabhaengig von Grossschreibung', () => {
        const cache = {};
        __setFiles([{ id: 1, folder: 'folder', filename: 'test.mp3', version: 1 }]);
        __setDeAudioCache(cache);
        markDubAsReady(1, 'Sounds/DE/folder/test.mp3');
        expect(cache).toEqual({ 'folder/test.mp3': 'Sounds/DE/folder/test.mp3' });
    });

    test('funktioniert auch mit kleinem sounds', () => {
        const cache = {};
        __setFiles([{ id: 1, folder: 'folder', filename: 'test.mp3', version: 1 }]);
        __setDeAudioCache(cache);
        markDubAsReady(1, 'sounds/DE/folder/test.mp3');
        expect(cache).toEqual({ 'folder/test.mp3': 'sounds/DE/folder/test.mp3' });
    });

    test('erhoeht Versionsnummer bei vorhandener Datei', () => {
        const cache = { 'folder/test.mp3': 'sounds/DE/folder/test.mp3' };
        const file = { id: 2, folder: 'folder', filename: 'test.mp3', version: 1 };
        __setFiles([file]);
        __setDeAudioCache(cache);
        markDubAsReady(2, 'sounds/DE/folder/test.mp3');
        expect(file.version).toBe(2);
    });
});

describe('cleanupDubCache', () => {
    beforeEach(loadMain);

    test('bereinigt alte Eintraege', () => {
        const cache = { 'Sounds/DE/test.mp3': 'Sounds/DE/test.mp3', 'ok.mp3': 'ok' };
        __setDeAudioCache(cache);
        cleanupDubCache();
        expect(cache).toEqual({ 'ok.mp3': 'ok', 'test.mp3': 'Sounds/DE/test.mp3' });
    });
});
