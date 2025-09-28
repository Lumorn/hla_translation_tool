// Gemeinsame Hilfsfunktionen zur Berechnung von Projektstatistiken
const globalScope = typeof globalThis !== 'undefined'
    ? globalThis
    : (typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : {}));

// Prueft, ob ein Textinhalt vorhanden ist
function hasText(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

// Liefert den verfuegbaren Cache fuer DE-Audios
function resolveDeAudioCache(options = {}) {
    if (options.deAudioCache) return options.deAudioCache;
    if (globalScope && globalScope.deAudioCache) return globalScope.deAudioCache;
    return null;
}

// Sucht in einem Cache case-insensitiv nach einem Schlüssel
function findCacheKeyInsensitive(cache, key) {
    if (!cache || !key) return null;
    if (Object.prototype.hasOwnProperty.call(cache, key)) return key;
    const helper = typeof globalScope.findDeAudioCacheKeyInsensitive === 'function'
        ? globalScope.findDeAudioCacheKeyInsensitive
        : null;
    if (helper) {
        const mapped = helper(key);
        if (mapped && Object.prototype.hasOwnProperty.call(cache, mapped)) {
            return mapped;
        }
        return null;
    }
    const lower = key.toLowerCase();
    for (const existing of Object.keys(cache)) {
        if (typeof existing === 'string' && existing.toLowerCase() === lower) {
            return existing;
        }
    }
    return null;
}

// Standardweg, um den Pfad zu einer DE-Audiodatei zu ermitteln
function defaultGetDeFilePath(file, options = {}) {
    if (!file) return null;
    if (file.deAudioPath) return file.deAudioPath;
    if (file.deAudio) return file.deAudio;
    if (file.hasDeAudio) return true;
    const cache = resolveDeAudioCache(options);
    if (cache && file.fullPath) {
        const matchedKey = findCacheKeyInsensitive(cache, file.fullPath);
        if (matchedKey) {
            return matchedKey;
        }
    }
    return null;
}

// Standardpruefung, ob eine Datei vollstaendig bearbeitet ist
function defaultIsFileCompleted(file, options = {}) {
    if (!file) return false;
    const resolver = options.getDeFilePath || ((entry) => defaultGetDeFilePath(entry, options));
    const hasEn = hasText(file.enText);
    const hasDe = hasText(file.deText);
    const hasAudio = !!resolver(file, options);
    return hasEn && hasDe && hasAudio;
}

// Berechnet Statistiken fuer ein Projekt
function calculateProjectStats(project = {}, options = {}) {
    if (project && typeof project === 'object' && project.fixedStats) {
        return project.fixedStats;
    }

    const files = Array.isArray(project && project.files) ? project.files : [];
    const totalFiles = files.length;

    if (totalFiles === 0) {
        return {
            enPercent: 0,
            dePercent: 0,
            deAudioPercent: 0,
            completedPercent: 0,
            totalFiles: 0,
            scoreAvg: 0,
            scoreMin: 0
        };
    }

    const resolver = options.getDeFilePath || ((entry) => defaultGetDeFilePath(entry, options));
    const completionChecker = typeof options.isFileCompleted === 'function'
        ? (file) => options.isFileCompleted(file, options)
        : (file) => defaultIsFileCompleted(file, { ...options, getDeFilePath: resolver });

    const filesWithEN = files.filter(f => hasText(f && f.enText)).length;
    const filesWithDE = files.filter(f => hasText(f && f.deText)).length;
    const filesWithDeAudio = files.filter(f => !!resolver(f, options)).length;
    const filesCompleted = files.filter(completionChecker).length;

    const validScores = files
        .map(f => Number(f && f.score))
        .filter(n => Number.isFinite(n));

    const avgScore = validScores.length
        ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
        : 0;
    const minScore = validScores.length
        ? Math.min(...validScores)
        : 0;

    return {
        enPercent: Math.round((filesWithEN / totalFiles) * 100),
        dePercent: Math.round((filesWithDE / totalFiles) * 100),
        deAudioPercent: Math.round((filesWithDeAudio / totalFiles) * 100),
        completedPercent: Math.round((filesCompleted / totalFiles) * 100),
        totalFiles: totalFiles,
        scoreAvg: avgScore,
        scoreMin: minScore
    };
}

const exported = {
    calculateProjectStats,
    defaultGetDeFilePath,
    defaultIsFileCompleted
};

// Exporte fuer Node.js und Browser bereitstellen
if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
}

if (globalScope && typeof globalScope === 'object') {
    if (!globalScope.hlaProjectStats) {
        globalScope.hlaProjectStats = {};
    }
    Object.assign(globalScope.hlaProjectStats, exported);
}

// Optional globale Direktzugriffe setzen
if (typeof window !== 'undefined') {
    window.calculateProjectStats = exported.calculateProjectStats;
}
