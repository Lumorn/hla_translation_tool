const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  scanFolders: () => ipcRenderer.invoke('scan-folders'),
  // Befehl an Hauptprozess senden, um DevTools umzuschalten
  toggleDevTools: () => ipcRenderer.send('toggle-devtools'),
});
