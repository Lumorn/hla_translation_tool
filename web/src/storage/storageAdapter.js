// Definiert eine allgemeine Schnittstelle für Speicher-Backends
// Die folgenden Funktionen müssen von jedem Backend implementiert werden:
// getItem, setItem, removeItem, clear und keys

import { localStorageBackend } from './localStorageBackend.js';

/**
 * Gibt je nach Typ das passende Speicher-Backend zurück
 * @param {string} type - Bezeichner des gewünschten Backends
 * @returns {{getItem: Function, setItem: Function, removeItem: Function, clear: Function, keys: Function}}
 */
export function createStorage(type) {
    switch (type) {
        case 'local':
        case 'localStorage':
            return localStorageBackend;
        default:
            throw new Error(`Unbekannter Speicher-Typ: ${type}`);
    }
}
