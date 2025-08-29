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

// Überträgt alle Einträge aus dem LocalStorage in eine Datei und leert den Speicher
// Die Daten werden in einem vom Nutzer gewählten Ordner als "hla_daten.json" gespeichert
// und die Funktion liefert Informationen über den Speicherort zurück
window.migrateLocalStorageToFile = async function() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
    }
    // Prüfen, ob die File-System-API im aktuellen Kontext verfügbar ist
    if (!window.isSecureContext || typeof window.showDirectoryPicker !== 'function') {
        throw new Error('Dateisystem-API wird in diesem Kontext nicht unterstützt');
    }
    // Ordner wählen und Schreibzugriff anfordern
    let dirHandle, fileHandle, writable;
    try {
        dirHandle = await window.showDirectoryPicker();
        fileHandle = await dirHandle.getFileHandle('hla_daten.json', { create: true });
        writable = await fileHandle.createWritable();
        // Daten schreiben und Datei schließen
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
        // LocalStorage aufräumen
        localStorage.clear();
        // Name des Verzeichnisses ermitteln
        const dirName = dirHandle.name || '';
        return { newCount: Object.keys(data).length, fileName: fileHandle.name, dirName };
    } catch (err) {
        // Fallback: Daten dauerhaft in IndexedDB sichern
        if (window.indexedDB) {
            await saveToIndexedDB('hla_daten', data);
            // LocalStorage nicht leeren, damit die Daten erhalten bleiben
            return { newCount: localStorage.length, fileName: 'hla_daten', dirName: 'IndexedDB' };
        }
        // Verständliche Fehlermeldung, falls der Zugriff verweigert oder blockiert wird
        throw new Error('Dateisystem-Zugriff verweigert oder vom Browser blockiert');
    }
};

// Speichert Daten unter dem angegebenen Schlüssel dauerhaft in IndexedDB
async function saveToIndexedDB(key, value) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('hlaMigration', 1);
        request.onupgradeneeded = () => {
            request.result.createObjectStore('daten');
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('daten', 'readwrite');
            tx.objectStore('daten').put(value, key).onsuccess = () => resolve();
            tx.onerror = () => reject(tx.error);
        };
    });
}

// Lädt zuvor gesicherte Daten aus IndexedDB
window.loadProjectFromIndexedDB = async function(key = 'hla_daten') {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('hlaMigration', 1);
        request.onupgradeneeded = () => {
            request.result.createObjectStore('daten');
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const tx = db.transaction('daten', 'readonly');
            const getReq = tx.objectStore('daten').get(key);
            getReq.onsuccess = () => resolve(getReq.result);
            getReq.onerror = () => reject(getReq.error);
        };
    });
};
