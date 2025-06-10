const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const config = require('./config.json');

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
}

app.whenReady().then(() => {
  ipcMain.handle('scan-folders', () => {
    const enPath = path.join(config.projectPath, config.enFolder);
    const dePath = path.join(config.projectPath, config.deFolder);
    return {
      enFiles: readAudioFiles(enPath),
      deFiles: readAudioFiles(dePath),
    };
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
