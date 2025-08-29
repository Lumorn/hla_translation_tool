// Entfernt alle Dateien aus einem Projekt, deren ID nicht in der Liste gültiger IDs enthalten ist
// und protokolliert jede entfernte ID.
function removeUnknownFileIds(project, ids, logFn = console.error) {
    const valid = new Set((ids || []).map(id => String(id)));
    const originalCount = Array.isArray(project.files) ? project.files.length : 0;
    project.files = (project.files || []).filter(f => {
        if (valid.has(String(f.id))) return true;
        logFn(`Unbekannte ID entfernt: ${f.id}`);
        return false;
    });
    return originalCount - (project.files ? project.files.length : 0);
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { removeUnknownFileIds };
} else {
    window.removeUnknownFileIds = removeUnknownFileIds;
}
