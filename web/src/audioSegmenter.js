// Funktionen zur Audio-Segmentierung
// Erkennt Pausen und liefert passende Abschnitte zurueck

async function detectSegments(file, silenceMs = 300, threshold = 0.01, onProgress) {
    const buffer = await loadAudioBuffer(file);
    const data = buffer.getChannelData(0);
    const sr = buffer.sampleRate;
    const windowSize = Math.round(sr * 0.03); // 30 ms
    const silenceSamples = Math.round(sr * silenceMs / 1000);
    let segments = [];
    let start = 0;
    let silent = 0;
    let inSound = false;
    const total = data.length;
    for (let i = 0; i < total; i += windowSize) {
        let sum = 0;
        for (let j = 0; j < windowSize && i + j < data.length; j++) {
            sum += Math.abs(data[i + j]);
        }
        const amp = sum / windowSize;
        const ms = i / sr * 1000;
        if (amp < threshold) {
            silent += windowSize;
            if (inSound && silent >= silenceSamples) {
                const end = (i - silent) / sr * 1000;
                if (end > start) segments.push({ start, end });
                inSound = false;
            }
        } else {
            if (!inSound) {
                start = ms;
                inSound = true;
            }
            silent = 0;
        }
        if (onProgress && i % (sr * 0.5) === 0) {
            onProgress(i / total);
        }
    }
    if (inSound) {
        const end = data.length / sr * 1000;
        segments.push({ start, end });
    }
    if (onProgress) onProgress(1);
    return { buffer, segments };
}

function drawSegments(canvas, buffer, segments) {
    drawWaveform(canvas, buffer);
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const durationMs = buffer.length / buffer.sampleRate * 1000;
    segments.forEach((s, i) => {
        const startX = (s.start / durationMs) * width;
        const endX = (s.end / durationMs) * width;
        ctx.fillStyle = i % 2 ? 'rgba(0,0,255,0.3)' : 'rgba(255,0,255,0.3)';
        ctx.fillRect(startX, 0, endX - startX, height);
    });
}

// Schneidet einen Bereich aus einem Buffer heraus
function sliceBuffer(buffer, startMs, endMs) {
    const sr = buffer.sampleRate;
    const start = Math.max(0, Math.floor(startMs * sr / 1000));
    const end = Math.min(buffer.length, Math.floor(endMs * sr / 1000));
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const newBuf = ctx.createBuffer(buffer.numberOfChannels, end - start, sr);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        const data = buffer.getChannelData(ch).subarray(start, end);
        newBuf.copyToChannel(data, ch);
    }
    // AudioContext wieder schließen, um Browser-Limit zu vermeiden
    ctx.close();
    return newBuf;
}
