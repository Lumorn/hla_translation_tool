const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  scanFolders: () => ipcRenderer.invoke('scan-folders'),
  // Befehl an Hauptprozess senden, um DevTools umzuschalten
  toggleDevTools: () => ipcRenderer.send('toggle-devtools'),
  // Datei speichern (z.B. Backup)
  saveFile: (data, defaultPath) => ipcRenderer.invoke('save-file', { data, defaultPath }),
  // DE-Datei im Projektordner speichern
  saveDeFile: (relPath, data) => ipcRenderer.invoke('save-de-file', { relPath, data }),
  // Backup-Funktionen
  listBackups: () => ipcRenderer.invoke('list-backups'),
  saveBackup: (data) => ipcRenderer.invoke('save-backup', data),
  readBackup: (name) => ipcRenderer.invoke('read-backup', name),
  deleteBackup: (name) => ipcRenderer.invoke('delete-backup', name),
});
