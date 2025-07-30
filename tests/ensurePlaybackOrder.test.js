/**
 * @jest-environment jsdom
 */
const { getProjectPlaybackList, ensurePlaybackOrder, __setFiles, __setDisplayOrder, __setDeAudioCache } = require('../web/src/main.js');

test('ensurePlaybackOrder korrigiert die Reihenfolge', () => {
    const testFiles = [
        { id: 1, folder: 'f', filename: 'a.mp3' },
        { id: 2, folder: 'f', filename: 'b.wav' },
        { id: 3, folder: 'f', filename: 'c.mp3' }
    ];
    const cache = {
        'f/a.mp3': true,
        'f/b.wav': true,
        'f/c.mp3': true
    };
    __setFiles(testFiles);
    __setDeAudioCache(cache);
    // Falsche Reihenfolge simulieren
    __setDisplayOrder([
        { file: testFiles[2], originalIndex: 2 },
        { file: testFiles[0], originalIndex: 0 },
        { file: testFiles[1], originalIndex: 1 }
    ]);

    ensurePlaybackOrder();
    const order = getProjectPlaybackList().map(f => f.id);
    expect(order).toEqual([1, 2, 3]);
});
