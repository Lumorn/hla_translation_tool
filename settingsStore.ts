const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Algorithmus für die AES-256-CBC-Verschlüsselung
const algorithm = 'aes-256-cbc';
// Schlüssel aus Umgebungsvariable ableiten, damit nichts Hartkodiertes im Repo landet
const KEY = crypto.createHash('sha256').update(process.env.HLA_ENC_KEY || '').digest();

function encrypt(text) {
    // Für jede Speicherung einen neuen Initialisierungsvektor erzeugen
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    // IV dem Ergebnis voranstellen und alles als Base64 zurückgeben
    return Buffer.concat([iv, encrypted]).toString('base64');
}

function decrypt(enc) {
    try {
        const buf = Buffer.from(enc, 'base64');
        // Ersten 16 Bytes als IV auslesen, Rest ist der Ciphertext
        const iv = buf.subarray(0, 16);
        const data = buf.subarray(16);
        const decipher = crypto.createDecipheriv(algorithm, KEY, iv);
        return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    } catch {
        return '';
    }
}

function getFile(dir) {
    return path.join(dir, 'settings.json');
}

function saveSettings(dir, data) {
    const file = getFile(dir);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    let current = {};
    if (fs.existsSync(file)) {
        try {
            current = JSON.parse(fs.readFileSync(file, 'utf8'));
        } catch {}
    }
    const toSave = {
        openaiKey: 'openaiKey' in data
            ? encrypt(data.openaiKey || '')
            : current.openaiKey || '',
        selectedModel: 'selectedModel' in data
            ? data.selectedModel || ''
            : current.selectedModel || '',
        cachedModels: 'cachedModels' in data
            ? data.cachedModels
            : current.cachedModels || null
    };
    fs.writeFileSync(file, JSON.stringify(toSave, null, 2));
}

function loadSettings(dir) {
    const file = getFile(dir);
    if (fs.existsSync(file)) {
        try {
            const obj = JSON.parse(fs.readFileSync(file, 'utf8'));
            return {
                openaiKey: obj.openaiKey ? decrypt(obj.openaiKey) : '',
                selectedModel: obj.selectedModel || '',
                cachedModels: obj.cachedModels || null
            };
        } catch {}
    }
    return { openaiKey: '', selectedModel: '', cachedModels: null };
}

module.exports = { saveSettings, loadSettings };
