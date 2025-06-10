const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  scanFolders: () => ipcRenderer.invoke('scan-folders'),
  // DevTools im Hauptprozess ein- oder ausschalten
  toggleDevTools: () => ipcRenderer.send('toggle-devtools'),
});
