const calculateProjectStats = require('../calculateProjectStats');

describe('calculateProjectStats', () => {
    test('empty file list returns 0% stats', () => {
        const result = calculateProjectStats({ files: [] });
        expect(result).toEqual({
            enPercent: 0,
            dePercent: 0,
            completedPercent: 0,
            totalFiles: 0
        });
    });

    test('single completed file returns 100% in all categories', () => {
        const result = calculateProjectStats({
            files: [{ enText: 'EN', deText: 'DE', completed: true }]
        });
        expect(result).toEqual({
            enPercent: 100,
            dePercent: 100,
            completedPercent: 100,
            totalFiles: 1
        });
    });

    // Testfall: Nur EN-Texte vorhanden
    test('only EN texts present', () => {
        const result = calculateProjectStats({
            files: [
                { enText: 'EN1', deText: '', completed: false },
                { enText: 'EN2', deText: '', completed: false },
                { enText: 'EN3', deText: '', completed: false }
            ]
        });
        expect(result).toEqual({
            enPercent: 100,
            dePercent: 0,
            completedPercent: 0,
            totalFiles: 3
        });
    });

    // Testfall: Nur DE-Texte vorhanden
    test('only DE texts present', () => {
        const result = calculateProjectStats({
            files: [
                { enText: '', deText: 'DE1', completed: false },
                { enText: '', deText: 'DE2', completed: false }
            ]
        });
        expect(result).toEqual({
            enPercent: 0,
            dePercent: 100,
            completedPercent: 0,
            totalFiles: 2
        });
    });

    // Testfall: Gleichmäßige Verteilung von EN- und DE-Texten
    test('mixed ratio of 50% EN and 50% DE texts', () => {
        const result = calculateProjectStats({
            files: [
                { enText: 'EN1', deText: '', completed: false },
                { enText: '', deText: 'DE1', completed: false }
            ]
        });
        expect(result).toEqual({
            enPercent: 50,
            dePercent: 50,
            completedPercent: 0,
            totalFiles: 2
        });
    });
});
