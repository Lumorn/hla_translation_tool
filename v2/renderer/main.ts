import type {
  CreateProjectOptions,
  ProjectBackupInfo,
  ProjectAudioBackupInfo,
  ProjectData,
  ProjectManifest,
  ProjectPaths,
  ProjectSettings,
  ProjectLibraryEntry,
  ProjectLibraryCreateResult,
} from '../backend/projectStore';
import type {
  ImportDecision,
  ImportSourceSelection,
  ImportWizardState,
} from '../importer/importWizard';

declare global {
  interface Window {
    runtimeInfo?: {
      isElectron?: boolean;
      versions?: Record<string, string>;
    };
    process?: {
      versions?: Record<string, string | undefined>;
    };
    projectStore?: ProjectStoreBridge;
    projectLibrary?: ProjectLibraryBridge;
    importWizard?: ImportWizardBridge;
    __HLA_DEMO__?: boolean;
    __HLA_DEMO_AUTO_OPEN__?: string;
  }
}

interface ProjectOpenResult {
  sessionId: string;
  paths: ProjectPaths;
  manifest: ProjectManifest;
  settings: ProjectSettings;
  data: ProjectData;
}

interface ProjectStoreBridge {
  createProject: (projectPath: string, options?: CreateProjectOptions) => Promise<ProjectPaths>;
  openProject: (projectPath: string) => Promise<ProjectOpenResult>;
  closeProject: (sessionId: string) => Promise<boolean>;
  readManifest: (sessionId: string) => Promise<ProjectManifest>;
  readSettings: (sessionId: string) => Promise<ProjectSettings>;
  writeSettings: (sessionId: string, settings: ProjectSettings) => Promise<boolean>;
  readData: (sessionId: string) => Promise<ProjectData>;
  writeData: (sessionId: string, data: ProjectData, logMessage?: string) => Promise<boolean>;
  createBackup: (sessionId: string) => Promise<ProjectBackupInfo>;
  listBackups: (sessionId: string) => Promise<ProjectBackupInfo[]>;
  restoreBackup: (sessionId: string, backupName: string) => Promise<boolean>;
  deleteBackup: (sessionId: string, backupName: string) => Promise<boolean>;
  createAudioSnapshot: (sessionId: string) => Promise<ProjectAudioBackupInfo>;
  listAudioSnapshots: (sessionId: string) => Promise<ProjectAudioBackupInfo[]>;
  restoreAudioSnapshot: (sessionId: string, snapshotName: string) => Promise<boolean>;
  deleteAudioSnapshot: (sessionId: string, snapshotName: string) => Promise<boolean>;
}

interface ProjectLibraryBridge {
  getRoot: () => Promise<string>;
  list: () => Promise<ProjectLibraryEntry[]>;
  create: (projectName: string, options?: CreateProjectOptions) => Promise<ProjectLibraryCreateResult>;
}

interface ImportWizardBridge {
  start: (sessionId: string, selection: ImportSourceSelection) => Promise<ImportWizardState>;
  scan: (sessionId: string) => Promise<ImportWizardState>;
  audit: (sessionId: string) => Promise<ImportWizardState>;
  resolve: (sessionId: string, decisions: Record<string, ImportDecision>) => Promise<ImportWizardState>;
  execute: (sessionId: string) => Promise<ImportWizardState>;
  report: (sessionId: string) => Promise<ImportWizardState>;
  cancel: (sessionId: string) => Promise<boolean>;
  loadTemplate: (templateName: string) => Promise<string>;
}

const statusElement = document.getElementById('status');
const versionHintElement = document.getElementById('version-hint');
const storageStatusElement = document.getElementById('storage-status');
const projectInfoElement = document.getElementById('project-info');
const libraryLocationElement = document.getElementById('project-library-location');
const libraryListElement = document.getElementById('project-library-entries') as HTMLUListElement | null;
const refreshLibraryButton = document.getElementById('refresh-library-button') as HTMLButtonElement | null;
const createProjectForm = document.getElementById('project-create-form') as HTMLFormElement | null;
const createProjectInput = createProjectForm?.querySelector('input[name="projectName"]') as HTMLInputElement | null;
const createProjectButton = document.getElementById('create-project-button') as HTMLButtonElement | null;
const projectForm = document.getElementById('project-open-form') as HTMLFormElement | null;
const projectPathInput = projectForm?.querySelector('input[name="projectPath"]') as HTMLInputElement | null;
const openProjectButton = document.getElementById('open-project-button') as HTMLButtonElement | null;
const closeProjectButton = document.getElementById('close-project-button') as HTMLButtonElement | null;
const backupSection = document.getElementById('backup-section');
const backupInfoElement = document.getElementById('backup-info');
const backupTableBody = document.getElementById('backup-table-body') as HTMLTableSectionElement | null;
const createBackupButton = document.getElementById('create-backup-button') as HTMLButtonElement | null;
const refreshBackupsButton = document.getElementById('refresh-backups-button') as HTMLButtonElement | null;
const audioSection = document.getElementById('audio-backup-section');
const audioInfoElement = document.getElementById('audio-backup-info');
const audioTableBody = document.getElementById('audio-backup-table-body') as HTMLTableSectionElement | null;
const createAudioSnapshotButton = document.getElementById('create-audio-snapshot-button') as HTMLButtonElement | null;
const refreshAudioSnapshotsButton = document.getElementById('refresh-audio-snapshots-button') as HTMLButtonElement | null;
const wizardRoot = document.getElementById('import-wizard-root');

let activeProject: ProjectOpenResult | undefined;
let currentImportState: ImportWizardState | undefined;
let wizardInitialized = false;
const conflictDecisions = new Map<string, ImportDecision>();
let projectLibraryEntries: ProjectLibraryEntry[] = [];
let selectedProjectPath: string | undefined;
let projectLibraryRoot: string | undefined;

const wizardElements: {
  form: HTMLFormElement | null;
  progress: HTMLElement | null;
  conflicts: HTMLElement | null;
  actions: HTMLElement | null;
  runButton: HTMLButtonElement | null;
  cancelButton: HTMLButtonElement | null;
  report: HTMLElement | null;
} = {
  form: null,
  progress: null,
  conflicts: null,
  actions: null,
  runButton: null,
  cancelButton: null,
  report: null,
};

function ensureElectronRuntime(): void {
  if (window.__HLA_DEMO__) {
    if (statusElement) {
      statusElement.textContent = 'Demomodus aktiv – Browserlaufzeit wird bewusst zugelassen.';
    }
    return;
  }

  const runtimeInfo = window.runtimeInfo;
  const electronFromBridge = runtimeInfo?.isElectron === true;
  const electronFromProcess = Boolean(window.process?.versions?.electron);

  if (electronFromBridge || electronFromProcess) {
    return;
  }

  const message = 'Dieser Renderer darf nur innerhalb der Electron-App ausgeführt werden. Bitte verwende "npm run start:v2".';
  if (statusElement) {
    statusElement.textContent = message;
  }

  throw new Error('Electron-Laufzeit wurde nicht gefunden.');
}

function ensureProjectStoreBridge(): void {
  if (!storageStatusElement) {
    return;
  }

  if (!window.projectStore) {
    storageStatusElement.textContent = 'Projektverwaltung nicht verfügbar – Dateifunktionen sind deaktiviert.';
    throw new Error('Projekt-Bridge wurde nicht gefunden.');
  }

  if (!window.projectLibrary) {
    storageStatusElement.textContent = 'Projektbibliothek nicht verfügbar – Projektauswahl deaktiviert.';
    throw new Error('Projektbibliothek wurde nicht gefunden.');
  }

  storageStatusElement.textContent =
    'Projektverwaltung verbunden – Projekte werden aus der Bibliothek geladen.';
}

function ensureImportWizardBridge(): void {
  if (!window.importWizard) {
    throw new Error('Der Import-Assistent steht nicht zur Verfügung.');
  }
}

function updateVersionHint(): void {
  const versions = window.runtimeInfo?.versions;
  if (!versionHintElement || !versions) {
    return;
  }

  const electronVersion = versions.electron;
  const chromeVersion = versions.chrome;
  const nodeVersion = versions.node;

  versionHintElement.textContent = `Electron ${electronVersion ?? 'unbekannt'} · Chromium ${chromeVersion ?? 'unbekannt'} · Node ${nodeVersion ?? 'unbekannt'}`;
}

async function setupImportWizardUI(): Promise<void> {
  if (!wizardRoot) {
    return;
  }

  ensureImportWizardBridge();

  if (!wizardInitialized) {
    try {
      const templateContent = await window.importWizard!.loadTemplate('importWizard.vue');
      const templateHtml = extractTemplate(templateContent);
      wizardRoot.innerHTML = templateHtml;
    } catch (error) {
      console.error('Import-Vorlage konnte nicht geladen werden:', error);
      return;
    }

    wizardElements.form = wizardRoot.querySelector('#import-source-form');
    wizardElements.progress = wizardRoot.querySelector('#import-progress');
    wizardElements.conflicts = wizardRoot.querySelector('#import-conflicts');
    wizardElements.actions = wizardRoot.querySelector('#import-actions');
    wizardElements.runButton = wizardRoot.querySelector('#import-run-button');
    wizardElements.cancelButton = wizardRoot.querySelector('#import-cancel-button');
    wizardElements.report = wizardRoot.querySelector('#import-report');

    wizardElements.form?.addEventListener('submit', handleImportStart);
    wizardElements.cancelButton?.addEventListener('click', handleImportReset);
    wizardElements.runButton?.addEventListener('click', handleImportExecution);

    wizardInitialized = true;
  }

  wizardRoot.classList.remove('hidden');
  resetImportWizardUI();
}

function resetImportWizardUI(): void {
  currentImportState = undefined;
  conflictDecisions.clear();

  if (wizardElements.form) {
    wizardElements.form.reset();
  }
  if (wizardElements.progress) {
    wizardElements.progress.innerHTML = '';
  }
  if (wizardElements.conflicts) {
    wizardElements.conflicts.innerHTML = '';
  }
  if (wizardElements.report) {
    wizardElements.report.innerHTML = '';
  }
  if (wizardElements.runButton) {
    wizardElements.runButton.disabled = true;
  }
}

function hideImportWizard(): void {
  if (wizardRoot) {
    wizardRoot.classList.add('hidden');
  }
  resetImportWizardUI();
}

function setProjectInfo(message: string): void {
  if (projectInfoElement) {
    projectInfoElement.textContent = message;
  }
}

function toggleBackupControls(disabled: boolean): void {
  if (createBackupButton) {
    createBackupButton.disabled = disabled;
  }
  if (refreshBackupsButton) {
    refreshBackupsButton.disabled = disabled;
  }
  if (backupTableBody) {
    const actionButtons = backupTableBody.querySelectorAll('button');
    actionButtons.forEach((button) => {
      button.disabled = disabled;
    });
  }
}

function toggleAudioControls(disabled: boolean): void {
  if (createAudioSnapshotButton) {
    createAudioSnapshotButton.disabled = disabled;
  }
  if (refreshAudioSnapshotsButton) {
    refreshAudioSnapshotsButton.disabled = disabled;
  }
  if (audioTableBody) {
    const actionButtons = audioTableBody.querySelectorAll('button');
    actionButtons.forEach((button) => {
      button.disabled = disabled;
    });
  }
}

function updateLibraryLocation(location: string): void {
  if (libraryLocationElement) {
    libraryLocationElement.textContent = `Projektbibliothek: ${location}`;
  }
}

function renderProjectLibrary(): void {
  if (!libraryListElement) {
    return;
  }

  if (projectLibraryEntries.length === 0) {
    libraryListElement.innerHTML =
      '<li class="project-library__item project-library__item--empty">Noch keine Projekte vorhanden.</li>';
    return;
  }

  const items = projectLibraryEntries
    .map((entry) => {
      const classes = ['project-library__item'];
      if (entry.path === selectedProjectPath) {
        classes.push('is-selected');
      }
      if (entry.hasLock) {
        classes.push('is-locked');
      }

      const updated = entry.manifest.updatedAt
        ? new Date(entry.manifest.updatedAt).toLocaleString('de-DE')
        : 'unbekannt';

      return `<li class="${classes.join(' ')}" data-path="${escapeHtml(entry.path)}" data-locked="${
        entry.hasLock ? 'true' : 'false'
      }">
        <button type="button" class="project-library__select" data-path="${escapeHtml(entry.path)}">
          <span class="project-library__name">${escapeHtml(entry.manifest.name ?? entry.folderName)}</span>
          <span class="project-library__meta">${escapeHtml(entry.folderName)} · Aktualisiert am ${escapeHtml(updated)}</span>
          ${entry.hasLock ? '<span class="project-library__badge">In Verwendung</span>' : ''}
        </button>
      </li>`;
    })
    .join('');

  libraryListElement.innerHTML = items;
}

function setSelectedProject(path?: string, entry?: ProjectLibraryEntry): void {
  selectedProjectPath = path;
  if (!entry && path) {
    entry = projectLibraryEntries.find((item) => item.path === path);
  }

  if (projectPathInput) {
    projectPathInput.value = path ?? '';
  }

  const isLocked = entry?.hasLock ?? false;

  if (openProjectButton) {
    openProjectButton.disabled = Boolean(activeProject) || !path || isLocked;
  }

  renderProjectLibrary();

  if (!activeProject) {
    if (path && entry) {
      const updated = entry.manifest.updatedAt
        ? new Date(entry.manifest.updatedAt).toLocaleString('de-DE')
        : 'unbekannt';
      if (isLocked) {
        setProjectInfo(
          `Ausgewählt: ${entry.manifest.name} (${entry.folderName}) – bereits durch eine andere Sitzung gesperrt.`
        );
      } else {
        setProjectInfo(`Ausgewählt: ${entry.manifest.name} (${entry.folderName}) · Aktualisiert am ${updated}.`);
      }
    } else if (path) {
      setProjectInfo(`Projekt ausgewählt: ${path}`);
    } else {
      setProjectInfo('Kein Projekt ausgewählt.');
    }
  }
}

async function loadProjectLibrary(): Promise<void> {
  if (!window.projectLibrary) {
    return;
  }

  try {
    if (!projectLibraryRoot) {
      projectLibraryRoot = await window.projectLibrary.getRoot();
      updateLibraryLocation(projectLibraryRoot);
    }

    const entries = await window.projectLibrary.list();
    projectLibraryEntries = entries;

    if (activeProject) {
      selectedProjectPath = activeProject.paths.root;
    } else if (selectedProjectPath && !entries.some((entry) => entry.path === selectedProjectPath)) {
      selectedProjectPath = undefined;
    }

    renderProjectLibrary();

    if (!selectedProjectPath && projectLibraryEntries.length > 0 && !activeProject) {
      const firstEntry = projectLibraryEntries[0];
      setSelectedProject(firstEntry.path, firstEntry);
    } else if (selectedProjectPath) {
      const current = projectLibraryEntries.find((entry) => entry.path === selectedProjectPath);
      if (current) {
        setSelectedProject(selectedProjectPath, current);
      } else if (!activeProject) {
        setProjectInfo('Kein Projekt ausgewählt.');
      }
    }
  } catch (error) {
    console.error('Projektbibliothek konnte nicht geladen werden:', error);
    if (libraryLocationElement) {
      libraryLocationElement.textContent = `Projektbibliothek konnte nicht geladen werden: ${(error as Error).message}`;
    }
    if (libraryListElement) {
      libraryListElement.innerHTML =
        '<li class="project-library__item is-error">Fehler beim Laden der Projektliste.</li>';
    }
  }
}

function handleLibraryClick(event: Event): void {
  if (!(event.target instanceof HTMLElement)) {
    return;
  }

  const button = event.target.closest('button.project-library__select');
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const path = button.dataset.path;
  if (!path) {
    return;
  }

  const entry = projectLibraryEntries.find((item) => item.path === path);
  setSelectedProject(path, entry);
}

async function handleProjectCreate(event: Event): Promise<void> {
  event.preventDefault();

  if (!window.projectLibrary || !createProjectInput) {
    return;
  }

  const name = createProjectInput.value.trim();
  if (!name) {
    setProjectInfo('Bitte gib einen Projektnamen ein.');
    return;
  }

  if (createProjectButton) {
    createProjectButton.disabled = true;
  }

  setProjectInfo(`Lege Projekt "${name}" an …`);

  try {
    const created = await window.projectLibrary.create(name);
    selectedProjectPath = created.path;
    await loadProjectLibrary();
    const entry = projectLibraryEntries.find((item) => item.path === created.path);
    setSelectedProject(created.path, entry);
    createProjectForm?.reset();
    setProjectInfo(`Projekt "${created.manifest.name}" wurde angelegt.`);
  } catch (error) {
    console.error('Projekt konnte nicht angelegt werden:', error);
    setProjectInfo(`Projekt konnte nicht angelegt werden: ${(error as Error).message}`);
  } finally {
    if (createProjectButton) {
      createProjectButton.disabled = false;
    }
  }
}

function toggleProjectControls(disabled: boolean): void {
  if (openProjectButton) {
    const entry = selectedProjectPath
      ? projectLibraryEntries.find((item) => item.path === selectedProjectPath)
      : undefined;
    const isLocked = entry?.hasLock ?? false;
    openProjectButton.disabled = disabled || Boolean(activeProject) || !selectedProjectPath || isLocked;
  }
  toggleBackupControls(disabled || !activeProject);
  toggleAudioControls(disabled || !activeProject);
}

function toggleBackupSection(visible: boolean): void {
  if (!backupSection) {
    return;
  }
  if (visible) {
    backupSection.classList.remove('hidden');
  } else {
    backupSection.classList.add('hidden');
  }
}

function setBackupInfo(message: string): void {
  if (backupInfoElement) {
    backupInfoElement.textContent = message;
  }
}

function toggleAudioSection(visible: boolean): void {
  if (!audioSection) {
    return;
  }
  if (visible) {
    audioSection.classList.remove('hidden');
  } else {
    audioSection.classList.add('hidden');
  }
}

function setAudioInfo(message: string): void {
  if (audioInfoElement) {
    audioInfoElement.textContent = message;
  }
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

function renderBackupList(entries: ProjectBackupInfo[]): void {
  if (!backupTableBody) {
    return;
  }

  backupTableBody.innerHTML = '';

  if (entries.length === 0) {
    setBackupInfo('Noch keine Backups vorhanden.');
    return;
  }

  const rows = document.createDocumentFragment();

  entries.forEach((entry) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${entry.name}</td>
      <td>${new Date(entry.createdAt).toLocaleString('de-DE')}</td>
      <td>${formatBytes(entry.size)}</td>
      <td class="backup-actions">
        <button data-action="restore" data-name="${entry.name}">Wiederherstellen</button>
        <button class="secondary" data-action="delete" data-name="${entry.name}">Löschen</button>
      </td>
    `;
    rows.appendChild(row);
  });

  backupTableBody.appendChild(rows);
  setBackupInfo(`${entries.length} Backup(s) geladen.`);
}

function renderAudioSnapshotList(entries: ProjectAudioBackupInfo[]): void {
  if (!audioTableBody) {
    return;
  }

  audioTableBody.innerHTML = '';

  if (entries.length === 0) {
    setAudioInfo('Noch keine Audio-Schnappschüsse vorhanden.');
    return;
  }

  const rows = document.createDocumentFragment();

  entries.forEach((entry) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${entry.name}</td>
      <td>${new Date(entry.createdAt).toLocaleString('de-DE')}</td>
      <td>${formatBytes(entry.size)}</td>
      <td class="backup-actions">
        <button data-action="restore" data-name="${entry.name}">Wiederherstellen</button>
        <button class="secondary" data-action="delete" data-name="${entry.name}">Löschen</button>
      </td>
    `;
    rows.appendChild(row);
  });

  audioTableBody.appendChild(rows);
  setAudioInfo(`${entries.length} Audio-Schnappschuss(e) geladen.`);
}

async function loadBackups(): Promise<void> {
  if (!activeProject || !window.projectStore) {
    toggleBackupSection(false);
    setBackupInfo('Kein Projekt ausgewählt.');
    return;
  }

  toggleBackupSection(true);
  toggleBackupControls(true);
  setBackupInfo('Lade Backups …');

  try {
    const entries = await window.projectStore.listBackups(activeProject.sessionId);
    renderBackupList(entries);
  } catch (error) {
    console.error('Backups konnten nicht geladen werden:', error);
    setBackupInfo(`Fehler beim Laden der Backups: ${(error as Error).message}`);
    renderBackupList([]);
  } finally {
    toggleBackupControls(false);
  }
}

async function loadAudioBackups(): Promise<void> {
  if (!activeProject || !window.projectStore) {
    toggleAudioSection(false);
    setAudioInfo('Kein Projekt ausgewählt.');
    return;
  }

  toggleAudioSection(true);
  toggleAudioControls(true);
  setAudioInfo('Lade Audio-Schnappschüsse …');

  try {
    const entries = await window.projectStore.listAudioSnapshots(activeProject.sessionId);
    renderAudioSnapshotList(entries);
  } catch (error) {
    console.error('Audio-Schnappschüsse konnten nicht geladen werden:', error);
    setAudioInfo(`Fehler beim Laden der Audio-Schnappschüsse: ${(error as Error).message}`);
    renderAudioSnapshotList([]);
  } finally {
    toggleAudioControls(false);
  }
}

async function handleCreateBackup(): Promise<void> {
  if (!activeProject || !window.projectStore || !createBackupButton) {
    return;
  }

  createBackupButton.disabled = true;
  setBackupInfo('Erstelle Backup …');

  try {
    const info = await window.projectStore.createBackup(activeProject.sessionId);
    setBackupInfo(`Backup "${info.name}" erstellt (${formatBytes(info.size)}).`);
    await loadBackups();
  } catch (error) {
    console.error('Backup konnte nicht erstellt werden:', error);
    setBackupInfo(`Backup fehlgeschlagen: ${(error as Error).message}`);
  } finally {
    createBackupButton.disabled = false;
  }
}

async function handleCreateAudioSnapshot(): Promise<void> {
  if (!activeProject || !window.projectStore || !createAudioSnapshotButton) {
    return;
  }

  createAudioSnapshotButton.disabled = true;
  setAudioInfo('Erstelle Audio-Schnappschuss …');

  try {
    const info = await window.projectStore.createAudioSnapshot(activeProject.sessionId);
    setAudioInfo(`Audio-Schnappschuss "${info.name}" erstellt (${formatBytes(info.size)}).`);
    await loadAudioBackups();
  } catch (error) {
    console.error('Audio-Schnappschuss konnte nicht erstellt werden:', error);
    setAudioInfo(`Audio-Schnappschuss fehlgeschlagen: ${(error as Error).message}`);
  } finally {
    createAudioSnapshotButton.disabled = false;
  }
}

async function handleBackupTableClick(event: Event): Promise<void> {
  if (!(event.target instanceof HTMLButtonElement)) {
    return;
  }

  const button = event.target;
  const action = button.dataset.action;
  const backupName = button.dataset.name;

  if (!activeProject || !window.projectStore || !action || !backupName) {
    return;
  }

  if (action === 'delete') {
    const confirmed = window.confirm(`Backup "${backupName}" wirklich löschen?`);
    if (!confirmed) {
      return;
    }
  }

  button.disabled = true;
  setBackupInfo(action === 'restore' ? `Stelle Backup "${backupName}" wieder her …` : `Lösche Backup "${backupName}" …`);

  try {
    if (action === 'restore') {
      await window.projectStore.restoreBackup(activeProject.sessionId, backupName);
      setBackupInfo(`Backup "${backupName}" erfolgreich wiederhergestellt.`);
    } else if (action === 'delete') {
      await window.projectStore.deleteBackup(activeProject.sessionId, backupName);
      setBackupInfo(`Backup "${backupName}" gelöscht.`);
    }
    await loadBackups();
  } catch (error) {
    console.error('Backup-Aktion fehlgeschlagen:', error);
    setBackupInfo(`Aktion fehlgeschlagen: ${(error as Error).message}`);
  } finally {
    button.disabled = false;
  }
}

async function handleAudioTableClick(event: Event): Promise<void> {
  if (!(event.target instanceof HTMLButtonElement)) {
    return;
  }

  const button = event.target;
  const action = button.dataset.action;
  const snapshotName = button.dataset.name;

  if (!activeProject || !window.projectStore || !action || !snapshotName) {
    return;
  }

  if (action === 'delete') {
    const confirmed = window.confirm(`Audio-Schnappschuss "${snapshotName}" wirklich löschen?`);
    if (!confirmed) {
      return;
    }
  }

  button.disabled = true;
  setAudioInfo(
    action === 'restore'
      ? `Stelle Audio-Schnappschuss "${snapshotName}" wieder her …`
      : `Lösche Audio-Schnappschuss "${snapshotName}" …`
  );

  try {
    if (action === 'restore') {
      await window.projectStore.restoreAudioSnapshot(activeProject.sessionId, snapshotName);
      setAudioInfo(`Audio-Schnappschuss "${snapshotName}" wiederhergestellt.`);
    } else if (action === 'delete') {
      await window.projectStore.deleteAudioSnapshot(activeProject.sessionId, snapshotName);
      setAudioInfo(`Audio-Schnappschuss "${snapshotName}" gelöscht.`);
    }
    await loadAudioBackups();
  } catch (error) {
    console.error('Audio-Schnappschuss-Aktion fehlgeschlagen:', error);
    setAudioInfo(`Aktion fehlgeschlagen: ${(error as Error).message}`);
  } finally {
    button.disabled = false;
  }
}

async function handleProjectOpen(event: Event): Promise<void> {
  event.preventDefault();
  if (!window.projectStore || !projectForm) {
    return;
  }

  const formData = new FormData(projectForm);
  const projectPath = String(formData.get('projectPath') ?? '').trim();
  if (!projectPath) {
    setProjectInfo('Bitte wähle ein Projekt aus der Bibliothek.');
    return;
  }

  const selectedEntry = projectLibraryEntries.find((item) => item.path === projectPath);
  if (selectedEntry?.hasLock) {
    setProjectInfo(
      `Projekt "${selectedEntry.manifest.name}" ist bereits geöffnet. Bitte schließe die andere Sitzung, bevor du fortfährst.`
    );
    return;
  }

  toggleProjectControls(true);
  setProjectInfo('Öffne Projekt …');

  try {
    const opened = await window.projectStore.openProject(projectPath);
    activeProject = opened;
    closeProjectButton && (closeProjectButton.disabled = false);
    await setupImportWizardUI();
    await loadBackups();
    await loadAudioBackups();
    await loadProjectLibrary();
    toggleProjectControls(false);
    setProjectInfo(
      `Projekt "${opened.manifest.name}" geöffnet. Aktualisiert am ${new Date(opened.manifest.updatedAt).toLocaleString(
        'de-DE'
      )}.`
    );
  } catch (error) {
    console.error(error);
    setProjectInfo(`Projekt konnte nicht geöffnet werden: ${(error as Error).message}`);
    toggleProjectControls(false);
    toggleBackupSection(false);
    setBackupInfo('Kein Projekt ausgewählt.');
    toggleAudioSection(false);
    setAudioInfo('Kein Projekt ausgewählt.');
    await loadProjectLibrary();
  }
}

async function handleProjectClose(): Promise<void> {
  if (!activeProject || !window.projectStore) {
    return;
  }

  const sessionId = activeProject.sessionId;
  closeProjectButton && (closeProjectButton.disabled = true);
  setProjectInfo('Schließe Projekt …');

  try {
    await window.projectStore.closeProject(sessionId);
    await window.importWizard?.cancel(sessionId);
    activeProject = undefined;
    setProjectInfo('Kein Projekt geöffnet.');
    toggleProjectControls(false);
    toggleBackupSection(false);
    setBackupInfo('Kein Projekt ausgewählt.');
    toggleAudioSection(false);
    setAudioInfo('Kein Projekt ausgewählt.');
    hideImportWizard();
    await loadProjectLibrary();
  } catch (error) {
    console.error(error);
    setProjectInfo(`Projekt konnte nicht geschlossen werden: ${(error as Error).message}`);
    closeProjectButton && (closeProjectButton.disabled = false);
  }
}

async function handleImportStart(event: Event): Promise<void> {
  event.preventDefault();
  if (!activeProject || !window.importWizard || !wizardElements.form) {
    return;
  }

  const formData = new FormData(wizardElements.form);
  const selection: ImportSourceSelection = {
    root: String(formData.get('root') ?? '').trim(),
    dataFiles: parseMultiline(formData.get('dataFiles')),
    audioDirectories: parseMultiline(formData.get('audioDirs')),
  };

  if (!selection.root) {
    showWizardError('Bitte gib einen Quellstamm an, bevor der Import gestartet wird.');
    return;
  }

  disableWizardForm(true);
  showWizardProgress('Analysiere Importquellen …');

  try {
    conflictDecisions.clear();
    const startState = await window.importWizard.start(activeProject.sessionId, selection);
    renderImportState(startState, 'Quellen übernommen.');

    const scanState = await window.importWizard.scan(activeProject.sessionId);
    renderImportState(scanState, 'Quellen wurden eingelesen.');

    const auditState = await window.importWizard.audit(activeProject.sessionId);
    renderImportState(auditState, 'Konfliktprüfung abgeschlossen.');
    updateRunButtonAvailability(auditState);
  } catch (error) {
    console.error(error);
    showWizardError(`Fehler beim Einlesen: ${(error as Error).message}`);
    await window.importWizard.cancel(activeProject.sessionId);
  } finally {
    disableWizardForm(false);
  }
}

async function handleImportExecution(): Promise<void> {
  if (!activeProject || !window.importWizard) {
    return;
  }

  if (!currentImportState) {
    showWizardError('Bitte führe zuerst einen Scan der Quellen durch.');
    return;
  }

  const decisions = Object.fromEntries(conflictDecisions);
  wizardElements.runButton && (wizardElements.runButton.disabled = true);
  showWizardProgress('Wende Entscheidungen an …');

  try {
    const resolvedState = await window.importWizard.resolve(activeProject.sessionId, decisions);
    renderImportState(resolvedState, 'Entscheidungen übernommen.');

    if (!resolvedState.resolution || resolvedState.resolution.toImport === 0) {
      showWizardError('Es wurden keine Datensätze zum Import ausgewählt. Bitte passe die Entscheidungen an.');
      updateRunButtonAvailability(resolvedState);
      return;
    }

    showWizardProgress('Kopiere Dateien und schreibe Daten …');
    const copyState = await window.importWizard.execute(activeProject.sessionId);
    renderImportState(copyState, 'Dateien wurden kopiert.');

    const reportState = await window.importWizard.report(activeProject.sessionId);
    renderImportState(reportState, 'Import abgeschlossen.');
  } catch (error) {
    console.error(error);
    showWizardError(`Import fehlgeschlagen: ${(error as Error).message}`);
  } finally {
    updateRunButtonAvailability(currentImportState);
  }
}

async function handleImportReset(): Promise<void> {
  if (activeProject && window.importWizard) {
    await window.importWizard.cancel(activeProject.sessionId);
  }
  resetImportWizardUI();
  showWizardProgress('Import-Assistent wurde zurückgesetzt.');
}

function renderImportState(state: ImportWizardState, infoMessage?: string): void {
  currentImportState = state;
  renderProgress(state, infoMessage);
  renderConflicts(state);
  renderReport(state);
}

function renderProgress(state: ImportWizardState, infoMessage?: string): void {
  if (!wizardElements.progress) {
    return;
  }

  const parts: string[] = [];
  parts.push('<h3>Zwischenstand</h3>');
  parts.push('<dl>');
  parts.push(`<dt>Schritt</dt><dd>${escapeHtml(state.step)}</dd>`);

  if (state.selection) {
    parts.push('<dt>Quellstamm</dt>');
    parts.push(`<dd>${escapeHtml(state.selection.root)}</dd>`);
  }

  if (state.scan) {
    parts.push('<dt>Analyse</dt>');
    parts.push(
      `<dd>${state.scan.totalRecords} Datensätze aus ${state.scan.dataFiles} Dateien · ${state.scan.audioFiles} Audiodateien gefunden.</dd>`
    );
  }

  if (state.resolution) {
    parts.push('<dt>Entscheidungen</dt>');
    parts.push(`<dd>${state.resolution.toImport} werden importiert, ${state.resolution.toSkip} werden übersprungen.</dd>`);
  }

  if (state.copy) {
    parts.push('<dt>Kopierte Dateien</dt>');
    parts.push(`<dd>${state.copy.writtenRecords} Datensätze · ${state.copy.copiedFiles.length} Audiodateien.</dd>`);
  }

  if (state.errors && state.errors.length > 0) {
    parts.push('<dt>Hinweise</dt>');
    parts.push('<dd><ul>');
    for (const error of state.errors) {
      parts.push(`<li>${escapeHtml(error)}</li>`);
    }
    parts.push('</ul></dd>');
  }

  if (infoMessage) {
    parts.push('<dt>Status</dt>');
    parts.push(`<dd>${escapeHtml(infoMessage)}</dd>`);
  }

  parts.push('</dl>');
  wizardElements.progress.innerHTML = parts.join('');
}

function renderConflicts(state: ImportWizardState): void {
  if (!wizardElements.conflicts) {
    return;
  }

  const conflicts = state.audit?.conflicts ?? [];

  if (!state.audit) {
    wizardElements.conflicts.innerHTML = '';
    conflictDecisions.clear();
    updateRunButtonAvailability(state);
    return;
  }

  if (conflicts.length === 0) {
    wizardElements.conflicts.innerHTML = '<h3>Konflikte</h3><p>Keine Konflikte gefunden. Alle Datensätze können importiert werden.</p>';
    conflictDecisions.clear();
    updateRunButtonAvailability(state);
    return;
  }

  const rows: string[] = [];
  rows.push('<h3>Konflikte</h3>');
  rows.push('<table class="wizard__table">');
  rows.push('<thead><tr><th>Datensatz</th><th>Beschreibung</th><th>Aktion</th></tr></thead>');
  rows.push('<tbody>');

  conflictDecisions.clear();

  for (const conflict of conflicts) {
    const decisionOptions = buildDecisionOptions(conflict.type);
    const defaultDecision = decisionOptions.defaultDecision;
    conflictDecisions.set(conflict.key, defaultDecision);

    rows.push('<tr>');
    rows.push('<td>');
    rows.push(`<strong>${escapeHtml(conflict.record.id)}</strong>`);
    if (conflict.record.audioHint) {
      rows.push(`<br /><small>${escapeHtml(conflict.record.audioHint)}</small>`);
    }
    rows.push('</td>');

    rows.push('<td>');
    rows.push(`${escapeHtml(conflict.message)}<br />`);
    rows.push(`<span class="badge ${conflict.severity}">${conflict.severity === 'error' ? 'Fehler' : 'Hinweis'}</span>`);
    rows.push('</td>');

    rows.push('<td>');
    rows.push('<label class="sr-only" for="decision-' + escapeHtml(conflict.key) + '">Aktion</label>');
    rows.push(
      `<select data-conflict-key="${escapeHtml(conflict.key)}" data-conflict-type="${escapeHtml(conflict.type)}" id="decision-${escapeHtml(conflict.key)}">${decisionOptions.options}</select>`
    );
    rows.push('</td>');
    rows.push('</tr>');
  }

  rows.push('</tbody></table>');
  wizardElements.conflicts.innerHTML = rows.join('');

  const selectElements = wizardElements.conflicts.querySelectorAll('select[data-conflict-key]');
  selectElements.forEach((element) => {
    const select = element as HTMLSelectElement;
    const key = select.dataset.conflictKey ?? '';
    if (!key) {
      return;
    }
    select.addEventListener('change', () => {
      conflictDecisions.set(key, select.value as ImportDecision);
      updateRunButtonAvailability(currentImportState);
    });
  });

  updateRunButtonAvailability(state);
}

function renderReport(state: ImportWizardState): void {
  if (!wizardElements.report) {
    return;
  }

  if (!state.report) {
    wizardElements.report.innerHTML = '';
    return;
  }

  const { imported, skipped, missingAudio, copiedFiles, dataFile, logFile, details } = state.report;
  const parts: string[] = [];
  parts.push('<h3>Importbericht</h3>');
  parts.push('<p>');
  parts.push(
    `${imported} Datensätze importiert, ${skipped} übersprungen, ${missingAudio} ohne Audio. Daten geschrieben nach ${escapeHtml(
      dataFile
    )}.`
  );
  parts.push('</p>');
  parts.push(`<p>Protokoll unter ${escapeHtml(logFile)} aktualisiert.</p>`);
  parts.push('<ul>');
  for (const detail of details) {
    parts.push(`<li>[${escapeHtml(detail.action)}] ${escapeHtml(detail.id)} – ${escapeHtml(detail.message)}</li>`);
  }
  parts.push('</ul>');
  if (copiedFiles.length > 0) {
    parts.push('<p>Übertragene Audio-Dateien:</p><ul>');
    for (const file of copiedFiles) {
      parts.push(`<li>${escapeHtml(file)}</li>`);
    }
    parts.push('</ul>');
  }
  wizardElements.report.innerHTML = parts.join('');
}

function showWizardProgress(message: string): void {
  if (wizardElements.progress) {
    wizardElements.progress.innerHTML = `<p>${escapeHtml(message)}</p>`;
  }
}

function showWizardError(message: string): void {
  if (wizardElements.progress) {
    wizardElements.progress.innerHTML = `<p class="badge error">${escapeHtml(message)}</p>`;
  }
}

function disableWizardForm(disabled: boolean): void {
  if (!wizardElements.form) {
    return;
  }

  const elements = Array.from(wizardElements.form.elements) as HTMLInputElement[];
  for (const element of elements) {
    element.disabled = disabled;
  }

  if (wizardElements.runButton) {
    wizardElements.runButton.disabled = true;
  }
}

function updateRunButtonAvailability(state?: ImportWizardState): void {
  if (!wizardElements.runButton) {
    return;
  }

  if (!state || !state.audit) {
    wizardElements.runButton.disabled = true;
    return;
  }

  wizardElements.runButton.disabled = state.audit.readyRecords === 0 || state.step === 'report-ready';
}

function parseMultiline(value: FormDataEntryValue | null): string[] {
  if (!value) {
    return [];
  }
  return String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function extractTemplate(source: string): string {
  const match = source.match(/<template>([\s\S]*?)<\/template>/i);
  return match ? match[1].trim() : source;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function buildDecisionOptions(type: string): { options: string; defaultDecision: ImportDecision } {
  if (type === 'missing-audio') {
    return {
      options:
        '<option value="skip">Überspringen</option>' +
        '<option value="import">Trotzdem importieren</option>',
      defaultDecision: 'skip',
    };
  }

  return {
    options:
      '<option value="skip">Überspringen</option>' + '<option value="force">Trotzdem importieren</option>',
    defaultDecision: 'skip',
  };
}

window.addEventListener('DOMContentLoaded', () => {
  try {
    ensureElectronRuntime();
    ensureProjectStoreBridge();
    ensureImportWizardBridge();
    if (statusElement) {
      statusElement.textContent = 'Renderer erfolgreich über Electron gestartet.';
    }
    updateVersionHint();
  } catch (error) {
    console.error(error);
    return;
  }

  if (projectForm) {
    projectForm.addEventListener('submit', (event) => void handleProjectOpen(event));
  }

  if (libraryListElement) {
    libraryListElement.addEventListener('click', (event) => handleLibraryClick(event));
  }

  if (refreshLibraryButton) {
    refreshLibraryButton.addEventListener('click', () => void loadProjectLibrary());
  }

  if (createProjectForm) {
    createProjectForm.addEventListener('submit', (event) => void handleProjectCreate(event));
  }

  if (closeProjectButton) {
    closeProjectButton.addEventListener('click', () => void handleProjectClose());
  }

  if (createBackupButton) {
    createBackupButton.addEventListener('click', () => void handleCreateBackup());
  }

  if (refreshBackupsButton) {
    refreshBackupsButton.addEventListener('click', () => void loadBackups());
  }

  if (backupTableBody) {
    backupTableBody.addEventListener('click', (event) => void handleBackupTableClick(event));
  }

  if (createAudioSnapshotButton) {
    createAudioSnapshotButton.addEventListener('click', () => void handleCreateAudioSnapshot());
  }

  if (refreshAudioSnapshotsButton) {
    refreshAudioSnapshotsButton.addEventListener('click', () => void loadAudioBackups());
  }

  if (audioTableBody) {
    audioTableBody.addEventListener('click', (event) => void handleAudioTableClick(event));
  }

  toggleProjectControls(false);
  setProjectInfo('Kein Projekt geöffnet.');
  toggleBackupSection(false);
  setBackupInfo('Kein Projekt ausgewählt.');
  toggleAudioSection(false);
  setAudioInfo('Kein Projekt ausgewählt.');
  void loadProjectLibrary();
});

export {};
