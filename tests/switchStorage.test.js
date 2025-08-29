/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

test('switchStorage lädt gewählten Speicher ohne Migration neu', async () => {
    document.body.innerHTML = '<span id="storageModeIndicator"></span><button id="switchStorageButton"></button>';

    const alterSpeicher = { 'hla_projects': JSON.stringify([{ id: 1, name: 'Alt' }]) };
    const neuerSpeicher = {};

    const altesBackend = {
        getItem: k => alterSpeicher[k],
        setItem: (k, v) => { alterSpeicher[k] = v; },
        removeItem: k => { delete alterSpeicher[k]; },
        clear: () => { for (const k in alterSpeicher) delete alterSpeicher[k]; }
    };

    const neuesBackend = {
        getItem: k => neuerSpeicher[k],
        setItem: (k, v) => { neuerSpeicher[k] = v; },
        removeItem: k => { delete neuerSpeicher[k]; },
        clear: () => { for (const k in neuerSpeicher) delete neuerSpeicher[k]; }
    };

    window.storage = altesBackend;
    window.createStorage = typ => typ === 'indexedDB' ? neuesBackend : altesBackend;
    window.migrateStorage = jest.fn();

    // Platzhalter für Meldungen
    window.showToast = () => {};
    window.updateStatus = () => {};

    // Einfaches Nachladen simulieren
    window.projects = JSON.parse(alterSpeicher['hla_projects']);
    window.files = ['alt'];
    window.textDatabase = { foo: 'bar' };
    window.audioFileCache = { a: 1 };
    window.historyPresenceCache = { h: true };
    window.loadProjects = async () => {
        const saved = await window.storage.getItem('hla_projects');
        window.projects = saved ? JSON.parse(saved) : [];
    };

    localStorage.setItem('hla_storageMode', 'localStorage');

    const hauptskript = fs.readFileSync(path.join(__dirname, '../web/src/main.js'), 'utf8');
    const updateStart = hauptskript.indexOf('function updateStorageIndicator');
    const updateEnd = hauptskript.indexOf('// Wechselt das Speichersystem', updateStart);
    const switchStart = hauptskript.indexOf('async function switchStorage');
    const switchEnd = hauptskript.indexOf('// Globale Bereitstellung', switchStart);
    const updateCode = hauptskript.slice(updateStart, updateEnd);
    const switchCode = hauptskript.slice(switchStart, switchEnd);
    eval(`${updateCode}\n${switchCode}`);
    window.updateStorageIndicator = updateStorageIndicator;
    window.switchStorage = switchStorage;

    updateStorageIndicator('localStorage');
    await switchStorage('indexedDB');

    expect(window.migrateStorage).not.toHaveBeenCalled();
    expect(localStorage.getItem('hla_storageMode')).toBe('indexedDB');
    expect(document.getElementById('storageModeIndicator').textContent).toContain('Datei-Modus');
    expect(window.projects).toEqual([]);
    expect(window.files).toEqual([]);
    expect(window.textDatabase).toEqual({});
    expect(window.audioFileCache).toEqual({});
    expect(window.historyPresenceCache).toEqual({});

    // Neues Projekt im neuen Speicher anlegen und zurückwechseln
    neuerSpeicher['hla_projects'] = JSON.stringify([{ id: 2, name: 'Neu' }]);
    window.projects = [{ id: 2, name: 'Neu' }];

    await switchStorage('localStorage');

    expect(localStorage.getItem('hla_storageMode')).toBe('localStorage');
    expect(document.getElementById('storageModeIndicator').textContent).toContain('LocalStorage');
    expect(window.projects).toEqual([{ id: 1, name: 'Alt' }]);
    expect(alterSpeicher['hla_projects']).toBe(JSON.stringify([{ id: 1, name: 'Alt' }]));
});

test('updateStatus ergänzt aktiven Speichermodus', () => {
    document.body.innerHTML = '<span id="statusText"></span>';
    window.isDirty = false;
    localStorage.setItem('hla_storageMode', 'indexedDB');
    const hauptskript = fs.readFileSync(path.join(__dirname, '../web/src/main.js'), 'utf8');
    const statusStart = hauptskript.indexOf('function updateStatus');
    const statusEnd = hauptskript.indexOf('// Zeigt kurz eingeblendete Hinweise', statusStart);
    const statusCode = hauptskript.slice(statusStart, statusEnd);
    eval(statusCode);
    updateStatus('Datei gespeichert');
    expect(document.getElementById('statusText').textContent).toBe('Datei gespeichert (im Datei-Modus (OPFS))');
});
