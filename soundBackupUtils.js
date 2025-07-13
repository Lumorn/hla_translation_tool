const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Erstellt ein ZIP-Backup der Sound-Ordner und behält höchstens 'limit' Dateien
// Optional kann ein Callback den Fortschritt entgegennehmen
function createSoundBackup(root, dePath, deBackupPath, deHistoryPath, limit = 5, progressCb = null) {
    return new Promise((resolve, reject) => {
        fs.mkdirSync(root, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = path.join(root, `sounds_${timestamp}.zip`);
        const output = fs.createWriteStream(file);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => {
            // Älteste Backups entfernen
            let files = fs.readdirSync(root).filter(f => f.endsWith('.zip')).sort();
            while (files.length > limit) {
                const remove = files.shift();
                fs.unlinkSync(path.join(root, remove));
            }
            resolve(file);
        });
        archive.on('error', err => reject(err));
        archive.on('progress', progress => {
            if (progressCb) progressCb(progress);
        });
        archive.pipe(output);
        archive.directory(dePath, 'Sounds/DE');
        archive.directory(deBackupPath, 'DE-Backup');
        archive.directory(deHistoryPath, 'DE-History');
        archive.finalize();
    });
}

// Gibt alle vorhandenen Sound-Backups mit Datum und Größe zurück
function listSoundBackups(root) {
    if (!fs.existsSync(root)) return [];
    return fs.readdirSync(root)
        .filter(f => f.endsWith('.zip'))
        .map(name => {
            const stat = fs.statSync(path.join(root, name));
            return { name, size: stat.size, mtime: stat.mtime.getTime() };
        })
        .sort((a, b) => b.mtime - a.mtime);
}

// Löscht ein bestimmtes Sound-Backup
function deleteSoundBackup(root, name) {
    const file = path.join(root, name);
    if (fs.existsSync(file)) fs.unlinkSync(file);
    return true;
}

module.exports = { createSoundBackup, listSoundBackups, deleteSoundBackup };
