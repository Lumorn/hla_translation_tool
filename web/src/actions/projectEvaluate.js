// Sammele sichtbare Zeilen, rufe den GPT-Service auf und aktualisiere die Tabelle
// GPT-Service importieren – je nach Umgebung
let evaluateScene;
let autoApplySuggestion = false;
let attachScoreHandlers;
let markDirty;
let saveCurrentProject;
if (typeof require !== 'undefined') {
    try {
        ({ evaluateScene } = require('../gptService.js'));
        ({ autoApplySuggestion, markDirty, saveCurrentProject } = require('../main.js'));
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
if (typeof window !== 'undefined' && window.markDirty) {
    markDirty = window.markDirty;
}
if (typeof window !== 'undefined' && window.saveCurrentProject) {
    saveCurrentProject = window.saveCurrentProject;
}

// Überträgt die GPT-Ergebnisse in die Dateiliste
// Nur Einträge mit passender Projekt-ID werden übernommen
function applyEvaluationResults(results, files, currentProject) {
    if (!Array.isArray(results) || !currentProject) return;
    let geaendert = false; // Merkt, ob Daten angepasst wurden
    for (const r of results) {
        if (r.projectId !== currentProject.id) continue;
        // IDs als Strings vergleichen, damit auch Gleitkommawerte gefunden werden
        const f = files.find(fl => String(fl.id) === String(r.id));
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
            geaendert = true;
        }
    }
    // Nur speichern, wenn tatsächlich etwas geändert wurde
    if (geaendert) {
        if (typeof markDirty === 'function') markDirty();
        if (typeof saveCurrentProject === 'function') saveCurrentProject();
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
        id: String(file.id), // ID als String serialisieren
        // Charakter entspricht dem Ordnernamen
        character: file.character || file.folder || '',
        en: file.enText || '',
        de: file.deText || ''
    }));
    const scene = currentProject?.levelName || '';
    let results = [];
    try {
        // projectId wird an den Service übergeben, damit die Ergebnisse zugeordnet werden können
        results = await evaluateScene({ scene, lines, key: apiKey, model: gptModel, projectId: currentProject?.id });
    } catch (e) {
        if (showErrorBanner) {
            showErrorBanner(String(e), () => scoreVisibleLines({ ...opts, autoApplySuggestion }));
        }
        return;
    }
    applyEvaluationResults(results, files, currentProject);
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
