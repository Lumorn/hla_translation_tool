// @ts-check
/**
 * Typdefinitionen für die IPC-Kommunikation importieren
 * @typedef {import('./ipcContracts').SaveDeFileArgs} SaveDeFileArgs
 * @typedef {import('./ipcContracts').SaveFileArgs} SaveFileArgs
 * @typedef {import('./ipcContracts').MoveFileArgs} MoveFileArgs
 * @typedef {import('./ipcContracts').RestoreDeHistoryArgs} RestoreDeHistoryArgs
 * @typedef {import('./ipcContracts').SaveDeHistoryBufferArgs} SaveDeHistoryBufferArgs
 */
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
    saveFile: (data, defaultPath) => ipcRenderer.invoke('save-file', /** @type {SaveFileArgs} */({ data, defaultPath })),
    // DE-Datei im Projektordner speichern
    saveDeFile: (relPath, data) => ipcRenderer.invoke('save-de-file', /** @type {SaveDeFileArgs} */({ relPath, data })),
    backupDeFile: (relPath) => ipcRenderer.invoke('backup-de-file', relPath),
    restoreDeFile: (relPath) => ipcRenderer.invoke('restore-de-file', relPath),
    deleteDeBackupFile: (relPath) => ipcRenderer.invoke('delete-de-backup-file', relPath),
    listDeHistory: (relPath) => ipcRenderer.invoke('list-de-history', relPath),
    restoreDeHistory: (relPath, name) => ipcRenderer.invoke('restore-de-history', /** @type {RestoreDeHistoryArgs} */({ relPath, name })),
    saveDeHistoryBuffer: (relPath, data) => ipcRenderer.invoke('save-de-history-buffer', /** @type {SaveDeHistoryBufferArgs} */({ relPath, data })),
    // Backup-Funktionen
    listBackups: () => ipcRenderer.invoke('list-backups'),
    saveBackup: (data) => ipcRenderer.invoke('save-backup', data),
    readBackup: (name) => ipcRenderer.invoke('read-backup', name),
    deleteBackup: (name) => ipcRenderer.invoke('delete-backup', name),
    listSoundBackups: () => ipcRenderer.invoke('list-sound-backups'),
    createSoundBackup: () => ipcRenderer.invoke('create-sound-backup'),
    deleteSoundBackup: (name) => ipcRenderer.invoke('delete-sound-backup', name),
    openBackupFolder: () => ipcRenderer.invoke('open-backup-folder'),
    moveFile: (src, dest) => ipcRenderer.invoke('move-file', /** @type {MoveFileArgs} */({ src, dest })),
    onManualFile: (cb) => ipcRenderer.on('manual-file', (e, file) => cb(file)),
    onDubDone: cb => ipcRenderer.on('dub-done', (e, info) => cb(info)),
    onDubError: cb => ipcRenderer.on('dub-error', (e, info) => cb(info)),
    onDubStatus: cb => ipcRenderer.on('dub-status', (e, info) => cb(info)),
    onDubLog: cb => ipcRenderer.on('dub-log', (e, msg) => cb(msg)),
    sendDubStart: info => ipcRenderer.send('dub-start', info),
    getDownloadPath: () => ipcRenderer.invoke('get-download-path'),
    // Liefert Pfad-Informationen für das Debug-Fenster
    getDebugInfo: () => ipcRenderer.invoke('get-debug-info'),
    fsReadFile: p => fs.readFileSync(p),
    fsExists: p => fs.existsSync(p),
    getDeDuplicates: rel => ipcRenderer.invoke('get-de-duplicates', rel),
    deleteDeFile: rel => ipcRenderer.invoke('delete-de-file', rel),
    onSaveError: cb => ipcRenderer.on('save-error', (e, msg) => cb(msg)),
    join: (...segments) => path.join(...segments),
    translateText: (id, text) => ipcRenderer.send('translate-text', { id, text }),
    onTranslateFinished: cb => ipcRenderer.on('translate-finished', (e, data) => cb(data)),
    // Half-Life: Alyx starten (Modus und Sprache wählbar, optional Map)
    startHla: (mode, lang, map) => ipcRenderer.invoke('start-hla', { mode, lang, map }),
    openExternal: (url) => ipcRenderer.invoke('open-external', url),
  });

  // API für Video-Bookmarks bereitstellen
  contextBridge.exposeInMainWorld('videoApi', {
    loadBookmarks: () => ipcRenderer.invoke('load-bookmarks'),
    saveBookmarks: list => ipcRenderer.invoke('save-bookmarks', list),
    // einzelnen Bookmark per Index löschen
    deleteBookmark: idx => ipcRenderer.invoke('delete-bookmark', idx),
  });
  console.log('[Preload] erfolgreich geladen');
}
