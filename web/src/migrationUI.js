// Steuert den Export und Import der Daten und zeigt Statusmeldungen an
window.startMigration = async function() {
    const statusEl = document.getElementById('migration-status');
    const oldCount = (await storage.keys()).length;
    // Vorherige Anzahl anzeigen
    statusEl.textContent = `Alte Daten: ${oldCount} Einträge – Export läuft...`;
    try {
        const result = await window.exportLocalStorageToFile();
        // Erfolgsmeldung mit Vergleich alt/neu und Zielordner
        statusEl.textContent = `Export abgeschlossen: ${oldCount} → ${result.newCount} Einträge in "${result.dirName}" (${result.fileName}).`;
    } catch (err) {
        // Fehlerhinweis bei Problemen
        statusEl.textContent = `Fehler beim Export: ${err.message}`;
    }
};

// Lädt die zuvor exportierten LocalStorage-Daten aus dem OPFS
window.loadMigration = async function() {
    const statusEl = document.getElementById('migration-status');
    // Hinweis vor dem Start anzeigen
    statusEl.textContent = 'Import läuft...';
    try {
        const result = await window.importLocalStorageFromOpfs();
        // Erfolgsmeldung mit Anzahl der geladenen Einträge
        statusEl.textContent = `Import abgeschlossen: ${result.count} Einträge aus "${result.fileName}".`;
    } catch (err) {
        // Fehlerhinweis bei Problemen
        statusEl.textContent = `Fehler beim Import: ${err.message}`;
    }
};

// Kopiert alle Einträge vom LocalStorage in das neue Backend
window.migrateData = async function() {
    const statusEl = document.getElementById('migration-status');
    statusEl.textContent = 'Migration läuft...';
    try {
        const oldBackend = window.createStorage('localStorage');
        const newBackend = window.createStorage('indexedDB');
        // Nach der Übertragung den alten Speicher vollständig leeren
        const count = await window.migrateStorage(oldBackend, newBackend, { clearOld: true });
        statusEl.textContent = `Migration abgeschlossen: ${count} Einträge übertragen und alter Speicher geleert.`;
    } catch (err) {
        statusEl.textContent = `Fehler bei Migration: ${err.message}`;
    }
};

// Optionaler Wechsel mit expliziter Richtung zur Verdeutlichung des Zielsystems
window.switchStorageDirection = async function(von, zu) {
    const statusEl = document.getElementById('migration-status');
    statusEl.textContent = `Wechsle von ${von} zu ${zu} ...`;
    try {
        await window.switchStorage(zu);
        statusEl.textContent = `Wechsel zu ${zu} abgeschlossen.`;
    } catch (err) {
        statusEl.textContent = `Fehler beim Wechsel: ${err.message}`;
    }
};
