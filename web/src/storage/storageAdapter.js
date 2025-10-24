// Definiert eine allgemeine Schnittstelle für Speicher-Backends
// Die folgenden Funktionen müssen von jedem Backend implementiert werden:
// getItem, setItem, removeItem, clear, keys und optional runTransaction

import { localStorageBackend } from './localStorageBackend.js';
import { createIndexedDbBackend } from './indexedDbBackend.js';

// Merker für alle laufenden Schreibvorgänge, damit Tests und Fallbacks warten können
const pendingWrites = new Set();

// Registriert Rückgabewerte als Promises und entfernt sie nach Abschluss wieder aus dem Set
function trackPendingWrite(result) {
    const promise = Promise.resolve(result);
    pendingWrites.add(promise);
    const cleanup = () => pendingWrites.delete(promise);
    promise.then(cleanup, cleanup);
    return result;
}

// Wartet so lange, bis keine registrierten Schreibvorgänge mehr aktiv sind
export async function waitForPendingWrites() {
    while (pendingWrites.size > 0) {
        const laufende = Array.from(pendingWrites);
        await Promise.allSettled(laufende);
    }
}

if (typeof window !== 'undefined') {
    // Für bestehende Skripte als globale Hilfsfunktion verfügbar machen
    window.waitForPendingWrites = waitForPendingWrites;
}

// Hilfsfunktion zum Einwickeln von Schreibmethoden, ohne den Rückgabewert zu verändern
function wrapWriteMethod(target, source, methodName) {
    if (typeof source[methodName] !== 'function') return;
    const original = source[methodName].bind(source);
    target[methodName] = function (...args) {
        const result = original(...args);
        trackPendingWrite(result);
        return result;
    };
}

/**
 * Liefert je nach Typ das passende Speicher-Backend.
 * @param {string} type – gewünschter Backend-Typ
 * @returns {{getItem: Function, setItem: Function, removeItem: Function, clear: Function, keys: Function}}
 */
export function createStorage(type) {
    let backend;
    switch (type) {
        case 'local':
        case 'localStorage':
            backend = localStorageBackend;
            break;
        case 'indexedDB':
            backend = createIndexedDbBackend();
            break;
        default:
            throw new Error(`Unbekannter Speicher-Typ: ${type}`);
    }
    const result = {
        ...backend,
        // Standard-Fähigkeiten festlegen, falls das Backend keine angibt
        capabilities: backend.capabilities || { blobs: 'none', atomicWrite: false }
    };

    wrapWriteMethod(result, backend, 'setItem');
    wrapWriteMethod(result, backend, 'removeItem');
    if (!backend.runTransaction) {
        /**
         * Führt mehrere Schreiboperationen als Einheit aus.
         * Bei Fehlern werden keine Änderungen übernommen.
         * @param {Function} fn - Callback, das einen Transaktions-Kontext erhält
         */
        result.runTransaction = async function (fn) {
            // Operationen zwischenspeichern
            const ops = [];
            const tx = {
                getItem: key => backend.getItem(key),
                setItem: (key, value) => ops.push({ type: 'set', key, value }),
                removeItem: key => ops.push({ type: 'remove', key })
            };
            try {
                await fn(tx);
                for (const op of ops) {
                    if (op.type === 'set') {
                        const write = backend.setItem(op.key, op.value);
                        trackPendingWrite(write);
                        await Promise.resolve(write);
                    } else {
                        const write = backend.removeItem(op.key);
                        trackPendingWrite(write);
                        await Promise.resolve(write);
                    }
                }
            } catch (err) {
                // Bei Fehlern nichts schreiben
                throw err;
            }
        };
        wrapWriteMethod(result, result, 'runTransaction');
    } else if (backend.runTransaction) {
        wrapWriteMethod(result, backend, 'runTransaction');
    }
    return result;
}

/**
 * Kopiert alle Einträge aus einem alten Backend in ein neues und entfernt auf Wunsch die Quelle.
 * @param {{getItem: Function, setItem: Function, keys: Function, clear?: Function}} oldBackend - Quelle der Daten
 * @param {{setItem: Function}} newBackend - Ziel-Backend für die Daten
 * @param {{clearOld?: boolean}} [opts] - Optionale Einstellungen, z. B. ob der alte Speicher geleert wird
 * @returns {Promise<number>} Anzahl der übertragenen Schlüssel
 */
export async function migrateStorage(oldBackend, newBackend, opts = {}) {
    const keys = await oldBackend.keys();
    for (const key of keys) {
        const value = await oldBackend.getItem(key);
        await newBackend.setItem(key, value);
    }
    // Alten Speicher bei Bedarf vollständig leeren
    if (opts.clearOld && typeof oldBackend.clear === 'function') {
        await oldBackend.clear();
    }
    return keys.length;
}
