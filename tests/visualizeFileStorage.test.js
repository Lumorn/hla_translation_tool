/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

test('visualizeFileStorage zeigt neuen Speicher an', async () => {
    // Platzhalter für Statusausgabe
    document.body.innerHTML = '<span id="statusText"></span>';

    // Alte und neue Speicher simulieren
    const alterSpeicher = {};
    const neuerSpeicher = { test: 'wert' };

    const altesBackend = {
        getItem: k => alterSpeicher[k],
        setItem: (k, v) => { alterSpeicher[k] = v; },
        removeItem: k => { delete alterSpeicher[k]; },
        clear: () => { for (const k in alterSpeicher) delete alterSpeicher[k]; },
        keys: async () => Object.keys(alterSpeicher)
    };

    const neuesBackend = {
        getItem: k => neuerSpeicher[k],
        setItem: (k, v) => { neuerSpeicher[k] = v; },
        removeItem: k => { delete neuerSpeicher[k]; },
        clear: () => { for (const k in neuerSpeicher) delete neuerSpeicher[k]; },
        keys: async () => Object.keys(neuerSpeicher)
    };

    // Adapter und Statusfunktion bereitstellen
    window.createStorage = typ => typ === 'indexedDB' ? neuesBackend : altesBackend;
    window.updateStatus = jest.fn();

    // Funktion aus dem Hauptskript extrahieren und ausführen
    const hauptskript = fs.readFileSync(path.join(__dirname, '../web/src/main.js'), 'utf8');
    const start = hauptskript.indexOf('async function visualizeFileStorage');
    const end = hauptskript.indexOf('// Globale Bereitstellung', start);
    eval(hauptskript.slice(start, end));
    window.visualizeFileStorage = visualizeFileStorage;

    const res = await window.visualizeFileStorage('test');
    expect(res).toEqual({ local: false, indexedDB: true });
    expect(window.updateStatus).toHaveBeenCalledWith('„test“ liegt im neuen Speichersystem.');
});

