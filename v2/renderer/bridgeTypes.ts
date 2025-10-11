import type {
  CreateProjectOptions,
  ProjectAudioBackupInfo,
  ProjectBackupInfo,
  ProjectData,
  ProjectManifest,
  ProjectPaths,
  ProjectSettings,
} from '../backend/projectStore';
import type {
  AudioProcessingRequest,
  AudioProcessingResult,
  AudioWaveformPreview,
} from '../backend/audioProcessing';
import type { ImportDecision, ImportSourceSelection, ImportWizardState } from '../importer/importWizard';

export interface ProjectOpenResult {
  sessionId: string;
  paths: ProjectPaths;
  manifest: ProjectManifest;
  settings: ProjectSettings;
  data: ProjectData;
}

export interface ProjectStoreBridge {
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

export interface ProjectLibraryBridge {
  getRoot: () => Promise<string>;
  list: () => Promise<ProjectLibraryEntry[]>;
  create: (projectName: string, options?: CreateProjectOptions) => Promise<ProjectLibraryCreateResult>;
}

export interface ProjectLibraryEntry {
  folderName: string;
  path: string;
  manifest: ProjectManifest;
  hasLock: boolean;
}

export interface ProjectLibraryCreateResult {
  folderName: string;
  path: string;
  paths: ProjectPaths;
  manifest: ProjectManifest;
}

export interface ImportWizardBridge {
  start: (sessionId: string, selection: ImportSourceSelection) => Promise<ImportWizardState>;
  scan: (sessionId: string) => Promise<ImportWizardState>;
  audit: (sessionId: string) => Promise<ImportWizardState>;
  resolve: (sessionId: string, decisions: Record<string, ImportDecision>) => Promise<ImportWizardState>;
  execute: (sessionId: string) => Promise<ImportWizardState>;
  report: (sessionId: string) => Promise<ImportWizardState>;
  cancel: (sessionId: string) => Promise<boolean>;
  loadTemplate: (templateName: string) => Promise<string>;
}

export interface ProjectEditorBridge {
  open: (sessionId: string, projectName?: string) => Promise<unknown>;
  close: (sessionId: string) => Promise<unknown>;
}

export interface AudioProcessingBridge {
  loadWaveform: (
    sessionId: string,
    fileName: string,
    options?: { maxPeaks?: number; targetSampleRate?: number }
  ) => Promise<AudioWaveformPreview>;
  processClip: (sessionId: string, request: AudioProcessingRequest) => Promise<AudioProcessingResult>;
  duplicateClip: (sessionId: string, sourceFile: string, label: string) => Promise<string>;
}

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
    projectEditor?: ProjectEditorBridge;
    audioProcessing?: AudioProcessingBridge;
    __HLA_DEMO__?: boolean;
    __HLA_DEMO_AUTO_OPEN__?: string;
  }
}

export {};
