const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const ytdl = require('ytdl-core');
const play = require('play-dl');
const ffmpeg = require('ffmpeg-static');

// prueft, ob yt-dlp verfuegbar ist
function hasYtDlp() {
    const res = spawnSync('yt-dlp', ['--version'], { encoding: 'utf8' });
    return res.status === 0;
}

// ruft die direkte Videourl ueber yt-dlp ab
function getUrlViaYtDlp(videoUrl) {
    try {
        const res = spawnSync('yt-dlp', ['-g', videoUrl], { encoding: 'utf8' });
        if (res.status === 0 && res.stdout) {
            const line = res.stdout.split(/\r?\n/)[0].trim();
            if (line.startsWith('http')) return line;
        }
    } catch (err) {
        console.error('[captureFrame] yt-dlp Fehler', err.message);
    }
    return null;
}

// Prüft, ob alle benötigten Bibliotheken vorhanden sind
function checkVideoDependencies() {
    const missing = [];
    if (!ffmpeg || !fs.existsSync(ffmpeg)) missing.push('ffmpeg-static');
    try { require.resolve('ytdl-core'); } catch { missing.push('ytdl-core'); }
    try { require.resolve('play-dl'); } catch { missing.push('play-dl'); }
    if (!hasYtDlp()) missing.push('yt-dlp');
    return {
        ok: missing.length === 0,
        missing,
        ffmpegPath: ffmpeg
    };
}

// Erstellt ein Standbild eines Videos
// Bei YouTube-Links wird zunächst der Direktlink ermittelt
async function captureFrame(url, sec, outPath) {
    const dep = checkVideoDependencies();
    if (!dep.ok) {
        console.error('[captureFrame] Fehlende Abhängigkeiten:', dep.missing.join(', '));
        return false;
    }

    let input = url;

    // yt-dlp wird nun bevorzugt, sofern installiert
    if (hasYtDlp()) {
        const viaDlp = getUrlViaYtDlp(url);
        if (viaDlp) {
            // bevorzugter Weg – ytdl-core und play-dl werden übersprungen
            input = viaDlp;
        }
    }

    if (input === url && ytdl.validateURL(url)) {
        try {
            const info = await ytdl.getInfo(url);
            const fmt = ytdl.chooseFormat(info.formats, { quality: '18', filter: 'audioandvideo' });
            input = fmt.url;
        } catch (e) {
            console.error('[captureFrame] YouTube-Info fehlgeschlagen', e.message);
            if (/connect|tunnel|ENOTFOUND/i.test(e.message)) {
                console.error('[captureFrame] Netzwerkfehler – Zugriff eventuell blockiert');
            }
            // Zusätzlicher Hinweis, falls YouTube-Struktur geändert wurde
            if (e.message && e.message.includes('Could not extract')) {
                console.error('[captureFrame] Vermutlich ist ytdl-core veraltet – bitte per "npm update ytdl-core" aktualisieren');
            }
            try {
                // Fallback über play-dl
                const info = await play.video_basic_info(url);
                const stream = await play.stream_from_info(info);
                input = stream.url;
            } catch (e2) {
                console.error('[captureFrame] Auch play-dl konnte die Video-URL nicht ermitteln', e2.message);
                if (/connect|tunnel|ENOTFOUND/i.test(e2.message)) {
                    console.error('[captureFrame] Netzwerkfehler – Zugriff eventuell blockiert');
                }
                if (hasYtDlp()) {
                    const dlUrl = getUrlViaYtDlp(url);
                    if (dlUrl) {
                        // letzter Versuch über yt-dlp, falls oben kein Link ermittelt werden konnte
                        console.debug('[captureFrame] Nutze yt-dlp als Fallback');
                        input = dlUrl;
                    }
                }
            }
        }
    }
    return await new Promise(resolve => {
        const args = ['-ss', String(sec), '-i', input, '-frames:v', '1', '-q:v', '2', '-y', outPath];
        const proc = spawn(ffmpeg, args);
        proc.on('error', err => {
            console.error('[captureFrame] ffmpeg-Fehler', err);
            resolve(false);
        });
        proc.on('close', code => resolve(code === 0 && fs.existsSync(outPath)));
    });
}

// Sichert das Bild im userData-Ordner und gibt den Pfad zurück
async function ensureFrame(url, sec, dir) {
    const safe = Buffer.from(url).toString('base64').replace(/[+/=]/g, '');
    const file = path.join(dir, `${safe}_${sec}.jpg`);
    if (!fs.existsSync(file)) {
        fs.mkdirSync(dir, { recursive: true });
        const ok = await captureFrame(url, sec, file);
        if (!ok) {
            console.error('[ensureFrame] Bild konnte nicht erstellt werden');
        }
    }
    return fs.existsSync(file) ? file : null;
}

module.exports = { ensureFrame, checkVideoDependencies };

