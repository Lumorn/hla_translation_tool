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
    // Standardmäßig keine OPFS-Unterstützung
    Object.defineProperty(navigator, 'storage', { value: undefined, configurable: true });
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

test('startMigration exportiert alle Einträge und belässt den Speicher', async () => {
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
    expect(localStorage.length).toBe(2);
    const status = document.getElementById('migration-status').textContent;
    expect(status).toContain('Export abgeschlossen');
    expect(status).toContain('2 → 2');
});

test('startMigration meldet fehlende File-System-API verständlich', async () => {
    // API entfernen, um Fehlerpfad zu testen
    delete window.showDirectoryPicker;
    Object.defineProperty(navigator, 'storage', { value: undefined, configurable: true });

    const fileStorage = fs.readFileSync(path.join(__dirname, '../web/src/fileStorage.js'), 'utf8');
    eval(fileStorage);
    const migrationUI = fs.readFileSync(path.join(__dirname, '../web/src/migrationUI.js'), 'utf8');
    eval(migrationUI);

    await window.startMigration();

    const status = document.getElementById('migration-status').textContent;
    expect(status).toContain('Fehler beim Export');
    expect(status).toContain('Dateisystem-API');
});

test('startMigration nutzt OPFS-Fallback bei verweigertem Dateizugriff', async () => {
    // showDirectoryPicker wirft Fehler, OPFS übernimmt
    window.showDirectoryPicker = async () => ({
        name: 'Export',
        getFileHandle: async () => { throw new Error('not allowed'); }
    });
    Object.defineProperty(navigator, 'storage', {
        value: {
            getDirectory: async () => ({
                name: 'OPFS',
                getFileHandle: async (name, opts) => ({
                    name,
                    createWritable: async () => ({
                        write: async (text) => { gespeicherterText = text; },
                        close: async () => {}
                    })
                })
            })
        },
        configurable: true
    });

    localStorage.setItem('projektA', 'datenA');

    const fileStorage = fs.readFileSync(path.join(__dirname, '../web/src/fileStorage.js'), 'utf8');
    eval(fileStorage);
    const migrationUI = fs.readFileSync(path.join(__dirname, '../web/src/migrationUI.js'), 'utf8');
    eval(migrationUI);

    await window.startMigration();

    const gespeichert = JSON.parse(gespeicherterText);
    expect(gespeichert.projektA).toBe('datenA');
    expect(localStorage.length).toBe(1);
    const status = document.getElementById('migration-status').textContent;
    expect(status).toContain('Export abgeschlossen');
    expect(status).toContain('OPFS');
});

test('loadMigration importiert Daten aus dem OPFS und ersetzt den LocalStorage', async () => {
    localStorage.setItem('alt', 'wert');
    Object.defineProperty(navigator, 'storage', {
        value: {
            getDirectory: async () => ({
                getFileHandle: async () => ({
                    name: 'hla_daten.json',
                    getFile: async () => ({
                        text: async () => JSON.stringify({ neu: 'daten' })
                    })
                })
            })
        },
        configurable: true
    });

    const fileStorage = fs.readFileSync(path.join(__dirname, '../web/src/fileStorage.js'), 'utf8');
    eval(fileStorage);
    const migrationUI = fs.readFileSync(path.join(__dirname, '../web/src/migrationUI.js'), 'utf8');
    eval(migrationUI);

    await window.loadMigration();

    expect(localStorage.getItem('neu')).toBe('daten');
    expect(localStorage.length).toBe(1);
    const status = document.getElementById('migration-status').textContent;
    expect(status).toContain('Import abgeschlossen');
    expect(status).toContain('hla_daten.json');
});
