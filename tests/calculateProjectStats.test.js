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
});
