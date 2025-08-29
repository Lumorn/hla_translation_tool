/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');
require('fake-indexeddb/auto');
if (!global.structuredClone) {
    global.structuredClone = (val) => JSON.parse(JSON.stringify(val));
}

let gespeicherterText = '';

beforeEach(() => {
    document.body.innerHTML = '<div id="migration-status"></div>';
    // LocalStorage leeren
    localStorage.clear();
    // Sicherstellen, dass der Kontext als sicher gilt
    window.isSecureContext = true;
    // File-System-API stubben: Verzeichnis- und Dateihandles
    window.showDirectoryPicker = async () => ({
        name: 'Export',
        getFileHandle: async (name, opts) => ({
            name,
            createWritable: async () => ({
                write: async (text) => { gespeicherterText = text; },
                close: async () => {}
            })
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
    const status = document.getElementById('migration-status').textContent;
    expect(status).toContain('Migration abgeschlossen');
    expect(status).toContain('Export');
    expect(status).toContain('2 → 2');
});

test('startMigration meldet fehlende File-System-API verständlich', async () => {
    // API entfernen, um Fehlerpfad zu testen
    delete window.showDirectoryPicker;

    const fileStorage = fs.readFileSync(path.join(__dirname, '../web/src/fileStorage.js'), 'utf8');
    eval(fileStorage);
    const migrationUI = fs.readFileSync(path.join(__dirname, '../web/src/migrationUI.js'), 'utf8');
    eval(migrationUI);

    await window.startMigration();

    const status = document.getElementById('migration-status').textContent;
    expect(status).toContain('Fehler bei der Migration');
    expect(status).toContain('Dateisystem-API');
});

test('startMigration nutzt IndexedDB-Fallback bei verweigertem Dateizugriff', async () => {
    // showDirectoryPicker wirft Fehler, IndexedDB übernimmt
    window.showDirectoryPicker = async () => { throw new Error('not allowed'); };

    localStorage.setItem('projektA', 'datenA');

    const fileStorage = fs.readFileSync(path.join(__dirname, '../web/src/fileStorage.js'), 'utf8');
    eval(fileStorage);
    const migrationUI = fs.readFileSync(path.join(__dirname, '../web/src/migrationUI.js'), 'utf8');
    eval(migrationUI);

    await window.startMigration();

    const gespeichert = await window.loadProjectFromIndexedDB();
    expect(gespeichert.projektA).toBe('datenA');
    expect(localStorage.length).toBe(1);
    const status = document.getElementById('migration-status').textContent;
    expect(status).toContain('Migration abgeschlossen');
    expect(status).toContain('IndexedDB');
});
