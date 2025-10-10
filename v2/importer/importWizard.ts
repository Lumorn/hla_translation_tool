import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  ProjectData,
  ProjectPaths,
  readData,
  writeData,
} from '../backend/projectStore';

/**
 * Beschreibt die Auswahl der Quellpfade für den Import.
 */
export interface ImportSourceSelection {
  root: string;
  dataFiles: string[];
  audioDirectories: string[];
}

/**
 * Unterstützte Konfliktarten während des Imports.
 */
export type ImportConflictType =
  | 'missing-audio'
  | 'duplicate-in-import'
  | 'existing-record';

/**
 * Entscheidet, wie ein Konflikt behandelt wird.
 */
export type ImportDecision = 'skip' | 'import' | 'force';

/**
 * Beschreibt einen eingelesenen Datensatz aus einer V1-Quelle.
 */
export interface ImportRecord {
  id: string;
  text?: string;
  audioHint?: string;
  sourceFile: string;
  sourceIndex: number;
  raw: unknown;
}

/**
 * Interne Repräsentation einer Audio-Datei.
 */
interface AudioAsset {
  absolutePath: string;
  relativePath: string;
  fileName: string;
}

/**
 * Erweiterter Datensatz inklusive zugeordneter Audio-Datei.
 */
interface PreparedRecord extends ImportRecord {
  audioAsset?: AudioAsset;
}

/**
 * Konflikt inklusive Beschreibung und vorgeschlagener Behandlung.
 */
export interface ImportConflict {
  key: string;
  type: ImportConflictType;
  severity: 'warning' | 'error';
  message: string;
  record: PreparedRecord;
}

/**
 * Zusammenfassung nach der Konfliktauflösung.
 */
export interface ImportResolutionSummary {
  toImport: PreparedRecord[];
  toSkip: PreparedRecord[];
  conflicts: ImportConflict[];
  decisions: Record<string, ImportDecision>;
}

/**
 * Ergebnis der Kopierphase.
 */
export interface ImportCopyResult {
  copiedFiles: string[];
  writtenRecords: number;
  dataFile: string;
}

/**
 * Abschließender Bericht nach allen Schritten.
 */
export interface ImportReport {
  imported: number;
  skipped: number;
  missingAudio: number;
  copiedFiles: string[];
  dataFile: string;
  logFile: string;
  details: Array<{
    id: string;
    action: 'imported' | 'skipped' | 'missing-audio';
    message: string;
  }>;
}

/**
 * Fortschrittszustand des Wizards.
 */
export type ImportWizardStep =
  | 'idle'
  | 'sources-selected'
  | 'scan-complete'
  | 'audit-complete'
  | 'conflicts-resolved'
  | 'copy-complete'
  | 'report-ready';

/**
 * Zustandsobjekt für den Renderer.
 */
export interface ImportWizardState {
  step: ImportWizardStep;
  selection?: ImportSourceSelection;
  scan?: {
    totalRecords: number;
    dataFiles: number;
    audioFiles: number;
    sample?: ImportRecord;
  };
  audit?: {
    readyRecords: number;
    conflicts: ImportConflict[];
  };
  resolution?: {
    toImport: number;
    toSkip: number;
  };
  copy?: ImportCopyResult;
  report?: ImportReport;
  errors?: string[];
}

/**
 * Normalisierte Pfadauswahl mit absolut aufgelösten Einträgen.
 */
interface NormalizedSelection {
  root: string;
  dataFiles: string[];
  audioDirectories: string[];
}

/**
 * Führt den mehrstufigen Import durch und speichert Zwischenergebnisse.
 */
export class ImportWizardSession {
  private readonly projectPaths: ProjectPaths;
  private selection?: NormalizedSelection;
  private records: ImportRecord[] = [];
  private audioAssets: AudioAsset[] = [];
  private preparedRecords: PreparedRecord[] = [];
  private conflicts: ImportConflict[] = [];
  private resolution?: ImportResolutionSummary;
  private copyResult?: ImportCopyResult;
  private report?: ImportReport;
  private step: ImportWizardStep = 'idle';
  private errors: string[] = [];

  constructor(projectPaths: ProjectPaths) {
    this.projectPaths = projectPaths;
  }

  /**
   * Setzt den Wizard zurück, damit mehrere Durchläufe möglich sind.
   */
  reset(): void {
    this.selection = undefined;
    this.records = [];
    this.audioAssets = [];
    this.preparedRecords = [];
    this.conflicts = [];
    this.resolution = undefined;
    this.copyResult = undefined;
    this.report = undefined;
    this.step = 'idle';
    this.errors = [];
  }

  /**
   * Übernimmt die Quellpfade und prüft deren Existenz.
   */
  async selectSources(selection: ImportSourceSelection): Promise<ImportWizardState> {
    this.reset();

    const normalized = await this.normalizeSelection(selection);
    this.selection = normalized;
    this.step = 'sources-selected';

    return this.snapshot();
  }

  /**
   * Liest die V1-Quellen ein und bereitet Datensätze vor.
   */
  async scanSources(): Promise<ImportWizardState> {
    if (!this.selection) {
      throw new Error('Es wurden noch keine Quellpfade ausgewählt.');
    }

    this.records = await this.loadRecords(this.selection);
    this.audioAssets = await this.collectAudioAssets(this.selection);
    this.step = 'scan-complete';

    return this.snapshot();
  }

  /**
   * Prüft die eingelesenen Datensätze auf Konflikte.
   */
  async auditRecords(): Promise<ImportWizardState> {
    if (!this.selection) {
      throw new Error('Es wurden noch keine Quellpfade ausgewählt.');
    }

    const { prepared, conflicts } = await this.analyzeRecords();
    this.preparedRecords = prepared;
    this.conflicts = conflicts;
    this.resolution = undefined;
    this.step = 'audit-complete';

    return this.snapshot();
  }

  /**
   * Übernimmt Nutzerentscheidungen für Konflikte.
   */
  async resolveConflicts(decisions: Record<string, ImportDecision>): Promise<ImportWizardState> {
    if (this.step !== 'audit-complete') {
      throw new Error('Die Konfliktprüfung wurde noch nicht abgeschlossen.');
    }

    const { toImport, toSkip } = this.applyDecisions(decisions);
    this.resolution = {
      toImport,
      toSkip,
      conflicts: this.conflicts,
      decisions,
    };
    this.step = 'conflicts-resolved';

    return this.snapshot();
  }

  /**
   * Kopiert Dateien, schreibt Daten und erstellt Protokolle.
   */
  async executeImport(): Promise<ImportWizardState> {
    if (!this.resolution || !this.selection) {
      throw new Error('Der Import kann erst nach der Konfliktauflösung gestartet werden.');
    }

    const copyResult = await this.performCopyAndWrite(this.resolution.toImport);
    this.copyResult = copyResult;
    this.step = 'copy-complete';

    return this.snapshot();
  }

  /**
   * Erstellt einen Abschlussbericht.
   */
  async finalize(): Promise<ImportWizardState> {
    if (!this.resolution || !this.copyResult) {
      throw new Error('Der Bericht kann erst nach dem Kopieren erstellt werden.');
    }

    this.report = this.createReport();
    this.step = 'report-ready';

    return this.snapshot();
  }

  /**
   * Liefert den aktuellen Zustand für den Renderer.
   */
  snapshot(): ImportWizardState {
    return {
      step: this.step,
      selection: this.selection,
      scan: this.records.length
        ? {
            totalRecords: this.records.length,
            dataFiles: new Set(this.records.map((record) => record.sourceFile)).size,
            audioFiles: this.audioAssets.length,
            sample: this.records[0],
          }
        : undefined,
      audit: this.preparedRecords.length
        ? {
            readyRecords: this.preparedRecords.length,
            conflicts: this.conflicts,
          }
        : undefined,
      resolution: this.resolution
        ? {
            toImport: this.resolution.toImport.length,
            toSkip: this.resolution.toSkip.length,
          }
        : undefined,
      copy: this.copyResult,
      report: this.report,
      errors: this.errors.length ? [...this.errors] : undefined,
    };
  }

  /**
   * Normalisiert Eingaben, ohne die V1-Quellen zu verändern.
   */
  private async normalizeSelection(selection: ImportSourceSelection): Promise<NormalizedSelection> {
    const root = path.resolve(selection.root);
    await this.assertPathExists(root, 'Das Quellverzeichnis wurde nicht gefunden.');

    const uniqueDataFiles = Array.from(new Set(selection.dataFiles.map((file) => file.trim()).filter(Boolean)));
    const normalizedDataFiles: string[] = [];
    for (const file of uniqueDataFiles) {
      const absolute = path.isAbsolute(file) ? file : path.join(root, file);
      await this.assertPathExists(absolute, `Die Quelldatei "${file}" wurde nicht gefunden.`);
      normalizedDataFiles.push(path.resolve(absolute));
    }

    const uniqueAudioDirs = Array.from(new Set(selection.audioDirectories.map((dir) => dir.trim()).filter(Boolean)));
    const normalizedAudioDirs: string[] = [];
    for (const dir of uniqueAudioDirs) {
      const absolute = path.isAbsolute(dir) ? dir : path.join(root, dir);
      await this.assertPathExists(absolute, `Das Audioverzeichnis "${dir}" wurde nicht gefunden.`);
      normalizedAudioDirs.push(path.resolve(absolute));
    }

    return {
      root,
      dataFiles: normalizedDataFiles,
      audioDirectories: normalizedAudioDirs,
    };
  }

  /**
   * Prüft, ob ein Pfad existiert und andernfalls einen Fehler wirft.
   */
  private async assertPathExists(target: string, message: string): Promise<void> {
    try {
      await fs.access(target);
    } catch {
      throw new Error(message);
    }
  }

  /**
   * Lädt alle Datensätze aus den angegebenen JSON-Dateien.
   */
  private async loadRecords(selection: NormalizedSelection): Promise<ImportRecord[]> {
    const records: ImportRecord[] = [];

    for (const file of selection.dataFiles) {
      const content = await fs.readFile(file, 'utf8');
      let parsed: unknown;
      try {
        parsed = JSON.parse(content);
      } catch (error) {
        this.errors.push(`Datei "${file}" konnte nicht gelesen werden: ${(error as Error).message}`);
        continue;
      }

      const entries = this.extractEntries(parsed);
      entries.forEach((entry, index) => {
        const id = this.extractIdentifier(entry, file, index);
        const text = this.extractText(entry);
        const audioHint = this.extractAudioHint(entry);
        records.push({
          id,
          text,
          audioHint,
          sourceFile: file,
          sourceIndex: index,
          raw: entry,
        });
      });
    }

    return records;
  }

  /**
   * Wandelt beliebige JSON-Strukturen in eine Liste um.
   */
  private extractEntries(parsed: unknown): any[] {
    if (Array.isArray(parsed)) {
      return parsed;
    }

    if (parsed && typeof parsed === 'object') {
      if (Array.isArray((parsed as any).segments)) {
        return (parsed as any).segments;
      }
      if (Array.isArray((parsed as any).entries)) {
        return (parsed as any).entries;
      }
      return Object.values(parsed as Record<string, unknown>);
    }

    return [];
  }

  /**
   * Leitet die Datensatz-ID her oder erzeugt einen Fallback.
   */
  private extractIdentifier(entry: any, file: string, index: number): string {
    const fallback = `${path.basename(file)}#${index + 1}`;
    const candidate = entry?.id ?? entry?.uuid ?? entry?.key ?? fallback;
    return String(candidate).trim() || fallback;
  }

  /**
   * Extrahiert den Textinhalt, sofern vorhanden.
   */
  private extractText(entry: any): string | undefined {
    const candidate = entry?.text ?? entry?.caption ?? entry?.subtitle;
    if (candidate && typeof candidate === 'string') {
      return candidate;
    }
    return undefined;
  }

  /**
   * Ermittelt einen Audio-Hinweis für den Datensatz.
   */
  private extractAudioHint(entry: any): string | undefined {
    const candidate = entry?.audio ?? entry?.audioFile ?? entry?.file ?? entry?.sound;
    if (candidate && typeof candidate === 'string') {
      return candidate;
    }
    return undefined;
  }

  /**
   * Sammelt alle verfügbaren Audiodateien rekursiv ein.
   */
  private async collectAudioAssets(selection: NormalizedSelection): Promise<AudioAsset[]> {
    const assets: AudioAsset[] = [];

    for (const dir of selection.audioDirectories) {
      const files = await this.walkDirectory(dir);
      for (const file of files) {
        const fileName = path.basename(file);
        const relativePath = path.relative(selection.root, file);
        assets.push({
          absolutePath: file,
          relativePath: normalizePath(relativePath),
          fileName,
        });
      }
    }

    return assets;
  }

  /**
   * Rekursive Verzeichnissuche ohne Änderungen an den Quellen.
   */
  private async walkDirectory(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await this.walkDirectory(fullPath)));
      } else if (entry.isFile()) {
        if (isAudioFile(fullPath)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  /**
   * Analysiert eingelesene Datensätze und erstellt Konfliktlisten.
   */
  private async analyzeRecords(): Promise<{
    prepared: PreparedRecord[];
    conflicts: ImportConflict[];
  }> {
    const prepared: PreparedRecord[] = [];
    const conflicts: ImportConflict[] = [];
    const seenIds = new Map<string, PreparedRecord[]>();

    const projectData = await this.loadProjectData();
    const existingIds = new Set<string>(
      Array.isArray(projectData.segments)
        ? projectData.segments
            .map((segment: any) => segment?.id)
            .filter((id: unknown): id is string => typeof id === 'string')
        : []
    );

    for (const record of this.records) {
      const matchedAsset = record.audioHint ? this.findAudioAsset(record.audioHint) : undefined;
      const preparedRecord: PreparedRecord = {
        ...record,
        audioAsset: matchedAsset ?? undefined,
      };
      prepared.push(preparedRecord);

      if (!matchedAsset && record.audioHint) {
        conflicts.push({
          key: `${record.id}:missing-audio:${record.sourceIndex}`,
          type: 'missing-audio',
          severity: 'warning',
          message: `Keine passende Audiodatei für "${record.audioHint}" gefunden.`,
          record: preparedRecord,
        });
      }

      const occurrences = seenIds.get(record.id) ?? [];
      occurrences.push(preparedRecord);
      seenIds.set(record.id, occurrences);

      if (occurrences.length > 1) {
        conflicts.push({
          key: `${record.id}:duplicate:${occurrences.length}`,
          type: 'duplicate-in-import',
          severity: 'error',
          message: `Die ID "${record.id}" wurde mehrfach in den Importquellen gefunden.`,
          record: preparedRecord,
        });
      }

      if (existingIds.has(record.id)) {
        conflicts.push({
          key: `${record.id}:existing`,
          type: 'existing-record',
          severity: 'warning',
          message: `Im Zielprojekt existiert bereits ein Eintrag mit der ID "${record.id}".`,
          record: preparedRecord,
        });
      }
    }

    return { prepared, conflicts };
  }

  /**
   * Lädt die aktuelle Datenbasis des Zielprojekts.
   */
  private async loadProjectData(): Promise<ProjectData> {
    try {
      return await readData(this.projectPaths);
    } catch (error) {
      this.errors.push(`Bestehende Projektdaten konnten nicht gelesen werden: ${(error as Error).message}`);
      return { segments: [] };
    }
  }

  /**
   * Sucht die passende Audiodatei anhand des Hinweises.
   */
  private findAudioAsset(audioHint: string): AudioAsset | undefined {
    const normalizedHint = normalizePath(audioHint);
    const hintName = normalizePath(path.basename(audioHint));

    return (
      this.audioAssets.find((asset) => asset.relativePath === normalizedHint) ??
      this.audioAssets.find((asset) => asset.fileName === hintName)
    );
  }

  /**
   * Überträgt Nutzerentscheidungen auf vorbereitete Datensätze.
   */
  private applyDecisions(decisions: Record<string, ImportDecision>): {
    toImport: PreparedRecord[];
    toSkip: PreparedRecord[];
  } {
    const conflictMap = new Map<string, ImportConflict>();
    for (const conflict of this.conflicts) {
      conflictMap.set(conflict.key, conflict);
    }

    const skippedByConflict = new Set<PreparedRecord>();

    for (const [key, decision] of Object.entries(decisions)) {
      const conflict = conflictMap.get(key);
      if (!conflict) {
        continue;
      }

      if (conflict.type === 'missing-audio') {
        if (decision === 'skip') {
          skippedByConflict.add(conflict.record);
        }
      } else {
        if (decision !== 'force') {
          skippedByConflict.add(conflict.record);
        }
      }
    }

    for (const conflict of this.conflicts) {
      if (!decisions[conflict.key]) {
        if (conflict.type === 'missing-audio') {
          skippedByConflict.add(conflict.record);
        } else {
          skippedByConflict.add(conflict.record);
        }
      }
    }

    const toImport: PreparedRecord[] = [];
    const toSkip: PreparedRecord[] = [];

    for (const record of this.preparedRecords) {
      if (skippedByConflict.has(record)) {
        toSkip.push(record);
      } else {
        toImport.push(record);
      }
    }

    return { toImport, toSkip };
  }

  /**
   * Kopiert Audio und ergänzt das Datenfile.
   */
  private async performCopyAndWrite(records: PreparedRecord[]): Promise<ImportCopyResult> {
    const copiedFiles: string[] = [];
    const segmentsToAppend: any[] = [];

    for (const record of records) {
      let audioRelativePath: string | null = null;
      if (record.audioAsset) {
        const destination = await this.copyAudioAsset(record);
        audioRelativePath = normalizePath(path.relative(this.projectPaths.root, destination));
        copiedFiles.push(audioRelativePath);
      }

      const segment = {
        id: record.id,
        text: record.text ?? '',
        audio: audioRelativePath,
        sourceFile: normalizePath(path.relative(this.selection!.root, record.sourceFile)),
        sourceIndex: record.sourceIndex,
        importedAt: new Date().toISOString(),
      };
      segmentsToAppend.push(segment);
    }

    const projectData = await this.loadProjectData();
    const existingSegments = Array.isArray(projectData.segments) ? [...projectData.segments] : [];
    const nextData: ProjectData = {
      ...projectData,
      segments: [...existingSegments, ...segmentsToAppend],
    };

    await writeData(this.projectPaths, nextData, `${records.length} Datensätze wurden aus V1 importiert.`);
    await this.appendLog(
      `Import abgeschlossen: ${records.length} übernommen, ${this.preparedRecords.length - records.length} übersprungen.`
    );

    return {
      copiedFiles,
      writtenRecords: records.length,
      dataFile: this.projectPaths.dataFile,
    };
  }

  /**
   * Kopiert eine Audiodatei mit eindeutiger Benennung.
   */
  private async copyAudioAsset(record: PreparedRecord): Promise<string> {
    if (!record.audioAsset) {
      throw new Error('Der Datensatz enthält keine Audiodatei.');
    }

    const extension = path.extname(record.audioAsset.absolutePath) || '.wav';
    const safeId = record.id.replace(/[^a-zA-Z0-9_-]+/g, '_');
    let targetName = `${safeId}${extension}`;
    let counter = 1;
    let destination = path.join(this.projectPaths.audioDir, targetName);

    while (await fileExists(destination)) {
      targetName = `${safeId}_${counter}${extension}`;
      destination = path.join(this.projectPaths.audioDir, targetName);
      counter += 1;
    }

    await fs.copyFile(record.audioAsset.absolutePath, destination);
    return destination;
  }

  /**
   * Erstellt einen Abschlussbericht basierend auf allen Zwischenschritten.
   */
  private createReport(): ImportReport {
    if (!this.resolution || !this.copyResult) {
      throw new Error('Für den Bericht fehlen Zwischenergebnisse.');
    }

    const missingAudio = this.resolution.toImport.filter((record) => !record.audioAsset).length;
    const details: ImportReport['details'] = [];

    for (const record of this.resolution.toImport) {
      details.push({
        id: record.id,
        action: record.audioAsset ? 'imported' : 'missing-audio',
        message: record.audioAsset
          ? 'Datensatz wurde importiert.'
          : 'Datensatz ohne Audio übernommen – bitte später ergänzen.',
      });
    }

    for (const record of this.resolution.toSkip) {
      details.push({
        id: record.id,
        action: 'skipped',
        message: 'Datensatz wurde aufgrund eines Konflikts übersprungen.',
      });
    }

    return {
      imported: this.resolution.toImport.length,
      skipped: this.resolution.toSkip.length,
      missingAudio,
      copiedFiles: this.copyResult.copiedFiles,
      dataFile: this.copyResult.dataFile,
      logFile: this.projectPaths.logFile,
      details,
    };
  }

  /**
   * Ergänzt das Projektprotokoll um eine Importmeldung.
   */
  private async appendLog(message: string): Promise<void> {
    const line = `${new Date().toISOString()} ${message}\n`;
    await fs.mkdir(path.dirname(this.projectPaths.logFile), { recursive: true });
    await fs.appendFile(this.projectPaths.logFile, line, 'utf8');
  }
}

/**
 * Hilfsfunktion zur Normalisierung von Pfaden.
 */
function normalizePath(value: string): string {
  return value.replace(/\\/g, '/');
}

/**
 * Prüft, ob eine Datei bereits existiert.
 */
async function fileExists(target: string): Promise<boolean> {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

/**
 * Prüft, ob eine Datei ein unterstütztes Audioformat besitzt.
 */
function isAudioFile(file: string): boolean {
  const extension = path.extname(file).toLowerCase();
  return ['.wav', '.mp3', '.ogg', '.flac'].includes(extension);
}
