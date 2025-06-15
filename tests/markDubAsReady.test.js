let markDubAsReady, cleanupDubCache, __setFiles, __setDeAudioCache, __setRenderFileTable, __setSaveCurrentProject;

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
    ({ markDubAsReady, cleanupDubCache, __setFiles, __setDeAudioCache, __setRenderFileTable, __setSaveCurrentProject } = require('../web/src/main.js'));
    __setRenderFileTable(() => {});
    __setSaveCurrentProject(() => {});
}

describe('markDubAsReady', () => {
    beforeEach(loadMain);

    test('entfernt Prefix unabhaengig von Grossschreibung', () => {
        const cache = {};
        __setFiles([{ id: 1 }]);
        __setDeAudioCache(cache);
        markDubAsReady(1, 'Sounds/DE/folder/test.mp3');
        expect(cache).toEqual({ 'folder/test.mp3': 'Sounds/DE/folder/test.mp3' });
    });

    test('funktioniert auch mit kleinem sounds', () => {
        const cache = {};
        __setFiles([{ id: 1 }]);
        __setDeAudioCache(cache);
        markDubAsReady(1, 'sounds/DE/folder/test.mp3');
        expect(cache).toEqual({ 'folder/test.mp3': 'sounds/DE/folder/test.mp3' });
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
