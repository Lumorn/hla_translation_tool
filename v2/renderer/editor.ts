import type { AudioEffectSettings, AudioProcessingRequest, AudioWaveformPreview } from '../backend/audioProcessing';
import type { ProjectData, ProjectSegment } from '../backend/projectStore';
import type { AudioProcessingBridge, ProjectStoreBridge } from './bridgeTypes';
import { WaveformPairRenderer } from './audioEditor';

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
const audioZoomInput = document.getElementById('audio-zoom') as HTMLInputElement | null;
const audioHeightInput = document.getElementById('audio-height') as HTMLInputElement | null;
const audioSyncInput = document.getElementById('audio-sync') as HTMLInputElement | null;
const audioTrimStartInput = document.getElementById('audio-trim-start') as HTMLInputElement | null;
const audioTrimEndInput = document.getElementById('audio-trim-end') as HTMLInputElement | null;
const audioTempoInput = document.getElementById('audio-tempo') as HTMLInputElement | null;
const audioGainInput = document.getElementById('audio-gain') as HTMLInputElement | null;
const audioFadeInInput = document.getElementById('audio-fade-in') as HTMLInputElement | null;
const audioFadeOutInput = document.getElementById('audio-fade-out') as HTMLInputElement | null;
const audioReverseInput = document.getElementById('audio-reverse') as HTMLInputElement | null;
const audioNormalizeInput = document.getElementById('audio-normalize') as HTMLInputElement | null;
const audioApplyButton = document.getElementById('audio-apply') as HTMLButtonElement | null;
const audioUndoButton = document.getElementById('audio-undo') as HTMLButtonElement | null;
const audioReloadButton = document.getElementById('audio-reload') as HTMLButtonElement | null;
const audioSourceLabel = document.getElementById('audio-source-name');
const audioEditedLabel = document.getElementById('audio-edited-name');
const audioOriginalPlayer = document.getElementById('audio-player-original') as HTMLAudioElement | null;
const audioEditedPlayer = document.getElementById('audio-player-edited') as HTMLAudioElement | null;
const audioStatusElement = document.getElementById('audio-status');
const waveOriginalCanvas = document.getElementById('wave-canvas-original') as HTMLCanvasElement | null;
const waveProcessedCanvas = document.getElementById('wave-canvas-processed') as HTMLCanvasElement | null;
const waveOriginalRuler = document.getElementById('wave-ruler-original');
const waveProcessedRuler = document.getElementById('wave-ruler-processed');
const waveOriginalScroll = document.getElementById('wave-scroll-original') as HTMLElement | null;
const waveProcessedScroll = document.getElementById('wave-scroll-processed') as HTMLElement | null;

let projectData: AugmentedProjectData = { segments: [] };
let segments: ProjectSegment[] = [];
let filteredIndices: number[] = [];
let activeIndex = -1;
let filterValue = '';
let saveTimeout: number | undefined;
let isSaving = false;
const dirtyIndices = new Set<number>();

interface SegmentAudioState {
  sourceFile?: string;
  editedFile?: string;
  history: string[];
  trimStartMs: number;
  trimEndMs?: number;
  effects: AudioEffectSettings;
  normalize: boolean;
  zoom: number;
  height: number;
  originalWave?: AudioWaveformPreview;
  editedWave?: AudioWaveformPreview;
  loading?: boolean;
}

const DEFAULT_AUDIO_STATE: SegmentAudioState = {
  history: [],
  trimStartMs: 0,
  trimEndMs: undefined,
  effects: {},
  normalize: false,
  zoom: 1,
  height: 140,
};

let audioState: SegmentAudioState = { ...DEFAULT_AUDIO_STATE };
let waveformRenderer: WaveformPairRenderer | undefined;
let audioLoadToken = 0;

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

function getAudioBridge(): AudioProcessingBridge {
  const bridge = window.audioProcessing;
  if (!bridge) {
    throw new Error('Die Audio-Verarbeitung steht im Editor nicht zur Verfügung.');
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

function setAudioStatus(message: string, tone: StatusTone = 'info'): void {
  if (!audioStatusElement) {
    return;
  }
  audioStatusElement.textContent = message;
  audioStatusElement.className = 'audio-editor__status';
  audioStatusElement.classList.add(`audio-editor__status--${tone}`);
}

function buildAudioFileUrl(fileName?: string): string | undefined {
  if (!fileName || !projectRoot) {
    return undefined;
  }
  let normalizedRoot = projectRoot.replace(/\\/g, '/');
  if (!normalizedRoot.startsWith('/')) {
    normalizedRoot = `/${normalizedRoot}`;
  }
  normalizedRoot = normalizedRoot.replace(/\/+$/, '');
  const encoded = fileName
    .split(/[\\/]/)
    .filter((part) => part.length > 0)
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `file://${normalizedRoot}/audio/${encoded}`;
}

function updateAudioPlayers(): void {
  if (audioSourceLabel) {
    audioSourceLabel.textContent = audioState.sourceFile ?? '—';
  }
  if (audioEditedLabel) {
    audioEditedLabel.textContent = audioState.editedFile ?? '—';
  }
  if (audioOriginalPlayer) {
    const sourceUrl = buildAudioFileUrl(audioState.sourceFile);
    if (sourceUrl) {
      audioOriginalPlayer.src = sourceUrl;
    } else {
      audioOriginalPlayer.removeAttribute('src');
      audioOriginalPlayer.load();
    }
  }
  if (audioEditedPlayer) {
    const editedUrl = buildAudioFileUrl(audioState.editedFile ?? audioState.sourceFile);
    if (editedUrl) {
      audioEditedPlayer.src = editedUrl;
    } else {
      audioEditedPlayer.removeAttribute('src');
      audioEditedPlayer.load();
    }
  }
}

function updateWaveforms(): void {
  if (!waveformRenderer) {
    return;
  }
  waveformRenderer.setZoom(audioState.zoom);
  waveformRenderer.setHeight(audioState.height);
  waveformRenderer.setData(audioState.originalWave, audioState.editedWave ?? audioState.originalWave);
}

function updateAudioControls(): void {
  const hasAudio = Boolean(audioState.sourceFile);
  const controls: (HTMLInputElement | HTMLButtonElement | null)[] = [
    audioTrimStartInput,
    audioTrimEndInput,
    audioTempoInput,
    audioGainInput,
    audioFadeInInput,
    audioFadeOutInput,
    audioReverseInput,
    audioNormalizeInput,
    audioApplyButton,
    audioUndoButton,
    audioReloadButton,
  ];
  controls.forEach((control) => {
    if (control) {
      control.disabled = !hasAudio;
    }
  });
  if (audioZoomInput) {
    audioZoomInput.value = audioState.zoom.toFixed(2);
  }
  if (audioHeightInput) {
    audioHeightInput.value = String(Math.round(audioState.height));
  }
  if (audioTrimStartInput) {
    audioTrimStartInput.value = String(Math.max(0, Math.round(audioState.trimStartMs)));
  }
  if (audioTrimEndInput) {
    audioTrimEndInput.value = audioState.trimEndMs ? String(Math.round(audioState.trimEndMs)) : '';
  }
  const effects = audioState.effects ?? {};
  if (audioTempoInput) {
    audioTempoInput.value = effects.tempoRatio ? effects.tempoRatio.toString() : '1';
  }
  if (audioGainInput) {
    audioGainInput.value = effects.gainDb ? effects.gainDb.toString() : '0';
  }
  if (audioFadeInInput) {
    audioFadeInInput.value = effects.fadeInMs ? effects.fadeInMs.toString() : '0';
  }
  if (audioFadeOutInput) {
    audioFadeOutInput.value = effects.fadeOutMs ? effects.fadeOutMs.toString() : '0';
  }
  if (audioReverseInput) {
    audioReverseInput.checked = Boolean(effects.reverse);
  }
  if (audioNormalizeInput) {
    audioNormalizeInput.checked = Boolean(audioState.normalize);
  }
  if (audioUndoButton) {
    audioUndoButton.disabled = !hasAudio || audioState.history.length === 0;
  }
  if (audioReloadButton) {
    audioReloadButton.disabled = !hasAudio;
  }
}

function resetAudioState(): void {
  audioState = {
    ...DEFAULT_AUDIO_STATE,
    zoom: audioState.zoom,
    height: audioState.height,
  };
  updateAudioControls();
  updateAudioPlayers();
  if (waveformRenderer) {
    waveformRenderer.setData(undefined, undefined);
  }
}

function readNumberInput(input: HTMLInputElement | null, fallback: number, min?: number): number {
  if (!input) {
    return fallback;
  }
  const value = Number.parseFloat(input.value);
  if (!Number.isFinite(value)) {
    return fallback;
  }
  if (typeof min === 'number' && value < min) {
    return min;
  }
  return value;
}

function syncAudioStateFromInputs(): void {
  audioState.trimStartMs = readNumberInput(audioTrimStartInput, 0, 0);
  if (audioTrimEndInput && audioTrimEndInput.value.trim() === '') {
    audioState.trimEndMs = undefined;
  } else {
    const endValue = readNumberInput(
      audioTrimEndInput,
      Number.isFinite(audioState.trimEndMs ?? NaN) ? audioState.trimEndMs ?? 0 : 0,
      0,
    );
    audioState.trimEndMs = Number.isFinite(endValue) && endValue > 0 ? endValue : undefined;
  }
  const tempo = readNumberInput(audioTempoInput, audioState.effects.tempoRatio ?? 1, 0.1);
  const gain = readNumberInput(audioGainInput, audioState.effects.gainDb ?? 0);
  const fadeIn = readNumberInput(audioFadeInInput, audioState.effects.fadeInMs ?? 0, 0);
  const fadeOut = readNumberInput(audioFadeOutInput, audioState.effects.fadeOutMs ?? 0, 0);
  audioState.effects = {
    ...audioState.effects,
    tempoRatio: Number.isFinite(tempo) ? tempo : 1,
    gainDb: Number.isFinite(gain) ? gain : 0,
    fadeInMs: Number.isFinite(fadeIn) ? fadeIn : 0,
    fadeOutMs: Number.isFinite(fadeOut) ? fadeOut : 0,
    reverse: Boolean(audioReverseInput?.checked),
  };
  audioState.normalize = Boolean(audioNormalizeInput?.checked);
}

async function loadSegmentAudio(segment: ProjectSegment): Promise<void> {
  resetAudioState();
  const originalFile = typeof segment.audio === 'string' ? segment.audio : undefined;
  const editedFile = typeof (segment as { audioEdited?: unknown }).audioEdited === 'string'
    ? ((segment as { audioEdited?: unknown }).audioEdited as string)
    : undefined;
  const history = Array.isArray((segment as { audioHistory?: unknown }).audioHistory)
    ? ((segment as { audioHistory?: unknown }).audioHistory as unknown[])
        .filter((value): value is string => typeof value === 'string')
    : [];
  const stored = (segment as { audioProcessing?: unknown }).audioProcessing;
  if (stored && typeof stored === 'object') {
    const candidate = stored as Partial<AudioProcessingRequest> & { effects?: AudioEffectSettings };
    audioState.trimStartMs = typeof candidate.trimStartMs === 'number' ? candidate.trimStartMs : 0;
    audioState.trimEndMs = typeof candidate.trimEndMs === 'number' ? candidate.trimEndMs : undefined;
    audioState.normalize = Boolean(candidate.normalize);
    if (candidate.effects && typeof candidate.effects === 'object') {
      audioState.effects = { ...candidate.effects };
    }
  }
  audioState.sourceFile = originalFile;
  audioState.editedFile = editedFile;
  audioState.history = history;
  updateAudioControls();
  updateAudioPlayers();
  if (!originalFile) {
    setAudioStatus('Für dieses Segment liegt keine Audiodatei vor.', 'warning');
    return;
  }
  setAudioStatus('Wellenform wird geladen …');
  audioLoadToken += 1;
  const token = audioLoadToken;
  try {
    const bridge = getAudioBridge();
    audioState.originalWave = await bridge.loadWaveform(sessionId, originalFile, {
      maxPeaks: 4096,
      targetSampleRate: 8000,
    });
    if (token !== audioLoadToken) {
      return;
    }
    if (audioState.editedFile) {
      audioState.editedWave = await bridge.loadWaveform(sessionId, audioState.editedFile, {
        maxPeaks: 4096,
        targetSampleRate: 8000,
      });
    } else {
      audioState.editedWave = undefined;
    }
    if (token !== audioLoadToken) {
      return;
    }
    updateWaveforms();
    setAudioStatus('Audio bereit.');
  } catch (error) {
    console.error('Wellenform konnte nicht geladen werden:', error);
    setAudioStatus(`Wellenform konnte nicht geladen werden: ${(error as Error).message}`, 'error');
  }
}

async function applyAudioEdits(): Promise<void> {
  if (activeIndex === -1 || !audioState.sourceFile) {
    return;
  }
  syncAudioStateFromInputs();
  setAudioStatus('Audio wird verarbeitet …');
  try {
    const bridge = getAudioBridge();
    const request: AudioProcessingRequest = {
      sourceFile: audioState.editedFile ?? audioState.sourceFile,
      trimStartMs: audioState.trimStartMs,
      trimEndMs: audioState.trimEndMs,
      effects: { ...audioState.effects },
      normalize: audioState.normalize,
    };
    const result = await bridge.processClip(sessionId, request);
    const previous = audioState.editedFile ?? audioState.sourceFile;
    if (previous) {
      audioState.history = [...audioState.history, previous];
    }
    audioState.editedFile = result.outputFile;
    audioState.editedWave = await bridge.loadWaveform(sessionId, result.outputFile, {
      maxPeaks: 4096,
      targetSampleRate: 8000,
    });
    updateWaveforms();
    updateAudioPlayers();
    const segment = segments[activeIndex];
    (segment as { audioEdited?: string }).audioEdited = audioState.editedFile;
    (segment as { audioHistory?: string[] }).audioHistory = [...audioState.history];
    (segment as { audioProcessing?: Partial<AudioProcessingRequest> }).audioProcessing = {
      trimStartMs: audioState.trimStartMs,
      trimEndMs: audioState.trimEndMs,
      effects: { ...audioState.effects },
      normalize: audioState.normalize,
    };
    markDirty(activeIndex);
    setAudioStatus('Audio wurde bearbeitet.', 'success');
    updateAudioControls();
  } catch (error) {
    console.error('Audio konnte nicht verarbeitet werden:', error);
    setAudioStatus(`Audio konnte nicht verarbeitet werden: ${(error as Error).message}`, 'error');
  }
}

async function undoAudioEdit(): Promise<void> {
  if (activeIndex === -1 || audioState.history.length === 0) {
    return;
  }
  const previous = audioState.history.pop();
  if (!previous) {
    return;
  }
  audioState.editedFile = previous === audioState.sourceFile ? undefined : previous;
  try {
    if (audioState.editedFile) {
      const bridge = getAudioBridge();
      audioState.editedWave = await bridge.loadWaveform(sessionId, audioState.editedFile, {
        maxPeaks: 4096,
        targetSampleRate: 8000,
      });
    } else {
      audioState.editedWave = undefined;
    }
    const segment = segments[activeIndex];
    (segment as { audioEdited?: string | undefined }).audioEdited = audioState.editedFile;
    (segment as { audioHistory?: string[] }).audioHistory = [...audioState.history];
    markDirty(activeIndex);
    updateWaveforms();
    updateAudioPlayers();
    updateAudioControls();
    setAudioStatus('Letzte Änderung wurde zurückgenommen.', 'success');
  } catch (error) {
    console.error('Rückgängig machen fehlgeschlagen:', error);
    setAudioStatus(`Rückgängig machen fehlgeschlagen: ${(error as Error).message}`, 'error');
  }
}

async function reloadWaveforms(): Promise<void> {
  if (activeIndex === -1 || !audioState.sourceFile) {
    return;
  }
  const segment = segments[activeIndex];
  await loadSegmentAudio(segment);
}

function setupWaveformRenderer(): void {
  if (
    waveformRenderer ||
    !waveOriginalCanvas ||
    !waveProcessedCanvas ||
    !waveOriginalRuler ||
    !waveProcessedRuler ||
    !waveOriginalScroll ||
    !waveProcessedScroll
  ) {
    return;
  }
  waveformRenderer = new WaveformPairRenderer({
    original: {
      canvas: waveOriginalCanvas,
      ruler: waveOriginalRuler,
      scroll: waveOriginalScroll,
    },
    processed: {
      canvas: waveProcessedCanvas,
      ruler: waveProcessedRuler,
      scroll: waveProcessedScroll,
    },
  });
  waveformRenderer.setZoom(audioState.zoom);
  waveformRenderer.setHeight(audioState.height);
  waveformRenderer.setSync(Boolean(audioSyncInput?.checked ?? true));
  updateWaveforms();
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
    resetAudioState();
    setAudioStatus('Kein Segment ausgewählt.', 'info');
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
  void loadSegmentAudio(segment);
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
  audioZoomInput?.addEventListener('input', () => {
    const value = Number.parseFloat(audioZoomInput.value);
    if (Number.isFinite(value)) {
      audioState.zoom = value;
      waveformRenderer?.setZoom(value);
    }
  });
  audioHeightInput?.addEventListener('input', () => {
    const value = Number.parseInt(audioHeightInput.value, 10);
    if (Number.isFinite(value)) {
      audioState.height = value;
      waveformRenderer?.setHeight(value);
    }
  });
  audioSyncInput?.addEventListener('change', () => {
    waveformRenderer?.setSync(Boolean(audioSyncInput?.checked));
  });
  audioTrimStartInput?.addEventListener('change', () => {
    syncAudioStateFromInputs();
    updateAudioControls();
  });
  audioTrimEndInput?.addEventListener('change', () => {
    syncAudioStateFromInputs();
    updateAudioControls();
  });
  audioTempoInput?.addEventListener('change', () => {
    syncAudioStateFromInputs();
  });
  audioGainInput?.addEventListener('change', () => {
    syncAudioStateFromInputs();
  });
  audioFadeInInput?.addEventListener('change', () => {
    syncAudioStateFromInputs();
  });
  audioFadeOutInput?.addEventListener('change', () => {
    syncAudioStateFromInputs();
  });
  audioReverseInput?.addEventListener('change', () => {
    syncAudioStateFromInputs();
  });
  audioNormalizeInput?.addEventListener('change', () => {
    syncAudioStateFromInputs();
  });
  audioApplyButton?.addEventListener('click', () => {
    void applyAudioEdits();
  });
  audioUndoButton?.addEventListener('click', () => {
    void undoAudioEdit();
  });
  audioReloadButton?.addEventListener('click', () => {
    void reloadWaveforms();
  });
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
  setupWaveformRenderer();
  updateAudioControls();
  updateAudioPlayers();
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
