// @ts-check
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const { resolveRenderer, resolveProjectsRoot } = require('../shared/appPaths');
const projectStore = require('../dist/backend/projectStore.js');
const audioProcessing = require('../dist/backend/audioProcessing.js');
const { ImportWizardSession } = require('../dist/importer/importWizard.js');

// Merkt sich aktive Sitzungen, um Sperren sauber aufzulösen
const activeSessions = new Map();
const sessionByPath = new Map();
const importSessions = new Map();
const editorWindows = new Map();
let projectLibraryRoot;

// Hilfsfunktion zum Aufräumen aller offenen Sitzungen
async function releaseAllSessions() {
  const sessions = Array.from(activeSessions.values());
  activeSessions.clear();
  sessionByPath.clear();
  importSessions.clear();
  editorWindows.forEach((win) => {
    if (win && !win.isDestroyed()) {
      win.close();
    }
  });
  editorWindows.clear();

  await Promise.all(
    sessions.map((session) =>
      projectStore
        .closeProject(session)
        .catch((error) => console.error('Projekt konnte beim Beenden nicht freigegeben werden:', error))
    )
  );
}

async function getProjectsLibraryRoot() {
  if (!projectLibraryRoot) {
    const resolved = resolveProjectsRoot();
    projectLibraryRoot = await projectStore.ensureProjectsLibrary(resolved);
  }
  return projectLibraryRoot;
}

// Hilfsfunktion für IPC-Zugriffe auf eine bestimmte Sitzung
function requireSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    throw new Error('Die Projektsitzung ist nicht mehr verfügbar.');
  }
  return session;
}

// Hilfsfunktion, um eine Import-Sitzung zu erhalten
function requireImportSession(sessionId) {
  const session = importSessions.get(sessionId);
  if (!session) {
    throw new Error('Es wurde noch kein Import für dieses Projekt gestartet.');
  }
  return session;
}

// Registriert alle IPC-Handler rund um die Projektverwaltung
function registerProjectIpc() {
  ipcMain.handle('projectStore:create', async (_event, projectPath, options) => {
    const result = await projectStore.createProject(projectPath, options);
    return result;
  });

  ipcMain.handle('projectStore:open', async (_event, projectPath) => {
    const resolvedPath = path.resolve(projectPath);
    if (sessionByPath.has(resolvedPath)) {
      throw new Error('Das Projekt ist bereits geöffnet.');
    }

    const snapshot = await projectStore.openProject(resolvedPath);
    activeSessions.set(snapshot.sessionId, snapshot);
    sessionByPath.set(snapshot.paths.root, snapshot.sessionId);

    const [manifest, settings, data] = await Promise.all([
      projectStore.readManifest(snapshot.paths),
      projectStore.readSettings(snapshot.paths),
      projectStore.readData(snapshot.paths),
    ]);

    return {
      sessionId: snapshot.sessionId,
      paths: snapshot.paths,
      manifest,
      settings,
      data,
    };
  });

  ipcMain.handle('projectStore:close', async (_event, sessionId) => {
    const session = requireSession(sessionId);
    const editor = editorWindows.get(sessionId);
    if (editor && !editor.isDestroyed()) {
      editor.close();
    }
    editorWindows.delete(sessionId);
    activeSessions.delete(sessionId);
    sessionByPath.delete(session.paths.root);
    importSessions.delete(sessionId);
    await projectStore.closeProject(session);
    return true;
  });

  ipcMain.handle('projectStore:readManifest', async (_event, sessionId) => {
    const session = requireSession(sessionId);
    return projectStore.readManifest(session.paths);
  });

  ipcMain.handle('projectStore:readSettings', async (_event, sessionId) => {
    const session = requireSession(sessionId);
    return projectStore.readSettings(session.paths);
  });

  ipcMain.handle('projectStore:writeSettings', async (_event, sessionId, settings) => {
    const session = requireSession(sessionId);
    await projectStore.writeSettings(session.paths, settings);
    return true;
  });

  ipcMain.handle('projectStore:readData', async (_event, sessionId) => {
    const session = requireSession(sessionId);
    return projectStore.readData(session.paths);
  });

  ipcMain.handle('projectStore:writeData', async (_event, sessionId, data, logMessage) => {
    const session = requireSession(sessionId);
    await projectStore.writeData(session.paths, data, logMessage);
    return true;
  });

  ipcMain.handle('projectStore:updateMetadata', async (_event, projectPath, updates) => {
    return projectStore.updateProjectMetadata(projectPath, updates ?? {});
  });

  ipcMain.handle('projectStore:createBackup', async (_event, sessionId) => {
    const session = requireSession(sessionId);
    const backupPath = await projectStore.createBackup(session.paths);
    return backupPath;
  });

  ipcMain.handle('projectStore:listBackups', async (_event, sessionId) => {
    const session = requireSession(sessionId);
    return projectStore.listBackups(session.paths);
  });

  ipcMain.handle('projectStore:restoreBackup', async (_event, sessionId, backupName) => {
    const session = requireSession(sessionId);
    await projectStore.restoreBackup(session.paths, backupName);
    return true;
  });

  ipcMain.handle('projectStore:deleteBackup', async (_event, sessionId, backupName) => {
    const session = requireSession(sessionId);
    await projectStore.deleteBackup(session.paths, backupName);
    return true;
  });

  ipcMain.handle('projectStore:createAudioSnapshot', async (_event, sessionId) => {
    const session = requireSession(sessionId);
    return projectStore.createAudioSnapshot(session.paths);
  });

  ipcMain.handle('projectStore:listAudioSnapshots', async (_event, sessionId) => {
    const session = requireSession(sessionId);
    return projectStore.listAudioSnapshots(session.paths);
  });

  ipcMain.handle('projectStore:restoreAudioSnapshot', async (_event, sessionId, snapshotName) => {
    const session = requireSession(sessionId);
    await projectStore.restoreAudioSnapshot(session.paths, snapshotName);
    return true;
  });

  ipcMain.handle('projectStore:deleteAudioSnapshot', async (_event, sessionId, snapshotName) => {
    const session = requireSession(sessionId);
    await projectStore.deleteAudioSnapshot(session.paths, snapshotName);
    return true;
  });

  ipcMain.handle('audio:loadWaveform', async (_event, sessionId, fileName, options) => {
    const session = requireSession(sessionId);
    return audioProcessing.loadWaveformPreview(session.paths, fileName, options);
  });

  ipcMain.handle('audio:processClip', async (_event, sessionId, request) => {
    const session = requireSession(sessionId);
    return audioProcessing.processAudioClip(session.paths, request);
  });

  ipcMain.handle('audio:duplicateClip', async (_event, sessionId, sourceFile, label) => {
    const session = requireSession(sessionId);
    return audioProcessing.duplicateForComparison(session.paths, sourceFile, label);
  });

  ipcMain.handle('projectLibrary:getRoot', async () => {
    return getProjectsLibraryRoot();
  });

  ipcMain.handle('projectLibrary:list', async () => {
    const root = await getProjectsLibraryRoot();
    return projectStore.listProjectsInLibrary(root);
  });

  ipcMain.handle('projectLibrary:create', async (_event, projectName, options) => {
    const root = await getProjectsLibraryRoot();
    return projectStore.createProjectInLibrary(root, projectName, options);
  });

  ipcMain.handle('projectLibrary:update', async (_event, projectPath, updates) => {
    return projectStore.updateProjectMetadata(projectPath, updates ?? {});
  });

  ipcMain.handle('importWizard:start', async (_event, sessionId, selection) => {
    const session = requireSession(sessionId);
    const wizard = new ImportWizardSession(session.paths);
    importSessions.set(sessionId, wizard);
    const state = await wizard.selectSources(selection);
    return state;
  });

  ipcMain.handle('importWizard:scan', async (_event, sessionId) => {
    const wizard = requireImportSession(sessionId);
    return wizard.scanSources();
  });

  ipcMain.handle('importWizard:audit', async (_event, sessionId) => {
    const wizard = requireImportSession(sessionId);
    return wizard.auditRecords();
  });

  ipcMain.handle('importWizard:resolve', async (_event, sessionId, decisions) => {
    const wizard = requireImportSession(sessionId);
    return wizard.resolveConflicts(decisions ?? {});
  });

  ipcMain.handle('importWizard:execute', async (_event, sessionId) => {
    const wizard = requireImportSession(sessionId);
    return wizard.executeImport();
  });

  ipcMain.handle('importWizard:report', async (_event, sessionId) => {
    const wizard = requireImportSession(sessionId);
    return wizard.finalize();
  });

  ipcMain.handle('importWizard:cancel', async (_event, sessionId) => {
    importSessions.delete(sessionId);
    return true;
  });

  ipcMain.handle('importWizard:loadTemplate', async (_event, templateName) => {
    if (typeof templateName !== 'string' || templateName.includes('..')) {
      throw new Error('Die angeforderte Vorlage ist ungültig.');
    }

    const templatePath = path.join(__dirname, '..', 'renderer', templateName);
    const content = await fs.readFile(templatePath, 'utf8');
    return content;
  });
}

registerProjectIpc();

// Öffnet oder fokussiert das Bearbeitungsfenster für ein Projekt
ipcMain.handle('projectEditor:open', async (_event, sessionId, projectName) => {
  const session = requireSession(sessionId);
  const existing = editorWindows.get(sessionId);
  if (existing && !existing.isDestroyed()) {
    existing.focus();
    return { opened: false, focused: true };
  }

  const editorWindow = createEditorWindow(session, projectName);
  editorWindows.set(sessionId, editorWindow);
  editorWindow.on('closed', () => {
    editorWindows.delete(sessionId);
  });
  return { opened: true, focused: true };
});

// Schließt das Bearbeitungsfenster eines Projekts
ipcMain.handle('projectEditor:close', async (_event, sessionId) => {
  const existing = editorWindows.get(sessionId);
  if (existing && !existing.isDestroyed()) {
    existing.close();
  }
  editorWindows.delete(sessionId);
  return true;
});

let isShuttingDown = false;

// Stellt sicher, dass Sperren vor dem Beenden entfernt werden
app.on('before-quit', (event) => {
  if (isShuttingDown) {
    return;
  }

  if (activeSessions.size === 0) {
    isShuttingDown = true;
    return;
  }

  event.preventDefault();
  isShuttingDown = true;
  releaseAllSessions()
    .then(() => app.quit())
    .catch((error) => {
      console.error('Projektsperren konnten beim Beenden nicht entfernt werden:', error);
      app.exit(1);
    });
});

// Erstellt das Hauptfenster der V2-Anwendung
function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-v2.js'),
      contextIsolation: true,
    },
  });

  // Nach dem Laden das Fenster sichtbar machen, um Flackern zu vermeiden
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Renderer-HTML-Datei aus dem V2-Verzeichnis laden
  mainWindow.loadFile(resolveRenderer('index.html'));

  return mainWindow;
}

function createEditorWindow(session, projectName) {
  const title = projectName ? `Projekt bearbeiten – ${projectName}` : 'Projekt bearbeiten';
  const editorWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-v2.js'),
      contextIsolation: true,
    },
  });

  editorWindow.once('ready-to-show', () => {
    editorWindow.show();
  });

  editorWindow.setTitle(title);
  const search = new URLSearchParams({
    sessionId: session.sessionId,
    projectName: projectName ?? '',
    projectRoot: session.paths.root,
  }).toString();
  editorWindow.loadFile(resolveRenderer('editor.html'), { search: `?${search}` });
  return editorWindow;
}

// Startpunkt der Electron-App mit üblichem Lebenszyklus für Windows/Linux/macOS
app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

// Anwendung für Windows/Linux schließen, sobald alle Fenster geschlossen sind
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Export nur für Tests oder externe Starter, um Wiederverwendung zu ermöglichen
module.exports = {
  createMainWindow,
  resolveRenderer: resolveRenderer,
};
