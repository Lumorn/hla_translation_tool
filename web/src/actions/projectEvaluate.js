// Sammele sichtbare Zeilen, rufe den GPT-Service auf und aktualisiere die Tabelle
// GPT-Service importieren – je nach Umgebung
let evaluateScene;
let autoApplySuggestion = false;
let attachScoreHandlers;
if (typeof require !== 'undefined') {
    try {
        ({ evaluateScene } = require('../gptService.js'));
        ({ autoApplySuggestion } = require('../main.js'));
        ({ attachScoreHandlers } = require('../scoreColumn.js'));
    } catch {}
}
if (typeof window !== 'undefined' && window.evaluateScene) {
    evaluateScene = window.evaluateScene;
}
if (typeof window !== 'undefined' && window.autoApplySuggestion !== undefined) {
    autoApplySuggestion = window.autoApplySuggestion;
}
if (typeof window !== 'undefined' && window.attachScoreHandlers) {
    attachScoreHandlers = window.attachScoreHandlers;
}

// Überträgt die GPT-Ergebnisse in die Dateiliste
function applyEvaluationResults(results, files) {
    if (!Array.isArray(results)) return;
    for (const r of results) {
        // ID in Zahl umwandeln, bei Präzisionsproblemen auch String vergleichen
        const idNum = Number(r.id);
        let f = files.find(fl => fl.id === idNum);
        if (!f) {
            const idStr = String(r.id);
            f = files.find(fl => String(fl.id) === idStr);
        }
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
    // Tabelle mit den aktualisierten Dateien neu aufbauen
    await renderTable(displayOrder.map(d => d.file));
    if (typeof attachScoreHandlers === 'function' && typeof document !== 'undefined') {
        const tbody = document.getElementById('fileTableBody');
        if (tbody) {
            // Nach dem Aufbau die Score-Klassen erneut binden
            attachScoreHandlers(tbody, files);
        }
    }
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
