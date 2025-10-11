import type { ProjectData, ProjectSegment } from '../backend/projectStore';
import type { ProjectStoreBridge } from './bridgeTypes';

type StatusTone = 'info' | 'success' | 'warning' | 'error';

type AugmentedProjectData = ProjectData & Record<string, unknown>;

type EditorProjectStore = ProjectStoreBridge;

const params = new URLSearchParams(window.location.search);
const sessionId = params.get('sessionId') ?? '';
const projectName = params.get('projectName') ?? '';
const projectRoot = params.get('projectRoot') ?? '';

const titleElement = document.getElementById('editor-title');
const pathElement = document.getElementById('editor-path');
const statusElement = document.getElementById('editor-status');
const summaryElement = document.getElementById('editor-summary');
const saveStateElement = document.getElementById('editor-save-state');
const listElement = document.getElementById('segment-list') as HTMLUListElement | null;
const filterInput = document.getElementById('segment-list-filter') as HTMLInputElement | null;
const idElement = document.getElementById('segment-id');
const audioElement = document.getElementById('segment-audio');
const textElement = document.getElementById('segment-text');
const translationInput = document.getElementById('segment-translation') as HTMLTextAreaElement | null;
const statusInput = document.getElementById('segment-status-input') as HTMLInputElement | null;
const prevButton = document.getElementById('segment-prev') as HTMLButtonElement | null;
const nextButton = document.getElementById('segment-next') as HTMLButtonElement | null;

let projectData: AugmentedProjectData = { segments: [] };
let segments: ProjectSegment[] = [];
let filteredIndices: number[] = [];
let activeIndex = -1;
let filterValue = '';
let saveTimeout: number | undefined;
let isSaving = false;
const dirtyIndices = new Set<number>();

function setDocumentTitle(): void {
  if (projectName) {
    document.title = `Projekt bearbeiten – ${projectName}`;
    if (titleElement) {
      titleElement.textContent = `Segment-Editor – ${projectName}`;
    }
  } else {
    document.title = 'Projekt bearbeiten';
  }

  if (pathElement) {
    pathElement.textContent = projectRoot ? projectRoot : 'Projektpfad nicht übergeben.';
  }
}

function getProjectStore(): EditorProjectStore {
  const bridge = window.projectStore;
  if (!bridge) {
    throw new Error('Die Projektverwaltung steht im Editor nicht zur Verfügung.');
  }
  return bridge;
}

function setStatus(message: string, tone: StatusTone = 'info'): void {
  if (!statusElement) {
    return;
  }

  statusElement.textContent = message;
  statusElement.className = 'editor__status';
  statusElement.classList.add(`editor__status--${tone}`);
}

function setSaveState(message: string): void {
  if (saveStateElement) {
    saveStateElement.textContent = message;
  }
}

function recomputeFilter(): void {
  if (!filterValue) {
    filteredIndices = segments.map((_, index) => index);
    return;
  }

  const lower = filterValue.toLowerCase();
  filteredIndices = segments
    .map((segment, index) => ({ segment, index }))
    .filter(({ segment }) => {
      const haystack = [segment.id, segment.text, segment.translation, segment.status]
        .filter((value): value is string => typeof value === 'string')
        .join(' ')
        .toLowerCase();
      return haystack.includes(lower);
    })
    .map(({ index }) => index);
}

function renderSegmentList(): void {
  if (!listElement) {
    return;
  }

  listElement.innerHTML = '';

  if (segments.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'Dieses Projekt enthält keine Segmente.';
    empty.className = 'editor__segment';
    listElement.appendChild(empty);
    updateSummary();
    return;
  }

  recomputeFilter();

  if (filteredIndices.length === 0) {
    const info = document.createElement('li');
    info.textContent = 'Der Filter liefert keine Treffer.';
    info.className = 'editor__segment';
    listElement.appendChild(info);
    updateSummary();
    return;
  }

  const fragment = document.createDocumentFragment();
  filteredIndices.forEach((segmentIndex) => {
    const segment = segments[segmentIndex];
    const item = document.createElement('li');
    item.className = 'editor__segment';
    item.dataset.index = String(segmentIndex);

    const idLine = document.createElement('span');
    idLine.className = 'editor__segment-id';
    idLine.textContent = segment.id;
    item.appendChild(idLine);

    const preview = document.createElement('span');
    preview.className = 'editor__segment-preview';
    preview.textContent = segment.text ?? '—';
    item.appendChild(preview);

    fragment.appendChild(item);
  });

  listElement.appendChild(fragment);
  updateListSelection();
  updateSummary();
}

function updateSummary(): void {
  if (!summaryElement) {
    return;
  }

  const total = segments.length;
  const visible = filteredIndices.length;
  summaryElement.textContent = `${visible} von ${total} Segmenten sichtbar.`;
}

function updateListSelection(): void {
  if (!listElement) {
    return;
  }

  const items = listElement.querySelectorAll('li[data-index]') as NodeListOf<HTMLElement>;
  items.forEach((item) => {
    const value = item.getAttribute('data-index');
    if (value === null) {
      return;
    }
    const index = Number(value);
    if (!Number.isFinite(index)) {
      return;
    }
    if (index === activeIndex) {
      item.classList.add('is-active');
    } else {
      item.classList.remove('is-active');
    }
  });
}

function updateNavigationState(): void {
  const visiblePosition = filteredIndices.indexOf(activeIndex);
  if (prevButton) {
    prevButton.disabled = visiblePosition <= 0;
  }
  if (nextButton) {
    nextButton.disabled = visiblePosition === -1 || visiblePosition >= filteredIndices.length - 1;
  }
}

function enableEditing(enabled: boolean): void {
  if (translationInput) {
    translationInput.disabled = !enabled;
  }
  if (statusInput) {
    statusInput.disabled = !enabled;
  }
}

function selectSegment(targetIndex: number): void {
  if (targetIndex < 0 || targetIndex >= segments.length) {
    activeIndex = -1;
    enableEditing(false);
    if (idElement) {
      idElement.textContent = 'Kein Segment ausgewählt.';
    }
    if (textElement) {
      textElement.textContent = 'Bitte wähle ein Segment aus der Liste.';
    }
    if (audioElement) {
      audioElement.textContent = '';
    }
    if (translationInput) {
      translationInput.value = '';
    }
    if (statusInput) {
      statusInput.value = '';
    }
    updateListSelection();
    updateNavigationState();
    return;
  }

  activeIndex = targetIndex;
  const segment = segments[activeIndex];
  enableEditing(true);

  if (idElement) {
    idElement.textContent = segment.id;
  }
  if (textElement) {
    textElement.textContent = segment.text ?? '—';
  }
  if (audioElement) {
    audioElement.textContent = segment.audio ? `Audio: ${segment.audio}` : '';
  }
  if (translationInput) {
    translationInput.value = segment.translation ?? '';
    translationInput.focus();
    translationInput.setSelectionRange(translationInput.value.length, translationInput.value.length);
  }
  if (statusInput) {
    statusInput.value = segment.status ?? '';
  }

  updateListSelection();
  updateNavigationState();
}

function scheduleSave(): void {
  if (saveTimeout !== undefined) {
    window.clearTimeout(saveTimeout);
  }
  saveTimeout = window.setTimeout(() => {
    void persistSegments();
  }, 750);
}

async function persistSegments(): Promise<void> {
  if (dirtyIndices.size === 0 || isSaving) {
    return;
  }

  const store = getProjectStore();
  if (saveTimeout !== undefined) {
    window.clearTimeout(saveTimeout);
    saveTimeout = undefined;
  }
  isSaving = true;
  setStatus('Speichere Änderungen …');
  setSaveState('Änderungen werden gespeichert …');

  try {
    const payload: ProjectData = {
      ...(projectData as ProjectData),
      segments: segments.map((segment) => ({ ...segment })),
    };
    await store.writeData(sessionId, payload, 'Segmenteditor');
    projectData = { ...projectData, segments: payload.segments };
    dirtyIndices.clear();
    setStatus('Alle Änderungen gespeichert.', 'success');
    const timestamp = new Date().toLocaleTimeString('de-DE');
    setSaveState(`Zuletzt gespeichert um ${timestamp}.`);
  } catch (error) {
    console.error('Speichern im Editor fehlgeschlagen:', error);
    setStatus(`Speichern fehlgeschlagen: ${(error as Error).message}`, 'error');
    setSaveState('Speichern fehlgeschlagen – bitte erneut versuchen.');
  } finally {
    isSaving = false;
  }
}

function markDirty(index: number): void {
  dirtyIndices.add(index);
  setStatus('Änderungen noch nicht gespeichert.', 'warning');
  setSaveState('Änderungen liegen vor.');
  scheduleSave();
}

function handleListClick(event: Event): void {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const item = target.closest('li[data-index]') as HTMLElement | null;
  if (!item) {
    return;
  }

  const index = Number(item.dataset.index);
  if (!Number.isFinite(index)) {
    return;
  }

  selectSegment(index);
}

function handleFilterInput(value: string): void {
  filterValue = value.trim();
  renderSegmentList();
  if (filteredIndices.length > 0) {
    if (filteredIndices.includes(activeIndex)) {
      updateNavigationState();
    } else {
      selectSegment(filteredIndices[0]);
    }
  } else {
    selectSegment(-1);
  }
}

function handleTranslationInput(): void {
  if (activeIndex === -1 || !translationInput) {
    return;
  }

  const nextValue = translationInput.value;
  if ((segments[activeIndex].translation ?? '') !== nextValue) {
    segments[activeIndex].translation = nextValue;
    markDirty(activeIndex);
  }
}

function handleStatusInput(): void {
  if (activeIndex === -1 || !statusInput) {
    return;
  }

  const nextValue = statusInput.value.trim();
  if ((segments[activeIndex].status ?? '') !== nextValue) {
    segments[activeIndex].status = nextValue;
    markDirty(activeIndex);
  }
}

function selectRelative(delta: number): void {
  if (filteredIndices.length === 0) {
    return;
  }
  const currentPos = filteredIndices.indexOf(activeIndex);
  const targetPos = currentPos === -1 ? 0 : currentPos + delta;
  if (targetPos < 0 || targetPos >= filteredIndices.length) {
    return;
  }
  selectSegment(filteredIndices[targetPos]);
}

async function loadSegments(): Promise<void> {
  if (!sessionId) {
    setStatus('Keine Sitzungskennung übergeben.', 'error');
    enableEditing(false);
    return;
  }

  setStatus('Lade Segmente …');

  try {
    const store = getProjectStore();
    const data = await store.readData(sessionId);
    projectData = { ...data };
    segments = Array.isArray(data.segments) ? data.segments.map((segment) => ({ ...segment })) : [];
    dirtyIndices.clear();
    filterValue = '';
    if (filterInput) {
      filterInput.value = '';
    }
    renderSegmentList();
    if (segments.length > 0) {
      selectSegment(0);
      setStatus(`${segments.length} Segmente geladen.`, 'success');
      setSaveState('Keine Änderungen.');
    } else {
      selectSegment(-1);
      setStatus('Dieses Projekt enthält keine Segmente.', 'warning');
      setSaveState('Keine Segmente vorhanden.');
    }
  } catch (error) {
    console.error('Segmente konnten nicht geladen werden:', error);
    setStatus(`Segmente konnten nicht geladen werden: ${(error as Error).message}`, 'error');
    setSaveState('Ladevorgang fehlgeschlagen.');
    enableEditing(false);
  }
}

function setupEventListeners(): void {
  if (listElement) {
    listElement.addEventListener('click', (event) => handleListClick(event));
  }
  if (filterInput) {
    filterInput.addEventListener('input', (event) => {
      const value = (event.target as HTMLInputElement).value;
      handleFilterInput(value);
    });
  }
  translationInput?.addEventListener('input', () => handleTranslationInput());
  statusInput?.addEventListener('change', () => handleStatusInput());
  prevButton?.addEventListener('click', () => selectRelative(-1));
  nextButton?.addEventListener('click', () => selectRelative(1));
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented) {
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable)) {
      return;
    }
    if (event.key === 'ArrowUp') {
      selectRelative(-1);
    } else if (event.key === 'ArrowDown') {
      selectRelative(1);
    }
  });
  window.addEventListener('beforeunload', () => {
    if (saveTimeout !== undefined) {
      window.clearTimeout(saveTimeout);
      saveTimeout = undefined;
    }
    if (dirtyIndices.size > 0 && !isSaving) {
      void persistSegments();
    }
  });
}

function bootstrap(): void {
  setDocumentTitle();
  setupEventListeners();
  void loadSegments();
}

try {
  bootstrap();
} catch (error) {
  console.error('Editor konnte nicht initialisiert werden:', error);
  setStatus((error as Error).message, 'error');
  enableEditing(false);
}

export {};
