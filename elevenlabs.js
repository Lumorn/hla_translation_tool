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
async function createDubbing({ audioFile, csvContent, voiceId = '', apiKey }) {
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

    const response = await fetch(`${API}/dubbing`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: form
    });

    if (!response.ok) {
        throw new Error(`Create dubbing failed: ${response.status} ${await response.text()}`);
    }
    return await response.json();
}
// =========================== CREATEDUBBING END =============================

// =========================== GETDUBBINGSTATUS START =======================
/**
 * Fragt den aktuellen Status eines Dubbings ab.
 * @param {string} apiKey - Eigener API-Schluessel.
 * @param {string} dubbingId - Die von createDubbing erhaltene ID.
 * @returns {Promise<object>} Status-Objekt der API.
 */
async function getDubbingStatus(apiKey, dubbingId) {
    const response = await fetch(`${API}/dubbing/${dubbingId}`, {
        headers: { 'xi-api-key': apiKey }
    });

    if (!response.ok) {
        throw new Error('Status-Abfrage fehlgeschlagen: ' + await response.text());
    }
    return await response.json();
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
async function waitForDubbing(apiKey, dubbingId, targetLang = 'de', timeout = 180) {
    const start = Date.now();
    let info = null; // Letzte Status-Info merken
    while (Date.now() - start < timeout * 1000) {
        info = await getDubbingStatus(apiKey, dubbingId);
        const status = info.status;
        if (status === 'failed') {
            const reason = info.detail?.message || info.error || 'Server meldet failed';
            throw new Error('Dubbing fehlgeschlagen: ' + reason);
        }
        const finished = info.progress?.langs?.[targetLang]?.state === 'finished';
        if (finished) return;
        await new Promise(r => setTimeout(r, 3000));
    }
    // Falls kein Eintrag für die Sprache existiert, Hinweis ausgeben
    if (!info?.progress?.langs || !info.progress.langs[targetLang]) {
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
async function downloadDubbingAudio(apiKey, dubbingId, targetLang = 'de', targetPath, options = {}) {
    // Erst warten, bis die Sprache laut API komplett gerendert ist
    await waitForDubbing(apiKey, dubbingId, targetLang);
    // Manche Jobs benötigen einen kurzen Moment, bis die Datei bereit steht
    await new Promise(r => setTimeout(r, 1000));

    let response;
    let errText = '';

    const maxRetries = options.maxRetries ?? 10;
    const delayMs    = options.retryDelay ?? 2000;

    // Bis zu maxRetries Versuche mit Abstand starten
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        response = await fetch(`${API}/dubbing/${dubbingId}/audio/${targetLang}`, {
            headers: { 'xi-api-key': apiKey }
        });

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

// =========================== GETDEFAULTVOICESETTINGS START ================
/**
 * Holt die Standardwerte für Voice-Einstellungen von ElevenLabs.
 * @param {string} apiKey - Eigener API-Schlüssel.
 * @returns {Promise<object>} Einstellungen der API als Objekt.
 */
async function getDefaultVoiceSettings(apiKey) {
    const response = await fetch(`${API}/voices/settings/default`, {
        headers: { 'xi-api-key': apiKey }
    });

    if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Default-Settings: ' + await response.text());
    }

    return await response.json();
}
// =========================== GETDEFAULTVOICESETTINGS END ==================

// =========================== RENDERLANGUAGE START ==========================
// Rendert eine Sprache eines bestehenden Dubbings neu
async function renderLanguage(dubbingId, targetLang = 'de', renderType = 'wav', apiKey) {
    const res = await fetch(`${API}/dubbing/${dubbingId}/render/${targetLang}`, {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ render_type: renderType })
    });

    if (!res.ok) {
        throw new Error(`Render language failed: ${res.status} ${await res.text()}`);
    }

    return await res.json();
}
// =========================== RENDERLANGUAGE END ============================

// =========================== DUBSEGMENTS START ============================
// Vertont alle Segmente eines Projekts im Studio-Workflow
async function dubSegments(apiKey, resourceId, languages = ['de']) {
    // Zuerst die vorhandenen Segment-IDs abfragen
    const infoRes = await fetch(`${API}/dubbing/resource/${resourceId}`, {
        headers: { 'xi-api-key': apiKey }
    });
    if (!infoRes.ok) {
        throw new Error('Segmente konnten nicht geladen werden: ' + await infoRes.text());
    }
    const info = await infoRes.json();
    const segIds = Object.keys(info.speaker_segments || {});

    // Anschließend alle Segmente in den gewählten Sprachen vertonen
    const res = await fetch(`${API}/dubbing/resource/${resourceId}/dub`, {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ segments: segIds, languages })
    });
    if (!res.ok) {
        throw new Error('Dub-Auftrag fehlgeschlagen: ' + await res.text());
    }
    return await res.json();
}
// =========================== DUBSEGMENTS END ==============================

// =========================== RENDERRESOURCE START ========================
// Rendert die komplette Audiodatei fuer eine Sprache
async function renderDubbingResource(apiKey, resourceId, lang = 'de', type = 'mp3') {
    const res = await fetch(`${API}/dubbing/resource/${resourceId}/render/${lang}`, {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ render_type: type })
    });
    if (!res.ok) {
        throw new Error('Rendern fehlgeschlagen: ' + await res.text());
    }
    return await res.json();
}
// =========================== RENDERRESOURCE END ==========================

// =========================== GETRESOURCE START ===========================
// Liefert den aktuellen Status eines Dubbing-Resources
async function getDubbingResource(apiKey, resourceId) {
    const res = await fetch(`${API}/dubbing/resource/${resourceId}`, {
        headers: { 'xi-api-key': apiKey }
    });
    if (!res.ok) {
        throw new Error('Abfrage fehlgeschlagen: ' + await res.text());
    }
    return await res.json();
}
// =========================== GETRESOURCE END =============================

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
    renderLanguage
};
