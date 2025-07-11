const fs = require('fs');

// Basis-URL der API
const API = 'https://api.elevenlabs.io/v1';

// =========================== CREATEDUBBING START ===========================
/**
 * Startet einen Dubbing-Auftrag bei ElevenLabs und gibt die Antwort zurueck.
 * @param {string} apiKey - Eigener API-Schluessel.
 * @param {string} audioPath - Pfad zur englischen Audiodatei.
 * @param {string} [voiceId=''] - Optionale Stimme.
 *
 * `target_lang` und `target_languages` werden immer auf `de` gesetzt.
 * @returns {Promise<object>} Antwort der API als Objekt.
 */
// Erstellt einen Dubbing-Job bei ElevenLabs
async function createDubbing({ audioFile, csvContent, voiceId = '', apiKey }, logger = () => {}) {
    if (!fs.existsSync(audioFile)) {
        throw new Error('Audio-Datei nicht gefunden: ' + audioFile);
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(audioFile));
    form.append('csv_file', new Blob([csvContent], { type: 'text/csv' }), 'script.csv');
    const lang = 'de';
    form.append('target_lang', lang);
    form.append('target_languages', JSON.stringify([lang]));
    form.append('mode', 'manual');
    form.append('dubbing_studio', 'true');

    if (voiceId) {
        form.append('voice_id', voiceId);
    } else {
        form.append('disable_voice_cloning', 'true');
    }

    logger(`POST ${API}/dubbing`);
    const response = await fetch(`${API}/dubbing`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: form
    });
    const text = await response.text();
    logger(`Antwort (${response.status}): ${text}`);

    if (!response.ok) {
        throw new Error(`Create dubbing failed: ${response.status} ${text}`);
    }
    return JSON.parse(text);
}
// =========================== CREATEDUBBING END =============================

// =========================== GETDUBBINGSTATUS START =======================
/**
 * Fragt den aktuellen Status eines Dubbings ab.
 * @param {string} apiKey - Eigener API-Schluessel.
 * @param {string} dubbingId - Die von createDubbing erhaltene ID.
 * @returns {Promise<object>} Status-Objekt der API.
 */
async function getDubbingStatus(apiKey, dubbingId, logger = () => {}) {
    logger(`GET ${API}/dubbing/${dubbingId}`);
    const response = await fetch(`${API}/dubbing/${dubbingId}`, {
        headers: { 'xi-api-key': apiKey }
    });
    const text = await response.text();
    logger(`Antwort (${response.status}): ${text}`);

    if (!response.ok) {
        throw new Error('Status-Abfrage fehlgeschlagen: ' + text);
    }
    return JSON.parse(text);
}
// =========================== WAITFORDUBBING START ==========================
/**
 * Wartet so lange, bis die API den Status "complete" liefert.
 * @param {string} apiKey - Eigener API-Schlüssel.
 * @param {string} dubbingId - ID des Dubbings.
 * @param {string} [lang='de'] - Gewünschte Sprache.
 * @param {number} [timeout=180] - Maximale Wartezeit in Sekunden.
 * @returns {Promise<void>} Auflösung, wenn fertig; Fehler bei Abbruch.
 */
async function waitForDubbing(apiKey, dubbingId, targetLang = 'de', timeout = 180, logger = () => {}) {
    const start = Date.now();
    let info = null; // Letzte Status-Info merken

    while (Date.now() - start < timeout * 1000) {
        logger(`GET ${API}/dubbing/${dubbingId}`);
        const res = await fetch(`${API}/dubbing/${dubbingId}`, { headers: { 'xi-api-key': apiKey } });
        const text = await res.text();
        logger(`Antwort (${res.status}): ${text}`);
        if (!res.ok) throw new Error(text);
        info = JSON.parse(text);
        const ready = info.status === 'dubbed' && (info.target_languages || []).includes(targetLang);
        if (ready) return;
        if (info.status === 'failed') {
            const reason = info.error || 'Server meldet failed';
            throw new Error(reason);
        }
        await new Promise(r => setTimeout(r, 3000));
    }

    if (info && info.status === 'dubbed' && !(info.target_languages || []).includes(targetLang)) {
        console.error('target_lang nicht gesetzt?');
    }
    throw new Error('Dubbing nicht fertig');
}
// =========================== WAITFORDUBBING END ============================
// =========================== GETDUBBINGSTATUS END =========================

// =========================== DOWNLOADDUBBING START ========================
/**
 * Laedt die fertige Dub-Datei herunter und speichert sie lokal.
 * @param {string} apiKey - Eigener API-Schluessel.
 * @param {string} dubbingId - ID des Dubbings.
 * @param {string} [lang='de'] - Sprache der gewuenschten Datei.
 * @param {string} targetPath - Dateipfad fuer die gespeicherte Ausgabe.
 * @param {object} [options] - Optional: Anzahl der Versuche und Delay.
 * @param {number} [options.maxRetries=10] - Maximale Download-Versuche.
 * @param {number} [options.retryDelay=2000] - Wartezeit in Millisekunden.
 * @returns {Promise<string>} Pfad zur gespeicherten Datei.
*/
// Lädt die gerenderte Audiodatei einer Sprache herunter
async function downloadDubbingAudio(apiKey, dubbingId, targetLang = 'de', targetPath, options = {}, logger = () => {}) {
    // Erst warten, bis die Sprache laut API komplett gerendert ist
    await waitForDubbing(apiKey, dubbingId, targetLang, 180, logger);
    // Manche Jobs benötigen einen kurzen Moment, bis die Datei bereit steht
    await new Promise(r => setTimeout(r, 1000));

    let response;
    let errText = '';

    const maxRetries = options.maxRetries ?? 10;
    const delayMs    = options.retryDelay ?? 2000;

    // Bis zu maxRetries Versuche mit Abstand starten
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        logger(`GET ${API}/dubbing/${dubbingId}/audio/${targetLang}`);
        response = await fetch(`${API}/dubbing/${dubbingId}/audio/${targetLang}`, {
            headers: { 'xi-api-key': apiKey }
        });
        logger(`Antwort (${response.status})`);

        if (response.ok) break;
        errText = await response.text();

        if (attempt < maxRetries - 1) {
            await new Promise(r => setTimeout(r, delayMs));
        }
    }

    if (!response.ok) {
        throw new Error('Download fehlgeschlagen: ' + errText);
    }

    const filePath = await downloadFromUrl(response.url, targetPath, response);

    // Nach dem Speichern pruefen, ob die Datei tatsaechlich Inhalt enthaelt
    try {
        const size = fs.statSync(filePath).size;
        if (size === 0) {
            console.error('Die Datei ist leer. Wurde der Render-Schritt ausgefuehrt?');
        }
    } catch (err) {
        console.error('Datei konnte nicht geprueft werden:', err.message);
    }

    return filePath;
}
// =========================== DOWNLOADDUBBING END ==========================

// =========================== ISDUBREADY START ==============================
// Prüft, ob eine Sprache fertig gerendert wurde
async function isDubReady(id, lang = 'de', apiKey, logger = () => {}) {
    logger(`GET ${API}/dubbing/${id}`);
    const res = await fetch(`${API}/dubbing/${id}`, { headers: { 'xi-api-key': apiKey } });
    const text = await res.text();
    logger(`Antwort (${res.status}): ${text}`);
    if (!res.ok) throw new Error(text);
    const meta = JSON.parse(text);
    return meta.status === 'dubbed' && (meta.target_languages || []).includes(lang);
}
// =========================== ISDUBREADY END ===============================

// =========================== GETDEFAULTVOICESETTINGS START ================
/**
 * Holt die Standardwerte für Voice-Einstellungen von ElevenLabs.
 * @param {string} apiKey - Eigener API-Schlüssel.
 * @returns {Promise<object>} Einstellungen der API als Objekt.
 */
async function getDefaultVoiceSettings(apiKey, logger = () => {}) {
    logger(`GET ${API}/voices/settings/default`);
    const response = await fetch(`${API}/voices/settings/default`, {
        headers: { 'xi-api-key': apiKey }
    });
    const text = await response.text();
    logger(`Antwort (${response.status}): ${text}`);

    if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Default-Settings: ' + text);
    }

    return JSON.parse(text);
}
// =========================== GETDEFAULTVOICESETTINGS END ==================

// =========================== RENDERLANGUAGE START ==========================
// Rendert ein Dubbing-Resource ueber die Beta-API
async function renderLanguage(id, lang = 'de', apiKey, logger = () => {}) {
    logger(`POST ${API}/dubbing/resource/${id}/render/${lang}`);
    const res = await fetch(`${API}/dubbing/resource/${id}/render/${lang}`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ render_type: 'wav' })
    });
    const text = await res.text();
    logger(`Antwort (${res.status}): ${text}`);
    if (res.status === 401 || res.status === 403) throw new Error('BETA_LOCKED');
    if (!res.ok) throw new Error(text);
}

// Wartet auf das Rendering und liefert die URL der fertigen Datei
async function pollRender(id, lang = 'de', apiKey, logger = () => {}) {
    while (true) {
        logger(`GET ${API}/dubbing/resource/${id}`);
        const res = await fetch(`${API}/dubbing/resource/${id}`, { headers: { 'xi-api-key': apiKey } });
        const text = await res.text();
        logger(`Antwort (${res.status}): ${text}`);
        if (!res.ok) throw new Error(text);
        const info = JSON.parse(text);
        const r = info.renders?.[lang];
        if (r?.status === 'complete') return r.url;
        await new Promise(r => setTimeout(r, 5000));
    }
}
// =========================== RENDERLANGUAGE END ============================

// =========================== SENDTEXTV2 START =============================
/**
 * Sendet einen Text an das Text-to-Speech-Endpunkt der Version 2.
 * Der Audio-Stream wird verworfen, es wird nur der Status geprüft.
 * @param {string} apiKey  Eigener API-Schlüssel.
 * @param {string} voiceId Gewählte Stimme.
 * @param {string} text    Zu generierender Text.
 */
async function sendTextV2(apiKey, voiceId, text, logger = () => {}) {
    const body = { text, model_id: 'eleven_multilingual_v2' };
    const url = `${API}/text-to-speech/${voiceId}`;
    logger(`POST ${url}`);
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    logger(`Antwort (${res.status})`);
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Text-to-Speech fehlgeschlagen: ${res.status} ${errText}`);
    }
}
// =========================== SENDTEXTV2 END ===============================

// =========================== DOWNLOADFROMURL START =======================
// Hilfsfunktion zum Speichern eines Response-Streams
async function downloadFromUrl(url, targetPath, existingResponse = null) {
    const response = existingResponse || await fetch(url);
    if (!response.ok) {
        throw new Error('Download fehlgeschlagen: ' + await response.text());
    }
    return await new Promise((resolve, reject) => {
        const fileStream = fs.createWriteStream(targetPath);
        const nodeStream = require('stream').Readable.fromWeb(response.body);
        nodeStream.pipe(fileStream);
        nodeStream.on('error', err => reject(err));
        fileStream.on('finish', () => resolve(targetPath));
        fileStream.on('error', err => reject(err));
    });
}
// =========================== DOWNLOADFROMURL END ========================

module.exports = {
    createDubbing,
    getDubbingStatus,
    downloadDubbingAudio,
    getDefaultVoiceSettings,
    waitForDubbing,
    isDubReady,
    renderLanguage,
    pollRender,
    sendTextV2
};
