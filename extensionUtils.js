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

/**
 * Synchronisiert Projektdateien mit der Datenbank und uebertraegt Texte.
 * Wird genutzt, wenn Dateiendungen gewechselt haben und Texte erhalten
 * bleiben sollen.
 * @param {Array} projects Liste aller Projekte
 * @param {Object} filePathDatabase Mapping Dateiname -> Pfadinformationen
 * @param {Object} textDatabase Mapping "Ordner/Dateiname" -> Texte
 * @returns {number} Anzahl geaenderter Dateien
 */
function syncProjectData(projects, filePathDatabase, textDatabase) {
    let updated = 0;
    const extList = ['.wav', '.ogg', '.mp3'];

    for (const project of projects) {
        if (!project.files) continue;
        for (const file of project.files) {
            const base = file.filename.replace(/\.(mp3|wav|ogg)$/i, '');
            let targetName = file.filename;
            let bestPath = null;

            if (filePathDatabase[file.filename]) {
                const paths = filePathDatabase[file.filename];
                bestPath = paths.find(p => p.folder === file.folder) || paths[0];
            } else {
                for (const ext of extList) {
                    const cand = base + ext;
                    if (!filePathDatabase[cand]) continue;
                    const paths = filePathDatabase[cand];
                    bestPath = paths.find(p => p.folder === file.folder) || paths[0];
                    if (bestPath) {
                        targetName = cand;
                        break;
                    }
                }
            }

            if (!bestPath) continue;

            const oldKey = `${file.folder}/${file.filename}`;
            const newKey = `${bestPath.folder}/${targetName}`;

            const merged = { en: '', de: '' };
            if (textDatabase[oldKey]) {
                if (textDatabase[oldKey].en) merged.en = textDatabase[oldKey].en;
                if (textDatabase[oldKey].de) merged.de = textDatabase[oldKey].de;
                delete textDatabase[oldKey];
            }
            if (textDatabase[newKey]) {
                merged.en = merged.en || textDatabase[newKey].en;
                merged.de = merged.de || textDatabase[newKey].de;
            }
            if (file.enText && !merged.en) merged.en = file.enText;
            if (file.deText && !merged.de) merged.de = file.deText;
            if (merged.en || merged.de) {
                textDatabase[newKey] = {
                    en: merged.en || '',
                    de: merged.de || ''
                };
            }

            if (file.filename !== targetName || file.folder !== bestPath.folder) {
                file.filename = targetName;
                file.folder = bestPath.folder;
                file.fullPath = bestPath.fullPath;
                updated++;
            }
        }
    }

    return updated;
}

module.exports = { repairFileExtensions, syncProjectData };
