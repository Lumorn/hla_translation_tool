// Verwaltet das Übertragen von GPT-Ergebnissen in die Tabelle
let autoApplySuggestion = false;
let markDirty;
let saveCurrentProject;
if (typeof require !== 'undefined') {
    try {
        ({ autoApplySuggestion, markDirty, saveCurrentProject } = require('../main.js'));
    } catch {}
}
if (typeof window !== 'undefined' && window.autoApplySuggestion !== undefined) {
    autoApplySuggestion = window.autoApplySuggestion;
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

// Kompatibilität für CommonJS
if (typeof module !== 'undefined') {
    module.exports = { applyEvaluationResults, parseEvaluationResults };
}
if (typeof window !== 'undefined') {
    window.applyEvaluationResults = applyEvaluationResults;
    window.parseEvaluationResults = parseEvaluationResults;
}
