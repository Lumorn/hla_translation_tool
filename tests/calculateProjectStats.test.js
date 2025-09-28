const { calculateProjectStats } = require('../web/src/calculateProjectStats.js');

describe('calculateProjectStats', () => {
    afterEach(() => {
        delete global.deAudioCache;
        delete global.findDeAudioCacheKeyInsensitive;
    });
    test('empty file list returns 0% stats', () => {
        const result = calculateProjectStats({ files: [] });
        expect(result).toEqual({
            enPercent: 0,
            dePercent: 0,
            deAudioPercent: 0,
            completedPercent: 0,
            totalFiles: 0,
            scoreAvg: 0,
            scoreMin: 0
        });
    });

    // Testfall: Aufruf ohne "files"-Eigenschaft
    test('project ohne files liefert 0% Statistiken', () => {
        const result = calculateProjectStats({});
        expect(result).toEqual({
            enPercent: 0,
            dePercent: 0,
            deAudioPercent: 0,
            completedPercent: 0,
            totalFiles: 0,
            scoreAvg: 0,
            scoreMin: 0
        });
    });

    test('single completed file returns 100% in all categories', () => {
        global.deAudioCache = { '/file.wav': true };
        const result = calculateProjectStats({
            files: [{ enText: 'EN', deText: 'DE', fullPath: '/file.wav' }]
        });
        expect(result).toEqual({
            enPercent: 100,
            dePercent: 100,
            deAudioPercent: 100,
            completedPercent: 100,
            totalFiles: 1,
            scoreAvg: 0,
            scoreMin: 0
        });
    });

    // Testfall: Nur EN-Texte vorhanden
    test('only EN texts present', () => {
        const result = calculateProjectStats({
            files: [
                { enText: 'EN1', deText: '' },
                { enText: 'EN2', deText: '' },
                { enText: 'EN3', deText: '' }
            ]
        });
        expect(result).toEqual({
            enPercent: 100,
            dePercent: 0,
            deAudioPercent: 0,
            completedPercent: 0,
            totalFiles: 3,
            scoreAvg: 0,
            scoreMin: 0
        });
    });

    // Testfall: Nur DE-Texte vorhanden
    test('only DE texts present', () => {
        const result = calculateProjectStats({
            files: [
                { enText: '', deText: 'DE1' },
                { enText: '', deText: 'DE2' }
            ]
        });
        expect(result).toEqual({
            enPercent: 0,
            dePercent: 100,
            deAudioPercent: 0,
            completedPercent: 0,
            totalFiles: 2,
            scoreAvg: 0,
            scoreMin: 0
        });
    });

    // Testfall: Gleichmäßige Verteilung von EN- und DE-Texten
    test('mixed ratio of 50% EN and 50% DE texts', () => {
        const result = calculateProjectStats({
            files: [
                { enText: 'EN1', deText: '' },
                { enText: '', deText: 'DE1' }
            ]
        });
        expect(result).toEqual({
            enPercent: 50,
            dePercent: 50,
            deAudioPercent: 0,
            completedPercent: 0,
            totalFiles: 2,
            scoreAvg: 0,
            scoreMin: 0
        });
    });

    test('de audio percentage calculated correctly', () => {
        global.deAudioCache = { '/game/file1.wav': true };
        const result = calculateProjectStats({
            files: [
                { enText: 'EN', deText: 'DE', fullPath: '/game/file1.wav' },
                { enText: 'EN2', deText: 'DE2', fullPath: '/game/file2.wav' }
            ]
        });
        expect(result).toEqual({
            enPercent: 100,
            dePercent: 100,
            deAudioPercent: 50,
            completedPercent: 50,
            totalFiles: 2,
            scoreAvg: 0,
            scoreMin: 0
        });
    });

    test('de audio lookup behandelt Großbuchstaben in Endungen korrekt', () => {
        global.deAudioCache = { '/game/file1.WAV': true };
        const result = calculateProjectStats({
            files: [
                { enText: 'EN', deText: 'DE', fullPath: '/game/file1.wav' }
            ]
        });
        expect(result.deAudioPercent).toBe(100);
        expect(result.completedPercent).toBe(100);
    });

    test('fehlende Audios triggern mit Helper keinen Vollscan pro Datei', () => {
        const files = [
            { enText: 'EN', deText: 'DE', fullPath: '/game/missing1.wav' },
            { enText: 'EN2', deText: 'DE2', fullPath: '/game/missing2.wav' },
            { enText: 'EN3', deText: 'DE3', fullPath: '/game/missing3.wav' }
        ];
        global.deAudioCache = {};
        const helper = jest.fn(() => null);
        global.findDeAudioCacheKeyInsensitive = helper;
        const originalKeys = Object.keys;
        const keysSpy = jest.spyOn(Object, 'keys').mockImplementation((target) => {
            if (target === global.deAudioCache) {
                throw new Error('Unzulässiger Vollscan des Audio-Caches');
            }
            return originalKeys(target);
        });
        try {
            const result = calculateProjectStats({ files });

            expect(result.deAudioPercent).toBe(0);
            expect(helper).toHaveBeenCalled();
        } finally {
            keysSpy.mockRestore();
        }
    });

    test('average and minimum gpt score are calculated', () => {
        const result = calculateProjectStats({
            files: [
                { score: 20 },
                { score: 40 },
                { score: 60 }
            ]
        });
        expect(result.scoreAvg).toBe(40);
        expect(result.scoreMin).toBe(20);
    });
});
