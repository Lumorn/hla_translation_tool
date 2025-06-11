// Ermittelt Statistiken fuer ein Projekt
function calculateProjectStats(project) {
    const files = project.files || [];
    const totalFiles = files.length;

    if (totalFiles === 0) {
        return {
            enPercent: 0,
            dePercent: 0,
            deAudioPercent: 0,
            completedPercent: 0,
            totalFiles: 0
        };
    }

    const filesWithEN = files.filter(f => f.enText && f.enText.trim().length > 0).length;
    const filesWithDE = files.filter(f => f.deText && f.deText.trim().length > 0).length;
    const filesCompleted = files.filter(isFileCompleted).length;
    const filesWithDeAudio = files.filter(f => getDeFilePath(f)).length;

    return {
        enPercent: Math.round((filesWithEN / totalFiles) * 100),
        dePercent: Math.round((filesWithDE / totalFiles) * 100),
        deAudioPercent: Math.round((filesWithDeAudio / totalFiles) * 100),
        completedPercent: Math.round((filesCompleted / totalFiles) * 100),
        totalFiles: totalFiles
    };
}

// Liefert den Pfad einer vorhandenen DE-Audiodatei oder null
function getDeFilePath(file) {
    if (file.deAudioPath) return file.deAudioPath;
    if (file.deAudio) return file.deAudio;
    if (file.hasDeAudio) return true;
    if (global.deAudioCache && file.fullPath && global.deAudioCache[file.fullPath]) {
        return file.fullPath;
    }
    return null;
}

// Prueft, ob eine Datei EN-Text, DE-Text und ein DE-Audio besitzt
function isFileCompleted(file) {
    const hasEn = file.enText && file.enText.trim().length > 0;
    const hasDe = file.deText && file.deText.trim().length > 0;
    const hasAudio = !!getDeFilePath(file);
    return hasEn && hasDe && hasAudio;
}

module.exports = calculateProjectStats;
