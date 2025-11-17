// Steuert den Export und Import der Daten und zeigt Statusmeldungen an
window.startMigration = async function() {
    const statusEl = document.getElementById('migration-status');
    const oldCount = (await storage.keys()).length;
    // Vorherige Anzahl anzeigen
    statusEl.textContent = window.i18n ? window.i18n.t('loading.project') : `Alte Daten: ${oldCount} Einträge – Export läuft...`;
    try {
        const result = await window.exportLocalStorageToFile();
        // Erfolgsmeldung mit Vergleich alt/neu und Zielordner
        const template = window.i18n ? window.i18n.t('system.migration.start') : 'Export abgeschlossen';
        statusEl.textContent = `${template}: ${oldCount} → ${result.newCount} Einträge in "${result.dirName}" (${result.fileName}).`;
    } catch (err) {
        // Fehlerhinweis bei Problemen
        statusEl.textContent = window.i18n
            ? `${window.i18n.t('loading.retry')}: ${err.message}`
            : `Fehler beim Export: ${err.message}`;
    }
};

// Lädt die zuvor exportierten LocalStorage-Daten aus dem OPFS
window.loadMigration = async function() {
    const statusEl = document.getElementById('migration-status');
    // Hinweis vor dem Start anzeigen
    statusEl.textContent = window.i18n ? window.i18n.t('system.migration.load') : 'Import läuft...';
    try {
        const result = await window.importLocalStorageFromOpfs();
        // Erfolgsmeldung mit Anzahl der geladenen Einträge
        statusEl.textContent = window.i18n
            ? `${window.i18n.t('system.migration.load')}: ${result.count} Einträge aus "${result.fileName}".`
            : `Import abgeschlossen: ${result.count} Einträge aus "${result.fileName}".`;
    } catch (err) {
        // Fehlerhinweis bei Problemen
        statusEl.textContent = window.i18n
            ? `${window.i18n.t('loading.retry')}: ${err.message}`
            : `Fehler beim Import: ${err.message}`;
    }
};

// Kopiert alle Einträge vom LocalStorage in das neue Backend
window.migrateData = async function() {
    const statusEl = document.getElementById('migration-status');
    statusEl.textContent = window.i18n ? window.i18n.t('system.migration.process') : 'Migration läuft...';
    try {
        const oldBackend = window.createStorage('localStorage');
        const newBackend = window.createStorage('indexedDB');
        // Nach der Übertragung den alten Speicher vollständig leeren
        const count = await window.migrateStorage(oldBackend, newBackend, { clearOld: true });
        statusEl.textContent = window.i18n
            ? `${window.i18n.t('system.migration.process')}: ${count} Einträge übertragen und alter Speicher geleert.`
            : `Migration abgeschlossen: ${count} Einträge übertragen und alter Speicher geleert.`;
    } catch (err) {
        statusEl.textContent = window.i18n
            ? `${window.i18n.t('loading.retry')}: ${err.message}`
            : `Fehler bei Migration: ${err.message}`;
    }
};

