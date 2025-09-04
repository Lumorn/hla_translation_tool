// Sucht nach alten LocalStorage-Schlüsseln aus dem früheren Speichersystem
// und entfernt sie bei Bedarf automatisch
export function cleanupLegacyLocalStorage(ls = window.localStorage) {
    const alleKeys = Object.keys(ls);
    const nutztNeuesSchema = alleKeys.some(k => k.startsWith('project:') && k.split(':').length === 3);
    const alteSchluessel = [];
    for (const key of alleKeys) {
        const istDatei = key.startsWith('file-') || key.startsWith('file:');
        // Nur alte Projekt-Schlüssel entfernen, neue mit drittem Abschnitt bleiben erhalten
        const istAltesProjekt =
            (key.startsWith('project-') && !key.startsWith('project-lock:')) ||
            (key.startsWith('project:') && key.split(':').length === 2);
        let istListe = key === 'hla_projects';
        if (istListe && nutztNeuesSchema) istListe = false; // Neue Schemas behalten die Projektliste
        if (istDatei || istAltesProjekt || istListe) {
            alteSchluessel.push(key);
        }
    }
    if (alteSchluessel.length) {
        alteSchluessel.forEach(k => ls.removeItem(k));
        if (typeof showToast === 'function') {
            showToast(`Alte LocalStorage-Daten entfernt (${alteSchluessel.length})`);
        }
    }
    return alteSchluessel.length;
}
