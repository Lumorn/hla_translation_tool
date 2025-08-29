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
