// Hilfsfunktionen zur Dateiendungs-Pruefung

/**
 * Aktualisiert Dateiendungen in allen Projekten basierend auf der Datenbank.
 * Wird z.B. benoetigt, wenn MP3-Dateien in WAV konvertiert wurden.
 * @param {Array} projects Liste aller Projekte
 * @param {Object} filePathDatabase Mapping Dateiname -> Pfadinformationen
 * @param {Object} textDatabase Mapping "Ordner/Dateiname" -> Texte
 * @returns {number} Anzahl geaenderter Dateien
 */
function repairFileExtensions(projects, filePathDatabase, textDatabase) {
    let updated = 0;
    const extList = ['.wav', '.ogg', '.mp3'];

    for (const project of projects) {
        if (!project.files) continue;
        for (const file of project.files) {
            if (filePathDatabase[file.filename]) continue;
            const base = file.filename.replace(/\.(mp3|wav|ogg)$/i, '');
            let foundName = null;
            let bestPath = null;
            for (const ext of extList) {
                const cand = base + ext;
                if (!filePathDatabase[cand]) continue;
                const paths = filePathDatabase[cand];
                bestPath = paths.find(p => p.folder === file.folder) || paths[0];
                if (bestPath) {
                    foundName = cand;
                    break;
                }
            }
            if (foundName && bestPath) {
                const oldKey = `${file.folder}/${file.filename}`;
                const newKey = `${bestPath.folder}/${foundName}`;
                if (textDatabase && textDatabase[oldKey]) {
                    textDatabase[newKey] = textDatabase[oldKey];
                    delete textDatabase[oldKey];
                }
                file.filename = foundName;
                file.folder = bestPath.folder;
                file.fullPath = bestPath.fullPath;
                updated++;
            }
        }
    }
    return updated;
}

// Export abhängig von der Umgebung
if (typeof module !== 'undefined' && module.exports) {
    // Node.js / Electron nutzt CommonJS
    module.exports = { repairFileExtensions };
} else {
    // Im Browser stehen die Funktionen global unter window zur Verfügung
    window.repairFileExtensions = repairFileExtensions;
}
