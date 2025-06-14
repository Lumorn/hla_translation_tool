/**
 * @jest-environment jsdom
 */
const { getProjectPlaybackList, __setFiles, __setDeAudioCache } = require('../web/src/main.js');

test('DE-Playback haelt die Reihenfolge ein', () => {
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

    const order = getProjectPlaybackList().map(f => f.id);
    expect(order).toEqual([1, 2, 3]);
});
