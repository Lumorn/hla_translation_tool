// Sammele sichtbare Zeilen, rufe den GPT-Service auf und aktualisiere die Tabelle
// GPT-Service importieren
let evaluateScene;
if (typeof module !== 'undefined' && module.exports) {
    ({ evaluateScene } = require('../gptService.js'));
} else if (typeof window !== 'undefined') {
    evaluateScene = window.evaluateScene;
}

// Überträgt die GPT-Ergebnisse in die Dateiliste
function applyEvaluationResults(results, files) {
    if (!Array.isArray(results)) return;
    for (const r of results) {
        const f = files.find(fl => fl.id === r.id);
        if (f) {
            const parsedScore = Number(r.score);
            f.score = Number.isFinite(parsedScore) ? parsedScore : null;
            f.comment = r.comment;
            // Vorschlag separat speichern
            f.suggestion = r.suggestion;
        }
    }
}

async function scoreVisibleLines(opts) {
    const { displayOrder, files, currentProject, apiKey, gptModel, renderTable,
            updateStatus, showErrorBanner, showToast } = opts;
    if (!apiKey) {
        if (showToast) showToast('Kein GPT-Key gespeichert', 'error');
        return;
    }

    const visible = displayOrder.filter(item => {
        const row = document.querySelector(`tr[data-id='${item.file.id}']`);
        return row && row.offsetParent !== null;
    });
    const lines = visible.map(({ file }) => ({
        id: file.id,
        character: file.character || '',
        en: file.enText || '',
        de: file.deText || ''
    }));
    const scene = currentProject?.levelName || '';
    let results = [];
    try {
        results = await evaluateScene({ scene, lines, key: apiKey, model: gptModel });
    } catch (e) {
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
