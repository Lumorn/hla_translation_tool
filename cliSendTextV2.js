#!/usr/bin/env node
// cliSendTextV2.js
// Sendet mehrere Texte nacheinander an die Text-to-Speech API v2.

const fs = require('fs');
const { sendTextV2 } = require('./elevenlabs');

const [,, apiKey, voiceId, filePath] = process.argv;

if (!apiKey || !voiceId || !filePath) {
    console.log('Aufruf: node cliSendTextV2.js <API-Key> <Voice-ID> <Datei>');
    process.exit(1);
}

const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter(l => l.trim().length > 0);
const seen = new Set();

(async () => {
    for (const line of lines) {
        const text = line.trim();
        if (seen.has(text)) continue; // Doppelte Zeilen überspringen
        await sendTextV2(apiKey, voiceId, text).catch(err => {
            console.error('Fehler bei', text, '-', err.message);
        });
        seen.add(text);
    }
    console.log('Daten an die API geschickt');
})();
