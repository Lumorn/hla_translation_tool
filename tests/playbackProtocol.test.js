/**
 * @jest-environment jsdom
 */

let startProjectPlayback, stopProjectPlayback, __setFiles, __setDeAudioCache, __getPlaybackProtocol;

function loadMain() {
    jest.resetModules();
    const doc = global.document;
    doc.getElementById = jest.fn(id => {
        if (id === 'projectPlayPauseBtn' || id === 'playbackPlayBtn') return { textContent: '' };
        if (id === 'playbackList') return { innerHTML: '' };
        if (id === 'playbackProtocol') return { textContent: '', scrollTop: 0, scrollHeight: 0 };
        if (id === 'playbackListDialog') return { classList: { remove: jest.fn(), add: jest.fn() } };
        if (id === 'audioPlayer') return { play: jest.fn(() => Promise.resolve()), pause: jest.fn(), addEventListener: jest.fn(), src: '' };
        return null;
    });
    doc.querySelectorAll = jest.fn(() => []);
    doc.querySelector = jest.fn(() => null);
    global.window = { addEventListener: jest.fn() };
    global.URL = { createObjectURL: jest.fn(()=>'blob:'), revokeObjectURL: jest.fn() };
    global.localStorage = { getItem: () => null };
    ({ startProjectPlayback, stopProjectPlayback, __setFiles, __setDeAudioCache, __getPlaybackProtocol } = require('../web/src/main.js'));
}

beforeEach(loadMain);

test('playback protocol logs expected order', () => {
    const files = [
        { id: 1, folder: 'f', filename: 'a.mp3' },
        { id: 2, folder: 'f', filename: 'b.wav' }
    ];
    const cache = { 'f/a.mp3': true, 'f/b.wav': true };
    __setFiles(files);
    __setDeAudioCache(cache);
    startProjectPlayback();
    stopProjectPlayback();
    const protocol = __getPlaybackProtocol();
    expect(protocol.startsWith('Erwartete Reihenfolge:\n1. a.mp3\n2. b.wav\nAbspielreihenfolge:\n1. a.mp3')).toBe(true);
});
