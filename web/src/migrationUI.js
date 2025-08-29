// Steuert die Migration von LocalStorage-Daten in eine Datei und zeigt Statusmeldungen an
window.startMigration = async function() {
    const statusEl = document.getElementById('migration-status');
    const count = localStorage.length;
    // Anzahl der vorhandenen Einträge anzeigen
    statusEl.textContent = `Starte Migration mit ${count} Einträgen...`;
    try {
        await window.migrateLocalStorageToFile();
        // Erfolgsmeldung nach Abschluss
        statusEl.textContent = `Migration abgeschlossen: ${count} Einträge exportiert.`;
    } catch (err) {
        // Fehlerhinweis bei Problemen
        statusEl.textContent = `Fehler bei der Migration: ${err.message}`;
    }
};
