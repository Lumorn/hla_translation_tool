const API = 'https://api.elevenlabs.io/v1';
const WAIT_INTERVAL_MS = 5000;

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

export async function waitForDubbing(apiKey, id, targetLang = 'de', timeout = 180, onProgress = () => {}, logger = () => {}) {
    const start = Date.now();
    let info = null;

    while (Date.now() - start < timeout * 1000) {
        logger(`GET ${API}/dubbing/${id}`);
        const res  = await fetch(`${API}/dubbing/${id}`, { headers: { 'xi-api-key': apiKey } });
        const text = await res.text();
        logger(`Antwort (${res.status}): ${text}`);
        if (!res.ok) throw new Error(text);
        info = JSON.parse(text);
        onProgress(info.status);

        const ready = info.status === 'dubbed' && (info.target_languages || []).includes(targetLang);
        if (ready) return;
        if (info.status === 'failed') {
            const reason = info.error || 'Server meldet failed';
            throw new Error(reason);
        }

        await new Promise(r => setTimeout(r, WAIT_INTERVAL_MS));
    }

    if (info && info.status === 'dubbed' && !(info.target_languages || []).includes(targetLang)) {
        console.error('target_lang nicht gesetzt?');
    }
    throw new Error('Dubbing nicht fertig');
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

// Prüft, ob ein Dubbing bereits generiert wurde
export async function isDubReady(id, lang = 'de', apiKey = import.meta.env.ELEVEN_API_KEY, logger = () => {}) {
    logger(`GET ${API}/dubbing/${id}`);
    const res = await fetch(`${API}/dubbing/${id}`, { headers: { 'xi-api-key': apiKey } });
    const text = await res.text();
    logger(`Antwort (${res.status}): ${text}`);
    if (!res.ok) throw new Error(text);
    const meta = JSON.parse(text);
    return meta.status === 'dubbed' && (meta.target_languages || []).includes(lang);
}

// export async function renderLanguage(dubbingId, targetLang = 'de', renderType = 'wav', apiKey, logger = () => {}) {
//     // Funktion wurde entfernt, da der Studio-Workflow das manuelle Rendering uebernimmt
//     logger('renderLanguage wird nicht mehr verwendet');
//     return {};
// }
