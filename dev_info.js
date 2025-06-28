#!/usr/bin/env node
// Gibt wichtige Systeminformationen für die Entwicklung aus
// Verwendung: node dev_info.js

const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');

function exec(cmd) {
  try {
    return execSync(cmd).toString().trim();
  } catch {
    return 'n/a';
  }
}

function human(bytes) {
  return Math.round(bytes / 1024 / 1024) + ' MB';
}

const info = {
  'Node-Version': exec('node --version'),
  'npm-Version': exec('npm --version'),
  'Python-Version': exec('python --version'),
  'Betriebssystem': `${os.type()} ${os.release()}`,
  'CPU': os.cpus()[0] ? os.cpus()[0].model : 'n/a',
  'CPU-Kerne': os.cpus().length,
  'Gesamt RAM': human(os.totalmem()),
  'Freier RAM': human(os.freemem()),
  'Arbeitsverzeichnis': process.cwd(),
  'VideoFrame-Ordner': path.join(os.homedir(), '.hla_translation_tool', 'videoFrames'),
  'ffmpeg-Pfad': ffmpeg || 'n/a',
  'ffmpeg-Version': (() => {
    if (!ffmpeg) return 'n/a';
    try {
      return exec(`"${ffmpeg}" -version`).split(/\r?\n/)[0];
    } catch {
      return 'n/a';
    }
  })(),
  'ytdl-core-Version': (() => {
    try { return require('ytdl-core/package.json').version; } catch { return 'n/a'; }
  })(),
  'play-dl-Version': (() => {
    try { return require('play-dl/package.json').version; } catch { return 'n/a'; }
  })(),
};


for (const [k, v] of Object.entries(info)) {
  console.log(`${k}: ${v}`);
}
