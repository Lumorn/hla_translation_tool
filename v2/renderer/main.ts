import type {
  CreateProjectOptions,
  ProjectBackupInfo,
  ProjectAudioBackupInfo,
  ProjectData,
  ProjectSegment,
  ProjectManifest,
  ProjectProgressSnapshot,
  ProjectPaths,
  ProjectSettings,
} from '../backend/projectStore';
import type { ImportDecision, ImportSourceSelection, ImportWizardState } from '../importer/importWizard';
import type {
  ProjectOpenResult,
  ProjectStoreBridge,
  ProjectLibraryBridge,
  ProjectEditorBridge,
  ProjectLibraryEntry,
  ProjectLibraryCreateResult,
  ImportWizardBridge,
} from './bridgeTypes';
import { calculateProjectStats } from '../shared/calculateProjectStats';

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
const dashboardRoot = document.getElementById('project-dashboard');
const dashboardChapterContainer = document.getElementById('project-dashboard-chapters');
const dashboardTotalProjectsElement = document.getElementById('dashboard-total-projects');
const dashboardVisibleProjectsElement = document.getElementById('dashboard-visible-projects');
const dashboardProgressLabelElement = document.getElementById('dashboard-progress-label');
const dashboardProgressFillElement = document.getElementById('dashboard-progress-fill');
const dashboardScoreLabelElement = document.getElementById('dashboard-score-label');
const dashboardScoreAverageElement = document.getElementById('dashboard-score-average');
const dashboardFilterInput = document.getElementById('dashboard-filter') as HTMLInputElement | null;
const dashboardOnlyOpenCheckbox = document.getElementById('dashboard-only-open') as HTMLInputElement | null;
const dashboardRandomButton = document.getElementById('dashboard-random-button') as HTMLButtonElement | null;
const dashboardRandomOpenButton = document.getElementById('dashboard-random-open-button') as HTMLButtonElement | null;
const dashboardLevelStatsButton = document.getElementById('dashboard-level-stats-button') as HTMLButtonElement | null;
const dashboardNoteOverviewButton = document.getElementById('dashboard-note-overview-button') as HTMLButtonElement | null;
const dashboardEnReviewButton = document.getElementById('dashboard-en-review-button') as HTMLButtonElement | null;
const dashboardProjectMenu = document.getElementById('dashboard-project-menu');
const dashboardLevelMenu = document.getElementById('dashboard-level-menu');
const dashboardChapterMenu = document.getElementById('dashboard-chapter-menu');
const dashboardDialogBackdrop = document.getElementById('dashboard-dialog-backdrop');
const dashboardDialogContent = document.getElementById('dashboard-dialog-content');
const dashboardDialogClose = document.getElementById('dashboard-dialog-close') as HTMLButtonElement | null;
const segmentsSection = document.getElementById('segments-section');
const segmentTableBody = document.getElementById('segment-table-body') as HTMLTableSectionElement | null;
const segmentStatusElement = document.getElementById('segment-status');
const segmentCountElement = document.getElementById('segment-count');
const segmentTranslatedCountElement = document.getElementById('segment-translated-count');
const segmentCoverageElement = document.getElementById('segment-coverage');
const segmentVisibleCountElement = document.getElementById('segment-visible-count');
const segmentFilterInput = document.getElementById('segment-filter') as HTMLInputElement | null;
const openEditorButton = document.getElementById('open-editor-button') as HTMLButtonElement | null;

let activeProject: ProjectOpenResult | undefined;
let currentImportState: ImportWizardState | undefined;
let wizardInitialized = false;
const conflictDecisions = new Map<string, ImportDecision>();
let projectLibraryEntries: ProjectLibraryEntry[] = [];
let selectedProjectPath: string | undefined;
let projectLibraryRoot: string | undefined;
let editableSegments: ProjectSegment[] = [];
const segmentRowElements = new Map<string, HTMLTableRowElement>();
const dirtySegmentIds = new Set<string>();
let segmentFilterText = '';
let segmentFilterRaw = '';
let segmentSaveTimeout: number | undefined;
let isSavingSegments = false;
const SEGMENT_SAVE_DELAY = 750;
type SegmentStatusTone = 'info' | 'success' | 'warning' | 'error';
let dashboardFilterText = '';
let dashboardOnlyOpen = false;
const collapsedChapters = new Set<string>();
const expandedLevels = new Set<string>();
let activeDashboardContext:
  | { type: 'project'; entry: ProjectLibraryEntry }
  | { type: 'level'; chapter: string; level: string }
  | { type: 'chapter'; chapter: string }
  | null = null;
let draggedProjectPath: string | undefined;
const DASHBOARD_PROGRESS_FALLBACK: ProjectProgressSnapshot = {
  enPercent: 0,
  dePercent: 0,
  audioPercent: 0,
  completedPercent: 0,
  scoreAverage: 0,
  scoreMinimum: 0,
  totalSegments: 0,
  updatedAt: new Date(0).toISOString(),
};
const DASHBOARD_DEFAULT_CHAPTER = 'Unsortiert';
const DASHBOARD_DEFAULT_LEVEL = 'Unbekanntes Level';

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
  renderProjectDashboard();

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

interface DashboardLevelView {
  name: string;
  order: number;
  projects: ProjectLibraryEntry[];
  progress: {
    completedPercent: number;
    scoreMinimum: number;
    scoreAverage: number;
  };
  isCompleted: boolean;
}

interface DashboardChapterView {
  name: string;
  order: number;
  levels: DashboardLevelView[];
  progress: {
    completedPercent: number;
    scoreMinimum: number;
    scoreAverage: number;
  };
  isCompleted: boolean;
}

function getManifestProgress(manifest?: ProjectManifest): ProjectProgressSnapshot {
  if (!manifest) {
    return { ...DASHBOARD_PROGRESS_FALLBACK };
  }

  const snapshot = manifest.progress ?? DASHBOARD_PROGRESS_FALLBACK;
  return {
    enPercent: Number.isFinite(snapshot.enPercent) ? snapshot.enPercent : 0,
    dePercent: Number.isFinite(snapshot.dePercent) ? snapshot.dePercent : 0,
    audioPercent: Number.isFinite(snapshot.audioPercent) ? snapshot.audioPercent : 0,
    completedPercent: Number.isFinite(snapshot.completedPercent) ? snapshot.completedPercent : 0,
    scoreAverage: Number.isFinite(snapshot.scoreAverage) ? snapshot.scoreAverage : 0,
    scoreMinimum: Number.isFinite(snapshot.scoreMinimum) ? snapshot.scoreMinimum : 0,
    totalSegments: Number.isFinite(snapshot.totalSegments) ? snapshot.totalSegments : 0,
    updatedAt: snapshot.updatedAt ?? new Date(0).toISOString(),
  };
}

function projectIsCompleted(entry: ProjectLibraryEntry): boolean {
  return getManifestProgress(entry.manifest).completedPercent >= 100;
}

function projectMatchesDashboardFilters(entry: ProjectLibraryEntry): boolean {
  if (dashboardFilterText) {
    const haystack = [
      entry.manifest.name ?? '',
      entry.folderName,
      entry.manifest.chapter ?? '',
      entry.manifest.level ?? '',
      String(entry.manifest.levelPart ?? ''),
    ]
      .join(' ')
      .toLowerCase();

    if (!haystack.includes(dashboardFilterText)) {
      return false;
    }
  }

  if (dashboardOnlyOpen && projectIsCompleted(entry)) {
    return false;
  }

  return true;
}

function aggregateProgress(entries: ProjectLibraryEntry[]): {
  completedPercent: number;
  scoreMinimum: number;
  scoreAverage: number;
  totalSegments: number;
} {
  let totalSegments = 0;
  let completedSegments = 0;
  let scoreSum = 0;
  let scoreCount = 0;
  let minScore = Number.POSITIVE_INFINITY;

  for (const entry of entries) {
    const progress = getManifestProgress(entry.manifest);
    const segments = Math.max(0, progress.totalSegments ?? 0);
    totalSegments += segments;
    if (segments > 0) {
      completedSegments += Math.round((progress.completedPercent / 100) * segments);
    }
    if (Number.isFinite(progress.scoreAverage)) {
      scoreSum += progress.scoreAverage;
      scoreCount += 1;
    }
    if (Number.isFinite(progress.scoreMinimum)) {
      minScore = Math.min(minScore, progress.scoreMinimum);
    }
  }

  const completedPercent = totalSegments > 0 ? Math.round((completedSegments / totalSegments) * 100) : 0;
  const scoreAverage = scoreCount > 0 ? Math.round(scoreSum / scoreCount) : 0;
  const scoreMinimum = Number.isFinite(minScore) ? minScore : 0;

  return { completedPercent, scoreMinimum, scoreAverage, totalSegments };
}

function updateLibraryEntryProgress(path: string, stats: ReturnType<typeof calculateProjectStats>): void {
  const entry = projectLibraryEntries.find((item) => item.path === path);
  if (!entry) {
    return;
  }

  entry.manifest.progress = {
    enPercent: stats.enPercent,
    dePercent: stats.dePercent,
    audioPercent: stats.audioPercent,
    completedPercent: stats.completedPercent,
    scoreAverage: stats.scoreAverage,
    scoreMinimum: stats.scoreMinimum,
    totalSegments: stats.totalSegments,
    updatedAt: new Date().toISOString(),
  };

  renderProjectDashboard();
}

function buildChapterGroups(entries: ProjectLibraryEntry[]): DashboardChapterView[] {
  const chapterMap = new Map<string, { order: number; levels: Map<string, { order: number; projects: ProjectLibraryEntry[] }> }>();

  for (const entry of entries) {
    const chapterName = (entry.manifest.chapter ?? DASHBOARD_DEFAULT_CHAPTER).trim() || DASHBOARD_DEFAULT_CHAPTER;
    const levelName = (entry.manifest.level ?? DASHBOARD_DEFAULT_LEVEL).trim() || DASHBOARD_DEFAULT_LEVEL;
    const chapterOrder = Number.isFinite(entry.manifest.chapterOrder) ? entry.manifest.chapterOrder ?? 0 : 0;
    const levelOrder = Number.isFinite(entry.manifest.levelOrder) ? entry.manifest.levelOrder ?? 0 : 0;

    if (!chapterMap.has(chapterName)) {
      chapterMap.set(chapterName, { order: chapterOrder, levels: new Map() });
    }

    const chapterEntry = chapterMap.get(chapterName)!;
    if (!chapterEntry.levels.has(levelName)) {
      chapterEntry.levels.set(levelName, { order: levelOrder, projects: [] });
    }

    const levelEntry = chapterEntry.levels.get(levelName)!;
    levelEntry.projects.push(entry);
  }

  const chapters: DashboardChapterView[] = [];

  for (const [chapterName, chapterData] of chapterMap.entries()) {
    const levels: DashboardLevelView[] = [];

    for (const [levelName, levelData] of chapterData.levels.entries()) {
      levelData.projects.sort((a, b) => {
        const partA = Number.isFinite(a.manifest.levelPart) ? a.manifest.levelPart ?? 0 : 0;
        const partB = Number.isFinite(b.manifest.levelPart) ? b.manifest.levelPart ?? 0 : 0;
        if (partA !== partB) {
          return partA - partB;
        }
        return (a.manifest.name ?? a.folderName).localeCompare(b.manifest.name ?? b.folderName, 'de');
      });

      const progress = aggregateProgress(levelData.projects);
      levels.push({
        name: levelName,
        order: levelData.order,
        projects: levelData.projects,
        progress: {
          completedPercent: progress.completedPercent,
          scoreMinimum: progress.scoreMinimum,
          scoreAverage: progress.scoreAverage,
        },
        isCompleted: levelData.projects.every(projectIsCompleted),
      });
    }

    levels.sort((a, b) => {
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      return a.name.localeCompare(b.name, 'de');
    });

    const chapterProgress = aggregateProgress(levels.flatMap((level) => level.projects));
    chapters.push({
      name: chapterName,
      order: chapterData.order,
      levels,
      progress: {
        completedPercent: chapterProgress.completedPercent,
        scoreMinimum: chapterProgress.scoreMinimum,
        scoreAverage: chapterProgress.scoreAverage,
      },
      isCompleted: levels.every((level) => level.isCompleted),
    });
  }

  chapters.sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order;
    }
    return a.name.localeCompare(b.name, 'de');
  });

  return chapters;
}

function updateDashboardMetrics(
  allEntries: ProjectLibraryEntry[],
  visibleEntries: ProjectLibraryEntry[],
): void {
  if (dashboardTotalProjectsElement) {
    dashboardTotalProjectsElement.textContent = String(allEntries.length);
  }
  if (dashboardVisibleProjectsElement) {
    dashboardVisibleProjectsElement.textContent = String(visibleEntries.length);
  }

  if (!dashboardProgressLabelElement || !dashboardProgressFillElement || !dashboardScoreLabelElement) {
    return;
  }

  const progress = aggregateProgress(visibleEntries);
  const percent = progress.completedPercent;
  dashboardProgressLabelElement.textContent = `${percent}%`;
  dashboardProgressFillElement.style.width = `${percent}%`;
  dashboardScoreLabelElement.textContent = `★ ${progress.scoreMinimum}`;
  if (dashboardScoreAverageElement) {
    dashboardScoreAverageElement.textContent = String(progress.scoreAverage);
  }
}

function renderProjectDashboard(): void {
  if (!dashboardRoot || !dashboardChapterContainer) {
    return;
  }

  if (projectLibraryEntries.length === 0) {
    updateDashboardMetrics([], []);
    dashboardChapterContainer.innerHTML =
      '<p class="project-library__item project-library__item--empty">Noch keine Projekte vorhanden.</p>';
    return;
  }

  const visibleEntries = projectLibraryEntries.filter(projectMatchesDashboardFilters);
  updateDashboardMetrics(projectLibraryEntries, visibleEntries);

  if (visibleEntries.length === 0) {
    dashboardChapterContainer.innerHTML =
      '<p class="project-library__item project-library__item--empty">Keine Projekte entsprechen dem Filter.</p>';
    return;
  }

  const chapters = buildChapterGroups(visibleEntries);
  dashboardChapterContainer.innerHTML = '';

  for (const chapter of chapters) {
    dashboardChapterContainer.appendChild(createChapterElement(chapter));
  }

  hideDashboardMenus();
}

function createChapterElement(chapter: DashboardChapterView): HTMLElement {
  const section = document.createElement('section');
  section.className = 'dashboard__chapter';
  section.dataset.chapter = chapter.name;
  if (collapsedChapters.has(chapter.name)) {
    section.classList.add('is-collapsed');
  }

  const header = document.createElement('div');
  header.className = 'dashboard__chapter-header';
  header.innerHTML = `
    <span class="dashboard__chapter-title">${escapeHtml(chapter.name)}</span>
    <div class="dashboard__metric-bar dashboard__chapter-progress"><div class="dashboard__metric-bar-fill" style="width:${chapter.progress.completedPercent}%"></div></div>
    <span class="dashboard__badge">★ ${chapter.progress.scoreMinimum}</span>
  `;
  header.addEventListener('click', () => {
    if (collapsedChapters.has(chapter.name)) {
      collapsedChapters.delete(chapter.name);
    } else {
      collapsedChapters.add(chapter.name);
    }
    renderProjectDashboard();
  });
  header.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    activeDashboardContext = { type: 'chapter', chapter: chapter.name };
    showDashboardMenu(dashboardChapterMenu, event);
  });
  section.appendChild(header);

  const levelList = document.createElement('div');
  levelList.className = 'dashboard__level-list';

  for (const level of chapter.levels) {
    levelList.appendChild(createLevelElement(chapter.name, level));
  }

  section.appendChild(levelList);
  return section;
}

function createLevelElement(chapterName: string, level: DashboardLevelView): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'dashboard__level';
  const levelKey = `${chapterName}::${level.name}`;
  if (!expandedLevels.has(levelKey)) {
    wrapper.classList.add('is-collapsed');
  }

  const header = document.createElement('div');
  header.className = 'dashboard__level-header';
  header.innerHTML = `
    <span class="dashboard__level-title">${escapeHtml(level.name)}</span>
    <div class="dashboard__metric-bar"><div class="dashboard__metric-bar-fill" style="width:${level.progress.completedPercent}%"></div></div>
    <span class="dashboard__badge">★ ${level.progress.scoreMinimum}</span>
  `;
  header.addEventListener('click', () => {
    if (expandedLevels.has(levelKey)) {
      expandedLevels.delete(levelKey);
    } else {
      expandedLevels.add(levelKey);
    }
    renderProjectDashboard();
  });
  header.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    activeDashboardContext = { type: 'level', chapter: chapterName, level: level.name };
    showDashboardMenu(dashboardLevelMenu, event);
  });
  wrapper.appendChild(header);

  const projectsContainer = document.createElement('div');
  projectsContainer.className = 'dashboard__projects';

  for (const project of level.projects) {
    projectsContainer.appendChild(createProjectCard(project, chapterName, level.name));
  }

  wrapper.appendChild(projectsContainer);
  return wrapper;
}

function createProjectCard(entry: ProjectLibraryEntry, chapterName: string, levelName: string): HTMLElement {
  const card = document.createElement('div');
  card.className = 'dashboard__project';
  if (entry.path === selectedProjectPath) {
    card.classList.add('is-selected');
  }
  card.dataset.path = entry.path;
  card.dataset.chapter = chapterName;
  card.dataset.level = levelName;
  card.draggable = true;

  const progress = getManifestProgress(entry.manifest);
  const badges = [
    `<span class="dashboard__badge">EN ${progress.enPercent}%</span>`,
    `<span class="dashboard__badge">DE ${progress.dePercent}%</span>`,
    `<span class="dashboard__badge">🔊 ${progress.audioPercent}%</span>`,
  ].join('');

  card.innerHTML = `
    <div class="dashboard__project-header">
      <span>${escapeHtml(entry.manifest.name ?? entry.folderName)}</span>
      <span>★ ${progress.scoreMinimum}</span>
    </div>
    <div class="dashboard__metric-bar"><div class="dashboard__metric-bar-fill" style="width:${progress.completedPercent}%"></div></div>
    <div class="dashboard__badges">${badges}</div>
  `;

  card.addEventListener('click', () => {
    setSelectedProject(entry.path, entry);
  });
  card.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    activeDashboardContext = { type: 'project', entry };
    showDashboardMenu(dashboardProjectMenu, event);
  });
  card.addEventListener('dragstart', (event) => handleDashboardDragStart(event, entry.path));
  card.addEventListener('dragover', (event) => handleDashboardDragOver(event, card));
  card.addEventListener('dragleave', () => handleDashboardDragLeave(card));
  card.addEventListener('drop', (event) => handleDashboardDrop(event, entry.path));
  card.addEventListener('dragend', handleDashboardDragEnd);

  return card;
}

function showDashboardMenu(menu: HTMLElement | null, event: MouseEvent): void {
  hideDashboardMenus();
  if (!menu) {
    return;
  }

  menu.style.display = 'block';
  const { clientX, clientY } = event;
  menu.style.left = `${clientX}px`;
  menu.style.top = `${clientY}px`;
}

function hideDashboardMenus(): void {
  for (const menu of [dashboardProjectMenu, dashboardLevelMenu, dashboardChapterMenu]) {
    if (menu) {
      menu.style.display = 'none';
    }
  }
  activeDashboardContext = null;
}

function handleDashboardDragStart(event: DragEvent, path: string): void {
  draggedProjectPath = path;
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', path);
    event.dataTransfer.effectAllowed = 'move';
  }
}

function handleDashboardDragOver(event: DragEvent, card: HTMLElement): void {
  if (!draggedProjectPath) {
    return;
  }
  event.preventDefault();
  if (card.dataset.path !== draggedProjectPath) {
    card.classList.add('is-drop-target');
  }
}

function handleDashboardDragLeave(card: HTMLElement): void {
  card.classList.remove('is-drop-target');
}

function handleDashboardDrop(event: DragEvent, targetPath: string): void {
  event.preventDefault();
  const sourcePath = draggedProjectPath;
  draggedProjectPath = undefined;
  const card = event.currentTarget as HTMLElement | null;
  if (card) {
    card.classList.remove('is-drop-target');
  }
  if (!sourcePath || sourcePath === targetPath) {
    return;
  }

  reorderProjectEntries(sourcePath, targetPath);
  renderProjectLibrary();
}

function handleDashboardDragEnd(): void {
  draggedProjectPath = undefined;
  const cards = dashboardChapterContainer?.querySelectorAll('.dashboard__project.is-drop-target');
  cards?.forEach((element) => element.classList.remove('is-drop-target'));
}

function reorderProjectEntries(sourcePath: string, targetPath: string): void {
  const sourceIndex = projectLibraryEntries.findIndex((entry) => entry.path === sourcePath);
  const targetIndex = projectLibraryEntries.findIndex((entry) => entry.path === targetPath);
  if (sourceIndex === -1 || targetIndex === -1) {
    return;
  }

  const [item] = projectLibraryEntries.splice(sourceIndex, 1);
  projectLibraryEntries.splice(targetIndex, 0, item);
}

function handleDashboardMenuClick(event: MouseEvent): void {
  const target = event.target as HTMLElement | null;
  if (!target?.dataset.action || !activeDashboardContext) {
    hideDashboardMenus();
    return;
  }

  const action = target.dataset.action;

  if (activeDashboardContext.type === 'project') {
    handleProjectContextAction(activeDashboardContext.entry, action);
  } else if (activeDashboardContext.type === 'level') {
    handleLevelContextAction(activeDashboardContext.chapter, activeDashboardContext.level, action);
  } else if (activeDashboardContext.type === 'chapter') {
    handleChapterContextAction(activeDashboardContext.chapter, action);
  }

  hideDashboardMenus();
}

function handleProjectContextAction(entry: ProjectLibraryEntry, action: string): void {
  switch (action) {
    case 'open':
      setSelectedProject(entry.path, entry);
      if (projectPathInput && projectForm) {
        projectForm.requestSubmit();
      }
      break;
    case 'stats':
      showProjectStatsDialog(entry);
      break;
    case 'review':
      void handleDashboardEnReview(entry);
      break;
    case 'remove':
      openDashboardDialog(
        `<h3>${escapeHtml(entry.manifest.name ?? entry.folderName)}</h3><p>Das Entfernen von Projekten erfolgt derzeit weiterhin über den Datei-Explorer oder die klassische V1-Oberfläche.</p>`,
      );
      break;
    default:
      break;
  }
}

function handleLevelContextAction(chapter: string, level: string, action: string): void {
  switch (action) {
    case 'stats':
      showLevelStatsDialog(chapter, level);
      break;
    case 'notes':
      showNoteOverviewDialog(chapter, level);
      break;
    case 'random':
      pickRandomProject({ chapter, level });
      break;
    default:
      break;
  }
}

function handleChapterContextAction(chapter: string, action: string): void {
  switch (action) {
    case 'collapse':
      if (collapsedChapters.has(chapter)) {
        collapsedChapters.delete(chapter);
      } else {
        collapsedChapters.add(chapter);
      }
      renderProjectDashboard();
      break;
    case 'random':
      pickRandomProject({ chapter });
      break;
    default:
      break;
  }
}

function openDashboardDialog(html: string): void {
  if (!dashboardDialogBackdrop || !dashboardDialogContent) {
    return;
  }
  dashboardDialogContent.innerHTML = html;
  dashboardDialogBackdrop.style.display = 'flex';
}

function closeDashboardDialog(): void {
  if (!dashboardDialogBackdrop || !dashboardDialogContent) {
    return;
  }
  dashboardDialogContent.innerHTML = '';
  dashboardDialogBackdrop.style.display = 'none';
}

function showProjectStatsDialog(entry: ProjectLibraryEntry): void {
  if (activeProject && activeProject.paths.root === entry.path) {
    const liveStats = calculateProjectStats(activeProject.data);
    entry.manifest.progress = {
      enPercent: liveStats.enPercent,
      dePercent: liveStats.dePercent,
      audioPercent: liveStats.audioPercent,
      completedPercent: liveStats.completedPercent,
      scoreAverage: liveStats.scoreAverage,
      scoreMinimum: liveStats.scoreMinimum,
      totalSegments: liveStats.totalSegments,
      updatedAt: new Date().toISOString(),
    };
    renderProjectDashboard();
  }

  const progress = getManifestProgress(entry.manifest);
  const html = `
    <h3>${escapeHtml(entry.manifest.name ?? entry.folderName)}</h3>
    <p><strong>Kapitel:</strong> ${escapeHtml(entry.manifest.chapter ?? DASHBOARD_DEFAULT_CHAPTER)} · <strong>Level:</strong> ${escapeHtml(entry.manifest.level ?? DASHBOARD_DEFAULT_LEVEL)}</p>
    <ul>
      <li>Fertigstellung: ${progress.completedPercent}% (${progress.totalSegments} Segmente)</li>
      <li>EN ${progress.enPercent}% · DE ${progress.dePercent}% · 🔊 ${progress.audioPercent}%</li>
      <li>Bewertung: Minimum ★ ${progress.scoreMinimum} · Durchschnitt ★ ${progress.scoreAverage}</li>
      <li>Zuletzt aktualisiert: ${new Date(progress.updatedAt).toLocaleString('de-DE')}</li>
    </ul>
  `;
  openDashboardDialog(html);
}

function showGlobalLevelStats(): void {
  const chapters = buildChapterGroups(projectLibraryEntries);
  const items = chapters
    .flatMap((chapter) =>
      chapter.levels.map(
        (level) =>
          `<li><strong>${escapeHtml(chapter.name)}</strong> · ${escapeHtml(level.name)} – ${level.progress.completedPercent}% · ★ ${level.progress.scoreMinimum}</li>`,
      ),
    )
    .join('');

  const html = `
    <h3>Level-Statistiken</h3>
    <p>Kapitel insgesamt: ${chapters.length}</p>
    <ul>${items || '<li>Keine Projekte verfügbar.</li>'}</ul>
  `;
  openDashboardDialog(html);
}

function showLevelStatsDialog(chapter: string, level: string): void {
  const projects = projectLibraryEntries.filter((entry) => {
    const chapterName = (entry.manifest.chapter ?? DASHBOARD_DEFAULT_CHAPTER).trim() || DASHBOARD_DEFAULT_CHAPTER;
    const levelName = (entry.manifest.level ?? DASHBOARD_DEFAULT_LEVEL).trim() || DASHBOARD_DEFAULT_LEVEL;
    return chapterName === chapter && levelName === level;
  });

  const progress = aggregateProgress(projects);
  const items = projects
    .map((entry) => {
      const snap = getManifestProgress(entry.manifest);
      return `<li>${escapeHtml(entry.manifest.name ?? entry.folderName)} – ${snap.completedPercent}% · ★ ${snap.scoreMinimum}</li>`;
    })
    .join('');

  const html = `
    <h3>Statistik: ${escapeHtml(level)} (${escapeHtml(chapter)})</h3>
    <p>Fortschritt: ${progress.completedPercent}% · Bewertung (Minimum): ★ ${progress.scoreMinimum} · Durchschnitt: ★ ${progress.scoreAverage}</p>
    <ul>${items || '<li>Keine Projekte vorhanden.</li>'}</ul>
  `;
  openDashboardDialog(html);
}

function showGlobalNoteOverview(): void {
  const chapters = buildChapterGroups(projectLibraryEntries);
  const items = chapters
    .map((chapter) => {
      const levels = chapter.levels
        .map((level) => `<li>${escapeHtml(level.name)} – ${level.progress.completedPercent}%</li>`)
        .join('');
      return `<li><strong>${escapeHtml(chapter.name)}</strong><ul>${levels || '<li>Keine Level vorhanden.</li>'}</ul></li>`;
    })
    .join('');

  const html = `
    <h3>Notizübersicht</h3>
    <p>Nutze die einzelnen Kapitel- und Levelkontextmenüs, um gezielt in Projekte zu springen. Detailnotizen stehen im Editor zur Verfügung.</p>
    <ul>${items || '<li>Keine Projekte verfügbar.</li>'}</ul>
  `;
  openDashboardDialog(html);
}

function showNoteOverviewDialog(chapter: string, level: string): void {
  const projects = projectLibraryEntries.filter((entry) => {
    const chapterName = (entry.manifest.chapter ?? DASHBOARD_DEFAULT_CHAPTER).trim() || DASHBOARD_DEFAULT_CHAPTER;
    const levelName = (entry.manifest.level ?? DASHBOARD_DEFAULT_LEVEL).trim() || DASHBOARD_DEFAULT_LEVEL;
    return chapterName === chapter && levelName === level;
  });

  const html = `
    <h3>Notizübersicht: ${escapeHtml(level)} (${escapeHtml(chapter)})</h3>
    <p>Die detaillierte Notizansicht wird aktuell über den Editor bereitgestellt. Wähle eines der folgenden Projekte aus und öffne es im Editor, um Notizen und Kommentare einzusehen.</p>
    <ul>${projects
      .map((entry) => `<li>${escapeHtml(entry.manifest.name ?? entry.folderName)}</li>`)
      .join('') || '<li>Keine Projekte zugeordnet.</li>'}</ul>
  `;
  openDashboardDialog(html);
}

function pickRandomProject(filter: { chapter?: string; level?: string; openOnly?: boolean } = {}): void {
  let candidates = projectLibraryEntries.filter((entry) => {
    if (filter.chapter) {
      const chapterName = (entry.manifest.chapter ?? DASHBOARD_DEFAULT_CHAPTER).trim() || DASHBOARD_DEFAULT_CHAPTER;
      if (chapterName !== filter.chapter) {
        return false;
      }
    }
    if (filter.level) {
      const levelName = (entry.manifest.level ?? DASHBOARD_DEFAULT_LEVEL).trim() || DASHBOARD_DEFAULT_LEVEL;
      if (levelName !== filter.level) {
        return false;
      }
    }
    if (filter.openOnly && projectIsCompleted(entry)) {
      return false;
    }
    if (!filter.chapter && !filter.level) {
      return projectMatchesDashboardFilters(entry);
    }
    return true;
  });

  if (filter.openOnly && !filter.chapter && !filter.level) {
    candidates = candidates.filter((entry) => projectIsCompleted(entry) === false);
  }

  if (candidates.length === 0) {
    openDashboardDialog('<h3>Keine Auswahl möglich</h3><p>Es wurden keine passenden Projekte gefunden.</p>');
    return;
  }

  const randomEntry = candidates[Math.floor(Math.random() * candidates.length)];
  setSelectedProject(randomEntry.path, randomEntry);
  scrollProjectIntoView(randomEntry.path);
  setProjectInfo(`Zufallsauswahl: ${randomEntry.manifest.name ?? randomEntry.folderName}`);
}

function scrollProjectIntoView(path: string): void {
  if (!dashboardChapterContainer) {
    return;
  }
  const cards = Array.from(dashboardChapterContainer.querySelectorAll<HTMLElement>('.dashboard__project'));
  const card = cards.find((element) => element.dataset.path === path);
  card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function handleDashboardEnReview(entry?: ProjectLibraryEntry): Promise<void> {
  if (entry) {
    setSelectedProject(entry.path, entry);
  }

  if (!activeProject) {
    openDashboardDialog('<h3>EN-Review</h3><p>Bitte öffne zunächst ein Projekt. Danach kannst du den Editor starten, um die EN-Review durchzuführen.</p>');
    return;
  }

  await handleEditorOpen();
  openDashboardDialog('<h3>EN-Review</h3><p>Der Editor wurde geöffnet. Nutze dort die EN-Review-Steuerung, um die Dateien abzuhören.</p>');
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
  if (openEditorButton) {
    openEditorButton.disabled = disabled || !activeProject;
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

function toggleSegmentsSection(visible: boolean): void {
  if (!segmentsSection) {
    return;
  }
  if (visible) {
    segmentsSection.classList.remove('hidden');
  } else {
    segmentsSection.classList.add('hidden');
  }
}

function setSegmentStatus(message: string, tone: SegmentStatusTone = 'info'): void {
  if (!segmentStatusElement) {
    return;
  }
  segmentStatusElement.textContent = message;
  segmentStatusElement.className = 'segment-status';
  if (tone !== 'info') {
    segmentStatusElement.classList.add(`segment-status--${tone}`);
  }
}

function updateSegmentSummary(visibleCount: number): void {
  if (!segmentCountElement || !segmentTranslatedCountElement || !segmentCoverageElement || !segmentVisibleCountElement) {
    return;
  }

  const total = editableSegments.length;
  const translated = editableSegments.reduce((sum, segment) => {
    const text = typeof segment.translation === 'string' ? segment.translation.trim() : '';
    return text.length > 0 ? sum + 1 : sum;
  }, 0);

  segmentCountElement.textContent = String(total);
  segmentTranslatedCountElement.textContent = String(translated);
  segmentVisibleCountElement.textContent = String(visibleCount);

  const coverage = total > 0 ? (translated / total) * 100 : 0;
  const coverageText = `${coverage.toLocaleString('de-DE', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} %`;
  segmentCoverageElement.textContent = coverageText;
}

function getFilteredSegments(): ProjectSegment[] {
  if (!segmentFilterText) {
    return editableSegments;
  }

  const normalizedFilter = segmentFilterText;
  return editableSegments.filter((segment) => {
    const parts = [segment.id, segment.text, segment.translation, segment.status, segment.audio]
      .filter((value): value is string => typeof value === 'string')
      .join(' ')
      .toLowerCase();
    return parts.includes(normalizedFilter);
  });
}

function renderSegmentsTable(): void {
  if (!segmentTableBody) {
    return;
  }

  segmentRowElements.clear();
  segmentTableBody.innerHTML = '';

  const segmentsToRender = getFilteredSegments();

  if (segmentsToRender.length === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 4;
    emptyCell.className = 'segment-table__empty';
    emptyCell.textContent =
      editableSegments.length === 0
        ? 'Dieses Projekt enthält noch keine Segmente.'
        : 'Der aktuelle Filter liefert keine Treffer.';
    emptyRow.appendChild(emptyCell);
    segmentTableBody.appendChild(emptyRow);
    updateSegmentSummary(0);
    return;
  }

  for (const segment of segmentsToRender) {
    const row = document.createElement('tr');
    row.dataset.id = segment.id;

    if (dirtySegmentIds.has(segment.id)) {
      row.classList.add('is-dirty');
    }

    const idCell = document.createElement('td');
    idCell.textContent = segment.id;
    row.appendChild(idCell);

    const textCell = document.createElement('td');
    const sourceParagraph = document.createElement('p');
    sourceParagraph.className = 'segment-text segment-text--source';
    sourceParagraph.textContent = segment.text ?? '—';
    textCell.appendChild(sourceParagraph);
    if (segment.audio) {
      const metaParagraph = document.createElement('p');
      metaParagraph.className = 'segment-text__meta';
      metaParagraph.textContent = `Audio: ${segment.audio}`;
      textCell.appendChild(metaParagraph);
    }
    row.appendChild(textCell);

    const translationCell = document.createElement('td');
    const translationArea = document.createElement('textarea');
    translationArea.dataset.field = 'translation';
    translationArea.value = segment.translation ?? '';
    translationArea.placeholder = 'Übersetzung eingeben';
    translationCell.appendChild(translationArea);
    row.appendChild(translationCell);

    const statusCell = document.createElement('td');
    const statusInput = document.createElement('input');
    statusInput.type = 'text';
    statusInput.dataset.field = 'status';
    statusInput.value = segment.status ?? '';
    statusInput.placeholder = 'Status festlegen';
    statusInput.setAttribute('list', 'segment-status-options');
    statusCell.appendChild(statusInput);
    row.appendChild(statusCell);

    segmentTableBody.appendChild(row);
    segmentRowElements.set(segment.id, row);
  }

  updateSegmentSummary(segmentsToRender.length);
}

function refreshSegmentStatus(): void {
  if (isSavingSegments || dirtySegmentIds.size > 0) {
    return;
  }

  if (editableSegments.length === 0) {
    setSegmentStatus('Dieses Projekt enthält noch keine Segmente.');
    return;
  }

  const visible = getFilteredSegments().length;
  if (visible === 0 && segmentFilterText) {
    setSegmentStatus('Der aktuelle Filter liefert keine Treffer.');
    return;
  }

  if (segmentFilterText) {
    setSegmentStatus(`Filter aktiv – ${visible} von ${editableSegments.length} Segmenten sichtbar.`);
    return;
  }

  setSegmentStatus('Segmentdaten geladen.');
}

function initializeSegments(data: ProjectData, options: { resetFilter?: boolean; statusMessage?: string } = {}): void {
  editableSegments = Array.isArray(data.segments)
    ? data.segments.map((segment) => ({ ...segment }))
    : [];
  dirtySegmentIds.clear();
  segmentRowElements.clear();

  if (options.resetFilter ?? false) {
    segmentFilterText = '';
    segmentFilterRaw = '';
  }

  if (segmentFilterInput) {
    segmentFilterInput.value = segmentFilterRaw;
  }

  renderSegmentsTable();

  if (options.statusMessage) {
    setSegmentStatus(options.statusMessage);
  } else {
    refreshSegmentStatus();
  }
}

function resetSegments(): void {
  editableSegments = [];
  segmentRowElements.clear();
  dirtySegmentIds.clear();
  segmentFilterText = '';
  segmentFilterRaw = '';
  if (segmentSaveTimeout !== undefined) {
    window.clearTimeout(segmentSaveTimeout);
    segmentSaveTimeout = undefined;
  }
  isSavingSegments = false;
  if (segmentTableBody) {
    segmentTableBody.innerHTML = '';
  }
  if (segmentFilterInput) {
    segmentFilterInput.value = '';
  }
  updateSegmentSummary(0);
  setSegmentStatus('Kein Projekt geöffnet.');
}

function updateSegmentRowDirtyState(segmentId: string, dirty: boolean): void {
  const row = segmentRowElements.get(segmentId);
  if (row) {
    row.classList.toggle('is-dirty', dirty);
  }
}

function markSegmentDirty(segmentId: string): void {
  dirtySegmentIds.add(segmentId);
  updateSegmentRowDirtyState(segmentId, true);
  setSegmentStatus('Änderungen noch nicht gespeichert.', 'warning');
  queueSegmentSave();
}

function queueSegmentSave(): void {
  if (segmentSaveTimeout !== undefined) {
    window.clearTimeout(segmentSaveTimeout);
  }
  segmentSaveTimeout = window.setTimeout(() => {
    void persistSegmentChanges();
  }, SEGMENT_SAVE_DELAY);
}

async function persistSegmentChanges(): Promise<void> {
  if (!activeProject || !window.projectStore) {
    return;
  }

  if (dirtySegmentIds.size === 0) {
    return;
  }

  if (segmentSaveTimeout !== undefined) {
    window.clearTimeout(segmentSaveTimeout);
    segmentSaveTimeout = undefined;
  }

  isSavingSegments = true;
  setSegmentStatus('Änderungen werden gespeichert …');

  const updatedData: ProjectData = {
    ...activeProject.data,
    segments: editableSegments.map((segment) => ({ ...segment })),
  };

  try {
    await window.projectStore.writeData(activeProject.sessionId, updatedData, 'Segmente aktualisiert.');
    activeProject.data = updatedData;
    const cleaned = Array.from(dirtySegmentIds);
    dirtySegmentIds.clear();
    cleaned.forEach((id) => updateSegmentRowDirtyState(id, false));
    setSegmentStatus('Änderungen gespeichert.', 'success');
    updateSegmentSummary(getFilteredSegments().length);
    await loadProjectLibrary();
  } catch (error) {
    console.error('Segmente konnten nicht gespeichert werden:', error);
    setSegmentStatus(`Speichern fehlgeschlagen: ${(error as Error).message}`, 'error');
  } finally {
    isSavingSegments = false;
  }
}

function handleSegmentTableInteraction(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement)) {
    return;
  }

  const field = target.dataset.field;
  if (field !== 'translation' && field !== 'status') {
    return;
  }

  const row = target.closest<HTMLTableRowElement>('tr[data-id]');
  if (!row) {
    return;
  }

  const segmentId = row.dataset.id;
  if (!segmentId) {
    return;
  }

  const segment = editableSegments.find((item) => item.id === segmentId);
  if (!segment) {
    return;
  }

  if (target instanceof HTMLTextAreaElement && field === 'translation') {
    if ((segment.translation ?? '') !== target.value) {
      segment.translation = target.value;
      markSegmentDirty(segmentId);
    }
    return;
  }

  if (target instanceof HTMLInputElement && field === 'status') {
    const normalized = target.value.trim();
    if ((segment.status ?? '') !== normalized) {
      segment.status = normalized;
      markSegmentDirty(segmentId);
    }
  }
}

function applySegmentFilter(value: string): void {
  segmentFilterRaw = value;
  segmentFilterText = value.trim().toLowerCase();
  renderSegmentsTable();
  refreshSegmentStatus();
}

async function reloadActiveProjectData(statusMessage?: string): Promise<void> {
  if (!activeProject || !window.projectStore) {
    return;
  }

  try {
    const freshData = await window.projectStore.readData(activeProject.sessionId);
    activeProject.data = freshData;
    initializeSegments(freshData, { statusMessage });
  } catch (error) {
    console.error('Projektdaten konnten nicht neu geladen werden:', error);
    setSegmentStatus(`Neu laden fehlgeschlagen: ${(error as Error).message}`, 'error');
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
      await reloadActiveProjectData('Backup wiederhergestellt – Segmente neu geladen.');
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

async function openProjectEditor(sessionId: string, projectName: string): Promise<void> {
  if (!window.projectEditor) {
    return;
  }

  try {
    await window.projectEditor.open(sessionId, projectName);
  } catch (error) {
    console.error('Editorfenster konnte nicht geöffnet werden:', error);
    setProjectInfo(`Editor konnte nicht geöffnet werden: ${(error as Error).message}`);
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
  toggleSegmentsSection(false);
  resetSegments();

  try {
    const opened = await window.projectStore.openProject(projectPath);
    activeProject = opened;
    closeProjectButton && (closeProjectButton.disabled = false);
    toggleSegmentsSection(true);
    initializeSegments(opened.data, { resetFilter: true });
    await setupImportWizardUI();
    await loadBackups();
    await loadAudioBackups();
    await loadProjectLibrary();
    updateLibraryEntryProgress(opened.paths.root, calculateProjectStats(opened.data));
    toggleProjectControls(false);
    setProjectInfo(
      `Projekt "${opened.manifest.name}" geöffnet. Aktualisiert am ${new Date(opened.manifest.updatedAt).toLocaleString(
        'de-DE'
      )}.`
    );
    void openProjectEditor(opened.sessionId, opened.manifest.name);
  } catch (error) {
    console.error(error);
    setProjectInfo(`Projekt konnte nicht geöffnet werden: ${(error as Error).message}`);
    toggleProjectControls(false);
    toggleBackupSection(false);
    setBackupInfo('Kein Projekt ausgewählt.');
    toggleAudioSection(false);
    setAudioInfo('Kein Projekt ausgewählt.');
    toggleSegmentsSection(false);
    resetSegments();
    await loadProjectLibrary();
    if (openEditorButton) {
      openEditorButton.disabled = true;
    }
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
    if (window.projectEditor) {
      try {
        await window.projectEditor.close(sessionId);
      } catch (editorError) {
        console.warn('Editorfenster konnte nicht automatisch geschlossen werden:', editorError);
      }
    }
    await window.projectStore.closeProject(sessionId);
    await window.importWizard?.cancel(sessionId);
    activeProject = undefined;
    setProjectInfo('Kein Projekt geöffnet.');
    toggleProjectControls(false);
    toggleBackupSection(false);
    setBackupInfo('Kein Projekt ausgewählt.');
    toggleAudioSection(false);
    setAudioInfo('Kein Projekt ausgewählt.');
    toggleSegmentsSection(false);
    resetSegments();
    hideImportWizard();
    await loadProjectLibrary();
  } catch (error) {
    console.error(error);
    setProjectInfo(`Projekt konnte nicht geschlossen werden: ${(error as Error).message}`);
    closeProjectButton && (closeProjectButton.disabled = false);
  }
}

async function handleEditorOpen(): Promise<void> {
  if (!activeProject) {
    setProjectInfo('Bitte öffne zuerst ein Projekt.');
    return;
  }

  if (!window.projectEditor) {
    setProjectInfo('Der Editor steht nur in der Electron-Vorschau zur Verfügung.');
    return;
  }

  await openProjectEditor(activeProject.sessionId, activeProject.manifest.name);
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
    await reloadActiveProjectData('Import abgeschlossen – Segmente neu geladen.');
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

  if (dashboardFilterInput) {
    dashboardFilterInput.addEventListener('input', (event) => {
      const value = (event.target as HTMLInputElement).value.trim().toLowerCase();
      dashboardFilterText = value;
      renderProjectDashboard();
    });
  }

  if (dashboardOnlyOpenCheckbox) {
    dashboardOnlyOpenCheckbox.addEventListener('change', (event) => {
      dashboardOnlyOpen = (event.target as HTMLInputElement).checked;
      renderProjectDashboard();
    });
  }

  if (dashboardRandomButton) {
    dashboardRandomButton.addEventListener('click', () => pickRandomProject());
  }

  if (dashboardRandomOpenButton) {
    dashboardRandomOpenButton.addEventListener('click', () => pickRandomProject({ openOnly: true }));
  }

  if (dashboardLevelStatsButton) {
    dashboardLevelStatsButton.addEventListener('click', () => showGlobalLevelStats());
  }

  if (dashboardNoteOverviewButton) {
    dashboardNoteOverviewButton.addEventListener('click', () => showGlobalNoteOverview());
  }

  if (dashboardEnReviewButton) {
    dashboardEnReviewButton.addEventListener('click', () => void handleDashboardEnReview());
  }

  if (dashboardProjectMenu) {
    dashboardProjectMenu.addEventListener('click', (event) => handleDashboardMenuClick(event));
  }

  if (dashboardLevelMenu) {
    dashboardLevelMenu.addEventListener('click', (event) => handleDashboardMenuClick(event));
  }

  if (dashboardChapterMenu) {
    dashboardChapterMenu.addEventListener('click', (event) => handleDashboardMenuClick(event));
  }

  if (dashboardDialogClose) {
    dashboardDialogClose.addEventListener('click', () => closeDashboardDialog());
  }

  if (dashboardDialogBackdrop) {
    dashboardDialogBackdrop.addEventListener('click', (event) => {
      if (event.target === dashboardDialogBackdrop) {
        closeDashboardDialog();
      }
    });
  }

  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.dashboard__context-menu')) {
      hideDashboardMenus();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideDashboardMenus();
      closeDashboardDialog();
    }
  });

  if (createProjectForm) {
    createProjectForm.addEventListener('submit', (event) => void handleProjectCreate(event));
  }

  if (closeProjectButton) {
    closeProjectButton.addEventListener('click', () => void handleProjectClose());
  }

  if (openEditorButton) {
    openEditorButton.addEventListener('click', () => void handleEditorOpen());
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

  if (segmentTableBody) {
    segmentTableBody.addEventListener('input', (event) => handleSegmentTableInteraction(event));
    segmentTableBody.addEventListener('change', (event) => handleSegmentTableInteraction(event));
  }

  if (segmentFilterInput) {
    segmentFilterInput.addEventListener('input', (event) => {
      const value = (event.target as HTMLInputElement).value;
      applySegmentFilter(value);
    });
  }

  toggleSegmentsSection(false);
  resetSegments();

  toggleProjectControls(false);
  setProjectInfo('Kein Projekt geöffnet.');
  toggleBackupSection(false);
  setBackupInfo('Kein Projekt ausgewählt.');
  toggleAudioSection(false);
  setAudioInfo('Kein Projekt ausgewählt.');
  void loadProjectLibrary();
});

export {};
