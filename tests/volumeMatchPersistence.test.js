const { expect, test } = require('@jest/globals');

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

function bufferRms(buffer) {
    let sum = 0;
    let len = 0;
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        const data = buffer.getChannelData(ch);
        for (let i = 0; i < data.length; i++) {
            sum += data[i] * data[i];
        }
        len += data.length;
    }
    return Math.sqrt(sum / len);
}

function matchVolume(sourceBuffer, targetBuffer) {
    const rms = bufferRms(sourceBuffer);
    const targetRms = bufferRms(targetBuffer);
    if (rms === 0) return sourceBuffer;
    const gain = targetRms / rms;
    const outData = new Float32Array(sourceBuffer.length);
    const inData = sourceBuffer.getChannelData(0);
    for (let i = 0; i < inData.length; i++) {
        let s = inData[i] * gain;
        outData[i] = Math.max(-1, Math.min(1, s));
    }
    return createBuffer(outData, sourceBuffer.sampleRate);
}

test('Lautstärke bleibt nach erneutem Speichern mit Abgleich unverändert', () => {
    const en = createBuffer([0.25, 0.25, 0.25, 0.25]);
    const deOrig = createBuffer([0.5, 0.5, 0.5, 0.5]);

    // Erstes Öffnen und Speichern mit Lautstärkeabgleich
    let savedOriginalBuffer = deOrig;
    let firstSaved = matchVolume(savedOriginalBuffer, en);

    // Zweites Öffnen mit dem bereits angepassten Buffer
    savedOriginalBuffer = firstSaved;
    let secondSaved = matchVolume(savedOriginalBuffer, en);

    const rms1 = bufferRms(firstSaved);
    const rms2 = bufferRms(secondSaved);
    expect(Math.abs(rms1 - rms2)).toBeLessThan(1e-6);
});
