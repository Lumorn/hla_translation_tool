const { app, BrowserWindow, ipcMain, globalShortcut, dialog, shell } = require('electron');
// 'node:path' nutzen, damit das integrierte Modul auch nach dem Packen gefunden wird
const path = require('node:path'); // Pfadmodul einbinden
const fs = require('fs');
const { execSync, spawnSync } = require('child_process');
// Lade Konfiguration relativ zum aktuellen Verzeichnis
const { DL_WATCH_PATH, projectRoot, SOUNDS_BASE_PATH, soundsDirName } = require(path.join(__dirname, '..', 'web', 'src', 'config.js'));
const { chooseExisting } = require('../pathUtils');
// Nach dem Laden der Projektwurzel pruefen wir auf Gross-/Kleinschreibung.
// Backups koennen ebenfalls groß oder klein geschrieben sein.
const backupsDirName = chooseExisting(projectRoot, ['Backups', 'backups']);
const historyUtils = require('../historyUtils');
const { watchDownloadFolder, clearDownloadFolder } = require('../watcher.js');
const { isDubReady } = require('../elevenlabs.js');
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
// Zusätzlichen Ordner für Session-Daten anlegen und verwenden,
// um Cache-Fehler wie "Unable to move the cache" zu vermeiden
const sessionDataPath = path.join(userDataPath, 'SessionData');
fs.mkdirSync(sessionDataPath, { recursive: true });
app.setPath('sessionData', sessionDataPath);
// =========================== USER-DATA-PFAD END =============================


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

function createWindow() {
  const win = new BrowserWindow({
    // Fensterbreite etwas vergrößern, damit Play- und Stop-Knopf Platz haben
    width: 1300,
    height: 800,
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
  ipcMain.handle('save-file', async (event, { data, defaultPath }) => {
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

  // Backup-Ordner im Dateimanager öffnen
  ipcMain.handle('open-backup-folder', async () => {
    shell.openPath(backupPath);
    return true;
  });

  // Pfad des projektinternen Download-Ordners liefern
  ipcMain.handle('get-download-path', () => {
    // Der Download-Ordner liegt im Web-Verzeichnis des Projekts
    return DL_WATCH_PATH;
  });

  // =========================== DEBUG-INFO START =============================
  // Liefert Pfad-Informationen für das Debug-Fenster
  ipcMain.handle('get-debug-info', () => {
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
      oldBackupPath,
      downloadWatchPath: DL_WATCH_PATH,
      appVersion: app.getVersion(),
      nodeVersion: process.version,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      processPlatform: process.platform,
      cpuArch: process.arch,
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
  ipcMain.handle('save-de-file', async (event, { relPath, data }) => {
    // Absoluten Zielpfad aufbauen
    const target = path.resolve(dePath, relPath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    // Vor dem Überschreiben alte Version in den History-Ordner kopieren
    if (fs.existsSync(target)) {
      historyUtils.saveVersion(deHistoryPath, relPath, target);
    }
    fs.writeFileSync(target, Buffer.from(data));
    return target;
  });

  // Verschiebt eine Datei innerhalb des Projekts
  ipcMain.handle('move-file', async (event, { src, dest }) => {
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
  ipcMain.handle('restore-de-history', async (event, { relPath, name }) => {
    return historyUtils.switchVersion(deHistoryPath, relPath, name, dePath);
  });

  // Speichert einen übergebenen Buffer als neue History-Version
  ipcMain.handle('save-de-history-buffer', async (event, { relPath, data }) => {
    return historyUtils.saveBufferVersion(deHistoryPath, relPath, Buffer.from(data));
  });

  // Uebersetzt EN-Text nach DE ueber ein Python-Skript
  ipcMain.handle('translate-text', async (event, text) => {
    try {
      const result = spawnSync(
        'python',
        [path.join(__dirname, '..', 'translate_text.py')],
        {
          input: text,
          encoding: 'utf8',
          env: { ...process.env, PYTHONIOENCODING: 'utf-8' },
        }
      );
      if (result.status === 0) {
        return result.stdout.trim();
      }
      console.error('[Translate]', result.stderr);
    } catch (e) {
      console.error('[Translate]', e);
    }
    return '';
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
