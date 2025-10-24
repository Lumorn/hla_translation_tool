// Wrapper für window.localStorage
// Implementiert die Speicher-Schnittstelle mit den Methoden getItem, setItem, removeItem, clear und keys

export const localStorageBackend = {
    // Liefert den gespeicherten Wert zu einem Schlüssel
    getItem(key) {
        return window.localStorage.getItem(key);
    },
    // Speichert einen Wert unter einem Schlüssel
    setItem(key, value) {
        window.localStorage.setItem(key, value);
        // Explizit undefined zurückgeben, damit Promise.resolve(...) sofort erfüllt wird
        return undefined;
    },
    // Entfernt einen Eintrag
    removeItem(key) {
        window.localStorage.removeItem(key);
        // Explizit undefined zurückgeben, damit Promise.resolve(...) sofort erfüllt wird
        return undefined;
    },
    // Leert den gesamten Speicher
    clear() {
        window.localStorage.clear();
    },
    // Gibt alle vorhandenen Schlüssel als Array zurück
    keys() {
        return Object.keys(window.localStorage);
    },
    // Unterstützte Features dieses Backends
    capabilities: {
        blobs: 'none',          // keine Speicherung großer Binärdaten
        atomicWrite: false      // keine atomaren Mehrfach-Schreibvorgänge
    }
};
