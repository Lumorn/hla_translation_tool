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

// Wandelt ArrayBuffer sicher in Base64 um (auch für große Dateien geeignet)
function arrayBufferToBase64(buffer) {
    const view = new Uint8Array(buffer);
    const chunkSize = 0x8000; // 32 kB pro Teilstück, damit der Stack klein bleibt
    let binary = '';
    for (let i = 0; i < view.length; i += chunkSize) {
        const chunk = view.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk);
    }
    return btoa(binary);
}

// Wandelt Base64 wieder in einen ArrayBuffer zurück
function base64ToArrayBuffer(str) {
    const binary = atob(str);
    const length = binary.length;
    const buffer = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
        buffer[i] = binary.charCodeAt(i);
    }
    return buffer.buffer;
}

// Größere Dateien auslagern
async function storeLargeData(value) {
    const blob = value instanceof Blob ? value : new Blob([value]);
    // OPFS bevorzugen, sofern verfügbar und freigegeben
    if (navigator.storage && navigator.storage.getDirectory) {
        try {
            const dir = await navigator.storage.getDirectory();
            const name = `blob_${crypto.randomUUID()}`;
            const fileHandle = await dir.getFileHandle(name, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            return { type: 'opfs', name, mime: blob.type || '' };
        } catch (err) {
            // Einige Browser blockieren OPFS in file://-Kontexten (CSP „worker-src“)
            console.warn('OPFS nicht verfügbar, verwende Base64-Fallback', err);
        }
    }
    // Fallback: Daten komprimiert als Base64 im IndexedDB-Eintrag speichern
    const arrayBuffer = value instanceof ArrayBuffer ? value : await blob.arrayBuffer();
    return { type: 'base64', data: arrayBufferToBase64(arrayBuffer), mime: blob.type || '' };
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
    } else if (ref.type === 'base64') {
        return base64ToArrayBuffer(ref.data);
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
    if (data && (data.type === 'opfs' || data.type === 'blob' || data.type === 'base64')) {
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
            if (name === 'misc' && typeof k === 'string' && k.includes(':')) {
                // Schlüssel aus dem Fallback-Store bereits mit Präfix zurückgeben
                allKeys.push(k);
            } else {
                // Reguläre Einträge weiterhin mit Store-Präfix versehen
                allKeys.push(`${name}:${k}`);
            }
        }
    }
    return allKeys;
}

// Factory-Funktion zum Erstellen des Backends
export function createIndexedDbBackend() {
    const hasOpfs = typeof navigator !== 'undefined' && navigator.storage && navigator.storage.getDirectory;
    const capabilities = {
        blobs: hasOpfs ? 'opfs' : 'base64', // bevorzugt OPFS, sonst Base64 im Store
        atomicWrite: true                  // IndexedDB-Transaktionen sind atomar
    };
    return {
        getItem: key => getItemInternal(key),
        setItem: (key, value) => setItemInternal(key, value),
        removeItem: key => removeItemInternal(key),
        clear: () => clearInternal(),
        keys: () => keysInternal(),
        capabilities
    };
}

