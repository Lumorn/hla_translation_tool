const TWO_PI = Math.PI * 2;

// Deutsche Kommentare zwingend
// Erzeugt eine synthetische Sprachaufnahme aus einer 120-Hz-Rumpelkomponente und einer 1-kHz-Stimmformant-Annäherung
const sampleRate = 48000;
const duration = 1.0; // Sekunden
const totalSamples = Math.floor(sampleRate * duration);
const rumbleFreq = 120;
const voiceFreq = 1000;
const rumbleAmplitude = 0.4;
const voiceAmplitude = 0.25;

const dry = new Float32Array(totalSamples);
for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    dry[i] = rumbleAmplitude * Math.sin(TWO_PI * rumbleFreq * t)
        + voiceAmplitude * Math.sin(TWO_PI * voiceFreq * t);
}

// Überträgt den Hochpass aus getZooImpulseResponse
function applyImpulseHighpass(data, cutoff, sr) {
    const rc = 1 / (2 * Math.PI * cutoff);
    const dt = 1 / sr;
    const alpha = rc / (rc + dt);
    let prevIn = data[0];
    let prevOut = data[0];
    for (let i = 0; i < data.length; i++) {
        const x = data[i];
        const y = alpha * (prevOut + x - prevIn);
        data[i] = y;
        prevOut = y;
        prevIn = x;
    }
    return data;
}

// Biquad-Hochpass wie im Effektzweig (AudioParam-Äquivalent)
function applyBiquadHighpass(data, cutoff, q, sr) {
    const w0 = TWO_PI * cutoff / sr;
    const cos = Math.cos(w0);
    const sin = Math.sin(w0);
    const alpha = sin / (2 * q);

    const b0 = (1 + cos) / 2;
    const b1 = -(1 + cos);
    const b2 = (1 + cos) / 2;
    const a0 = 1 + alpha;
    const a1 = -2 * cos;
    const a2 = 1 - alpha;

    const out = new Float32Array(data.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < data.length; i++) {
        const x0 = data[i];
        const y0 = (b0 / a0) * x0 + (b1 / a0) * x1 + (b2 / a0) * x2
            - (a1 / a0) * y1 - (a2 / a0) * y2;
        out[i] = y0;
        x2 = x1; x1 = x0;
        y2 = y1; y1 = y0;
    }
    return out;
}

// RMS-Helfer zur Einschätzung der Energie
function rms(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
}

// Projektion auf Sinusbasis zur Frequenzabschätzung
function projectAmplitude(data, freq, sr) {
    let sinSum = 0;
    let cosSum = 0;
    for (let i = 0; i < data.length; i++) {
        const t = i / sr;
        const angle = TWO_PI * freq * t;
        sinSum += data[i] * Math.sin(angle);
        cosSum += data[i] * Math.cos(angle);
    }
    return (2 / data.length) * Math.sqrt(sinSum * sinSum + cosSum * cosSum);
}

const filteredImpulse = applyImpulseHighpass(Float32Array.from(dry), 260, sampleRate);
const filtered = applyBiquadHighpass(filteredImpulse, 270, Math.SQRT1_2, sampleRate);

console.log('RMS vorher:', rms(dry).toFixed(6));
console.log('RMS nachher:', rms(filtered).toFixed(6));
console.log('120 Hz Amplitude vorher:', projectAmplitude(dry, rumbleFreq, sampleRate).toFixed(6));
console.log('120 Hz Amplitude nachher:', projectAmplitude(filtered, rumbleFreq, sampleRate).toFixed(6));
console.log('1 kHz Amplitude vorher:', projectAmplitude(dry, voiceFreq, sampleRate).toFixed(6));
console.log('1 kHz Amplitude nachher:', projectAmplitude(filtered, voiceFreq, sampleRate).toFixed(6));
