/** @jest-environment jsdom */
// Prüft den dynamischen Stille-Schwellwert und die Trim-Absicherung beim Time-Stretching
const { beforeEach, describe, expect, test } = require('@jest/globals');

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
    document.querySelector = jest.fn(() => null);
    document.querySelectorAll = jest.fn(() => []);
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
    console.debug = jest.fn();
    helpers = require('../web/src/main.js');
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

    test('dynamischer Schwellwert überschreitet nicht die maximale Polsteramplitude', () => {
        const buffer = createStubBuffer([
            [
                0.002,
                -0.004,
                0.003,
                -0.005,
                0.5,
                -0.4,
                0.6
            ]
        ], 48000);
        const threshold = helpers.__test_calculateDynamicSilenceThreshold(buffer, 4);
        expect(threshold).toBeLessThanOrEqual(0.005);
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

    test('analyzeEdgeTrim erkennt zusätzliche Stille an beiden Seiten', () => {
        const sampleRate = 1000;
        const totalFrames = 4000;
        const padFrames = 100;
        const threshold = 0.001;
        const headOffset = 100;
        const tailOffset = 100;
        const channel = new Float32Array(totalFrames);

        for (let i = padFrames + headOffset; i < totalFrames - (padFrames + tailOffset); i++) {
            channel[i] = 0.2;
        }

        const result = helpers.__test_analyzeEdgeTrim([channel], totalFrames, sampleRate, padFrames, threshold);
        expect(result.start).toBe(padFrames + headOffset);
        expect(result.end).toBe(padFrames + tailOffset);
        expect(console.debug).toHaveBeenCalledWith(
            expect.stringContaining('Zusätzliche Stille am Anfang erkannt'),
            expect.objectContaining({ padFrames })
        );
        expect(console.debug).toHaveBeenCalledWith(
            expect.stringContaining('Zusätzliche Stille am Ende erkannt'),
            expect.objectContaining({ padFrames })
        );
    });
});
