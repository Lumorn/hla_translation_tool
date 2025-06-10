const { app, BrowserWindow, ipcMain, globalShortcut, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// =========================== USER-DATA-PFAD START ===========================
// Benutzer-Datenordner festlegen, damit lokale Daten auch nach einem Neustart
// verfügbar bleiben und nicht durch Zugriffsrechte im Standardpfad verloren gehen
const userDataPath = path.join(app.getPath('home'), '.hla_translation_tool');
fs.mkdirSync(userDataPath, { recursive: true });
app.setPath('userData', userDataPath);
// =========================== USER-DATA-PFAD END =============================

// Flag, ob die DevTools beim Start geöffnet werden sollen
const isDebug = process.argv.includes('--debug');

// Pfade zu EN und DE relativ zur HTML-Datei

function readAudioFiles(dir) {
  const result = [];
  function walk(current, rel = '') {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full, path.join(rel, entry.name));
      } else if (/\.(mp3|wav|ogg)$/i.test(entry.name)) {
        result.push({ fullPath: path.join(rel, entry.name) });
      }
    }
  }
  if (fs.existsSync(dir)) walk(dir);
  return result;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, '..', 'hla_translation_tool.html'));

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
}

app.whenReady().then(() => {
  // Basis- und Sprachordner relativ zur App bestimmen
  const projectBase = path.join(__dirname, '..', 'sounds');
  const enPath = path.join(projectBase, 'EN');
  const dePath = path.join(projectBase, 'DE');
  fs.mkdirSync(enPath, { recursive: true }); // EN-Ordner anlegen
  fs.mkdirSync(dePath, { recursive: true }); // DE-Ordner anlegen

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

  // DevTools per IPC ein-/ausblenden
  ipcMain.on('toggle-devtools', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win.webContents.isDevToolsOpened()) {
      win.webContents.closeDevTools();
    } else {
      win.webContents.openDevTools();
    }
  });

  createWindow();

  // Beim Beenden alle Shortcuts wieder freigeben
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
