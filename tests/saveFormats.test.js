/**
 * @jest-environment jsdom
 */
jest.mock('lamejs', () => ({
    Mp3Encoder: class { constructor(){ } encodeBuffer(){ return [1]; } flush(){ return [2]; } }
}), { virtual: false });

let bufferToMp3, bufferToWav;

beforeAll(() => {
    ({ bufferToMp3, bufferToWav } = require('../web/src/main.js'));
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
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

test('bufferToMp3 erzeugt MP3-Blob', () => {
    const buf = createBuffer([0,0,0,0]);
    const blob = bufferToMp3(buf);
    expect(blob.type).toBe('audio/mp3');
    expect(blob.size).toBeGreaterThan(0);
});

test('bufferToWav erzeugt WAV-Blob', () => {
    const buf = createBuffer([0,0,0,0]);
    const blob = bufferToWav(buf);
    expect(blob.type).toBe('audio/wav');
    expect(blob.size).toBeGreaterThan(44);
});
