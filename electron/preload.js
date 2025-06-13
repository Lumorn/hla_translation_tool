const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  scanFolders: () => ipcRenderer.invoke('scan-folders'),
  // Befehl an Hauptprozess senden, um DevTools umzuschalten
  toggleDevTools: () => ipcRenderer.send('toggle-devtools'),
  // Datei speichern (z.B. Backup)
  saveFile: (data, defaultPath) => ipcRenderer.invoke('save-file', { data, defaultPath }),
  // DE-Datei im Projektordner speichern
  saveDeFile: (relPath, data) => ipcRenderer.invoke('save-de-file', { relPath, data }),
  backupDeFile: (relPath) => ipcRenderer.invoke('backup-de-file', relPath),
  restoreDeFile: (relPath) => ipcRenderer.invoke('restore-de-file', relPath),
  deleteDeBackupFile: (relPath) => ipcRenderer.invoke('delete-de-backup-file', relPath),
  listDeHistory: (relPath) => ipcRenderer.invoke('list-de-history', relPath),
  restoreDeHistory: (relPath, name) => ipcRenderer.invoke('restore-de-history', { relPath, name }),
  // Backup-Funktionen
  listBackups: () => ipcRenderer.invoke('list-backups'),
  saveBackup: (data) => ipcRenderer.invoke('save-backup', data),
  readBackup: (name) => ipcRenderer.invoke('read-backup', name),
  deleteBackup: (name) => ipcRenderer.invoke('delete-backup', name),
  openBackupFolder: () => ipcRenderer.invoke('open-backup-folder'),
  moveFile: (src, dest) => ipcRenderer.invoke('move-file', { src, dest }),
  onManualFile: (cb) => ipcRenderer.on('manual-file', (e, file) => cb(file)),
});
