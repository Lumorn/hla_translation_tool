const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const ytdl = require('ytdl-core');
const ffmpeg = require('ffmpeg-static');

// Erstellt ein Standbild eines Videos
// Bei YouTube-Links wird zunächst der Direktlink ermittelt
async function captureFrame(url, sec, outPath) {
    let input = url;
    if (ytdl.validateURL(url)) {
        try {
            const info = await ytdl.getInfo(url);
            const fmt = ytdl.chooseFormat(info.formats, { quality: '18', filter: 'audioandvideo' });
            input = fmt.url;
        } catch (e) {
            console.error('[captureFrame] YouTube-Info fehlgeschlagen', e.message);
        }
    }
    return await new Promise(resolve => {
        const args = ['-ss', String(sec), '-i', input, '-frames:v', '1', '-q:v', '2', '-y', outPath];
        const proc = spawn(ffmpeg, args);
        proc.on('error', () => resolve(false));
        proc.on('close', code => resolve(code === 0 && fs.existsSync(outPath)));
    });
}

// Sichert das Bild im userData-Ordner und gibt den Pfad zurück
async function ensureFrame(url, sec, dir) {
    const safe = Buffer.from(url).toString('base64').replace(/[+/=]/g, '');
    const file = path.join(dir, `${safe}_${sec}.jpg`);
    if (!fs.existsSync(file)) {
        fs.mkdirSync(dir, { recursive: true });
        await captureFrame(url, sec, file);
    }
    return fs.existsSync(file) ? file : null;
}

module.exports = { ensureFrame };

