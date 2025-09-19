const API = 'https://api.elevenlabs.io/v1';

// Erstellt ein Dubbing-Projekt bei ElevenLabs
// target_lang und target_languages sind fest auf "de" gesetzt
export async function createDubbing({
    audioFile,
    csvContent,
    voiceId = '',
    apiKey
}, logger = () => {}) {
    const form = new FormData();

    form.append('file', audioFile);
    form.append('csv_file', new Blob([csvContent], { type: 'text/csv' }), 'script.csv');
    const lang = 'de';
    form.append('target_lang', lang);
    form.append('target_languages', JSON.stringify([lang]));
    form.append('mode', 'manual');
    form.append('dubbing_studio', 'true');

    if (voiceId) {
        form.append('voice_id', voiceId);
    } else {
        // Ohne Voice-ID wird Voice Cloning abgeschaltet
        form.append('disable_voice_cloning', 'true');
    }

    logger(`POST ${API}/dubbing`);
    const res = await fetch(`${API}/dubbing`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: form
    });
    const text = await res.text();
    logger(`Antwort (${res.status}): ${text}`);
    if (!res.ok) {
        throw new Error(`Create dubbing failed: ${res.status} ${text}`);
    }
    return JSON.parse(text);
}

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
