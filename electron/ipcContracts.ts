export interface SaveDeFileArgs {
  relPath: string;
  data: Uint8Array;
}

export interface SaveFileArgs {
  data: Uint8Array;
  defaultPath: string;
}

export interface MoveFileArgs {
  src: string;
  dest: string;
}

export interface RestoreDeHistoryArgs {
  relPath: string;
  name: string;
}

export interface SaveDeHistoryBufferArgs {
  relPath: string;
  data: Uint8Array;
}

export interface SaveSegmentFileArgs {
  projectId: number;
  data: Uint8Array;
}

export type IpcChannels =
  | 'scan-folders'
  | 'open-folder-dialog'
  | 'save-file'
  | 'list-backups'
  | 'save-backup'
  | 'read-backup'
  | 'delete-backup'
  | 'list-sound-backups'
  | 'create-sound-backup'
  | 'delete-sound-backup'
  | 'open-backup-folder'
  | 'get-download-path'
  | 'get-debug-info'
  | 'import-zip'
  | 'backup-de-file'
  | 'delete-de-backup-file'
  | 'restore-de-file'
  | 'save-de-file'
  | 'save-segment-file'
  | 'move-file'
  | 'list-de-history'
  | 'restore-de-history'
  | 'save-de-history-buffer'
  | 'get-de-duplicates'
  | 'delete-de-file'
  | 'translate-text'
  | 'translate-finished'
  | 'toggle-devtools'
  | 'dub-start'
  | 'manual-file'
  | 'dub-done'
  | 'dub-error'
  | 'dub-status'
  | 'dub-log'
  | 'save-error'
  | 'start-hla'
  | 'load-bookmarks'
  | 'save-bookmarks'
  | 'delete-bookmark'
  | 'open-external'
  | 'open-path';
