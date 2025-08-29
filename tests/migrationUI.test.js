/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

let gespeicherterText = '';

beforeEach(() => {
    document.body.innerHTML = '<div id="migration-status"></div>';
    // LocalStorage leeren
    localStorage.clear();
    // File-System-API stubben
    window.showSaveFilePicker = async () => ({
        createWritable: async () => ({
            write: async (text) => { gespeicherterText = text; },
            close: async () => {}
        })
    });
});

test('startMigration exportiert alle Einträge und leert den Speicher', async () => {
    localStorage.setItem('projektA', 'datenA');
    localStorage.setItem('projektB', 'datenB');

    const fileStorage = fs.readFileSync(path.join(__dirname, '../web/src/fileStorage.js'), 'utf8');
    eval(fileStorage);
    const migrationUI = fs.readFileSync(path.join(__dirname, '../web/src/migrationUI.js'), 'utf8');
    eval(migrationUI);

    await window.startMigration();

    const gespeichert = JSON.parse(gespeicherterText);
    expect(gespeichert.projektA).toBe('datenA');
    expect(gespeichert.projektB).toBe('datenB');
    expect(localStorage.length).toBe(0);
    expect(document.getElementById('migration-status').textContent)
        .toContain('Migration abgeschlossen');
});
