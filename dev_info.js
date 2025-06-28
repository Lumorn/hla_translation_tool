#!/usr/bin/env node
// Gibt wichtige Systeminformationen für die Entwicklung aus
// Verwendung: node dev_info.js

const os = require('os');
const { execSync } = require('child_process');
const { checkVideoDependencies } = require('./videoFrameUtils');

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
};

const video = checkVideoDependencies();
info['Video-Abhängigkeiten'] = video.ok ? '✔️' : 'Fehlt: ' + video.missing.join(', ');

for (const [k, v] of Object.entries(info)) {
  console.log(`${k}: ${v}`);
}
