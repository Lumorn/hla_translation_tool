// Sammele sichtbare Zeilen, rufe den GPT-Service auf und aktualisiere die Tabelle
// GPT-Service importieren – je nach Umgebung
let evaluateScene;
let autoApplySuggestion = false;
if (typeof require !== 'undefined') {
    try {
        ({ evaluateScene } = require('../gptService.js'));
        ({ autoApplySuggestion } = require('../main.js'));
    } catch {}
}
if (typeof window !== 'undefined' && window.evaluateScene) {
    evaluateScene = window.evaluateScene;
}
if (typeof window !== 'undefined' && window.autoApplySuggestion !== undefined) {
    autoApplySuggestion = window.autoApplySuggestion;
}

// Überträgt die GPT-Ergebnisse in die Dateiliste
function applyEvaluationResults(results, files) {
    if (!Array.isArray(results)) return;
    for (const r of results) {
        const id = String(r.id);
        const f = files.find(fl => String(fl.id) === id);
        if (f) {
            // Score in Zahl umwandeln, sonst 0
            const sc = Number(r.score);
            f.score = Number.isFinite(sc) ? sc : 0;
            f.comment = r.comment || '';
            // Vorschlag separat speichern
            f.suggestion = r.suggestion || '';
            if (autoApplySuggestion) {
                f.deText = f.suggestion;
            }
        }
    }
}

// Wandelt den Inhalt des Textfelds in ein Array um
// Erwartet einen JSON-String und liefert das Array oder null
function parseEvaluationResults(text) {
    if (!text) return null;
    try {
        const data = JSON.parse(text);
        return Array.isArray(data) ? data : null;
    } catch {
        return null;
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
        // Charakter entspricht dem Ordnernamen
        character: file.character || file.folder || '',
        en: file.enText || '',
        de: file.deText || ''
    }));
    const scene = currentProject?.levelName || '';
    let results = [];
    try {
        results = await evaluateScene({ scene, lines, key: apiKey, model: gptModel });
    } catch (e) {
        if (showErrorBanner) {
            showErrorBanner(String(e), () => scoreVisibleLines({ ...opts, autoApplySuggestion }));
        }
        return;
    }
    applyEvaluationResults(results, files);
    await renderTable(displayOrder.map(d => d.file));
    if (updateStatus) updateStatus('GPT-Bewertung abgeschlossen');
}

// Kompatibilität für CommonJS
if (typeof module !== 'undefined') {
    module.exports = { scoreVisibleLines, applyEvaluationResults, parseEvaluationResults };
}
if (typeof window !== 'undefined') {
    window.scoreVisibleLines = scoreVisibleLines;
    window.applyEvaluationResults = applyEvaluationResults;
    window.parseEvaluationResults = parseEvaluationResults;
}
