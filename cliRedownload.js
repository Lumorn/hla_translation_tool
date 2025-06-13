#!/usr/bin/env node
// cliRedownload.js
// Einfache Kommandozeilenhilfe zum erneuten Herunterladen eines Dubbings

const { downloadDubbingAudio } = require('./elevenlabs');

// Parameter auslesen: node cliRedownload.js API-KEY DUBBING-ID AUSGABEDATEI [SPRACHE]
const [,, apiKey, dubbingId, outFile, targetLang = 'de'] = process.argv;

// Mindestens drei Parameter muessen vorhanden sein
if (!apiKey || !dubbingId || !outFile) {
    console.log('Aufruf: node cliRedownload.js <API-Key> <Dubbing-ID> <Ausgabedatei> [Sprache]');
    process.exit(1);
}

(async () => {
    try {
        // Gewuenschte Sprache an downloadDubbingAudio weiterreichen
        await downloadDubbingAudio(apiKey, dubbingId, targetLang, outFile);
        console.log('Download abgeschlossen:', outFile);
    } catch (err) {
        console.error('Fehler:', err.message);
        process.exit(1);
    }
})();
