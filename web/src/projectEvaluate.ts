export function applyEvaluationResults(results, files) {
    if (!Array.isArray(results)) return;
    for (const r of results) {
        const f = files.find(fl => fl.id === r.id);
        if (f) {
            f.score = r.score;
            f.comment = r.comment;
            // Vorschlag separat speichern, um ihn spaeter einfuellen zu koennen
            f.suggestion = r.suggestion;
        }
    }
}

// Kompatibilitaet fuer CommonJS
if (typeof module !== 'undefined') {
    module.exports = { applyEvaluationResults };
}

