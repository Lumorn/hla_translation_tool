// Parst den Inhalt einer closecaption-Datei in eine Map
function parseClosecaptionFile(content) {
    const map = new Map();
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
        const m = line.trim().match(/^"(\d+)"\s+"(.+)"$/);
        if (m) map.set(m[1], m[2]);
    }
    return map;
}

// Liest beide Untertitel-Dateien ein und gibt ein Array mit EN- und DE-Text zurück
async function loadClosecaptions(basePath) {
    let enContent = '';
    let deContent = '';

    // Standardpfad relativ zu diesem Skript im Node-Umfeld
    if (!basePath && typeof __dirname !== 'undefined') {
        const path = require('path');
        basePath = path.join(__dirname, 'closecaption');
    }

    if (typeof window !== 'undefined') {
        // Browser oder Electron
        const isElectron = !!window.electronAPI;
        const join = isElectron ? window.electronAPI.join : (p, f) => `${p}/${f}`;
        const enPath = join(basePath, 'closecaption_english.txt');
        const dePath = join(basePath, 'closecaption_german.txt');

        try {
            if (isElectron) {
                enContent = new TextDecoder().decode(window.electronAPI.fsReadFile(enPath));
                deContent = new TextDecoder().decode(window.electronAPI.fsReadFile(dePath));
            } else {
                enContent = await (await fetch(enPath)).text();
                deContent = await (await fetch(dePath)).text();
            }
        } catch {
            return null;
        }
    } else {
        // Reines Node.js
        const fs = require('fs');
        const path = require('path');
        try {
            enContent = fs.readFileSync(path.join(basePath, 'closecaption_english.txt'), 'utf8');
            deContent = fs.readFileSync(path.join(basePath, 'closecaption_german.txt'), 'utf8');
        } catch {
            return null;
        }
    }

    const enMap = parseClosecaptionFile(enContent);
    const deMap = parseClosecaptionFile(deContent);

    return Array.from(enMap.entries()).map(([id, enText]) => ({ id, enText, deText: deMap.get(id) || '' }));
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parseClosecaptionFile, loadClosecaptions };
} else {
    window.parseClosecaptionFile = parseClosecaptionFile;
    window.loadClosecaptions = loadClosecaptions;
}
