// IndexedDB-Backend für lokale Speicherung
// Jeder Datentyp nutzt einen eigenen Object Store (projects, textDB, pathDB, misc)
// Größere Dateien werden über OPFS oder Blob-URLs ausgelagert, nur Verweise landen in der Datenbank

const DB_NAME = 'hla-db';
const DB_VERSION = 1;
const STORE_NAMES = ['projects', 'textDB', 'pathDB', 'misc'];

// Datenbank öffnen und bei Bedarf Object Stores anlegen
function openDb() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            for (const name of STORE_NAMES) {
                if (!db.objectStoreNames.contains(name)) {
                    db.createObjectStore(name);
                }
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Schlüssel in "storeName:schlüssel" aufteilen, unbekannte Stores landen in "misc"
function parseKey(key) {
    const [store, realKey] = key.split(':');
    if (STORE_NAMES.includes(store)) {
        return { store, key: realKey };
    }
    return { store: 'misc', key };
}

// Hinweis: Früher wurden Einträge verschlüsselt. Die Verschlüsselung wurde entfernt,
// daher bleiben Hilfsfunktionen für Base64 und AES-GCM ungenutzt und entfallen.

// Größere Dateien auslagern
async function storeLargeData(value) {
    // OPFS bevorzugen, falls verfügbar
    if (navigator.storage && navigator.storage.getDirectory) {
        const dir = await navigator.storage.getDirectory();
        const name = `blob_${crypto.randomUUID()}`;
        const fileHandle = await dir.getFileHandle(name, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(value instanceof Blob ? value : new Blob([value]));
        await writable.close();
        return { type: 'opfs', name };
    }
    // Fallback: Blob-URL im Speicher behalten
    const url = URL.createObjectURL(value instanceof Blob ? value : new Blob([value]));
    return { type: 'blob', url };
}

// Ausgelagerte Daten laden
async function loadLargeData(ref) {
    if (ref.type === 'opfs') {
        const dir = await navigator.storage.getDirectory();
        const fileHandle = await dir.getFileHandle(ref.name);
        const file = await fileHandle.getFile();
        return await file.arrayBuffer();
    } else if (ref.type === 'blob') {
        const res = await fetch(ref.url);
        return await res.arrayBuffer();
    }
    return null;
}

// Eintrag speichern
async function setItemInternal(key, value) {
    const { store, key: realKey } = parseKey(key);
    const db = await openDb();
    let data = value;
    // Große Dateien auslagern
    if (value instanceof Blob || value instanceof ArrayBuffer) {
        data = await storeLargeData(value);
    }
    const tx = db.transaction(store, 'readwrite');
    // JSON-String direkt im Store ablegen
    tx.objectStore(store).put(JSON.stringify(data), realKey);
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}

// Eintrag laden
async function getItemInternal(key) {
    const { store, key: realKey } = parseKey(key);
    const db = await openDb();
    const tx = db.transaction(store, 'readonly');
    const request = tx.objectStore(store).get(realKey);
    const result = await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
    if (!result) return null;
    // Gespeicherten String direkt zu Daten umwandeln
    const data = JSON.parse(result);
    if (data && (data.type === 'opfs' || data.type === 'blob')) {
        return await loadLargeData(data);
    }
    return data;
}

// Eintrag entfernen
async function removeItemInternal(key) {
    const { store, key: realKey } = parseKey(key);
    const db = await openDb();
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).delete(realKey);
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
    });
}

// Alle Stores leeren
async function clearInternal() {
    const db = await openDb();
    await Promise.all(STORE_NAMES.map(name => {
        const tx = db.transaction(name, 'readwrite');
        tx.objectStore(name).clear();
        return new Promise((resolve, reject) => {
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
            tx.onabort = () => reject(tx.error);
        });
    }));
}

// Alle Schlüssel über alle Stores hinweg auflisten
async function keysInternal() {
    const db = await openDb();
    const allKeys = [];
    for (const name of STORE_NAMES) {
        const tx = db.transaction(name, 'readonly');
        const store = tx.objectStore(name);
        const request = store.getAllKeys();
        const keys = await new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        for (const k of keys) {
            allKeys.push(`${name}:${k}`);
        }
    }
    return allKeys;
}

// Factory-Funktion zum Erstellen des Backends
export function createIndexedDbBackend() {
    return {
        getItem: key => getItemInternal(key),
        setItem: (key, value) => setItemInternal(key, value),
        removeItem: key => removeItemInternal(key),
        clear: () => clearInternal(),
        keys: () => keysInternal()
    };
}

