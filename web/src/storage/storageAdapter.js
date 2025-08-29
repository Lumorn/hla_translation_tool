// Definiert eine allgemeine Schnittstelle für Speicher-Backends
// Die folgenden Funktionen müssen von jedem Backend implementiert werden:
// getItem, setItem, removeItem, clear und keys

import { localStorageBackend } from './localStorageBackend.js';
import { createIndexedDbBackend } from './indexedDbBackend.js';

/**
 * Gibt je nach Typ das passende Speicher-Backend zurück
 * @param {string} type - Bezeichner des gewünschten Backends
 * @param {{userKey?: ArrayBuffer}} [options] - Zusätzliche Optionen wie der Benutzerschlüssel
 * @returns {{getItem: Function, setItem: Function, removeItem: Function, clear: Function, keys: Function}}
 */
export function createStorage(type, options = {}) {
    switch (type) {
        case 'local':
        case 'localStorage':
            return localStorageBackend;
        case 'indexedDB':
            return createIndexedDbBackend(options.userKey);
        default:
            throw new Error(`Unbekannter Speicher-Typ: ${type}`);
    }
}

/**
 * Kopiert alle Einträge aus einem alten Backend in ein neues
 * @param {{getItem: Function, setItem: Function, keys: Function}} oldBackend - Quelle der Daten
 * @param {{setItem: Function}} newBackend - Ziel-Backend für die Daten
 * @returns {Promise<number>} Anzahl der übertragenen Schlüssel
 */
export async function migrateStorage(oldBackend, newBackend) {
    const keys = await oldBackend.keys();
    for (const key of keys) {
        const value = await oldBackend.getItem(key);
        await newBackend.setItem(key, value);
    }
    return keys.length;
}
