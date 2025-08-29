/** @jest-environment jsdom */
// Testet das verschlüsselte IndexedDB-Backend

global.structuredClone = obj => JSON.parse(JSON.stringify(obj));
const { indexedDB, IDBKeyRange } = require('fake-indexeddb');
const { webcrypto } = require('crypto');
const fs = require('fs');
const path = require('path');
const { TextEncoder, TextDecoder } = require('util');

let createIndexedDbBackend;

beforeAll(() => {
    // Benötigte APIs im Testumfeld bereitstellen
    global.indexedDB = indexedDB;
    global.IDBKeyRange = IDBKeyRange;
    global.crypto = webcrypto;
    Object.defineProperty(window, 'crypto', { value: webcrypto, configurable: true });
    global.TextEncoder = TextEncoder;
    global.TextDecoder = TextDecoder;
    let code = fs.readFileSync(path.join(__dirname, '../web/src/storage/indexedDbBackend.js'), 'utf8');
    code = code.replace(/export\s+/g, '');
    createIndexedDbBackend = new Function(code + '; return createIndexedDbBackend;')();
});

beforeEach(() => {
    // Datenbank vor jedem Test leeren
    indexedDB.deleteDatabase('hla-db');
});

test('setItem und getItem liefern gespeicherten Wert', async () => {
    const backend = createIndexedDbBackend(new Uint8Array(16).buffer);
    await backend.setItem('misc:foo', 'bar');
    const wert = await backend.getItem('misc:foo');
    expect(wert).toBe('bar');
});

test('keys listet alle Schlüssel', async () => {
    const backend = createIndexedDbBackend(new Uint8Array(16).buffer);
    await backend.setItem('projects:p1', 'a');
    await backend.setItem('textDB:t1', 'b');
    const schluessel = await backend.keys();
    expect(schluessel).toEqual(expect.arrayContaining(['projects:p1', 'textDB:t1']));
});

test('removeItem und clear löschen Einträge', async () => {
    const backend = createIndexedDbBackend(new Uint8Array(16).buffer);
    await backend.setItem('misc:a', '1');
    await backend.removeItem('misc:a');
    expect(await backend.getItem('misc:a')).toBeNull();
    await backend.setItem('misc:b', '2');
    await backend.clear();
    const schluessel = await backend.keys();
    expect(schluessel.length).toBe(0);
});

