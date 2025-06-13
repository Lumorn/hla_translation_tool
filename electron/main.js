const { app, BrowserWindow, ipcMain, globalShortcut, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { DL_WATCH_PATH, projectRoot } = require('../web/src/config.js');
const { chooseExisting } = require('../pathUtils');
// Nach dem Laden der Projektwurzel pruefen wir auf Gross-/Kleinschreibung.
// Ist ein Ordner nur mit großem Anfangsbuchstaben vorhanden, wird dieser verwendet.
const soundsDirName = chooseExisting(projectRoot, ['Sounds', 'sounds']);
const backupsDirName = chooseExisting(projectRoot, ['Backups', 'backups']);
const historyUtils = require('../historyUtils');
const { watchDownloadFolder } = require('../web/src/watcher.js');
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

// Flag, ob die DevTools beim Start geöffnet werden sollen
const isDebug = process.argv.includes('--debug');

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
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, '..', 'web', 'hla_translation_tool.html'));

  // DevTools optional öffnen, wenn das Flag gesetzt ist
  if (isDebug) {
    win.webContents.openDevTools();
  }

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
  const projectBase = path.resolve(projectRoot, soundsDirName);
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

  // =========================== DEBUG-INFO START =============================
  // Liefert Pfad-Informationen für das Debug-Fenster
  ipcMain.handle('get-debug-info', () => {
    const soundsPath = path.resolve(projectRoot, soundsDirName);
    const backupsPath = path.resolve(projectRoot, backupsDirName);
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
    fs.renameSync(src, target);
    // Sicherheitshalber alten Pfad löschen
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

  mainWindow = createWindow();

  // Download-Ordner überwachen und Renderer informieren
  watchDownloadFolder(file => {
    if (mainWindow) {
      mainWindow.webContents.send('manual-file', file);
    }
  });

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
