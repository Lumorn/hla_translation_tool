// Sucht nach alten LocalStorage-Schlüsseln aus dem früheren Speichersystem
// und entfernt sie bei Bedarf automatisch
export function cleanupLegacyLocalStorage(ls = window.localStorage) {
    const alteSchluessel = [];
    for (const key of Object.keys(ls)) {
        const istDatei = key.startsWith('file-') || key.startsWith('file:');
        // Nur alte Projekt-Schlüssel entfernen, neue mit drittem Abschnitt bleiben erhalten
        const istAltesProjekt =
            (key.startsWith('project-') && !key.startsWith('project-lock:')) ||
            (key.startsWith('project:') && key.split(':').length === 2);
        const istListe = key === 'hla_projects';
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
