/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

test('switchStorage migriert Daten in beide Richtungen und aktualisiert Anzeige', async () => {
    document.body.innerHTML = '<span id="storageModeIndicator"></span><button id="switchStorageButton"></button><span id="statusText"></span>';

    const altDaten = { eintrag: 'wert' };
    const neuerSpeicher = {};

    const altesBackend = {
        getItem: k => altDaten[k],
        setItem: (k, v) => { altDaten[k] = v; },
        removeItem: k => { delete altDaten[k]; },
        clear: () => { for (const k in altDaten) delete altDaten[k]; },
        keys: () => Object.keys(altDaten)
    };

    window.storage = altesBackend;
    window.createStorage = typ => {
        if (typ === 'indexedDB') {
            return {
                getItem: k => neuerSpeicher[k],
                setItem: (k, v) => { neuerSpeicher[k] = v; },
                removeItem: k => { delete neuerSpeicher[k]; },
                clear: () => { for (const k in neuerSpeicher) delete neuerSpeicher[k]; },
                keys: () => Object.keys(neuerSpeicher)
            };
        }
        return altesBackend;
    };
    window.migrateStorage = async (alt, neu) => {
        const schluessel = await alt.keys();
        for (const k of schluessel) {
            const val = await alt.getItem(k);
            await neu.setItem(k, val);
        }
        return schluessel.length;
    };

    // Platzhalter für Meldungen
    window.showToast = () => {};
    window.updateStatus = () => {};

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

    expect(neuerSpeicher.eintrag).toBe('wert');
    expect(localStorage.getItem('hla_storageMode')).toBe('indexedDB');
    expect(document.getElementById('storageModeIndicator').textContent).toContain('Neues System');
    expect(document.getElementById('switchStorageButton').textContent).toContain('LocalStorage');

    // Daten im neuen System ändern und zurückwechseln
    neuerSpeicher.eintrag = 'neu';
    await switchStorage('localStorage');

    expect(altDaten.eintrag).toBe('neu');
    expect(localStorage.getItem('hla_storageMode')).toBe('localStorage');
    expect(document.getElementById('storageModeIndicator').textContent).toContain('LocalStorage');
    expect(document.getElementById('switchStorageButton').textContent).toContain('neuem System');
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
    expect(document.getElementById('statusText').textContent).toBe('Datei gespeichert (im Neues System)');
});
