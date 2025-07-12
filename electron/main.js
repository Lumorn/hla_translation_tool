// @ts-check
/**
 * Typdefinitionen für die IPC-Kommunikation importieren
 * @typedef {import('./ipcContracts').SaveDeFileArgs} SaveDeFileArgs
 * @typedef {import('./ipcContracts').SaveFileArgs} SaveFileArgs
 * @typedef {import('./ipcContracts').MoveFileArgs} MoveFileArgs
 * @typedef {import('./ipcContracts').RestoreDeHistoryArgs} RestoreDeHistoryArgs
 * @typedef {import('./ipcContracts').SaveDeHistoryBufferArgs} SaveDeHistoryBufferArgs
 */
const { app, BrowserWindow, ipcMain, globalShortcut, dialog, shell, session } = require('electron'); // session wird für Header-Manipulation benötigt
// 'node:path' nutzen, damit das integrierte Modul auch nach dem Packen gefunden wird
const path = require('node:path'); // Pfadmodul einbinden
const fs = require('fs');
const { execSync, spawnSync, spawn } = require('child_process');
const os = require("os"); // Systeminformationen
// Lade Konfiguration relativ zum aktuellen Verzeichnis
const { DL_WATCH_PATH, projectRoot, SOUNDS_BASE_PATH, soundsDirName } = require(path.join(__dirname, '..', 'web', 'src', 'config.js'));
const { chooseExisting } = require('../pathUtils');
// Nach dem Laden der Projektwurzel pruefen wir auf Gross-/Kleinschreibung.
// Backups koennen ebenfalls groß oder klein geschrieben sein.
const backupsDirName = chooseExisting(projectRoot, ['Backups', 'backups']);
const historyUtils = require('../historyUtils');
const { watchDownloadFolder, clearDownloadFolder, pruefeAudiodatei } = require('../watcher.js');
const { isDubReady } = require('../elevenlabs.js');
const { createSoundBackup, listSoundBackups, deleteSoundBackup } = require('../soundBackupUtils');
const { saveSettings, loadSettings } = require('../settingsStore.ts');
// Fortschrittsbalken und FFmpeg für MP3->WAV-Konvertierung
const ProgressBar = require('progress');
const ffmpeg = require('ffmpeg-static');
// "unzipper" unterstuetzt auch ZIP64- und mehrteilige Archive
const unzipper = require('unzipper');
// Standbild-Erzeugung über ffmpeg
const { ensureFrame } = require('../legacy/videoFrameUtils.js');
// Pfad zum App-Icon (im Ordner 'assets' als 'app-icon.png' ablegen)
const iconPath = path.join(__dirname, 'assets', 'app-icon.png');
// Workshop-Start erfolgt über ein Python-Skript mit hlvrcfg.exe
const pendingDubs = [];
let mainWindow;
if (!fs.existsSync(DL_WATCH_PATH)) fs.mkdirSync(DL_WATCH_PATH);

// =========================== USER-DATA-PFAD START ===========================
// Benutzer-Datenordner festlegen, damit lokale Daten auch nach einem Neustart
// verfügbar bleiben und nicht durch Zugriffsrechte im Standardpfad verloren gehen
const userDataPath = path.join(app.getPath('home'), '.hla_translation_tool');
fs.mkdirSync(userDataPath, { recursive: true });
app.setPath('userData', userDataPath);
// Ordner für automatische Backups im Benutzerverzeichnis anlegen
// Neuer Pfad 'Backups' laut Benutzerwunsch
const backupPath = path.join(userDataPath, 'Backups');
fs.mkdirSync(backupPath, { recursive: true });
// Alter Backup-Pfad im Projektordner (Kompatibilitätsmodus)
const oldBackupPath = path.join(projectRoot, backupsDirName);
// Zusätzlicher Ordner für gesicherte MP3-Dateien
const audioBackupPath = path.join(backupPath, 'mp3');
fs.mkdirSync(audioBackupPath, { recursive: true });
// Ordner für ZIP-Sicherungen der Sounds anlegen
const soundZipBackupPath = path.join(backupPath, 'sounds');
fs.mkdirSync(soundZipBackupPath, { recursive: true });
// Temporärer Ordner für ZIP-Importe
const zipImportTempPath = path.join(userDataPath, 'ZipTemp');
fs.mkdirSync(zipImportTempPath, { recursive: true });
// Ordner für Segment-Audiodateien anlegen
const segmentFolderPath = path.join(SOUNDS_BASE_PATH, 'Segments');
fs.mkdirSync(segmentFolderPath, { recursive: true });
// Gespeicherte ChatGPT-Einstellungen laden
let { openaiKey: openaiApiKey = '', selectedModel: openaiModel = '', cachedModels: cached = null } = loadSettings(userDataPath);
let modelCache = cached || { data: [], time: 0 };
// Hilfsfunktion: sicheres Verschieben ueber Dateisystemgrenzen hinweg
function safeMove(src, dest) {
  try {
    fs.renameSync(src, dest); // Standardfall: einfache Umbenennung
  } catch (err) {
    if (err.code === 'EXDEV') {
      // Fallback fuer unterschiedliche Laufwerke: Datei kopieren und Quelle loeschen
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);
    } else {
      throw err; // anderen Fehler weiterreichen
    }
  }
}
// Zusätzlichen Ordner für Session-Daten anlegen und verwenden,
// um Cache-Fehler wie "Unable to move the cache" zu vermeiden
const sessionDataPath = path.join(userDataPath, 'SessionData');
fs.mkdirSync(sessionDataPath, { recursive: true });
app.setPath('sessionData', sessionDataPath);
// Ordner für erzeugte Video-Frames anlegen
const videoFramesPath = path.join(userDataPath, 'videoFrames');
fs.mkdirSync(videoFramesPath, { recursive: true });
// =========================== USER-DATA-PFAD END =============================

// =========================== VIDEO-BOOKMARKS START ==========================
// Pfad zur Datei mit den gespeicherten Video-Bookmarks
const dataPath = app.getPath('userData');
const bookmarkFile = path.join(dataPath, 'videoBookmarks.json');

// Liest vorhandene Bookmarks aus der JSON-Datei
function readBookmarks() {
  try {
    if (fs.existsSync(bookmarkFile)) {
      const txt = fs.readFileSync(bookmarkFile, 'utf8');
      if (txt.trim()) return JSON.parse(txt);
    }
  } catch (err) {
    console.error('Bookmarks konnten nicht geladen werden', err);
  }
  return [];
}

// Speichert eine Liste von Bookmarks in der JSON-Datei
function saveBookmarks(list) {
  try {
    fs.writeFileSync(bookmarkFile, JSON.stringify(list ?? [], null, 2));
  } catch (err) {
    console.error('Bookmarks konnten nicht gespeichert werden', err);
  }
}
// =========================== VIDEO-BOOKMARKS END ============================


// Pfade zu EN und DE relativ zur HTML-Datei

// =========================== READAUDIOFILES START ===========================
// Liest rekursiv Audiodateien ein und liefert Pfade in POSIX-Notation
function readAudioFiles(dir) {
  const result = [];

  function walk(current, rel = '') {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name); // Absoluter Pfad zum Einlesen

      if (entry.isDirectory()) {
        // Unterordner weiter durchsuchen und Pfad mit '/' verketten
        walk(full, path.posix.join(rel, entry.name));
      } else if (/\.(mp3|wav|ogg)$/i.test(entry.name)) {
        // Dateipfad in POSIX-Form speichern (immer '/')
        const relPath = path.posix.join(rel, entry.name);
        result.push({ fullPath: relPath });
      }
    }
  }

  if (fs.existsSync(dir)) {
    walk(dir);
  }

  return result;
}
// =========================== READAUDIOFILES END =============================

// =========================== MP3-TO-WAV START ==============================
// Konvertiert alle MP3-Dateien eines Ordners rekursiv nach WAV
function convertMp3Dir(base) {
  const mp3Files = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.mp3$/i.test(entry.name)) mp3Files.push(full);
    }
  })(base);

  if (!mp3Files.length) return;
  const bar = new ProgressBar('MP3 -> WAV [:bar] :current/:total', { total: mp3Files.length });
  for (const file of mp3Files) {
    const rel = path.relative(base, file);
    const backup = path.join(audioBackupPath, rel);
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    try {
      // Verschieben der MP3-Datei ins Backup. Bei Fehler (z.B. anderes Laufwerk)
      // wird automatisch auf Kopieren mit anschliessendem Loeschen umgestellt.
      safeMove(file, backup);
      const wav = file.replace(/\.mp3$/i, '.wav');
      const res = spawnSync(ffmpeg, ['-y', '-i', backup, wav], { stdio: 'ignore' });
      if (res.status !== 0 || !fs.existsSync(wav)) {
        // Rueckabwicklung bei fehlgeschlagener Konvertierung
        safeMove(backup, file);
        console.error('[Konvertierung] Fehler bei', file);
      }
    } catch (e) {
      console.error('[Konvertierung]', e.message);
    }
    bar.tick();
  }
}
// =========================== MP3-TO-WAV END ================================

function createWindow() {
  const win = new BrowserWindow({
    // Fensterbreite etwas vergrößern, damit Play- und Stop-Knopf Platz haben
    width: 1300,
    height: 800,
    icon: iconPath,
    webPreferences: {
      // Preload-Skript bindet die Electron-API im Renderer ein
      preload: path.join(__dirname, 'preload.cjs'),
      // Explizit aktivieren, damit die Brücke sicher funktioniert
      contextIsolation: true,
      // Sandbox vorsorglich deaktivieren, damit der Preload-Prozess nicht
      // in einen gesonderten Sandbox-Modus verschoben wird
      sandbox: false,
      nodeIntegration: false,
    },
  });

  // HTML-Datei immer über einen absoluten Pfad laden
  win.loadFile(path.join(__dirname, '../web/hla_translation_tool.html'));

  // DevTools immer in einem abgekoppelten Fenster öffnen
  win.webContents.openDevTools({ mode: 'detach' });

  // Shortcut zum Ein- und Ausblenden der DevTools
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (win.webContents.isDevToolsOpened()) {
      win.webContents.closeDevTools();
    } else {
      win.webContents.openDevTools();
    }
  });

  return win;
}

// GPU-Beschleunigung ausschalten, um Cache-Probleme zu vermeiden
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');
// Shader-Cache deaktivieren, um Fehlermeldungen wie "Unable to move the cache" zu vermeiden
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

app.whenReady().then(() => {
  // Problematischen Permissions-Policy-Header entfernen
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders;
    const key = Object.keys(headers).find(h => h.toLowerCase() === 'permissions-policy');
    if (key) {
      delete headers[key]; // entfernt ch-ua-form-factors und andere unbekannte Einträge
    }
    callback({ responseHeaders: headers });
  });
  // Basis- und Sprachordner relativ zur Projektwurzel bestimmen
  const projectBase = SOUNDS_BASE_PATH;
  const enPath = path.resolve(projectBase, 'EN');
  const dePath = path.resolve(projectBase, 'DE');
  const deBackupPath = path.resolve(projectBase, 'DE-Backup');
  const deHistoryPath = path.resolve(projectBase, 'DE-History');
  fs.mkdirSync(enPath, { recursive: true }); // EN-Ordner anlegen
  fs.mkdirSync(dePath, { recursive: true }); // DE-Ordner anlegen
  fs.mkdirSync(deBackupPath, { recursive: true }); // DE-Backup-Ordner anlegen
  fs.mkdirSync(deHistoryPath, { recursive: true }); // History-Ordner anlegen
  // MP3-Dateien zu WAV konvertieren
  convertMp3Dir(enPath);
  convertMp3Dir(dePath);

  ipcMain.handle('scan-folders', () => {
    return {
      enFiles: readAudioFiles(enPath),
      deFiles: readAudioFiles(dePath),
    };
  });

  // Ordnerauswahl-Dialog öffnen und gewählten Pfad zurückgeben
  ipcMain.handle('open-folder-dialog', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  // Speichert eine Datei über einen Dialog auf der Festplatte
  ipcMain.handle('save-file', async (event, /** @type {SaveFileArgs} */{ data, defaultPath }) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath,
    });
    if (canceled || !filePath) return null;
    fs.writeFileSync(filePath, Buffer.from(data));
    return filePath;
  });

  // Liste der vorhandenen Backups abrufen
  ipcMain.handle('list-backups', async () => {
    let files = [];
    if (fs.existsSync(backupPath)) {
      files.push(...fs.readdirSync(backupPath).filter(f => f.endsWith('.json')));
    }
    if (fs.existsSync(oldBackupPath)) {
      files.push(...fs.readdirSync(oldBackupPath).filter(f => f.endsWith('.json')));
    }
    return files.sort().reverse();
  });

  // Neues Backup im Backup-Ordner speichern
  ipcMain.handle('save-backup', async (event, data) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(backupPath, `backup_${timestamp}.json`);
    fs.writeFileSync(file, data);
    return file;
  });

  // Backup-Datei lesen
  ipcMain.handle('read-backup', async (event, name) => {
    let file = path.join(backupPath, name);
    if (!fs.existsSync(file)) {
      file = path.join(oldBackupPath, name);
    }
    return fs.readFileSync(file, 'utf8');
  });

  // Backup löschen
  ipcMain.handle('delete-backup', async (event, name) => {
    let file = path.join(backupPath, name);
    if (!fs.existsSync(file)) {
      file = path.join(oldBackupPath, name);
    }
    if (fs.existsSync(file)) fs.unlinkSync(file);
    return true;
  });

  // Liste der vorhandenen Sound-ZIP-Backups
  ipcMain.handle('list-sound-backups', async () => {
    return listSoundBackups(soundZipBackupPath);
  });

  // Neues Sound-ZIP-Backup erstellen
  ipcMain.handle('create-sound-backup', async () => {
    return await createSoundBackup(soundZipBackupPath, dePath, deBackupPath, deHistoryPath, 5);
  });

  // Sound-ZIP-Backup löschen
  ipcMain.handle('delete-sound-backup', async (event, name) => {
    return deleteSoundBackup(soundZipBackupPath, name);
  });

  // Backup-Ordner im Dateimanager öffnen
  ipcMain.handle('open-backup-folder', async () => {
    shell.openPath(backupPath);
    return true;
  });

  // ZIP-Import: Archiv wird entpackt und die enthaltenen Audios werden zurückgegeben
  ipcMain.handle('import-zip', async (event, data) => {
    try {
      // Temporären Ordner leeren
      fs.rmSync(zipImportTempPath, { recursive: true, force: true });
      fs.mkdirSync(zipImportTempPath, { recursive: true });

      // ZIP speichern und entpacken
      const zipFile = path.join(zipImportTempPath, 'import.zip');
      fs.writeFileSync(zipFile, Buffer.from(data));
      // Archiv mit "unzipper" entpacken, um auch exotische ZIP-Varianten zu
      // unterstuetzen
      await new Promise((resolve, reject) => {
        fs.createReadStream(zipFile)
          .pipe(unzipper.Extract({ path: zipImportTempPath }))
          .on('close', resolve)
          .on('error', reject);
      });
      fs.unlinkSync(zipFile);

      // Audiodateien rekursiv sammeln
      const audioFiles = [];
      const exts = ['.mp3', '.wav', '.ogg'];
      const collect = dir => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) collect(full);
          else if (exts.includes(path.extname(entry.name).toLowerCase())) {
            audioFiles.push(full);
          }
        }
      };
      collect(zipImportTempPath);

      // Nach führender Zahl sortieren
      const num = n => {
        const m = /^(\d+)/.exec(path.basename(n));
        return m ? parseInt(m[1], 10) : 0;
      };
      audioFiles.sort((a, b) => num(a) - num(b));

      const rel = audioFiles.map(f => path.relative(zipImportTempPath, f));
      return { files: rel };
    } catch (err) {
      return { error: err.message || String(err) };
    }
  });

  // Beliebige URL im Standardbrowser öffnen
  ipcMain.handle('open-external', async (event, url) => {
    shell.openExternal(url);
    return true;
  });

  // Beliebige Datei im Standardprogramm öffnen
  ipcMain.handle('open-path', async (event, p) => {
    shell.openPath(p);
    return true;
  });

  // Startet die automatische Browser-Steuerung über Playwright
  ipcMain.handle('auto-dub', async (event, { id, folder }) => {
    // Aktuell wird nur die ID verwendet. Der Ordnerparameter ist für künftige
    // Erweiterungen vorgesehen.
    const { chromium } = require('playwright');
    // Browser ohne Headless-Modus starten
    // Fortschritt im Terminal ausgeben
    console.log('[auto-dub] Starte Browser für ID', id);
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.goto(`https://elevenlabs.io/v1/dubbing/${id}`);
    console.log('[auto-dub] Seite geöffnet');
    // Abfolge wichtiger Buttons nacheinander klicken
    const selectors = [
      'text=Generate',
      'text=Continue',
      'text=Download'
    ];
    // Buttons der Reihe nach anklicken
    for (const sel of selectors) {
      try {
        await page.waitForSelector(sel, { timeout: 10000 });
        console.log('[auto-dub] Klicke', sel);
        await page.click(sel);
      } catch (err) {
        console.log('[auto-dub] Knopf fehlt:', sel);
      }
      await page.waitForTimeout(1000);
    }
    // Browser schließen, sobald alles durchgelaufen ist
    console.log('[auto-dub] Vorgang abgeschlossen, schließe Browser');
    await browser.close();
    return true;
  });

  // Screenshot des aktuellen Fensters erstellen
  ipcMain.handle('capture-frame', async (event, bounds) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    const img = await win.capturePage(bounds);
    return img.toPNG();
  });

  // Erstellt ein Einzelbild mit ffmpeg
  ipcMain.handle('get-video-frame', async (event, { url, time }) => {
    try {
      const file = await ensureFrame(url, time, videoFramesPath);
      if (!file) {
        console.error('[get-video-frame] Bild konnte nicht erzeugt werden');
        return null;
      }
      const data = fs.readFileSync(file);
      return data.toString('base64');
    } catch (err) {
      console.error('[get-video-frame]', err.message);
      return null;
    }
  });


  // Bookmarks aus dem userData-Ordner laden
  ipcMain.handle('load-bookmarks', () => readBookmarks());

  // Bookmarks im userData-Ordner speichern
  ipcMain.handle('save-bookmarks', (event, list) => {
    saveBookmarks(list);
    return true;
  });

  // einzelnen Bookmark anhand des Index entfernen
  ipcMain.handle('delete-bookmark', (event, idx) => {
    const list = readBookmarks();
    if (typeof idx === 'number' && idx >= 0 && idx < list.length) {
      list.splice(idx, 1);
      saveBookmarks(list);
    }
    return true;
  });

  // ChatGPT-Einstellungen laden und speichern
  ipcMain.handle('load-openai-settings', () => ({ key: openaiApiKey, model: openaiModel }));
  ipcMain.handle('save-openai-settings', (event, data) => {
    openaiApiKey = data.key || '';
    openaiModel = data.model || '';
    saveSettings(userDataPath, {
      openaiKey: openaiApiKey,
      selectedModel: openaiModel,
      cachedModels: modelCache
    });
    return true;
  });

  ipcMain.handle('load-openai-models', () => modelCache);
  ipcMain.handle('save-openai-models', (event, list) => {
    modelCache = { data: Array.isArray(list) ? list : [], time: Date.now() };
    saveSettings(userDataPath, {
      openaiKey: openaiApiKey,
      selectedModel: openaiModel,
      cachedModels: modelCache
    });
    return true;
  });

  // Pfad des projektinternen Download-Ordners liefern
  ipcMain.handle('get-download-path', () => {
    // Der Download-Ordner liegt im Web-Verzeichnis des Projekts
    return DL_WATCH_PATH;
  });

  // =========================== DEBUG-INFO START =============================
  // Liefert Pfad-Informationen für das Debug-Fenster
  ipcMain.handle('get-debug-info', async () => {
    const soundsPath = SOUNDS_BASE_PATH;
    const backupsPath = path.resolve(projectRoot, backupsDirName);

    // Helper zum Pruefen, ob das Programm mit Adminrechten laeuft
    function isElevated() {
      if (process.platform === 'win32') {
        try {
          execSync('net session', { stdio: 'ignore' });
          return true;
        } catch {
          return false;
        }
      }
      return process.getuid && process.getuid() === 0;
    }

    // Pfade zu wichtigen Dateien
    const pkgPath = path.join(projectRoot, 'package.json');
    const nodeModulesPath = path.join(projectRoot, 'node_modules');

    // Git-Informationen ermitteln
    let gitVersion = '';
    let gitCommit = '';
    try {
      gitVersion = execSync('git --version').toString().trim();
      gitCommit = execSync('git rev-parse HEAD').toString().trim();
    } catch {}

    // Python-Pfad bestimmen
    let pythonPath = '';
    try {
      const cmd = process.platform === 'win32' ? 'where python' : 'which python';
      pythonPath = execSync(cmd).toString().split(/\r?\n/)[0].trim();
    } catch {}

    // Letzte Zeilen aus setup.log lesen
    const logFile = path.join(__dirname, 'setup.log');
    let setupLog = '';
    if (fs.existsSync(logFile)) {
      const lines = fs.readFileSync(logFile, 'utf8').trim().split(/\r?\n/);
      setupLog = lines.slice(-10).join('\n');
    }


    // Kurzer Netztest, um YouTube zu erreichen
    async function checkConnectivity(url) {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        return `OK (${res.status})`;
      } catch (err) {
        return `Fehler: ${err.message}`;
      }
    }
    const youtubeStatus = await checkConnectivity('https://www.youtube.com');

    return {
      projectRoot,
      soundsDirName,
      backupsDirName,
      soundsPath,
      backupsPath,
      existsSoundsPath: fs.existsSync(soundsPath),
      existsBackupsPath: fs.existsSync(backupsPath),
      userDataPath,
      backupPath,
      zipImportTempPath,
      oldBackupPath,
      downloadWatchPath: DL_WATCH_PATH,
      appVersion: app.getVersion(),
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      processPlatform: process.platform,
      cpuArch: process.arch,
      osType: os.type(),
      osRelease: os.release(),
      cpuModel: os.cpus()[0] ? os.cpus()[0].model : "",
      cpuCount: os.cpus().length,
      totalMemMB: Math.round(os.totalmem() / 1024 / 1024),
      freeMemMB: Math.round(os.freemem() / 1024 / 1024),
      processType: 'browser',
      contextIsolation: true,
      sandbox: mainWindow ? mainWindow.webContents.getLastWebPreferences().sandbox : false,
      NODE_ENV: process.env.NODE_ENV,
      ELECTRON_RUN_AS_NODE: process.env.ELECTRON_RUN_AS_NODE,
      ELECTRON_DISABLE_SANDBOX: process.env.ELECTRON_DISABLE_SANDBOX,
      cwd: process.cwd(),
      scriptPath: __filename,
      uid: process.getuid ? process.getuid() : '',
      nodeExecPath: process.execPath,
      pythonExecPath: pythonPath,
      electronExecPath: app.getPath('exe'),
      packageJsonPath: pkgPath,
      nodeModulesPath,
      gitVersion,
      gitCommit,
      startArgs: process.argv.join(' '),
      setupLog,
      admin: isElevated(),
      ffmpegPath: ffmpeg,
      ffmpegVersion: (() => {
        if (!ffmpeg) return '';
        try {
          return execSync(`"${ffmpeg}" -version`).toString().split(/\r?\n/)[0];
        } catch {
          return '';
        }
      })(),
      ytdlVersion: (() => {
        try {
          return require('ytdl-core/package.json').version;
        } catch {
          return '';
        }
      })(),
      playDlVersion: (() => {
        try {
          return require('play-dl/package.json').version;
        } catch {
          return '';
        }
      })(),
      youtubeAccess: youtubeStatus
    };
  });
  // =========================== DEBUG-INFO END ===============================

  // =========================== BACKUP-DE-FILE START ===========================
  // Kopiert eine vorhandene DE-Datei nur dann ins Backup,
  // wenn dort noch keine Sicherung existiert
  ipcMain.handle('backup-de-file', async (event, relPath) => {
    const source = path.join(dePath, relPath);
    const target = path.join(deBackupPath, relPath);
    if (!fs.existsSync(target) && fs.existsSync(source)) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(source, target);
    }
    return target;
  });

  // Backup-Datei wieder entfernen (inkl. leerer Ordner)
  ipcMain.handle('delete-de-backup-file', async (event, relPath) => {
    const target = path.join(deBackupPath, relPath);
    if (fs.existsSync(target)) {
      fs.unlinkSync(target);
      let dir = path.dirname(target);
      while (dir.startsWith(deBackupPath) && fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
        fs.rmdirSync(dir);
        dir = path.dirname(dir);
      }
    }
    return true;
  });
  // =========================== RESTORE-DE-FILE START ========================
  // Stellt eine DE-Datei aus dem Backup-Ordner wieder her
  ipcMain.handle('restore-de-file', async (event, relPath) => {
    const backupFile = path.join(deBackupPath, relPath);
    const targetFile = path.join(dePath, relPath);
    if (fs.existsSync(backupFile)) {
      fs.mkdirSync(path.dirname(targetFile), { recursive: true });
      fs.copyFileSync(backupFile, targetFile);
    }
    return targetFile;
  });
  // =========================== RESTORE-DE-FILE END ==========================
  // =========================== BACKUP-DE-FILE END =============================

  // =========================== SAVE-DE-FILE START ===========================
  // Speichert eine hochgeladene DE-Datei im richtigen Unterordner
  ipcMain.handle('save-de-file', async (event, /** @type {SaveDeFileArgs} */{ relPath, data }) => {
    try {
      // Absoluten Zielpfad aufbauen
      const target = path.resolve(dePath, relPath);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      // Vor dem Überschreiben alte Version in den History-Ordner kopieren
      if (fs.existsSync(target)) {
        historyUtils.saveVersion(deHistoryPath, relPath, target);
      }
      fs.writeFileSync(target, Buffer.from(data));
      return target;
    } catch (err) {
      // Fehler an den Renderer melden
      event.sender.send('save-error', err.message);
      throw err;
    }
  });

  // Speichert die hochgeladene Segment-Datei projektbezogen
  ipcMain.handle('save-segment-file', async (event, { projectId, data }) => {
    try {
      const name = `${projectId}.wav`;
      const target = path.join(segmentFolderPath, name);
      fs.writeFileSync(target, Buffer.from(data));
      return path.posix.join('Segments', name);
    } catch (err) {
      event.sender.send('save-error', err.message);
      throw err;
    }
  });

  // Verschiebt eine Datei innerhalb des Projekts
  ipcMain.handle('move-file', async (event, /** @type {MoveFileArgs} */{ src, dest }) => {
    // Zielpfad absolut bestimmen
    const target = path.resolve(projectRoot, dest);
    fs.mkdirSync(path.dirname(target), { recursive: true });

    // Versuche mehrmals, die Datei zu verschieben
    for (let i = 0; i < 5; i++) {
      try {
        fs.renameSync(src, target);
        return target;
      } catch (err) {
        // Bei EXDEV (unterschiedliche Laufwerke) kopieren wir
        if (err.code === 'EXDEV') {
          fs.copyFileSync(src, target);
          if (fs.existsSync(src)) fs.unlinkSync(src);
          return target;
        }
        // Bei gesperrten Dateien kurz warten und erneut versuchen
        if (err.code === 'EBUSY' || err.code === 'EPERM') {
          await new Promise(r => setTimeout(r, 200));
          continue;
        }
        // Wenn die Quelldatei fehlt, aber das Ziel existiert, nichts tun
        if (err.code === 'ENOENT' && fs.existsSync(target)) {
          return target;
        }
        throw err;
      }
    }

    // Fallback: kopieren und Quelle löschen
    fs.copyFileSync(src, target);
    if (fs.existsSync(src)) fs.unlinkSync(src);
    return target;
  });

  // Liefert die History-Dateien zu einer DE-Datei
  ipcMain.handle('list-de-history', async (event, relPath) => {
    return historyUtils.listVersions(deHistoryPath, relPath);
  });

  // Stellt eine gewählte History-Version wieder her und tauscht sie mit der aktuellen
  ipcMain.handle('restore-de-history', async (event, /** @type {RestoreDeHistoryArgs} */{ relPath, name }) => {
    return historyUtils.switchVersion(deHistoryPath, relPath, name, dePath);
  });

  // Speichert einen übergebenen Buffer als neue History-Version
  ipcMain.handle('save-de-history-buffer', async (event, /** @type {SaveDeHistoryBufferArgs} */{ relPath, data }) => {
    return historyUtils.saveBufferVersion(deHistoryPath, relPath, Buffer.from(data));
  });

  // =========================== DUPLICATE-HELPER START ========================
  // Liefert vorhandene Dateien mit gleicher Basis aber anderer Endung
  ipcMain.handle('get-de-duplicates', async (event, relPath) => {
    const base = relPath.replace(/\.(mp3|wav|ogg)$/i, '');
    const result = [];
    for (const ext of ['.mp3', '.wav', '.ogg']) {
      const p = path.join(dePath, base + ext);
      if (fs.existsSync(p)) {
        const stat = fs.statSync(p);
        const valid = pruefeAudiodatei(p);
        result.push({
          relPath: path.posix.join(base + ext),
          size: stat.size,
          mtime: stat.mtimeMs,
          valid,
        });
      }
    }
    return result;
  });

  // Loescht eine DE-Datei
  ipcMain.handle('delete-de-file', async (event, relPath) => {
    const target = path.join(dePath, relPath);
    if (fs.existsSync(target)) fs.unlinkSync(target);
    return true;
  });
  // =========================== DUPLICATE-HELPER END ==========================

  // Uebersetzt EN-Text nach DE ueber ein Python-Skript
  ipcMain.on('translate-text', (event, { id, text }) => {
    try {
      const proc = spawn(
        'python',
        [path.join(__dirname, '..', 'translate_text.py')],
        { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }
      );
      let out = '';
      proc.stdout.on('data', d => { out += d.toString(); });
      proc.on('close', code => {
        const result = code === 0 ? out.trim() : '';
        event.sender.send('translate-finished', { id, text: result });
      });
      proc.stdin.write(text);
      proc.stdin.end();
    } catch (e) {
      console.error('[Translate]', e);
      event.sender.send('translate-finished', { id, text: '' });
    }
  });

  // OCR via EasyOCR-Python-Skript
  ipcMain.handle('run-easyocr', async (event, buf) => {
    return await new Promise(resolve => {
      try {
        const proc = spawn(
          'python',
          [path.join(__dirname, '..', 'run_easyocr.py')],
          { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }
        );
        let out = '';
        proc.stdout.on('data', d => { out += d.toString(); });
        proc.on('close', code => resolve(code === 0 ? out.trim() : ''));
        proc.stdin.write(Buffer.from(buf));
        proc.stdin.end();
      } catch (e) {
        console.error('[EasyOCR]', e);
        resolve('');
      }
    });
  });
  // =========================== SAVE-DE-FILE END =============================

  // DevTools per IPC ein-/ausblenden
  ipcMain.on('toggle-devtools', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win.webContents.isDevToolsOpened()) {
      win.webContents.closeDevTools();
    } else {
      win.webContents.openDevTools();
    }
  });

  // =========================== START-HLA START ==============================
  // Startet Half-Life: Alyx oder den Workshop-Modus über ein Python-Skript
  ipcMain.handle('start-hla', async (event, { mode, lang, map }) => {
    return await new Promise(resolve => {
      try {
        const proc = spawn(
          'python',
          [path.join(__dirname, '..', 'launch_hla.py'), mode, lang || '', map || ''],
          { env: { ...process.env, PYTHONIOENCODING: 'utf-8' } }
        );
        proc.on('close', code => resolve(code === 0));
      } catch (e) {
        console.error('HL-Alyx Start fehlgeschlagen', e);
        resolve(false);
      }
    });
  });
  // =========================== START-HLA END ================================

  // Merkt gestartete Dubbing-Jobs
  ipcMain.on('dub-start', (event, info) => {
    // Vor jedem neuen Dubbing den Download-Ordner leeren
    clearDownloadFolder(DL_WATCH_PATH);
    // Modus speichern, um Beta-Jobs später bereinigen zu können
    pendingDubs.push({
      id: info.id,
      fileId: info.fileId,
      relPath: info.relPath,
      // Erwarteter Dateibasisname fuer den automatischen Import
      expectBase: path.parse(info.relPath).name,
      mode: info.mode || 'beta',
    });
  });

  mainWindow = createWindow();

  // Download-Ordner überwachen (automatischer Import)
  watchDownloadFolder(
    file => {
      if (mainWindow) {
        mainWindow.webContents.send('manual-file', file);
      }
    },
    {
      pending: pendingDubs,
      onDone: info => {
        if (mainWindow) mainWindow.webContents.send('dub-done', info);
      },
      onError: info => {
        if (mainWindow) mainWindow.webContents.send('dub-error', info);
      },
      log: msg => {
        console.log('[Watcher]', msg);
        if (mainWindow) mainWindow.webContents.send('dub-log', msg);
      },
      // Ohne Pfad-Option nutzt der Watcher automatisch DL_WATCH_PATH
    }
  );

  // Regelmäßige Status-Abfrage aller offenen Dubbings
  const apiKey = process.env.ELEVEN_API_KEY || '';
  setInterval(async () => {
    for (let i = pendingDubs.length - 1; i >= 0; i--) {
      const job = pendingDubs[i];
      // Halbautomatische Jobs werden hier nicht abgefragt
      if (job.mode === 'manual') continue;
      try {
        const ready = await isDubReady(job.id, 'de', apiKey);
        if (mainWindow) {
          mainWindow.webContents.send('dub-status', { fileId: job.fileId, ready });
        }
        // Bei fertig gerenderten Beta-Jobs Eintrag entfernen
        if (ready && job.mode !== 'manual') {
          pendingDubs.splice(i, 1);
        }
      } catch (e) {
        if (mainWindow) {
          mainWindow.webContents.send('dub-error', { fileId: job.fileId, error: e.message });
        }
      }
    }
  }, 15000);

  // Beim Beenden alle Shortcuts wieder freigeben
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
