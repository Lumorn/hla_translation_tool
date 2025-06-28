const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
const KEY = crypto.createHash('sha256').update('hla_translation_tool').digest();
const IV = Buffer.alloc(16, 0);

function encrypt(text) {
    const cipher = crypto.createCipheriv(algorithm, KEY, IV);
    return Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]).toString('base64');
}

function decrypt(enc) {
    try {
        const decipher = crypto.createDecipheriv(algorithm, KEY, IV);
        return Buffer.concat([decipher.update(Buffer.from(enc, 'base64')), decipher.final()]).toString('utf8');
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
