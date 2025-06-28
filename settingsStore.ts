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
    const toSave = {
        openaiKey: encrypt(data.openaiKey || ''),
        gptModel: data.gptModel || 'gpt-3.5-turbo'
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
                gptModel: obj.gptModel || 'gpt-3.5-turbo'
            };
        } catch {}
    }
    return { openaiKey: '', gptModel: 'gpt-3.5-turbo' };
}

module.exports = { saveSettings, loadSettings };
