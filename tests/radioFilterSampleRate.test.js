const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const MAIN_JS_PATH = path.join(__dirname, '..', 'web', 'src', 'main.js');

function extractFunction(source, startMarker, endMarker) {
    const startIndex = source.indexOf(startMarker);
    if (startIndex === -1) {
        throw new Error(`Marker "${startMarker}" nicht gefunden`);
    }
    const endIndex = source.indexOf(endMarker, startIndex);
    if (endIndex === -1) {
        throw new Error(`Marker "${endMarker}" nicht gefunden`);
    }
    return source.slice(startIndex, endIndex);
}

describe('applyRadioFilter behält die volle Sample-Rate', () => {
    let browser;

    beforeAll(async () => {
        browser = await chromium.launch();
    }, 30000);

    afterAll(async () => {
        if (browser) {
            await browser.close();
        }
    });

    test('liefert bei 48 kHz Eingang auch wieder 48 kHz Ausgang', async () => {
        const source = fs.readFileSync(MAIN_JS_PATH, 'utf8');
        const bufferRmsCode = extractFunction(source, 'function bufferRms', '// =========================== LAUTSTAERKEANGLEICH END');
        const radioCode = extractFunction(source, 'async function applyRadioFilter', '// =========================== RADIOFILTER END');

        const page = await browser.newPage();
        try {
            const result = await page.evaluate(async ({ bufferRmsCode, radioCode }) => {
                // Funktionen aus main.js registrieren
                eval(bufferRmsCode);
                eval(radioCode);

                const sampleRate = 48000;
                const length = sampleRate; // 1 Sekunde Testsignal
                const buffer = new AudioBuffer({ length, numberOfChannels: 1, sampleRate });
                const data = buffer.getChannelData(0);
                for (let i = 0; i < length; i++) {
                    data[i] = Math.sin(2 * Math.PI * 440 * (i / sampleRate));
                }
                const originalCopy = new Float32Array(data);

                const dryResult = await applyRadioFilter(buffer, {
                    hp: 300,
                    lp: 3000,
                    saturation: 0.2,
                    noiseDb: -50,
                    crackle: 0.1,
                    wet: 0
                });
                const wetResult = await applyRadioFilter(buffer, {
                    hp: 300,
                    lp: 3000,
                    saturation: 0.2,
                    noiseDb: -50,
                    crackle: 0.1,
                    wet: 1
                });

                const dryData = dryResult.getChannelData(0);
                let maxDiff = 0;
                for (let i = 0; i < dryData.length && i < originalCopy.length; i++) {
                    const diff = Math.abs(dryData[i] - originalCopy[i]);
                    if (diff > maxDiff) {
                        maxDiff = diff;
                    }
                }

                const wetData = wetResult.getChannelData(0);
                let nonZero = 0;
                for (let i = 0; i < wetData.length; i++) {
                    if (wetData[i] !== 0) {
                        nonZero++;
                    }
                }

                return {
                    maxDiff,
                    wetSampleRate: wetResult.sampleRate,
                    drySampleRate: dryResult.sampleRate,
                    wetLength: wetResult.length,
                    dryLength: dryResult.length,
                    wetNonZero: nonZero
                };
            }, { bufferRmsCode, radioCode });

            expect(result.wetSampleRate).toBe(48000);
            expect(result.drySampleRate).toBe(48000);
            expect(result.maxDiff).toBeLessThan(1e-6);
            expect(result.wetNonZero).toBeGreaterThan(0);
            expect(result.wetLength).toBeGreaterThan(0);
            expect(result.dryLength).toBeGreaterThan(0);
        } finally {
            await page.close();
        }
    }, 60000);
});
