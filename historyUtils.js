const fs = require('fs');
const path = require('path');

// Speichert eine alte Version im History-Ordner und behält nur eine begrenzte Anzahl
function saveVersion(historyRoot, relPath, sourceFile, limit = 10) {
    try {
        if (!fs.existsSync(sourceFile)) return;
        const ext = path.extname(relPath);
        const historyDir = path.join(historyRoot, relPath);
        fs.mkdirSync(historyDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        let target = path.join(historyDir, `${timestamp}${ext}`);
        let counter = 1;
        while (fs.existsSync(target)) {
            target = path.join(historyDir, `${timestamp}-${counter}${ext}`);
            counter++;
        }
        fs.copyFileSync(sourceFile, target);
        let files = fs.readdirSync(historyDir).filter(f => f.endsWith(ext)).sort();
        while (files.length > limit) {
            const remove = files.shift();
            fs.unlinkSync(path.join(historyDir, remove));
        }
        return target;
    } catch (err) {
        // Beim Schreiben in die History ist ein Fehler aufgetreten
        console.error('Fehler beim Anlegen der History-Version', err);
        throw err;
    }
}

// Speichert direkt einen Buffer als History-Version
function saveBufferVersion(historyRoot, relPath, buffer, limit = 10) {
    const ext = path.extname(relPath);
    const historyDir = path.join(historyRoot, relPath);
    fs.mkdirSync(historyDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let target = path.join(historyDir, `${timestamp}${ext}`);
    let counter = 1;
    while (fs.existsSync(target)) {
        target = path.join(historyDir, `${timestamp}-${counter}${ext}`);
        counter++;
    }
    fs.writeFileSync(target, buffer);
    let files = fs.readdirSync(historyDir).filter(f => f.endsWith(ext)).sort();
    while (files.length > limit) {
        const remove = files.shift();
        fs.unlinkSync(path.join(historyDir, remove));
    }
    return target;
}

// Gibt die vorhandenen Versionen eines Pfades zurück
function listVersions(historyRoot, relPath) {
    const historyDir = path.join(historyRoot, relPath);
    if (!fs.existsSync(historyDir)) return [];
    return fs.readdirSync(historyDir).filter(f => !fs.statSync(path.join(historyDir, f)).isDirectory()).sort().reverse();
}

// Stellt eine Version wieder im Zielordner her
function restoreVersion(historyRoot, relPath, name, targetRoot) {
    const source = path.join(historyRoot, relPath, name);
    const target = path.join(targetRoot, relPath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
    return target;
}

// Tauscht die aktuelle Datei mit einer History-Version aus und aktualisiert die Historie
function switchVersion(historyRoot, relPath, name, targetRoot, limit = 10) {
    const source = path.join(historyRoot, relPath, name);
    const target = path.join(targetRoot, relPath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (fs.existsSync(target)) {
        // Aktuelle Datei vorher in die Historie verschieben
        saveVersion(historyRoot, relPath, target, limit);
    }
    fs.copyFileSync(source, target);
    // Wiederhergestellte Version aus der Historie entfernen
    fs.unlinkSync(source);
    return target;
}

module.exports = { saveVersion, listVersions, restoreVersion, switchVersion, saveBufferVersion };
