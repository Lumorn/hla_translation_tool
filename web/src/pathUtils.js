// Hilfsfunktionen für Pfadoperationen

function extractRelevantFolder(folderParts, fullPath) {
    // Gibt den relevanten Ordnerpfad einer Datei zurück.
    // Enthält der Pfad einen "vo"-Ordner, liefern wir alles ab diesem Punkt
    // (inklusive "vo") zurück, um die komplette Struktur zu bewahren.

    if (folderParts.length === 0) return 'root';

    const lowerParts = folderParts.map(p => p.toLowerCase());
    const voIndex    = lowerParts.lastIndexOf('vo');

    if (voIndex !== -1 && voIndex < folderParts.length) {
        // Beispiel: ["sounds","vo","combine","grunt1"] => "vo/combine/grunt1"
        return folderParts.slice(voIndex).join('/');
    }

    // Entferne führendes "sounds" falls vorhanden
    const startIndex = lowerParts[0] === 'sounds' ? 1 : 0;
    return folderParts.slice(startIndex).join('/');
}

// Exporte für Node.js und Browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { extractRelevantFolder };
} else {
    window.extractRelevantFolder = extractRelevantFolder;
}

