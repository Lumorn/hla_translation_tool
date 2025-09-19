const API = 'https://api.elevenlabs.io/v1';

// Lädt die gerenderte Audiodatei einer Sprache herunter
export async function downloadDubbingAudio(apiKey, id, targetLang = 'de', logger = () => {}) {
    logger(`GET ${API}/dubbing/${id}/audio/${targetLang}`);
    const res = await fetch(`${API}/dubbing/${id}/audio/${targetLang}`, {
        headers: { 'xi-api-key': apiKey }
    });
    logger(`Antwort (${res.status})`);
    if (!res.ok) throw new Error(await res.text());
    return await res.blob();
}

// export async function renderLanguage(dubbingId, targetLang = 'de', renderType = 'wav', apiKey, logger = () => {}) {
//     // Funktion wurde entfernt, da der Studio-Workflow das manuelle Rendering uebernimmt
//     logger('renderLanguage wird nicht mehr verwendet');
//     return {};
// }
