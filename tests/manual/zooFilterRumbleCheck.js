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

// Allgemeiner Biquad-Wrapper für verschiedene Filtertypen
function designBiquad(type, cutoff, q, gainDb, sr) {
    const w0 = TWO_PI * cutoff / sr;
    const cos = Math.cos(w0);
    const sin = Math.sin(w0);
    const alpha = sin / (2 * q);
    const A = Math.pow(10, gainDb / 40);

    switch (type) {
        case 'highpass':
            return {
                b0: (1 + cos) / 2,
                b1: -(1 + cos),
                b2: (1 + cos) / 2,
                a0: 1 + alpha,
                a1: -2 * cos,
                a2: 1 - alpha
            };
        case 'lowpass':
            return {
                b0: (1 - cos) / 2,
                b1: 1 - cos,
                b2: (1 - cos) / 2,
                a0: 1 + alpha,
                a1: -2 * cos,
                a2: 1 - alpha
            };
        case 'peaking': {
            const b0 = 1 + alpha * A;
            const b1 = -2 * cos;
            const b2 = 1 - alpha * A;
            const a0 = 1 + alpha / A;
            const a1 = -2 * cos;
            const a2 = 1 - alpha / A;
            return { b0, b1, b2, a0, a1, a2 };
        }
        case 'highshelf': {
            const twoSqrtAAlpha = 2 * Math.sqrt(A) * alpha;
            const b0 = A * ((A + 1) + (A - 1) * cos + twoSqrtAAlpha);
            const b1 = -2 * A * ((A - 1) + (A + 1) * cos);
            const b2 = A * ((A + 1) + (A - 1) * cos - twoSqrtAAlpha);
            const a0 = (A + 1) - (A - 1) * cos + twoSqrtAAlpha;
            const a1 = 2 * ((A - 1) - (A + 1) * cos);
            const a2 = (A + 1) - (A - 1) * cos - twoSqrtAAlpha;
            return { b0, b1, b2, a0, a1, a2 };
        }
        default:
            throw new Error(`Unbekannter Biquad-Typ: ${type}`);
    }
}

// Rechnet ein Biquad-Set in eine neue Float32Array-Ausgabe
function processBiquad(data, coeffs) {
    const { b0, b1, b2, a0, a1, a2 } = coeffs;
    const out = new Float32Array(data.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    const normB0 = b0 / a0;
    const normB1 = b1 / a0;
    const normB2 = b2 / a0;
    const normA1 = a1 / a0;
    const normA2 = a2 / a0;
    for (let i = 0; i < data.length; i++) {
        const x0 = data[i];
        const y0 = normB0 * x0 + normB1 * x1 + normB2 * x2
            - normA1 * y1 - normA2 * y2;
        out[i] = y0;
        x2 = x1; x1 = x0;
        y2 = y1; y1 = y0;
    }
    return out;
}

// Biquad-Hochpass wie im Effektzweig (AudioParam-Äquivalent)
function applyBiquadHighpass(data, cutoff, q, sr) {
    return processBiquad(data, designBiquad('highpass', cutoff, q, 0, sr));
}

// RMS-Helfer zur Einschätzung der Energie
function rms(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
        sum += data[i] * data[i];
    }
    return Math.sqrt(sum / data.length);
}

// RMS über einen Abschnitt zur Simulation von Signalpausen
function segmentRms(data, start, end) {
    let sum = 0;
    let count = 0;
    for (let i = start; i < end; i++) {
        const sample = data[i];
        sum += sample * sample;
        count++;
    }
    return count > 0 ? Math.sqrt(sum / count) : 0;
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

// Konvertiert einen Betrag in Dezibel, schützt vor -Inf
function toDb(value) {
    return 20 * Math.log10(Math.max(value, 1e-12));
}

// Maximalbetrag zur Peak-Beurteilung
function maxAbs(data) {
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
        const abs = Math.abs(data[i]);
        if (abs > peak) peak = abs;
    }
    return peak;
}

// WaveShaper-Übertrager (tanh wie im Effekt)
function applyWaveShaper(data, drive) {
    const out = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
        const x = data[i];
        out[i] = Math.tanh(drive * x);
    }
    return out;
}

// Einfache Kompressor-Simulation mit logarithmischer Hüllkurve
function applySimpleCompressor(data, { thresholdDb, ratio, attackMs, releaseMs }, sr) {
    const out = new Float32Array(data.length);
    const threshold = Math.pow(10, thresholdDb / 20);
    const attack = Math.exp(-1 / (attackMs / 1000 * sr));
    const release = Math.exp(-1 / (releaseMs / 1000 * sr));
    let envelope = 0;

    for (let i = 0; i < data.length; i++) {
        const x = data[i];
        const abs = Math.abs(x);
        if (abs > envelope) {
            envelope = attack * (envelope - abs) + abs;
        } else {
            envelope = release * (envelope - abs) + abs;
        }

        let gain = 1;
        if (envelope > threshold) {
            const envDb = toDb(envelope);
            const overDb = envDb - thresholdDb;
            const reducedDb = overDb / ratio;
            const makeupDb = reducedDb - overDb;
            gain = Math.pow(10, makeupDb / 20);
        }

        out[i] = x * gain;
    }

    return out;
}

// Endverstärkung wie im Tool (-15 dB Ziel, maximal 2,5x Gain)
function applyFinalGain(data, targetDb, maxGain) {
    const out = Float32Array.from(data);
    const currentRms = rms(out) || 1e-9;
    const target = Math.pow(10, targetDb / 20);
    const gain = Math.min(target / currentRms, maxGain);
    for (let i = 0; i < out.length; i++) {
        const scaled = out[i] * gain;
        out[i] = Math.max(-1, Math.min(1, scaled));
    }
    return { data: out, gain };
}

// Entspricht dem JS-Objekt im Tool
const zooSpeakerNoiseSettings = {
    aktiviert: true,
    gainDb: -40,
    brumm50HzDb: -52,
    brumm60HzDb: -56,
    lowcutHz: 140,
    highcutHz: 7000
};

// Erzeugt das bandbegrenzte Rauschbett inkl. Brummtönen
function generateZooNoise(length, sr, settings) {
    if (settings.aktiviert === false) {
        return new Float32Array(length);
    }

    const noise = new Float32Array(length);
    let last = 0;
    for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        last = 0.97 * last + 0.03 * white;
        noise[i] = last * 0.6;
    }

    let shaped = processBiquad(noise, designBiquad('highpass', settings.lowcutHz || 140, Math.SQRT1_2, 0, sr));
    shaped = processBiquad(shaped, designBiquad('lowpass', settings.highcutHz || 7000, 0.7, 0, sr));

    const brumm50Amp = typeof settings.brumm50HzDb === 'number'
        ? Math.pow(10, settings.brumm50HzDb / 20)
        : 0;
    const brumm60Amp = typeof settings.brumm60HzDb === 'number'
        ? Math.pow(10, settings.brumm60HzDb / 20)
        : 0;

    for (let i = 0; i < length; i++) {
        const t = i / sr;
        if (brumm50Amp) {
            shaped[i] += brumm50Amp * Math.sin(TWO_PI * 50 * t);
        }
        if (brumm60Amp) {
            shaped[i] += brumm60Amp * Math.sin(TWO_PI * 60 * t);
        }
    }

    const gain = Math.pow(10, (typeof settings.gainDb === 'number' ? settings.gainDb : -40) / 20);
    for (let i = 0; i < length; i++) {
        shaped[i] *= gain;
    }

    return shaped;
}

// Simuliert die eigentliche Lautsprecherkette (ohne Hall-Faltung)
function processZooSpeakerChain(input, sr) {
    let result = Float32Array.from(input);
    result = processBiquad(result, designBiquad('highshelf', 1800, 0.7, 1.8, sr));
    result = applyWaveShaper(result, 1.45);
    result = processBiquad(result, designBiquad('highpass', 430, 1.05, 0, sr));
    result = processBiquad(result, designBiquad('highpass', 440, 0.85, 0, sr));
    result = processBiquad(result, designBiquad('lowpass', 3500, 0.8, 0, sr));
    result = processBiquad(result, designBiquad('lowpass', 3500, 0.6, 0, sr));
    result = processBiquad(result, designBiquad('peaking', 1600, 1.5, 3.5, sr));
    result = applySimpleCompressor(result, {
        thresholdDb: -22,
        ratio: 3.1,
        attackMs: 18,
        releaseMs: 140
    }, sr);
    return result;
}

// Fügt das Rauschbett hinzu und imitiert die abschließende Normalisierung
function finalizeZooOutput(speaker, sr, settings) {
    const wetGain = 0.28;
    const noise = generateZooNoise(speaker.length, sr, settings);
    const noiseWet = new Float32Array(speaker.length);
    const combined = new Float32Array(speaker.length);

    for (let i = 0; i < speaker.length; i++) {
        const noiseSample = wetGain * noise[i];
        noiseWet[i] = noiseSample;
        combined[i] = speaker[i] + noiseSample;
    }

    const { data: normalized, gain } = applyFinalGain(combined, -15, 2.5);
    const scaledNoise = new Float32Array(noiseWet.length);
    for (let i = 0; i < noiseWet.length; i++) {
        scaledNoise[i] = Math.max(-1, Math.min(1, noiseWet[i] * gain));
    }

    return {
        output: normalized,
        noise: scaledNoise,
        appliedGain: gain
    };
}

// ------------------ Bestehender Hochpass-Check ------------------------------
const filteredImpulse = applyImpulseHighpass(Float32Array.from(dry), 260, sampleRate);
const filtered = applyBiquadHighpass(filteredImpulse, 270, Math.SQRT1_2, sampleRate);

console.log('--- Hochpass-Prüfung (Impulsantwort) ---');
console.log('RMS vorher:', rms(dry).toFixed(6));
console.log('RMS nachher:', rms(filtered).toFixed(6));
console.log('120 Hz Amplitude vorher:', projectAmplitude(dry, rumbleFreq, sampleRate).toFixed(6));
console.log('120 Hz Amplitude nachher:', projectAmplitude(filtered, rumbleFreq, sampleRate).toFixed(6));
console.log('1 kHz Amplitude vorher:', projectAmplitude(dry, voiceFreq, sampleRate).toFixed(6));
console.log('1 kHz Amplitude nachher:', projectAmplitude(filtered, voiceFreq, sampleRate).toFixed(6));

// ------------------ Noise-Floor-Messung -------------------------------------
const pauseDuration = 2.0;
const pauseSamples = Math.floor(sampleRate * pauseDuration);
const zooDry = new Float32Array(pauseSamples);

for (let i = 0; i < pauseSamples; i++) {
    const t = i / sampleRate;
    if (t < 0.65) {
        const envelope = t < 0.05 ? t / 0.05 : 1;
        zooDry[i] = envelope * (0.55 * Math.sin(TWO_PI * 1000 * t) + 0.3 * Math.sin(TWO_PI * 210 * t));
    } else {
        zooDry[i] = 0;
    }
}

const speakerProcessed = processZooSpeakerChain(zooDry, sampleRate);
const finalized = finalizeZooOutput(speakerProcessed, sampleRate, zooSpeakerNoiseSettings);
const pauseStart = Math.floor(1.2 * sampleRate);
const pauseNoiseRms = segmentRms(finalized.output, pauseStart, finalized.output.length);

console.log('\n--- Noise-Floor in Signalpausen ---');
console.log('Angewendeter Gain-Faktor:', finalized.appliedGain.toFixed(3));
console.log('RMS des reinen Rauschbetts:', rms(finalized.noise).toFixed(6), '(', toDb(rms(finalized.noise)).toFixed(2), 'dBFS )');
console.log('RMS der Pause (Output):', pauseNoiseRms.toFixed(6), '(', toDb(pauseNoiseRms).toFixed(2), 'dBFS )');

// ------------------ Spitzenverzerrung bei Impulsen ---------------------------
const impulseSamples = Math.floor(sampleRate * 0.5);
const impulseBuffer = new Float32Array(impulseSamples);
for (let n = 0; n < 5; n++) {
    const idx = 200 + n * 60;
    if (idx < impulseSamples) {
        const amp = n % 2 === 0 ? 1.3 : -1.25;
        impulseBuffer[idx] = amp;
    }
}

const impulseSpeaker = processZooSpeakerChain(impulseBuffer, sampleRate);
const impulseFinal = finalizeZooOutput(impulseSpeaker, sampleRate, { ...zooSpeakerNoiseSettings, aktiviert: false });
const peakBefore = maxAbs(impulseBuffer);
const peakAfter = maxAbs(impulseFinal.output);
const rmsBefore = rms(impulseBuffer);
const rmsAfter = rms(impulseFinal.output);

console.log('\n--- Spitzenverzerrung bei harten Impulsen ---');
console.log('Peak vorher:', peakBefore.toFixed(3), '(', toDb(peakBefore).toFixed(2), 'dBFS )');
console.log('Peak nachher:', peakAfter.toFixed(3), '(', toDb(peakAfter).toFixed(2), 'dBFS )');
console.log('RMS vorher:', rmsBefore.toFixed(6), '(', toDb(rmsBefore).toFixed(2), 'dBFS )');
console.log('RMS nachher:', rmsAfter.toFixed(6), '(', toDb(rmsAfter).toFixed(2), 'dBFS )');
console.log('Crest-Faktor vorher:', (peakBefore / (rmsBefore || 1e-9)).toFixed(2));
console.log('Crest-Faktor nachher:', (peakAfter / (rmsAfter || 1e-9)).toFixed(2));
