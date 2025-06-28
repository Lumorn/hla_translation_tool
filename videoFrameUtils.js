const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ytdl = require('ytdl-core');
const ffmpeg = require('ffmpeg-static');

// Erstellt ein Standbild eines YouTube-Videos
async function captureYoutubeFrame(url, sec, outPath) {
    try {
        const info = await ytdl.getInfo(url);
        const fmt = ytdl.chooseFormat(info.formats, { quality: '18', filter: 'audioandvideo' });
        const args = ['-ss', String(sec), '-i', fmt.url, '-frames:v', '1', '-q:v', '2', '-y', outPath];
        const res = spawnSync(ffmpeg, args, { stdio: 'ignore' });
        if (res.status !== 0) return false;
        return fs.existsSync(outPath);
    } catch (e) {
        console.error('[captureYoutubeFrame]', e.message);
        return false;
    }
}

// Sichert das Bild im userData-Ordner und gibt den Pfad zurück
async function ensureFrame(url, sec, dir) {
    const id = ytdl.getURLVideoID(url);
    const file = path.join(dir, `${id}_${sec}.jpg`);
    if (!fs.existsSync(file)) {
        fs.mkdirSync(dir, { recursive: true });
        await captureYoutubeFrame(url, sec, file);
    }
    return fs.existsSync(file) ? file : null;
}

module.exports = { ensureFrame };

