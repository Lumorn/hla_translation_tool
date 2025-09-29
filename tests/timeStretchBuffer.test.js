/** @jest-environment jsdom */
// Prüft den dynamischen Stille-Schwellwert und die Trim-Absicherung beim Time-Stretching
const { afterAll, beforeEach, describe, expect, test } = require('@jest/globals');

jest.mock('../../elevenlabs', () => ({
    downloadDubbingAudio: jest.fn(),
    renderLanguage: jest.fn(),
    pollRender: jest.fn()
}), { virtual: true });

jest.mock('../../extensionUtils', () => ({
    repairFileExtensions: jest.fn()
}), { virtual: true });

jest.mock('../../closecaptionParser', () => ({
    loadClosecaptions: jest.fn()
}), { virtual: true });

jest.mock('../web/src/dubbing.js', () => ({
    mountWaveTimeline: jest.fn(),
    renderWaveTimeline: jest.fn(),
    syncWaveTimelineControls: jest.fn(),
    initDubbing: jest.fn()
}), { virtual: true });

jest.mock('../web/src/fileUtils.js', () => ({
    calculateTextSimilarity: jest.fn(),
    levenshteinDistance: jest.fn()
}), { virtual: true });

jest.mock('../web/src/pathUtils.js', () => ({
    extractRelevantFolder: jest.fn()
}), { virtual: true });

jest.mock('../web/src/calculateProjectStats.js', () => ({
    calculateProjectStats: jest.fn()
}), { virtual: true });

let helpers;
const originalDocGetElementById = document.getElementById;
const originalAddEventListener = window.addEventListener;
const originalRemoveEventListener = window.removeEventListener;
const originalLocalStorage = window.localStorage;
const originalAudioContext = window.AudioContext;
const originalWebkitAudioContext = window.webkitAudioContext;

function createElementStub() {
    return {
        textContent: '',
        className: '',
        classList: { add: jest.fn(), remove: jest.fn() },
        style: {},
        title: '',
        setAttribute: jest.fn(),
        removeAttribute: jest.fn(),
        appendChild: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        value: '',
        checked: false,
        querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => [])
    };
}

beforeEach(() => {
    jest.resetModules();
    document.getElementById = jest.fn(() => createElementStub());
    window.addEventListener = jest.fn();
    window.removeEventListener = jest.fn();
    window.localStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
    };
    window.storage = window.localStorage;
    window.AudioContext = function () {
        this.createBuffer = (channels, length, sampleRate) => {
            const data = Array.from({ length: channels }, () => new Float32Array(length));
            return {
                numberOfChannels: channels,
                length,
                sampleRate,
                getChannelData: index => data[index],
                copyToChannel: jest.fn()
            };
        };
        this.close = jest.fn();
    };
    window.webkitAudioContext = window.AudioContext;
    global.storage = window.storage;
    helpers = require('../web/src/main.js');
});

afterAll(() => {
    if (originalDocGetElementById) document.getElementById = originalDocGetElementById;
    if (originalAddEventListener) window.addEventListener = originalAddEventListener;
    if (originalRemoveEventListener) window.removeEventListener = originalRemoveEventListener;
    if (originalLocalStorage) window.localStorage = originalLocalStorage;
    if (originalAudioContext) window.AudioContext = originalAudioContext;
    if (originalWebkitAudioContext) window.webkitAudioContext = originalWebkitAudioContext;
});

function createStubBuffer(channels, sampleRate = 48000) {
    return {
        numberOfChannels: channels.length,
        length: channels[0]?.length || 0,
        sampleRate,
        getChannelData(index) {
            return Float32Array.from(channels[index] || []);
        }
    };
}

describe('timeStretchBuffer-Helfer', () => {
    test('dynamischer Schwellwert orientiert sich am Ruhepolster', () => {
        const buffer = createStubBuffer([
            [
                0,
                0.0005,
                -0.0008,
                0.0005,
                0.05,
                0.1,
                -0.2,
                0.08,
                -0.0004,
                0.0005,
                -0.0003,
                0.0004
            ]
        ], 20);
        const threshold = helpers.__test_calculateDynamicSilenceThreshold(buffer, 4);
        expect(threshold).toBeGreaterThan(5e-4);
        expect(threshold).toBeLessThan(0.001);
    });

    test('dynamischer Schwellwert besitzt einen Mindestwert', () => {
        const buffer = createStubBuffer([[0, 2e-7, -3e-7, 0]]);
        const threshold = helpers.__test_calculateDynamicSilenceThreshold(buffer, 2);
        expect(threshold).toBeCloseTo(1e-6, 12);
    });

    test('Trim-Absicherung lässt nur Stille mit mindestens 100 ms zu', () => {
        const sampleRate = 48000;
        const totalFrames = sampleRate * 20; // 20 Sekunden
        const result = helpers.__test_applyTrimSafety(1000, 6000, totalFrames, sampleRate);
        expect(result.start).toBe(0);
        expect(result.end).toBe(6000);
    });

    test('Trim-Absicherung begrenzt das Abschneiden auf zehn Prozent der Länge', () => {
        const sampleRate = 48000;
        const totalFrames = sampleRate * 2; // 2 Sekunden
        const result = helpers.__test_applyTrimSafety(8000, 9000, totalFrames, sampleRate);
        const maxTrim = Math.round(totalFrames * 0.1);
        const minSilence = Math.round(sampleRate * 0.1);
        expect(result.start + result.end).toBeLessThanOrEqual(maxTrim);
        expect(result.start).toBe(0);
        if (maxTrim >= minSilence) {
            expect(result.end).toBeGreaterThanOrEqual(minSilence);
        } else {
            expect(result.end).toBe(0);
        }
        expect(result.end).toBeLessThanOrEqual(maxTrim);
    });

    test('Trim-Absicherung respektiert übergebene Mindestwerte unabhängig vom Zehn-Prozent-Limit', () => {
        const sampleRate = 48000;
        const totalFrames = sampleRate * 5; // 5 Sekunden
        const minFrames = sampleRate; // Eine Sekunde Stille als Mindestwert
        const result = helpers.__test_applyTrimSafety(minFrames, minFrames, totalFrames, sampleRate, minFrames, minFrames);
        expect(result.start).toBe(minFrames);
        expect(result.end).toBe(minFrames);
    });

    test('Turbo-Freigabe lässt leise Ausklänge vollständig stehen', () => {
        const sampleRate = 48000;
        const length = sampleRate; // 1 Sekunde
        const data = new Float32Array(length);
        const fadeStart = Math.floor(length * 0.8);
        for (let i = 0; i < length; i++) {
            if (i < fadeStart) {
                data[i] = Math.sin(i / 20) * 0.2;
            } else {
                const t = (i - fadeStart) / (length - fadeStart);
                data[i] = 0.02 * (1 - t);
            }
        }
        const buffer = {
            numberOfChannels: 1,
            length,
            sampleRate,
            getChannelData: () => data
        };
        const silence = helpers.__test_estimateStretchSilence(buffer);
        expect(silence.start).toBe(0);
        expect(silence.end).toBeLessThan(5);
    });

    test('Auto-Pausen und Turbo lassen sehr leises Fade-out unangetastet', () => {
        const sampleRate = 48000;
        const length = sampleRate * 2; // 2 Sekunden mit langem Ausklang
        const data = new Float32Array(length);
        const fadeStart = Math.floor(length * 0.7);
        for (let i = 0; i < length; i++) {
            if (i < fadeStart) {
                data[i] = Math.sin(i / 30) * 0.12;
            } else {
                const t = (i - fadeStart) / (length - fadeStart);
                data[i] = 0.0025 + (1 - t) * 0.006;
            }
            if (i % 97 === 0) {
                data[i] += 0.0002 * (i % 2 === 0 ? 1 : -1);
            }
        }
        const buffer = {
            numberOfChannels: 1,
            length,
            sampleRate,
            getChannelData: () => data
        };

        const threshold = helpers.__test_determineAdaptiveSilenceThreshold(buffer);
        const pauses = helpers.__test_detectPausesInBuffer(buffer, 300, threshold);
        expect(pauses).toHaveLength(0);

        const trim = helpers.__test_detectSilenceTrim(buffer, threshold);
        expect(trim.start).toBe(0);
        expect(trim.end).toBeLessThanOrEqual(1);

        const trimmed = helpers.removeRangesFromBuffer(buffer, pauses);
        const trimmedData = trimmed.getChannelData(0);
        const tailSlice = trimmedData.slice(trimmedData.length - Math.floor(sampleRate * 0.1));
        let maxTail = 0;
        for (let i = 0; i < tailSlice.length; i++) {
            const val = Math.abs(tailSlice[i]);
            if (val > maxTail) maxTail = val;
        }
        expect(maxTail).toBeGreaterThan(0.002);

        const turbo = helpers.__test_estimateStretchSilence(trimmed);
        expect(turbo.end).toBeLessThan(10);
    });
});
