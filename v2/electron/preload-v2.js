const { contextBridge, ipcRenderer } = require('electron');

// Stellt Basisinformationen zur Laufzeit im Renderer zur Verfügung
contextBridge.exposeInMainWorld('runtimeInfo', {
  isElectron: Boolean(process?.versions?.electron),
  versions: process.versions,
});

// Stellt Dateisystem-Funktionen der Projektverwaltung bereit
contextBridge.exposeInMainWorld('projectStore', {
  createProject: (projectPath, options) => ipcRenderer.invoke('projectStore:create', projectPath, options),
  openProject: (projectPath) => ipcRenderer.invoke('projectStore:open', projectPath),
  closeProject: (sessionId) => ipcRenderer.invoke('projectStore:close', sessionId),
  readManifest: (sessionId) => ipcRenderer.invoke('projectStore:readManifest', sessionId),
  readSettings: (sessionId) => ipcRenderer.invoke('projectStore:readSettings', sessionId),
  writeSettings: (sessionId, settings) => ipcRenderer.invoke('projectStore:writeSettings', sessionId, settings),
  readData: (sessionId) => ipcRenderer.invoke('projectStore:readData', sessionId),
  writeData: (sessionId, data, logMessage) => ipcRenderer.invoke('projectStore:writeData', sessionId, data, logMessage),
  updateMetadata: (projectPath, updates) => ipcRenderer.invoke('projectStore:updateMetadata', projectPath, updates),
  createBackup: (sessionId) => ipcRenderer.invoke('projectStore:createBackup', sessionId),
  listBackups: (sessionId) => ipcRenderer.invoke('projectStore:listBackups', sessionId),
  restoreBackup: (sessionId, backupName) => ipcRenderer.invoke('projectStore:restoreBackup', sessionId, backupName),
  deleteBackup: (sessionId, backupName) => ipcRenderer.invoke('projectStore:deleteBackup', sessionId, backupName),
  createAudioSnapshot: (sessionId) => ipcRenderer.invoke('projectStore:createAudioSnapshot', sessionId),
  listAudioSnapshots: (sessionId) => ipcRenderer.invoke('projectStore:listAudioSnapshots', sessionId),
  restoreAudioSnapshot: (sessionId, snapshotName) =>
    ipcRenderer.invoke('projectStore:restoreAudioSnapshot', sessionId, snapshotName),
  deleteAudioSnapshot: (sessionId, snapshotName) =>
    ipcRenderer.invoke('projectStore:deleteAudioSnapshot', sessionId, snapshotName),
});

// Stellt die feste Projektbibliothek bereit
contextBridge.exposeInMainWorld('projectLibrary', {
  getRoot: () => ipcRenderer.invoke('projectLibrary:getRoot'),
  list: () => ipcRenderer.invoke('projectLibrary:list'),
  create: (projectName, options) => ipcRenderer.invoke('projectLibrary:create', projectName, options),
  update: (projectPath, updates) => ipcRenderer.invoke('projectLibrary:update', projectPath, updates),
});

// Stellt Funktionen des Import-Wizards bereit
contextBridge.exposeInMainWorld('importWizard', {
  start: (sessionId, selection) => ipcRenderer.invoke('importWizard:start', sessionId, selection),
  scan: (sessionId) => ipcRenderer.invoke('importWizard:scan', sessionId),
  audit: (sessionId) => ipcRenderer.invoke('importWizard:audit', sessionId),
  resolve: (sessionId, decisions) => ipcRenderer.invoke('importWizard:resolve', sessionId, decisions),
  execute: (sessionId) => ipcRenderer.invoke('importWizard:execute', sessionId),
  report: (sessionId) => ipcRenderer.invoke('importWizard:report', sessionId),
  cancel: (sessionId) => ipcRenderer.invoke('importWizard:cancel', sessionId),
  loadTemplate: (templateName) => ipcRenderer.invoke('importWizard:loadTemplate', templateName),
});

// Schnittstelle zum Öffnen der Bearbeitungsansicht bereitstellen
contextBridge.exposeInMainWorld('projectEditor', {
  open: (sessionId, projectName) => ipcRenderer.invoke('projectEditor:open', sessionId, projectName),
  close: (sessionId) => ipcRenderer.invoke('projectEditor:close', sessionId),
});

contextBridge.exposeInMainWorld('audioProcessing', {
  loadWaveform: (sessionId, fileName, options) =>
    ipcRenderer.invoke('audio:loadWaveform', sessionId, fileName, options),
  processClip: (sessionId, request) => ipcRenderer.invoke('audio:processClip', sessionId, request),
  duplicateClip: (sessionId, sourceFile, label) =>
    ipcRenderer.invoke('audio:duplicateClip', sessionId, sourceFile, label),
});
