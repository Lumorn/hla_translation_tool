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
    },
    // Entfernt einen Eintrag
    removeItem(key) {
        window.localStorage.removeItem(key);
    },
    // Leert den gesamten Speicher
    clear() {
        window.localStorage.clear();
    },
    // Gibt alle vorhandenen Schlüssel als Array zurück
    keys() {
        return Object.keys(window.localStorage);
    }
};
