const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  scanFolders: () => ipcRenderer.invoke('scan-folders'),
});
