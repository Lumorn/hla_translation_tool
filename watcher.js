const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
// Benötigt für dynamische Pfaderkennung
const { DL_WATCH_PATH, SOUNDS_BASE_PATH, soundsDirName } = require('./web/src/config.js');

// Loescht alle Dateien und Unterordner eines Ordners
function leereOrdner(ordner) {
    if (!fs.existsSync(ordner)) return;
    for (const eintrag of fs.readdirSync(ordner)) {
        const p = path.join(ordner, eintrag);
        if (fs.statSync(p).isDirectory()) {
            fs.rmSync(p, { recursive: true, force: true });
        } else {
            fs.unlinkSync(p);
        }
    }
}

// Wartet, bis die Dateigroesse stabil bleibt
function warteBisFertig(datei) {
    return new Promise((resolve, reject) => {
        let letzteGroesse = -1;
        const timer = setInterval(() => {
            fs.stat(datei, (err, stat) => {
                if (err) {
                    clearInterval(timer);
                    return reject(err);
                }
                if (stat.size === letzteGroesse) {
                    clearInterval(timer);
                    return resolve();
                }
                letzteGroesse = stat.size;
            });
        }, 500);
    });
}

// Prüft durch einen schnellen Header-Vergleich, ob die Audiodatei gültig ist
function pruefeAudiodatei(datei) {
    try {
        const fd = fs.openSync(datei, 'r');
        const buf = Buffer.alloc(12);
        const gelesen = fs.readSync(fd, buf, 0, 12, 0);
        fs.closeSync(fd);
        if (gelesen < 4) return false;
        const h4 = buf.toString('ascii', 0, 4);
        if (h4 === 'RIFF' && buf.toString('ascii', 8, 12) === 'WAVE') return true;
        if (h4 === 'OggS') return true;
        if (h4 === 'ID3') return true;
        if (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return true;
        return false;
    } catch (e) {
        return false;
    }
}

// Ueberwacht den Download-Ordner und verarbeitet neue Dateien
function watchDownloadFolder(callback, opts = {}) {
    const pending = opts.pending || [];
    const onDone = opts.onDone || (() => {});
    const onError = opts.onError || (() => {});
    const log = opts.log || (() => {});
    const watchPath = opts.path || DL_WATCH_PATH;

    if (!fs.existsSync(watchPath)) {
        fs.mkdirSync(watchPath, { recursive: true });
        log('Download-Ordner angelegt: ' + watchPath);
    } else {
        log('Beobachte Download-Ordner: ' + watchPath);
    }
    // Ordner zu Beginn leeren
    leereOrdner(watchPath);

    chokidar.watch(watchPath, { ignoreInitial: true })
        .on('add', async file => {
            if (callback) callback(file);
            if (!pending.length) return;
            if (!/\.(wav|mp3|ogg)$/i.test(file)) return;
            log('Datei gefunden: ' + file);
            const basis = path.basename(file).replace(/\.(mp3|wav|ogg)$/i, '');
            // Grosszuegiges Matching fuer Dateinamen und IDs
            const idx = pending.findIndex(job => {
                const relBase = path.basename(job.relPath, path.extname(job.relPath));
                const expect = job.expectBase || relBase;
                return (
                    basis === job.id ||
                    basis.startsWith(job.id + '_') ||
                    basis.startsWith(expect + '_') ||
                    basis === expect
                );
            });
            // Wenn keine eindeutige Zuordnung gefunden wird, aber nur ein Job
            // offen ist, diesen verwenden
            let jobIdx = idx;
            if (jobIdx === -1 && pending.length === 1) jobIdx = 0;
            if (jobIdx === -1) {
                // Zur Fehlersuche fehlende Zuordnung im Terminal ausgeben
                console.warn('[watcher] Keine Job-Zuordnung für', basis,
                    '— offene Jobs:', pending.map(j => j.id));
                return;
            }
            const job = pending[jobIdx];
            try {
                await warteBisFertig(file);
                const srcValid = pruefeAudiodatei(file);
                log('Prüfung Download-Datei: ' + (srcValid ? 'OK' : 'FEHLER'));
                if (job.mode === 'manual' && !srcValid) {
                    throw new Error('Ungültige Audiodatei');
                }
                // Datei im Download-Ordner zuerst korrekt benennen
                const endung = path.extname(file);
                const richtigerName = path.join(path.dirname(file), job.id + endung);
                if (file !== richtigerName) {
                    try {
                        fs.renameSync(file, richtigerName);
                    } catch (err) {
                        // Bei unterschiedlichen Laufwerken schlägt renameSync fehl
                        if (err.code === 'EXDEV') {
                            fs.copyFileSync(file, richtigerName);
                            fs.unlinkSync(file);
                        } else {
                            throw err;
                        }
                    }
                    log('Umbenannt in: ' + richtigerName);
                    file = richtigerName;
                }
                // Pfad bereinigen und korrekt aufbauen
                let rel = job.relPath.replace(/^[\/]+/, '');
                rel = rel.replace(/^web[\/]/i, '');
                rel = rel.replace(/^sounds[\/](?=en[\/])/i, '');
                rel = rel.replace(/^(?:en|de)[\/]/i, '');
                const zielRel = path.posix.join(soundsDirName, 'DE', rel.replace(/\.(mp3|wav|ogg)$/i, '.wav'));
                const ziel = path.join(SOUNDS_BASE_PATH, 'DE', rel.replace(/\.(mp3|wav|ogg)$/i, '.wav'));
                fs.mkdirSync(path.dirname(ziel), { recursive: true });
                try {
                    fs.renameSync(file, ziel);
                } catch (err) {
                    // Bei unterschiedlichen Laufwerken schlägt renameSync fehl
                    if (err.code === 'EXDEV') {
                        fs.copyFileSync(file, ziel);
                        fs.unlinkSync(file);
                    } else {
                        throw err;
                    }
                }
                log('Verschoben nach: ' + ziel);
                const destValid = pruefeAudiodatei(ziel);
                log('Prüfung Ziel-Datei: ' + (destValid ? 'OK' : 'FEHLER'));
                pending.splice(jobIdx, 1);
                onDone({
                    id: job.id,
                    fileId: job.fileId,
                    dest: zielRel,
                    source: path.relative(watchPath, file),
                    srcValid,
                    destValid,
                    // Neuer Eintrag: absolute Pfade fuer detailliertes Logging
                    sourcePath: file,
                    destPath: ziel
                });
                // Nach erfolgreichem Verschieben den Download-Ordner leeren
                leereOrdner(watchPath);
            } catch (e) {
                pending.splice(jobIdx, 1);
                onError({ id: job.id, fileId: job.fileId, error: e.message });
            }
        });
}

module.exports = {
    watchDownloadFolder,
    clearDownloadFolder: leereOrdner,
    pruefeAudiodatei
};
