// Verwaltet das Speichern und Laden großer Datenmengen über die File System Access API
// Diese Funktionen ermöglichen es, Projektdaten außerhalb des LocalStorage abzulegen

// Speichert das übergebene Objekt als JSON-Datei
window.saveProjectToFile = async function(data) {
    // Nutzer nach einem Speicherort fragen
    const handle = await window.showSaveFilePicker({
        types: [{
            description: 'JSON-Datei',
            accept: { 'application/json': ['.json'] }
        }]
    });
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    return handle;
};

// Öffnet eine zuvor gespeicherte Datei und gibt deren Inhalt als Objekt zurück
window.loadProjectFromFile = async function() {
    const [handle] = await window.showOpenFilePicker({
        types: [{
            description: 'JSON-Datei',
            accept: { 'application/json': ['.json'] }
        }]
    });
    const file = await handle.getFile();
    const text = await file.text();
    return JSON.parse(text);
};

// Überträgt alle Einträge aus dem aktuellen Speicher in eine Datei, belässt die Originaldaten jedoch im Speicher
// Die Daten werden in einem vom Nutzer gewählten Ordner als "hla_daten.json" gespeichert
// und die Funktion liefert Informationen über den Speicherort zurück
window.exportLocalStorageToFile = async function() {
    const data = {};
    const keys = await storage.keys();
    for (const key of keys) {
        data[key] = await storage.getItem(key);
    }
    // Prüfen, ob die File-System-API im aktuellen Kontext verfügbar ist
    if (
        !window.isSecureContext ||
        (typeof window.showDirectoryPicker !== 'function' &&
            !(navigator.storage && navigator.storage.getDirectory))
    ) {
        throw new Error('Dateisystem-API wird in diesem Kontext nicht unterstützt');
    }
    // Ordner wählen und Schreibzugriff anfordern
    let dirHandle, fileHandle, writable;
    try {
        dirHandle = await window.showDirectoryPicker();
        fileHandle = await dirHandle.getFileHandle('hla_daten.json', { create: true });
        writable = await fileHandle.createWritable();
    } catch (err) {
        // Fallback: interner Browser-Speicher (OPFS), wenn verfügbar
        if (navigator.storage && navigator.storage.getDirectory) {
            dirHandle = await navigator.storage.getDirectory();
            fileHandle = await dirHandle.getFileHandle('hla_daten.json', { create: true });
            writable = await fileHandle.createWritable();
        } else {
            // Verständliche Fehlermeldung, falls der Zugriff verweigert oder blockiert wird
            throw new Error('Dateisystem-Zugriff verweigert oder vom Browser blockiert');
        }
    }
    // Daten schreiben und Datei schließen
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    // Name des Verzeichnisses, bei OPFS ggf. leer -> Platzhalter setzen
    const dirName = dirHandle.name || 'OPFS';
    return { newCount: Object.keys(data).length, fileName: fileHandle.name, dirName };
};

// Lädt die exportierte Migrationsdatei aus dem internen Browser-Speicher (OPFS)
// und ersetzt den aktuellen Speicher durch deren Inhalt
window.importLocalStorageFromOpfs = async function() {
    // Sicherstellen, dass OPFS im aktuellen Kontext verfügbar ist
    if (!(navigator.storage && navigator.storage.getDirectory)) {
        throw new Error('OPFS wird in diesem Kontext nicht unterstützt');
    }
    // OPFS-Wurzelverzeichnis öffnen und Datei lesen
    const dirHandle = await navigator.storage.getDirectory();
    const fileHandle = await dirHandle.getFileHandle('hla_daten.json');
    const file = await fileHandle.getFile();
    const text = await file.text();
    const data = JSON.parse(text);
    // Speicher durch geladene Daten ersetzen
    await storage.clear();
    for (const [key, value] of Object.entries(data)) {
        await storage.setItem(key, value);
    }
    const count = (await storage.keys()).length;
    return { count, fileName: fileHandle.name };
};

// Rückwärtskompatibilität: alter Funktionsname bleibt als Alias erhalten
window.migrateLocalStorageToFile = window.exportLocalStorageToFile;
