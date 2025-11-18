// Steuert den Export und Import der Daten und zeigt Statusmeldungen an
const migrationStatusState = {
    key: null,
    replacements: {},
    element: null
};

function resolveStatusElement() {
    if (!migrationStatusState.element) {
        migrationStatusState.element = document.getElementById('migration-status');
    }
    return migrationStatusState.element;
}

// Nutzt i18n.format für Platzhalter und bleibt ohne i18n funktionsfähig
function formatStatus(key, replacements = {}) {
    if (window.i18n && typeof window.i18n.format === 'function') {
        return window.i18n.format(key, replacements);
    }
    return Object.entries(replacements).reduce((acc, [placeholder, value]) => {
        return acc.replaceAll(`{${placeholder}}`, value);
    }, key);
}

function setStatus(key, replacements = {}) {
    const statusEl = resolveStatusElement();
    if (!statusEl) {
        return;
    }
    migrationStatusState.key = key;
    migrationStatusState.replacements = replacements;
    statusEl.textContent = formatStatus(key, replacements);
}

// Registriert eine Aktualisierung beim Sprachwechsel, damit laufende Anzeigen übersetzt werden
function ensureLanguageReactivity() {
    if (!window.i18n || ensureLanguageReactivity.registered) {
        return;
    }
    window.i18n.onLanguageChange(() => {
        if (!migrationStatusState.key) {
            return;
        }
        setStatus(migrationStatusState.key, migrationStatusState.replacements);
    });
    ensureLanguageReactivity.registered = true;
}

window.startMigration = async function() {
    ensureLanguageReactivity();
    setStatus('system.migration.status.preparing');
    const oldCount = (await storage.keys()).length;
    // Vorherige Anzahl anzeigen
    setStatus('system.migration.status.exporting', { oldCount });
    try {
        const result = await window.exportLocalStorageToFile();
        // Erfolgsmeldung mit Vergleich alt/neu und Zielordner
        setStatus('system.migration.status.export.success', {
            oldCount,
            newCount: result.newCount,
            dirName: result.dirName,
            fileName: result.fileName
        });
    } catch (err) {
        // Fehlerhinweis bei Problemen
        setStatus('system.migration.status.export.error', { message: err.message });
    }
};

// Lädt die zuvor exportierten LocalStorage-Daten aus dem OPFS
window.loadMigration = async function() {
    ensureLanguageReactivity();
    // Hinweis vor dem Start anzeigen
    setStatus('system.migration.status.importing');
    try {
        const result = await window.importLocalStorageFromOpfs();
        // Erfolgsmeldung mit Anzahl der geladenen Einträge
        setStatus('system.migration.status.import.success', {
            count: result.count,
            fileName: result.fileName
        });
    } catch (err) {
        // Fehlerhinweis bei Problemen
        setStatus('system.migration.status.import.error', { message: err.message });
    }
};

// Kopiert alle Einträge vom LocalStorage in das neue Backend
window.migrateData = async function() {
    ensureLanguageReactivity();
    setStatus('system.migration.status.migrating');
    try {
        const oldBackend = window.createStorage('localStorage');
        const newBackend = window.createStorage('indexedDB');
        // Nach der Übertragung den alten Speicher vollständig leeren
        const count = await window.migrateStorage(oldBackend, newBackend, { clearOld: true });
        setStatus('system.migration.status.migrate.success', { count });
    } catch (err) {
        setStatus('system.migration.status.migrate.error', { message: err.message });
    }
};

