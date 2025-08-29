// Zeigt den Migrationsfortschritt aus dem LocalStorage in eine Datei an
// und nutzt dabei die Funktionen aus fileStorage.js

window.startMigration = async function() {
    // Status-Element im DOM ermitteln
    const statusEl = document.getElementById('migration-status');
    const total = localStorage.length;
    // Anzahl der Einträge vor Beginn anzeigen
    statusEl.textContent = `Übertrage ${total} Einträge...`;
    try {
        await window.migrateLocalStorageToFile();
        // Erfolgsmeldung ausgeben und verbleibende Einträge prüfen
        statusEl.textContent = `Migration abgeschlossen – ${total} Einträge exportiert. LocalStorage enthält jetzt ${localStorage.length} Einträge.`;
    } catch (err) {
        // Fehler anzeigen, falls etwas schief geht
        console.error('Migration fehlgeschlagen', err);
        statusEl.textContent = 'Migration fehlgeschlagen. Details in der Konsole.';
    }
};
