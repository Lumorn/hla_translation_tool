// Sammele sichtbare Zeilen, rufe den GPT-Service auf und aktualisiere die Tabelle
import { evaluateScene } from '../gptService.ts';

export function applyEvaluationResults(results: any[], files: any[]) {
    if (!Array.isArray(results)) return;
    for (const r of results) {
        const f = files.find(fl => fl.id === r.id);
        if (f) {
            f.score = r.score;
            f.comment = r.comment;
            // Vorschlag separat speichern
            f.suggestion = r.suggestion;
        }
    }
}

export async function scoreVisibleLines(opts: {
    displayOrder: any[];
    files: any[];
    currentProject: any;
    apiKey: string;
    renderTable: (files: any[]) => Promise<void>;
    updateStatus: (msg: string) => void;
    showErrorBanner: (msg: string, retry: () => void) => void;
    showToast: (msg: string, type?: string) => void;
}) {
    const { displayOrder, files, currentProject, apiKey, renderTable,
            updateStatus, showErrorBanner, showToast } = opts;
    if (!apiKey) {
        if (showToast) showToast('Kein GPT-Key gespeichert', 'error');
        return;
    }

    const visible = displayOrder.filter(item => {
        const row = document.querySelector(`tr[data-id='${item.file.id}']`);
        return row && (row as HTMLElement).offsetParent !== null;
    });
    const lines = visible.map(({ file }) => ({
        id: file.id,
        character: file.character || '',
        en: file.enText || '',
        de: file.deText || ''
    }));
    const scene = currentProject?.levelName || '';
    let results: any[] = [];
    try {
        results = await evaluateScene({ scene, lines, key: apiKey });
    } catch (e: any) {
        if (showErrorBanner) {
            showErrorBanner(String(e), () => scoreVisibleLines(opts));
        }
        return;
    }
    applyEvaluationResults(results, files);
    await renderTable(displayOrder.map(d => d.file));
    if (updateStatus) updateStatus('GPT-Bewertung abgeschlossen');
}

// Kompatibilität für CommonJS
if (typeof module !== 'undefined') {
    module.exports = { scoreVisibleLines, applyEvaluationResults };
}
