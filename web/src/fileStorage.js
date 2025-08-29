// Verwaltet das Speichern und Laden großer Datenmengen über die File System Access API
// Diese Funktionen ermöglichen es, Projektdaten außerhalb des LocalStorage abzulegen

// Hilfsfunktion: Stellt anhand eines Journals unvollendete Schreibvorgänge fertig
async function journalWiederherstellen(dirHandle) {
    try {
        const journalHandle = await dirHandle.getFileHandle('journal.json', { create: false });
        const file = await journalHandle.getFile();
        const eintrag = JSON.parse(await file.text());
        const tmpHandle = await dirHandle.getFileHandle(eintrag.tmp, { create: false });
        await tmpHandle.move(eintrag.ziel);
        await dirHandle.removeEntry('journal.json');
    } catch (e) {
        // Kein Journal vorhanden oder nichts zu tun
    }
}

// Speichert das übergebene Objekt als JSON-Datei
window.saveProjectToFile = async function(data) {
    // Nutzer nach einem Speicherort fragen
    const handle = await window.showSaveFilePicker({
        types: [{
            description: 'JSON-Datei',
            accept: { 'application/json': ['.json'] }
        }]
    });

    // Prüfen, ob temporäre Dateien angelegt und umbenannt werden können
    const dirHandle = handle.getParent ? await handle.getParent() : null;
    const kannTmp = dirHandle && typeof dirHandle.getFileHandle === 'function' && typeof handle.move === 'function';

    if (kannTmp) {
        // Vorherige unvollständige Vorgänge abschließen
        await journalWiederherstellen(dirHandle);

        // Journal anlegen
        const tmpHandle = await dirHandle.getFileHandle(handle.name + '.tmp', { create: true });
        const journalHandle = await dirHandle.getFileHandle('journal.json', { create: true });
        const jw = await journalHandle.createWritable();
        await jw.write(JSON.stringify({ ziel: handle.name, tmp: tmpHandle.name }));
        await jw.close();

        // Daten zunächst in temporäre Datei schreiben
        const writable = await tmpHandle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();

        // Danach atomar umbenennen
        await tmpHandle.move(handle.name);

        // Journal wieder löschen
        await dirHandle.removeEntry('journal.json');

        return await dirHandle.getFileHandle(handle.name);
    }

    // Fallback: direktes Schreiben ohne Journal
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

    // Dateiinhalt lesen und dabei mögliche Fehler abfangen
    let text;
    try {
        text = await file.text();
    } catch (err) {
        // Nutzer informieren und optional Sicherungsdatei anbieten
        if (confirm('Fehler beim Lesen der Datei. Möchten Sie eine Sicherungsdatei wählen?')) {
            return await window.loadProjectFromFile();
        }
        alert('Ladevorgang abgebrochen: ' + err.message);
        return null;
    }

    // JSON parsen und bei Problemen auf Sicherungsdatei hinweisen
    let project;
    try {
        project = JSON.parse(text);
    } catch (err) {
        if (confirm('Die Datei enthält keine gültigen Projektdaten. Sicherungsdatei laden?')) {
            return await window.loadProjectFromFile();
        }
        alert('Ladevorgang abgebrochen: ' + err.message);
        return null;
    }

    // Pflichtfelder des Manifests prüfen
    try {
        const { validateProjectManifest } = await import('../../utils/projectSchema.js');
        validateProjectManifest(project);
    } catch (err) {
        if (confirm('Die Datei erfüllt nicht das erforderliche Schema. Sicherungsdatei laden?')) {
            return await window.loadProjectFromFile();
        }
        alert('Ladevorgang abgebrochen: ' + err.message);
        return null;
    }

    // IDs gegen vorhandene Daten abgleichen
    try {
        const keys = await storage.keys();
        const validIds = new Set();
        for (const key of keys) {
            const match = key.match(/file[_:-](\d+)/);
            if (match) validIds.add(match[1]);
        }
        project.files = (project.files || []).filter(f => {
            if (validIds.has(String(f.id))) return true;
            console.warn('Entfernte unbekannte Datei-ID: ' + f.id);
            return false;
        });
    } catch (err) {
        console.warn('Fehler beim Prüfen der Datei-IDs:', err);
    }

    return project;
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
