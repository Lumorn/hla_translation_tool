const API = 'https://api.elevenlabs.io/v1';
const WAIT_INTERVAL_MS = 5000;

export async function createDubbing(apiKey, file, targetLang = 'de', voiceSettings = null) {
    const form = new FormData();
    form.append('file', file);
    form.append('target_lang', targetLang);
    form.append('target_languages', JSON.stringify([targetLang]));
    if (voiceSettings && Object.keys(voiceSettings).length > 0) {
        form.append('voice_settings', JSON.stringify(voiceSettings));
    }
    const res = await fetch(`${API}/dubbing`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: form
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
}

export async function waitForDubbing(apiKey, id, lang = 'de', timeout = 180, onProgress = () => {}) {
    const start = Date.now();
    let info = null;
    while (Date.now() - start < timeout * 1000) {
        const res = await fetch(`${API}/dubbing/${id}`, {
            headers: { 'xi-api-key': apiKey }
        });
        if (!res.ok) throw new Error(await res.text());
        const info = await res.json();
        onProgress(info.status);
        if (info.status === 'dubbed') return;
        await new Promise(r => setTimeout(r, WAIT_INTERVAL_MS));
    }
    if (!info?.progress?.langs || !info.progress.langs[lang]) {
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
