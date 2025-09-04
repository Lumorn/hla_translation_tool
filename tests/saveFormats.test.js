/**
 * @jest-environment jsdom
 */

// Verhindert offene Timer und unterdrückt Konsolen-Ausgaben
jest.useFakeTimers();
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});

let bufferToWav;

beforeAll(() => {
    ({ bufferToWav } = require('../web/src/main.js'));
});

afterAll(() => {
    // Nach den Tests alle Mocks und Timer zurücksetzen
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
});

function createBuffer(samples, sampleRate = 44100) {
    const data = Float32Array.from(samples);
    return {
        numberOfChannels: 1,
        length: data.length,
        sampleRate,
        _data: [data],
        getChannelData(ch) { return this._data[ch]; }
    };
}

test('bufferToWav erzeugt WAV-Blob', () => {
    const buf = createBuffer([0,0,0,0]);
    const blob = bufferToWav(buf);
    expect(blob.type).toBe('audio/wav');
    expect(blob.size).toBeGreaterThan(44);
});
