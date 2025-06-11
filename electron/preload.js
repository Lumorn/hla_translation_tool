const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  scanFolders: () => ipcRenderer.invoke('scan-folders'),
  // Befehl an Hauptprozess senden, um DevTools umzuschalten
  toggleDevTools: () => ipcRenderer.send('toggle-devtools'),
  // Datei speichern (z.B. ZIP oder Backup)
  saveFile: (data, defaultPath) => ipcRenderer.invoke('save-file', { data, defaultPath }),
  // DE-Datei im Projektordner speichern
  saveDeFile: (relPath, data) => ipcRenderer.invoke('save-de-file', { relPath, data }),
});
