const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { WebSocket } = require('ws');

const LOGFILE = path.join(__dirname, 'setup.log');

function log(msg) {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  fs.appendFileSync(LOGFILE, `${timestamp} ${msg}\n`);
}

function run(cmd, options = {}) {
  log(`Führe aus: ${cmd}`);
  return execSync(cmd, { stdio: 'inherit', ...options });
}

function fetchJson(url) {
  if (typeof fetch === 'function') {
    return fetch(url).then(res => res.json());
  }
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

(async () => {
  log('Umgebungsprüfung gestartet');
  try {
    if (!fs.existsSync('package.json') || !fs.existsSync('electron')) {
      console.error('Bitte im Hauptverzeichnis ausführen.');
      log('Falsches Arbeitsverzeichnis');
      process.exit(1);
    }
    const nodeVer = execSync('node --version').toString().trim();
    log(`Node-Version: ${nodeVer}`);
    const major = parseInt(nodeVer.replace(/^v/, '').split('.')[0], 10);
    if (isNaN(major) || major < 18 || major >= 23) {
      console.error('Node-Version nicht unterstützt (18–22 erwartet).');
      log('Unpassende Node-Version erkannt');
      process.exit(1);
    }
    const npmVer = execSync('npm --version').toString().trim();
    log(`npm-Version: ${npmVer}`);
  } catch (err) {
    log('Fehler beim Prüfen von Node oder npm');
    log(err.toString());
    process.exit(1);
  }

  try {
    log('Installiere Abhängigkeiten im Hauptverzeichnis');
    run('npm ci');
  } catch (err) {
    log('npm ci im Hauptverzeichnis fehlgeschlagen');
    log(err.toString());
    process.exit(1);
  }

  try {
    log('Installiere Abhängigkeiten im electron-Ordner');
    run('npm ci', { cwd: path.join(__dirname, 'electron') });
    // Nach der Installation prüfen, ob das Electron-Modul vorhanden ist
    const electronPath = path.join(__dirname, 'electron', 'node_modules', 'electron');
    if (!fs.existsSync(electronPath)) {
      console.log('Electron-Modul fehlt, wird nachinstalliert...');
      log('Electron-Modul fehlt - versuche "npm install electron"');
      let installError = false;
      try {
        run('npm install electron', { cwd: path.join(__dirname, 'electron') });
        log('npm install electron erfolgreich');
      } catch (err) {
        installError = true;
        log('npm install electron fehlgeschlagen');
        log(err.toString());
      }
      // Nach der Installation erneut prüfen
      if (!fs.existsSync(electronPath)) {
        console.error('[Fehler] Electron-Modul fehlt weiterhin.');
        log('Electron-Modul weiterhin nicht vorhanden');
        process.exit(1);
      } else if (installError) {
        console.log('Electron wurde installiert, trotz Fehlermeldung.');
      }
    }
  } catch (err) {
    log('npm ci im electron-Ordner fehlgeschlagen');
    log(err.toString());
    process.exit(1);
  }

  try {
    const version = execSync('npx electron --version --no-sandbox', { cwd: path.join(__dirname, 'electron') }).toString().trim();
    log(`Gefundene Electron-Version: ${version}`);
  } catch (err) {
    log('Electron-Version konnte nicht ermittelt werden');
    log(err.toString());
  }

  log('Starte Testlauf von Electron');
  const electronProcess = spawn('npx', ['electron', '.', '--disable-gpu', '--no-sandbox', '--remote-debugging-port=9223'], { cwd: path.join(__dirname, 'electron') });
  electronProcess.stderr.on('data', d => fs.appendFileSync(LOGFILE, d));
  electronProcess.stdout.on('data', d => fs.appendFileSync(LOGFILE, d));

  let apiResult = false;
  try {
    // auf Debug-Port warten
    for (let i = 0; i < 10; i++) {
      try {
        await fetchJson('http://localhost:9223/json/list');
        break;
      } catch {
        await new Promise(r => setTimeout(r, 500));
      }
    }
    const list = await fetchJson('http://localhost:9223/json/list');
    const wsUrl = list[0].webSocketDebuggerUrl;
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      ws.on('open', () => {
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: 'typeof window.electronAPI !== "undefined"' } }));
      });
      ws.on('message', data => {
        const msg = JSON.parse(data);
        if (msg.id === 1) {
          apiResult = msg.result && msg.result.result && msg.result.result.value;
          ws.close();
        }
      });
      ws.on('close', resolve);
      ws.on('error', err => { reject(err); });
    });
  } catch (err) {
    log('Abfrage von window.electronAPI fehlgeschlagen');
    log(err.toString());
  }

  electronProcess.kill('SIGTERM');
  log(`ElectronAPI verfügbar: ${apiResult}`);
  console.log('Ergebnis der Prüfung:', apiResult ? 'OK' : 'FEHLER');

  // Optionaler Kurztest der Desktop-App mit Python
  if (process.argv.includes('--tool-check')) {
    log('Starte Python-Testlauf');
    const beforeSize = fs.existsSync(LOGFILE) ? fs.statSync(LOGFILE).size : 0;
    let exitCode = 0;
    try {
      run('python start_tool.py --check');
    } catch (err) {
      exitCode = err.status || 1;
    }
    const afterSize = fs.existsSync(LOGFILE) ? fs.statSync(LOGFILE).size : 0;
    const diff = fs.readFileSync(LOGFILE, 'utf8').slice(beforeSize, afterSize);
    const hasError = /Fehler/i.test(diff);
    if (exitCode !== 0 || hasError) {
      console.error('Desktop-App Test fehlgeschlagen. Siehe setup.log.');
      log('Python-Testlauf nicht erfolgreich');
    } else {
      console.log('Desktop-App Test erfolgreich.');
      log('Python-Testlauf erfolgreich');
    }
  }
})();
