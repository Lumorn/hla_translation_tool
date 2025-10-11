import { promises as fs, constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import {
  buildProgressSnapshot,
  calculateProjectStats,
  createEmptyStats,
  type ProjectProgressSnapshot as SharedProjectProgressSnapshot,
  type ProjectSegmentLike,
  type ProjectDataLike,
} from '../shared/projectStats';

/**
 * Beschreibt die Projekt-Metadaten aus der `project.json`.
 */
export interface ProjectProgressSnapshot extends SharedProjectProgressSnapshot {}

/**
 * Beschreibt die Projekt-Metadaten aus der `project.json`.
 */
export interface ProjectManifest {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  chapter: string;
  level: string;
  progress: ProjectProgressSnapshot;
}

/**
 * Beschreibt die gespeicherten Einstellungen eines Projekts.
 */
export interface ProjectSettings {
  language: string;
  playbackRate: number;
  [key: string]: unknown;
}

/**
 * Beschreibt einen einzelnen Dialog- oder Textabschnitt innerhalb eines Projekts.
 */
export interface ProjectSegment extends ProjectSegmentLike {
  id: string;
  text?: string;
  translation?: string;
  audio?: string;
  status?: string;
  [key: string]: unknown;
}

/**
 * Formale Struktur des Datencontainers (`data.json`).
 */
export interface ProjectData extends ProjectDataLike {
  segments: ProjectSegment[];
  [key: string]: unknown;
}

/**
 * Optionen, die beim Anlegen eines Projekts überschrieben werden können.
 */
export type ProjectManifestInput = Partial<Omit<ProjectManifest, 'progress'>> & {
  progress?: Partial<ProjectProgressSnapshot>;
};

export interface ProjectManifestUpdate {
  chapter?: string;
  level?: string;
  rating?: number;
}

export interface CreateProjectOptions {
  manifest?: ProjectManifestInput;
  settings?: Partial<ProjectSettings>;
  data?: Partial<ProjectData>;
}

/**
 * Pfadübersicht für ein konkretes Projekt.
 */
export interface ProjectPaths {
  root: string;
  manifestFile: string;
  settingsFile: string;
  dataFile: string;
  audioDir: string;
  logsDir: string;
  backupsDir: string;
  audioBackupsDir: string;
  lockFile: string;
  logFile: string;
}

/**
 * Beschreibt ein verfügbares Backup innerhalb eines Projekts.
 */
export interface ProjectBackupInfo {
  name: string;
  path: string;
  createdAt: string;
  size: number;
}

/**
 * Beschreibt einen Audio-Schnappschuss, der den Zustand des `audio/`-Ordners einfriert.
 */
export interface ProjectAudioBackupInfo {
  name: string;
  path: string;
  createdAt: string;
  size: number;
}

/**
 * Ergebnis nach dem Öffnen eines Projekts.
 */
export interface ProjectSessionSnapshot {
  sessionId: string;
  paths: ProjectPaths;
}

/**
 * Beschreibt einen Eintrag innerhalb der festen Projektbibliothek.
 */
export interface ProjectLibraryEntry {
  folderName: string;
  path: string;
  manifest: ProjectManifest;
  hasLock: boolean;
}

/**
 * Ergebnis nach dem Anlegen eines Projekts in der Bibliothek.
 */
export interface ProjectLibraryCreateResult {
  folderName: string;
  path: string;
  paths: ProjectPaths;
  manifest: ProjectManifest;
}

/**
 * Fehlerklasse für Projektoperationen.
 */
export class ProjectStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectStoreError';
  }
}

const LOCK_FILE_NAME = '.project.lock';
const LOG_FILE_NAME = 'events.log';
const BACKUP_PREFIX = 'backup-';
const AUDIO_BACKUP_PREFIX = 'audio-snapshot-';
const PROJECT_FALLBACK_PREFIX = 'projekt';

/**
 * Standardwerte für neue Projekte, damit jede Datei valide JSON-Strukturen enthält.
 */
const DEFAULT_PROGRESS: ProjectProgressSnapshot = {
  totalSegments: 0,
  translatedSegments: 0,
  audioSegments: 0,
  completedSegments: 0,
  translationPercent: 0,
  audioPercent: 0,
  completedPercent: 0,
  pendingReviewSegments: 0,
  rating: 0,
  statusCounts: {},
  noteCounts: {},
  notesTotal: 0,
  updatedAt: new Date(0).toISOString(),
};

const DEFAULT_MANIFEST_BASE: Omit<ProjectManifest, 'progress'> = {
  id: '',
  name: 'Neues Projekt',
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
  version: 1,
  chapter: 'Unsortiert',
  level: 'Allgemein',
};

const DEFAULT_MANIFEST: ProjectManifest = {
  ...DEFAULT_MANIFEST_BASE,
  progress: {
    ...DEFAULT_PROGRESS,
    statusCounts: {},
    noteCounts: {},
  },
};

const DEFAULT_SETTINGS: ProjectSettings = {
  language: 'de-DE',
  playbackRate: 1,
};

const DEFAULT_DATA: ProjectData = {
  segments: [],
};

function clampRating(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_PROGRESS.rating;
  }
  return Math.max(0, Math.min(5, Math.round(value)));
}

function sanitizeText(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }
  return fallback;
}

function sanitizeDate(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  return fallback;
}

function sanitizeChapter(value: unknown): string {
  return sanitizeText(value, DEFAULT_MANIFEST_BASE.chapter);
}

function sanitizeLevel(value: unknown): string {
  return sanitizeText(value, DEFAULT_MANIFEST_BASE.level);
}

function normalizeProgress(progress?: Partial<ProjectProgressSnapshot>): ProjectProgressSnapshot {
  const target = progress ?? {};
  const rating = clampRating(typeof target.rating === 'number' ? target.rating : DEFAULT_PROGRESS.rating);
  const updatedAt = sanitizeDate(target.updatedAt, DEFAULT_PROGRESS.updatedAt);

  const statusCounts: Record<string, number> = {};
  if (target.statusCounts && typeof target.statusCounts === 'object') {
    for (const [key, value] of Object.entries(target.statusCounts)) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        statusCounts[key] = Math.max(0, Math.round(value));
      }
    }
  }

  const noteCounts: Record<string, number> = {};
  if (target.noteCounts && typeof target.noteCounts === 'object') {
    for (const [key, value] of Object.entries(target.noteCounts)) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        noteCounts[key] = Math.max(0, Math.round(value));
      }
    }
  }

  return {
    totalSegments: Number.isFinite(target.totalSegments) ? Math.max(0, Math.round(target.totalSegments!)) : 0,
    translatedSegments: Number.isFinite(target.translatedSegments)
      ? Math.max(0, Math.round(target.translatedSegments!))
      : 0,
    audioSegments: Number.isFinite(target.audioSegments) ? Math.max(0, Math.round(target.audioSegments!)) : 0,
    completedSegments: Number.isFinite(target.completedSegments)
      ? Math.max(0, Math.round(target.completedSegments!))
      : 0,
    translationPercent: Number.isFinite(target.translationPercent)
      ? Math.max(0, Math.min(100, Math.round(target.translationPercent!)))
      : 0,
    audioPercent: Number.isFinite(target.audioPercent)
      ? Math.max(0, Math.min(100, Math.round(target.audioPercent!)))
      : 0,
    completedPercent: Number.isFinite(target.completedPercent)
      ? Math.max(0, Math.min(100, Math.round(target.completedPercent!)))
      : 0,
    pendingReviewSegments: Number.isFinite(target.pendingReviewSegments)
      ? Math.max(0, Math.round(target.pendingReviewSegments!))
      : 0,
    rating,
    statusCounts,
    noteCounts,
    notesTotal: Number.isFinite(target.notesTotal) ? Math.max(0, Math.round(target.notesTotal!)) : 0,
    updatedAt,
  };
}

function normalizeManifest(manifest?: ProjectManifestInput | Partial<ProjectManifest>): ProjectManifest {
  const source = manifest ?? {};
  const id = sanitizeText(source.id, '') || randomUUID();
  const name = sanitizeText(source.name, DEFAULT_MANIFEST_BASE.name);
  const createdAt = sanitizeDate(source.createdAt, new Date().toISOString());
  const updatedAt = sanitizeDate(source.updatedAt, new Date().toISOString());
  const version = Number.isFinite(source.version) ? Number(source.version) : DEFAULT_MANIFEST_BASE.version;
  const chapter = sanitizeChapter(source.chapter);
  const level = sanitizeLevel(source.level);
  const progress = normalizeProgress(source.progress);

  return {
    id,
    name,
    createdAt,
    updatedAt,
    version,
    chapter,
    level,
    progress,
  };
}

function toStableJson(value: unknown): string {
  return JSON.stringify(
    value,
    (_key, current) => {
      if (current && typeof current === 'object' && !Array.isArray(current)) {
        const sorted: Record<string, unknown> = {};
        for (const key of Object.keys(current).sort()) {
          sorted[key] = (current as Record<string, unknown>)[key];
        }
        return sorted;
      }
      return current;
    },
    2
  );
}

/**
 * Prüft, ob ein Pfad existiert.
 */
async function pathExists(target: string): Promise<boolean> {
  try {
    await fs.access(target, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Stellt sicher, dass ein Verzeichnis angelegt wurde.
 */
async function ensureDirectory(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Schreibt JSON-Inhalte transaktionssicher.
 */
async function writeJsonAtomic(targetFile: string, data: unknown): Promise<void> {
  const directory = path.dirname(targetFile);
  await ensureDirectory(directory);
  const tempFile = `${targetFile}.tmp-${randomUUID()}`;
  const payload = `${JSON.stringify(data, null, 2)}\n`;

  try {
    await fs.writeFile(tempFile, payload, 'utf8');
    await fs.rename(tempFile, targetFile);
  } catch (error) {
    await fs.rm(tempFile, { force: true }).catch(() => undefined);
    throw error;
  }
}

/**
 * Liest eine JSON-Datei ein.
 */
async function readJsonFile<T>(file: string): Promise<T> {
  const content = await fs.readFile(file, 'utf8');
  return JSON.parse(content) as T;
}

/**
 * Protokolliert ein Ereignis im Log-Verzeichnis.
 */
async function appendLog(logFile: string, message: string): Promise<void> {
  const directory = path.dirname(logFile);
  await ensureDirectory(directory);
  const time = new Date().toISOString();
  const line = `[${time}] ${message}\n`;
  await fs.appendFile(logFile, line, 'utf8');
}

/**
 * Ermittelt rekursiv die Gesamtgröße eines Ordners.
 */
async function calculateDirectorySize(directory: string): Promise<number> {
  let total = 0;
  const entries = await fs.readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      total += await calculateDirectorySize(fullPath);
    } else if (entry.isFile()) {
      const stats = await fs.stat(fullPath);
      total += stats.size;
    }
  }

  return total;
}

/**
 * Prüft Backupdateinamen auf unzulässige Pfadbestandteile.
 */
function sanitizeBackupName(name: string): string {
  if (name.includes('..') || name.includes(path.sep)) {
    throw new ProjectStoreError('Der angegebene Backup-Name ist ungültig.');
  }
  return name;
}

/**
 * Kopiert ein Verzeichnis rekursiv in einen Zielordner.
 */
async function copyDirectory(source: string, target: string): Promise<void> {
  await ensureDirectory(path.dirname(target));
  await fs.rm(target, { recursive: true, force: true });
  await fs.cp(source, target, { recursive: true });
}

/**
 * Normalisiert einen Projektnamen zu einem Ordnernamen.
 */
function slugifyProjectName(name: string): string {
  const base = name
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\-_ ]+/gu, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  if (base.length > 0) {
    return base;
  }

  return `${PROJECT_FALLBACK_PREFIX}-${Date.now()}`;
}

/**
 * Erstellt eine vollständige Projektstruktur in einem Zielordner.
 */
export async function createProject(targetDirectory: string, options: CreateProjectOptions = {}): Promise<ProjectPaths> {
  const resolvedRoot = path.resolve(targetDirectory);
  const paths = resolveProjectPaths(resolvedRoot);

  if (await pathExists(paths.manifestFile)) {
    throw new ProjectStoreError('Der Zielordner enthält bereits ein Projekt.');
  }

  await ensureDirectory(resolvedRoot);
  await ensureDirectory(paths.audioDir);
  await ensureDirectory(paths.logsDir);
  await ensureDirectory(paths.backupsDir);
  await ensureDirectory(paths.audioBackupsDir);

  const now = new Date().toISOString();
  const manifestInput: ProjectManifestInput = {
    ...options.manifest,
    id: options.manifest?.id ?? randomUUID(),
    name: options.manifest?.name ?? path.basename(resolvedRoot),
    createdAt: options.manifest?.createdAt ?? now,
    updatedAt: now,
    version: options.manifest?.version ?? DEFAULT_MANIFEST_BASE.version,
    chapter: options.manifest?.chapter ?? DEFAULT_MANIFEST_BASE.chapter,
    level: options.manifest?.level ?? DEFAULT_MANIFEST_BASE.level,
    progress:
      options.manifest?.progress ??
      buildProgressSnapshot(createEmptyStats(), { rating: DEFAULT_PROGRESS.rating, updatedAt: now }),
  };
  const manifest = normalizeManifest(manifestInput);

  const settings: ProjectSettings = {
    ...DEFAULT_SETTINGS,
    ...options.settings,
  };

  const data: ProjectData = {
    ...DEFAULT_DATA,
    ...options.data,
  };

  await writeJsonAtomic(paths.manifestFile, manifest);
  await writeJsonAtomic(paths.settingsFile, settings);
  await writeJsonAtomic(paths.dataFile, data);
  await appendLog(paths.logFile, `Projekt "${manifest.name}" wurde angelegt.`);

  return paths;
}

/**
 * Stellt sicher, dass die Projektbibliothek vorhanden ist.
 */
export async function ensureProjectsLibrary(libraryRoot: string): Promise<string> {
  const normalized = path.resolve(libraryRoot);
  await ensureDirectory(normalized);
  return normalized;
}

/**
 * Listet alle Projekte auf, die innerhalb der festen Bibliothek liegen.
 */
export async function listProjectsInLibrary(libraryRoot: string): Promise<ProjectLibraryEntry[]> {
  const normalized = await ensureProjectsLibrary(libraryRoot);
  let directoryEntries: import('node:fs').Dirent[] = [];

  try {
    directoryEntries = await fs.readdir(normalized, { withFileTypes: true });
  } catch (error) {
    throw new ProjectStoreError(`Projektbibliothek konnte nicht gelesen werden: ${(error as Error).message}`);
  }

  const projects: ProjectLibraryEntry[] = [];

  for (const entry of directoryEntries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const folderName = entry.name;
    if (folderName.startsWith('.')) {
      continue;
    }

    const projectRoot = path.join(normalized, folderName);
    const manifestFile = path.join(projectRoot, 'project.json');
    if (!(await pathExists(manifestFile))) {
      continue;
    }

    const projectPaths = resolveProjectPaths(projectRoot);

    try {
      const manifest = await readManifest(projectPaths);
      const hasLock = await pathExists(projectPaths.lockFile);
      projects.push({
        folderName,
        path: projectPaths.root,
        manifest,
        hasLock,
      });
    } catch (error) {
      // Fehlerhaftes Projekt überspringen, damit die Liste weiterhin nutzbar bleibt
      console.warn(`Projekt "${folderName}" konnte nicht geladen werden:`, error);
    }
  }

  projects.sort((a, b) => {
    const left = a.manifest.updatedAt ?? '';
    const right = b.manifest.updatedAt ?? '';
    return right.localeCompare(left);
  });

  return projects;
}

/**
 * Legt ein neues Projekt in der festen Bibliothek an.
 */
export async function createProjectInLibrary(
  libraryRoot: string,
  projectName: string,
  options: CreateProjectOptions = {}
): Promise<ProjectLibraryCreateResult> {
  const trimmedName = projectName.trim();
  if (!trimmedName) {
    throw new ProjectStoreError('Der Projektname darf nicht leer sein.');
  }

  const normalized = await ensureProjectsLibrary(libraryRoot);
  const slugBase = slugifyProjectName(trimmedName);
  let folderName = slugBase;
  let counter = 2;

  while (await pathExists(path.join(normalized, folderName))) {
    folderName = `${slugBase}-${counter}`;
    counter += 1;
  }

  const projectRoot = path.join(normalized, folderName);
  const overrides: CreateProjectOptions = {
    ...options,
    manifest: {
      ...options.manifest,
      name: trimmedName,
    },
  };

  const paths = await createProject(projectRoot, overrides);
  const manifest = await readManifest(paths);

  return {
    folderName,
    path: paths.root,
    paths,
    manifest,
  };
}

/**
 * Öffnet ein bestehendes Projekt und erzeugt eine Sperrdatei.
 */
export async function openProject(targetDirectory: string): Promise<ProjectSessionSnapshot> {
  const resolvedRoot = path.resolve(targetDirectory);
  const paths = resolveProjectPaths(resolvedRoot);

  if (!(await pathExists(paths.manifestFile))) {
    throw new ProjectStoreError('Im angegebenen Ordner wurde kein Projekt gefunden.');
  }

  await ensureDirectory(resolvedRoot);
  await ensureDirectory(paths.logsDir);
  await ensureDirectory(paths.audioDir);
  await ensureDirectory(paths.backupsDir);
  await ensureDirectory(paths.audioBackupsDir);

  try {
    const handle = await fs.open(paths.lockFile, 'wx');
    await handle.writeFile(JSON.stringify({ createdAt: new Date().toISOString(), pid: process.pid }, null, 2));
    await handle.close();
  } catch (error) {
    throw new ProjectStoreError('Das Projekt ist bereits geöffnet.');
  }

  await appendLog(paths.logFile, 'Projekt wurde geöffnet.');

  return {
    sessionId: randomUUID(),
    paths,
  };
}

/**
 * Schließt ein Projekt und entfernt die Sperrdatei.
 */
export async function closeProject(session: ProjectSessionSnapshot): Promise<void> {
  await fs.rm(session.paths.lockFile, { force: true });
  await appendLog(session.paths.logFile, 'Projekt wurde geschlossen.');
}

/**
 * Liest die Manifest-Datei eines Projekts.
 */
export async function readManifest(paths: ProjectPaths): Promise<ProjectManifest> {
  const raw = await readJsonFile<Partial<ProjectManifest>>(paths.manifestFile);
  let manifest = normalizeManifest(raw);

  let changed = toStableJson(raw) !== toStableJson(manifest);

  const requiresProgressMigration =
    manifest.progress.updatedAt === DEFAULT_PROGRESS.updatedAt && (await pathExists(paths.dataFile));

  if (requiresProgressMigration) {
    try {
      const data = await readJsonFile<ProjectData>(paths.dataFile);
      const stats = calculateProjectStats(data);
      const snapshot = buildProgressSnapshot(stats, manifest.progress);
      manifest = {
        ...manifest,
        progress: snapshot,
        updatedAt: new Date().toISOString(),
      };
      changed = true;
    } catch (error) {
      console.warn('Fortschritt konnte beim Lesen des Manifests nicht berechnet werden:', error);
    }
  }

  if (changed) {
    await writeJsonAtomic(paths.manifestFile, manifest);
    await appendLog(paths.logFile, 'Manifest migriert und aktualisiert.');
  }

  return manifest;
}

/**
 * Liest die Einstellungen eines Projekts.
 */
export async function readSettings(paths: ProjectPaths): Promise<ProjectSettings> {
  return readJsonFile<ProjectSettings>(paths.settingsFile);
}

/**
 * Schreibt neue Einstellungen und aktualisiert den Zeitstempel.
 */
export async function writeSettings(paths: ProjectPaths, settings: ProjectSettings): Promise<void> {
  await writeJsonAtomic(paths.settingsFile, settings);
  await touchManifest(paths, 'Einstellungen geändert');
  await appendLog(paths.logFile, 'Einstellungen wurden gespeichert.');
}

/**
 * Liest die Projektdaten.
 */
export async function readData(paths: ProjectPaths): Promise<ProjectData> {
  return readJsonFile<ProjectData>(paths.dataFile);
}

/**
 * Schreibt neue Projektdaten transaktionssicher.
 */
export async function writeData(paths: ProjectPaths, data: ProjectData, logMessage = 'Daten wurden aktualisiert.'): Promise<void> {
  await writeJsonAtomic(paths.dataFile, data);

  const stats = calculateProjectStats(data);
  const manifest = await readManifest(paths);
  const snapshot = buildProgressSnapshot(stats, manifest.progress);
  const updatedManifest: ProjectManifest = {
    ...manifest,
    progress: snapshot,
    updatedAt: new Date().toISOString(),
  };

  await writeJsonAtomic(paths.manifestFile, updatedManifest);
  await appendLog(paths.logFile, logMessage);
  await appendLog(paths.logFile, 'Fortschritt wurde neu berechnet.');
}

/**
 * Aktualisiert Kapitel, Level oder Bewertung eines Projekts.
 */
export async function updateProjectMetadata(
  projectRoot: string,
  updates: ProjectManifestUpdate
): Promise<ProjectManifest> {
  const normalizedRoot = path.resolve(projectRoot);
  const paths = resolveProjectPaths(normalizedRoot);

  if (!(await pathExists(paths.manifestFile))) {
    throw new ProjectStoreError('Für den angegebenen Pfad wurde kein Projekt gefunden.');
  }

  let manifest = await readManifest(paths);
  let changed = false;

  if (typeof updates.chapter === 'string') {
    const chapter = sanitizeChapter(updates.chapter);
    if (chapter !== manifest.chapter) {
      manifest = { ...manifest, chapter };
      changed = true;
    }
  }

  if (typeof updates.level === 'string') {
    const level = sanitizeLevel(updates.level);
    if (level !== manifest.level) {
      manifest = { ...manifest, level };
      changed = true;
    }
  }

  if (typeof updates.rating === 'number') {
    const rating = clampRating(updates.rating);
    if (rating !== manifest.progress.rating) {
      manifest = {
        ...manifest,
        progress: { ...manifest.progress, rating },
      };
      changed = true;
    }
  }

  if (!changed) {
    return manifest;
  }

  manifest = { ...manifest, updatedAt: new Date().toISOString() };
  await writeJsonAtomic(paths.manifestFile, manifest);
  await appendLog(paths.logFile, 'Projektmetadaten wurden angepasst.');

  return manifest;
}

/**
 * Erstellt ein Ordner-Backup inklusive Log-Eintrag.
 */
export async function createBackup(paths: ProjectPaths): Promise<ProjectBackupInfo> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFolderName = `${BACKUP_PREFIX}${timestamp}`;
  const backupPath = path.join(paths.backupsDir, backupFolderName);

  await ensureDirectory(paths.backupsDir);

  const stagingRoot = await fs.mkdtemp(path.join(tmpdir(), 'hla-backup-'));
  const stagingTarget = path.join(stagingRoot, path.basename(paths.root) || 'project-backup');

  await fs.cp(paths.root, stagingTarget, {
    recursive: true,
    force: true,
    errorOnExist: false,
    filter: (source) => {
      const resolvedSource = path.resolve(source);
      if (resolvedSource === path.resolve(paths.lockFile)) {
        return false;
      }
      if (resolvedSource.startsWith(path.resolve(paths.backupsDir))) {
        return false;
      }
      if (resolvedSource.startsWith(path.resolve(paths.audioBackupsDir))) {
        return false;
      }
      return true;
    },
  });

  await fs.rm(backupPath, { recursive: true, force: true });
  await fs.cp(stagingTarget, backupPath, { recursive: true });
  await fs.rm(stagingRoot, { recursive: true, force: true }).catch(() => undefined);

  const size = await calculateDirectorySize(backupPath);

  await appendLog(paths.logFile, `Backup "${backupFolderName}" wurde erstellt.`);

  return {
    name: backupFolderName,
    path: backupPath,
    createdAt: new Date().toISOString(),
    size,
  };
}

/**
 * Listet alle vorhandenen Backups des Projekts auf.
 */
export async function listBackups(paths: ProjectPaths): Promise<ProjectBackupInfo[]> {
  if (!(await pathExists(paths.backupsDir))) {
    return [];
  }

  const entries = await fs.readdir(paths.backupsDir, { withFileTypes: true });
  const backups: ProjectBackupInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const backupName = entry.name;
    if (!backupName.startsWith(BACKUP_PREFIX)) {
      continue;
    }

    const backupPath = path.join(paths.backupsDir, backupName);
    const stats = await fs.stat(backupPath);
    const size = await calculateDirectorySize(backupPath);

    backups.push({
      name: backupName,
      path: backupPath,
      createdAt: stats.mtime.toISOString(),
      size,
    });
  }

  return backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Stellt ein Backup wieder her, indem dessen Dateien zurückkopiert werden.
 */
export async function restoreBackup(paths: ProjectPaths, backupName: string): Promise<void> {
  const sanitized = sanitizeBackupName(backupName);
  const source = path.join(paths.backupsDir, sanitized);

  if (!(await pathExists(source))) {
    throw new ProjectStoreError('Das ausgewählte Backup wurde nicht gefunden.');
  }

  await fs.cp(source, paths.root, {
    recursive: true,
    force: true,
    errorOnExist: false,
    filter: (currentSource) => {
      if (path.basename(currentSource) === LOCK_FILE_NAME) {
        return false;
      }
      return true;
    },
  });

  await appendLog(paths.logFile, `Backup "${sanitized}" wurde wiederhergestellt.`);
}

/**
 * Löscht ein vorhandenes Backup aus dem Projekt.
 */
export async function deleteBackup(paths: ProjectPaths, backupName: string): Promise<void> {
  const sanitized = sanitizeBackupName(backupName);
  const target = path.join(paths.backupsDir, sanitized);

  if (!(await pathExists(target))) {
    throw new ProjectStoreError('Das ausgewählte Backup existiert nicht.');
  }

  await fs.rm(target, { recursive: true, force: true });
  await appendLog(paths.logFile, `Backup "${sanitized}" wurde gelöscht.`);
}

/**
 * Erstellt einen Audio-Schnappschuss des `audio/`-Ordners.
 */
export async function createAudioSnapshot(paths: ProjectPaths): Promise<ProjectAudioBackupInfo> {
  await ensureDirectory(paths.audioDir);
  await ensureDirectory(paths.audioBackupsDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const snapshotName = `${AUDIO_BACKUP_PREFIX}${timestamp}`;
  const targetDirectory = path.join(paths.audioBackupsDir, snapshotName);
  const tempDirectory = `${targetDirectory}.tmp-${randomUUID()}`;

  await fs.rm(tempDirectory, { recursive: true, force: true });
  await ensureDirectory(tempDirectory);
  await fs.cp(paths.audioDir, tempDirectory, { recursive: true });
  await fs.rm(targetDirectory, { recursive: true, force: true });
  await fs.rename(tempDirectory, targetDirectory);

  const size = await calculateDirectorySize(targetDirectory);
  const createdAt = new Date().toISOString();
  await appendLog(paths.logFile, `Audio-Schnappschuss "${snapshotName}" wurde angelegt.`);

  return {
    name: snapshotName,
    path: targetDirectory,
    createdAt,
    size,
  };
}

/**
 * Listet alle vorhandenen Audio-Schnappschüsse auf.
 */
export async function listAudioSnapshots(paths: ProjectPaths): Promise<ProjectAudioBackupInfo[]> {
  if (!(await pathExists(paths.audioBackupsDir))) {
    return [];
  }

  const entries = await fs.readdir(paths.audioBackupsDir, { withFileTypes: true });
  const snapshots: ProjectAudioBackupInfo[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const name = entry.name;
    if (!name.startsWith(AUDIO_BACKUP_PREFIX)) {
      continue;
    }

    const snapshotPath = path.join(paths.audioBackupsDir, name);
    const stats = await fs.stat(snapshotPath);
    const size = await calculateDirectorySize(snapshotPath);
    snapshots.push({
      name,
      path: snapshotPath,
      createdAt: stats.mtime.toISOString(),
      size,
    });
  }

  return snapshots.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Stellt einen Audio-Schnappschuss wieder her und ersetzt den `audio/`-Ordner.
 */
export async function restoreAudioSnapshot(paths: ProjectPaths, snapshotName: string): Promise<void> {
  const sanitized = sanitizeBackupName(snapshotName);
  const sourceDirectory = path.join(paths.audioBackupsDir, sanitized);

  if (!(await pathExists(sourceDirectory))) {
    throw new ProjectStoreError('Der gewünschte Audio-Schnappschuss existiert nicht.');
  }

  const tempDirectory = `${paths.audioDir}.restore-${randomUUID()}`;

  if (await pathExists(paths.audioDir)) {
    await fs.rm(tempDirectory, { recursive: true, force: true });
    await fs.rename(paths.audioDir, tempDirectory);
  } else {
    await ensureDirectory(paths.audioDir);
  }

  try {
    await copyDirectory(sourceDirectory, paths.audioDir);
    await fs.rm(tempDirectory, { recursive: true, force: true });
  } catch (error) {
    await fs.rm(paths.audioDir, { recursive: true, force: true }).catch(() => undefined);
    if (await pathExists(tempDirectory)) {
      await fs.rename(tempDirectory, paths.audioDir).catch(() => undefined);
    }
    throw error;
  }

  await touchManifest(paths, `Audio-Schnappschuss ${sanitized} wiederhergestellt`);
  await appendLog(paths.logFile, `Audio-Schnappschuss "${sanitized}" wurde wiederhergestellt.`);
}

/**
 * Entfernt einen Audio-Schnappschuss aus dem Projekt.
 */
export async function deleteAudioSnapshot(paths: ProjectPaths, snapshotName: string): Promise<void> {
  const sanitized = sanitizeBackupName(snapshotName);
  const snapshotPath = path.join(paths.audioBackupsDir, sanitized);

  if (!(await pathExists(snapshotPath))) {
    throw new ProjectStoreError('Der gewünschte Audio-Schnappschuss existiert nicht.');
  }

  await fs.rm(snapshotPath, { recursive: true, force: true });
  await appendLog(paths.logFile, `Audio-Schnappschuss "${sanitized}" wurde gelöscht.`);
}

/**
 * Ermittelt die Pfadstruktur eines Projekts relativ zum Stammordner.
 */
export function resolveProjectPaths(root: string): ProjectPaths {
  const normalizedRoot = path.resolve(root);
  const manifestFile = path.join(normalizedRoot, 'project.json');
  const settingsFile = path.join(normalizedRoot, 'settings.json');
  const dataFile = path.join(normalizedRoot, 'data.json');
  const audioDir = path.join(normalizedRoot, 'audio');
  const logsDir = path.join(normalizedRoot, 'logs');
  const backupsDir = path.join(normalizedRoot, 'backups');
  const audioBackupsDir = path.join(normalizedRoot, 'audio-backups');
  const lockFile = path.join(normalizedRoot, LOCK_FILE_NAME);
  const logFile = path.join(logsDir, LOG_FILE_NAME);

  return {
    root: normalizedRoot,
    manifestFile,
    settingsFile,
    dataFile,
    audioDir,
    logsDir,
    backupsDir,
    audioBackupsDir,
    lockFile,
    logFile,
  };
}

/**
 * Aktualisiert den Änderungszeitstempel der Manifest-Datei.
 */
async function touchManifest(paths: ProjectPaths, reason: string): Promise<void> {
  const manifest = await readManifest(paths);
  manifest.updatedAt = new Date().toISOString();
  await writeJsonAtomic(paths.manifestFile, manifest);
  await appendLog(paths.logFile, `Manifest aktualisiert (${reason}).`);
}
