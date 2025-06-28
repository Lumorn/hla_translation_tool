const { applyEvaluationResults } = require('../web/src/actions/projectEvaluate.js');
const { scoreCellTemplate } = require('../web/src/scoreColumn.js');

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

describe('GPT-Score-Pipeline', () => {
    test('applyEvaluationResults überträgt Score und Kommentare', () => {
        const files = [{ id: 1 }, { id: 2 }];
        const results = [{ id: 2, score: '80', comment: 'gut', suggestion: 'foo' }];
        applyEvaluationResults(results, files);
        expect(files[1]).toEqual({ id: 2, score: 80, comment: 'gut', suggestion: 'foo' });
    });

    test('scoreCellTemplate erzeugt HTML mit richtiger Klasse', () => {
        const html = scoreCellTemplate({ score: 85, comment: 'ok', suggestion: '' }, escapeHtml);
        expect(html).toContain('score-high');
        expect(html).toContain('>85<');
    });
});
