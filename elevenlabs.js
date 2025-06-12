const fs = require('fs');

// =========================== CREATEDUBBING START ===========================
/**
 * Startet einen Dubbing-Auftrag bei ElevenLabs und gibt die Antwort zurueck.
 * @param {string} apiKey - Eigener API-Schluessel.
 * @param {string} audioPath - Pfad zur englischen Audiodatei.
 * @param {string} [targetLang='de'] - Ziel-Sprache fuer das Dubbing.
 * @param {object} [voiceSettings=null] - Optionale Voice-Settings.
 * @returns {Promise<object>} Antwort der API als Objekt.
 */
async function createDubbing(apiKey, audioPath, targetLang = 'de', voiceSettings = null) {
    if (!fs.existsSync(audioPath)) {
        throw new Error('Audio-Datei nicht gefunden: ' + audioPath);
    }

    const form = new FormData();
    form.append('file', fs.createReadStream(audioPath));
    form.append('target_lang', targetLang);
    // Optional: Voice-Settings als JSON anhängen
    if (voiceSettings && Object.keys(voiceSettings).length > 0) {
        form.append('voice_settings', JSON.stringify(voiceSettings));
    }

    const response = await fetch('https://api.elevenlabs.io/v1/dubbing', {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: form
    });

    if (!response.ok) {
        throw new Error('Fehler beim Dubbing: ' + await response.text());
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
    const response = await fetch(`https://api.elevenlabs.io/v1/dubbing/${dubbingId}`, {
        headers: { 'xi-api-key': apiKey }
    });

    if (!response.ok) {
        throw new Error('Status-Abfrage fehlgeschlagen: ' + await response.text());
    }
    return await response.json();
}
// =========================== GETDUBBINGSTATUS END =========================

// =========================== DOWNLOADDUBBING START ========================
/**
 * Laedt die fertige Dub-Datei herunter und speichert sie lokal.
 * @param {string} apiKey - Eigener API-Schluessel.
 * @param {string} dubbingId - ID des Dubbings.
 * @param {string} [lang='de'] - Sprache der gewuenschten Datei.
 * @param {string} targetPath - Dateipfad fuer die gespeicherte Ausgabe.
 * @returns {Promise<string>} Pfad zur gespeicherten Datei.
 */
async function downloadDubbingAudio(apiKey, dubbingId, lang = 'de', targetPath) {
    const response = await fetch(`https://api.elevenlabs.io/v1/dubbing/${dubbingId}/audio/${lang}`, {
        headers: { 'xi-api-key': apiKey }
    });

    if (!response.ok) {
        throw new Error('Download fehlgeschlagen: ' + await response.text());
    }

    return await new Promise((resolve, reject) => {
        // Antwort-Stream direkt in die Zieldatei schreiben
        const fileStream = fs.createWriteStream(targetPath);
        const nodeStream = require('stream').Readable.fromWeb(response.body);
        nodeStream.pipe(fileStream);
        nodeStream.on('error', err => reject(err));
        fileStream.on('finish', () => resolve(targetPath));
        fileStream.on('error', err => reject(err));
    });
}
// =========================== DOWNLOADDUBBING END ==========================

// =========================== GETDEFAULTVOICESETTINGS START ================
/**
 * Holt die Standardwerte für Voice-Einstellungen von ElevenLabs.
 * @param {string} apiKey - Eigener API-Schlüssel.
 * @returns {Promise<object>} Einstellungen der API als Objekt.
 */
async function getDefaultVoiceSettings(apiKey) {
    const response = await fetch('https://api.elevenlabs.io/v1/voices/settings/default', {
        headers: { 'xi-api-key': apiKey }
    });

    if (!response.ok) {
        throw new Error('Fehler beim Abrufen der Default-Settings: ' + await response.text());
    }

    return await response.json();
}
// =========================== GETDEFAULTVOICESETTINGS END ==================

module.exports = {
    createDubbing,
    getDubbingStatus,
    downloadDubbingAudio,
    getDefaultVoiceSettings
};
