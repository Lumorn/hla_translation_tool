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
window.migrateLocalStorageToFile = async function() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        data[key] = localStorage.getItem(key);
    }
    await window.saveProjectToFile(data);
    localStorage.clear();
};
