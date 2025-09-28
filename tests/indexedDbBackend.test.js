/** @jest-environment jsdom */
// Testet das IndexedDB-Backend

global.structuredClone = obj => JSON.parse(JSON.stringify(obj));
const { indexedDB, IDBKeyRange } = require('fake-indexeddb');
const { webcrypto } = require('crypto');
const fs = require('fs');
const path = require('path');
const { TextEncoder, TextDecoder } = require('util');

let createIndexedDbBackend;
const projectHelpersCode = fs.readFileSync(path.join(__dirname, '../web/src/projectHelpers.js'), 'utf8');

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
    eval(projectHelpersCode);
});

beforeEach(() => {
    // Datenbank vor jedem Test leeren
    indexedDB.deleteDatabase('hla-db');
});

test('setItem und getItem liefern gespeicherten Wert', async () => {
    const backend = createIndexedDbBackend();
    await backend.setItem('misc:foo', 'bar');
    const wert = await backend.getItem('misc:foo');
    expect(wert).toBe('bar');
});

test('keys listet alle Schlüssel', async () => {
    const backend = createIndexedDbBackend();
    await backend.setItem('projects:p1', 'a');
    await backend.setItem('textDB:t1', 'b');
    const schluessel = await backend.keys();
    expect(schluessel).toEqual(expect.arrayContaining(['projects:p1', 'textDB:t1']));
});

test('keys gibt Fallback-Schlüssel unverändert zurück', async () => {
    const backend = createIndexedDbBackend();
    await backend.setItem('misc:lokal', 'x');
    await backend.setItem('project:42:meta', '{}');
    const schluessel = await backend.keys();
    expect(schluessel).toEqual(expect.arrayContaining(['misc:lokal', 'project:42:meta']));
});

test('removeItem und clear löschen Einträge', async () => {
    const backend = createIndexedDbBackend();
    await backend.setItem('misc:a', '1');
    await backend.removeItem('misc:a');
    expect(await backend.getItem('misc:a')).toBeNull();
    await backend.setItem('misc:b', '2');
    await backend.clear();
    const schluessel = await backend.keys();
    expect(schluessel.length).toBe(0);
});

test('syncProjectListWithStorage nutzt rekonstruierte Projekt-Schlüssel', async () => {
    const backend = createIndexedDbBackend();
    await backend.setItem('project:7:meta', '{}');
    await backend.setItem('project:7:index', '[]');
    window.projects = [];
    await window.syncProjectListWithStorage(backend);
    const listeRoh = await backend.getItem('hla_projects');
    const liste = listeRoh ? JSON.parse(listeRoh) : [];
    expect(liste.some(p => String(p.id) === '7')).toBe(true);
});

