const API = 'https://api.elevenlabs.io/v1';
const WAIT_INTERVAL_MS = 5000;

// Erstellt ein Dubbing-Projekt bei ElevenLabs
export async function createDubbing({
    audioFile,
    csvContent,
    targetLang = 'de',
    voiceId = '',
    apiKey
}) {
    const form = new FormData();

    form.append('file', audioFile);
    form.append('csv_file', new Blob([csvContent], { type: 'text/csv' }), 'script.csv');
    form.append('target_lang', targetLang);
    form.append('target_languages', JSON.stringify([targetLang]));
    form.append('mode', 'manual');
    form.append('dubbing_studio', 'true');

    if (voiceId) {
        form.append('voice_id', voiceId);
    } else {
        // Ohne Voice-ID wird Voice Cloning abgeschaltet
        form.append('disable_voice_cloning', 'true');
    }

    const res = await fetch(`${API}/dubbing`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: form
    });

    if (!res.ok) {
        throw new Error(`Create dubbing failed: ${res.status} ${await res.text()}`);
    }
    return await res.json();
}

export async function waitForDubbing(apiKey, id, targetLang = 'de', timeout = 180, onProgress = () => {}) {
    const start = Date.now();
    let info = null;
    while (Date.now() - start < timeout * 1000) {
        const res = await fetch(`${API}/dubbing/${id}`, {
            headers: { 'xi-api-key': apiKey }
        });
        if (!res.ok) throw new Error(await res.text());
        info = await res.json();
        onProgress(info.status);
        const finished = info.progress?.langs?.[targetLang]?.state === 'finished';
        if (finished) return;
        await new Promise(r => setTimeout(r, WAIT_INTERVAL_MS));
    }
    if (!info?.progress?.langs || !info.progress.langs[targetLang]) {
        console.error('target_lang nicht gesetzt?');
    }
    throw new Error('Dubbing nicht fertig');
}

export async function downloadDubbingAudio(apiKey, id, lang = 'de') {
    const res = await fetch(`${API}/dubbing/${id}/audio/${lang}`, {
        headers: { 'xi-api-key': apiKey }
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.blob();
}
