// Steuert die Migration von LocalStorage-Daten in eine Datei und zeigt Statusmeldungen an
window.startMigration = async function() {
    const statusEl = document.getElementById('migration-status');
    const oldCount = localStorage.length;
    // Vorherige Anzahl anzeigen
    statusEl.textContent = `Alte Daten: ${oldCount} Einträge – Export läuft...`;
    try {
        const result = await window.migrateLocalStorageToFile();
        // Erfolgsmeldung mit Vergleich alt/neu und Zielordner
        statusEl.textContent = `Migration abgeschlossen: ${oldCount} → ${result.newCount} Einträge in "${result.dirName}" (${result.fileName}).`;
    } catch (err) {
        // Fehlerhinweis bei Problemen
        statusEl.textContent = `Fehler bei der Migration: ${err.message}`;
    }
};
