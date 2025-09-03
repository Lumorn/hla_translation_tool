/**
 * @jest-environment jsdom
 */

// Testet die Zuordnung von Ganzzahl- und Gleitkomma-IDs in updateGptSummary
const { updateGptSummary, __setFiles } = require('../web/src/main.js');

describe('updateGptSummary', () => {
    beforeEach(() => {
        document.body.innerHTML = '<table id="gptSummaryTable"><tbody></tbody></table>';
        const files = [
            { id: 1, name: 'Datei1', folder: 'Ordner1' },
            { id: 2.5, name: 'Datei2', folder: 'Ordner2' }
        ];
        __setFiles(files);
    });

    test('ordnet Ganzzahl- und Gleitkomma-IDs korrekt zu', () => {
        const results = [
            { id: '1', score: 80, suggestion: '', comment: '' },
            { id: '2.5', score: 90, suggestion: '', comment: '' }
        ];
        updateGptSummary(results);
        const rows = document.querySelectorAll('#gptSummaryTable tbody tr');
        expect(rows).toHaveLength(2);
        expect(rows[0].children[1].textContent).toBe('Datei1');
        expect(rows[1].children[1].textContent).toBe('Datei2');
    });
});
