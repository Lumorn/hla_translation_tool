#!/usr/bin/env node
// cliRedownload.js
// Einfache Kommandozeilenhilfe zum erneuten Herunterladen eines Dubbings

const { downloadDubbingAudio } = require('./elevenlabs');

// Parameter auslesen: node cliRedownload.js API-KEY DUBBING-ID AUSGABEDATEI
const [,, apiKey, dubbingId, outFile] = process.argv;

if (!apiKey || !dubbingId || !outFile) {
    console.log('Aufruf: node cliRedownload.js <API-Key> <Dubbing-ID> <Ausgabedatei>');
    process.exit(1);
}

(async () => {
    try {
        await downloadDubbingAudio(apiKey, dubbingId, 'de', outFile);
        console.log('Download abgeschlossen:', outFile);
    } catch (err) {
        console.error('Fehler:', err.message);
        process.exit(1);
    }
})();
