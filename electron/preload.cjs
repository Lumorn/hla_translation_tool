console.log('[PRELOAD] start', __filename);
process.on('uncaughtException',  e => console.error('[PRELOAD] uncaught', e));
process.on('unhandledRejection', e => console.error('[PRELOAD] rejected', e));
// Startzeitpunkt protokollieren
console.log('[PRELOAD] gestartet', __filename);

// Vorab pruefen, ob 'require' verfuegbar ist
if (typeof require !== 'function') {
  console.warn('Preload-Skript: "require" ist nicht verf\u00fcgbar. Das Skript wird beendet.');
} else {
  const { contextBridge, ipcRenderer } = require('electron');
  const fs = require('fs');
  // 'node:path' nutzen, damit das integrierte Modul auch nach dem Packen gefunden wird
  const path = require('node:path');
  // Konfiguration dynamisch laden, damit der Pfad auch nach dem Packen stimmt
  const { DL_WATCH_PATH } = require(path.join(__dirname, '..', 'web', 'src', 'config.js'));

  // Unerwartete Fehler werden bereits oben abgefangen

  contextBridge.exposeInMainWorld('electronAPI', {
    versions: process.versions,
    openFolder: () => ipcRenderer.invoke('open-folder-dialog'),
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
    getDownloadPath: () => DL_WATCH_PATH,
    // Liefert Pfad-Informationen für das Debug-Fenster
    getDebugInfo: () => ipcRenderer.invoke('get-debug-info'),
    fsReadFile: p => fs.readFileSync(p),
    fsExists: p => fs.existsSync(p),
    join: (...segments) => path.join(...segments),
  });
  console.log('[Preload] erfolgreich geladen');
}
