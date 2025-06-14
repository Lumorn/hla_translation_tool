const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const { DL_WATCH_PATH, projectRoot } = require('./web/src/config.js');

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

// Ueberwacht den Download-Ordner und verarbeitet neue Dateien
function watchDownloadFolder(callback, opts = {}) {
    const pending = opts.pending || [];
    const onDone = opts.onDone || (() => {});
    const onError = opts.onError || (() => {});
    const log = opts.log || (() => {});

    if (!fs.existsSync(DL_WATCH_PATH)) {
        fs.mkdirSync(DL_WATCH_PATH, { recursive: true });
        log('Download-Ordner angelegt: ' + DL_WATCH_PATH);
    } else {
        log('Beobachte Download-Ordner: ' + DL_WATCH_PATH);
    }

    chokidar.watch(DL_WATCH_PATH, { ignoreInitial: true })
        .on('add', async file => {
            if (callback) callback(file);
            if (!pending.length) return;
            if (!/\.(wav|mp3|ogg)$/i.test(file)) return;
            const basis = path.basename(file).replace(/\.(mp3|wav|ogg)$/i, '');
            const idx = pending.findIndex(job =>
                job.id === basis ||
                path.basename(job.relPath, path.extname(job.relPath)) === basis
            );
            if (idx === -1) return;
            const job = pending[idx];
            try {
                await warteBisFertig(file);
                const zielRel = path.posix.join('sounds', 'DE', job.relPath.replace(/\.(mp3|wav|ogg)$/i, '.wav'));
                const ziel = path.join(projectRoot, zielRel);
                fs.mkdirSync(path.dirname(ziel), { recursive: true });
                fs.renameSync(file, ziel);
                pending.splice(idx, 1);
                onDone({ id: job.id, fileId: job.fileId, dest: zielRel });
            } catch (e) {
                pending.splice(idx, 1);
                onError({ id: job.id, fileId: job.fileId, error: e.message });
            }
        });
}

module.exports = { watchDownloadFolder };
