const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

// Flag, ob die DevTools beim Start geöffnet werden sollen
const isDebug = process.argv.includes('--debug');

// Referenz auf das Hauptfenster speichern
let mainWindow;

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
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'hla_translation_tool.html'));

  // DevTools optional öffnen, wenn das Flag gesetzt ist
  if (isDebug) {
    mainWindow.webContents.openDevTools();
  }

  // Shortcut zum Ein- und Ausblenden der DevTools
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools();
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

  // DevTools auf Befehl aus dem Renderer umschalten
  ipcMain.on('toggle-devtools', () => {
    if (!mainWindow) return;
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools();
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
