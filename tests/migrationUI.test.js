/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

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
    // API entfernt, um Fehlerpfad zu testen
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
