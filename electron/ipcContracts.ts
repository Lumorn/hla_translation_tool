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

export type IpcChannels =
  | 'scan-folders'
  | 'open-folder-dialog'
  | 'save-file'
  | 'list-backups'
  | 'save-backup'
  | 'read-backup'
  | 'delete-backup'
  | 'open-backup-folder'
  | 'get-download-path'
  | 'get-debug-info'
  | 'backup-de-file'
  | 'delete-de-backup-file'
  | 'restore-de-file'
  | 'save-de-file'
  | 'move-file'
  | 'list-de-history'
  | 'restore-de-history'
  | 'save-de-history-buffer'
  | 'get-de-duplicates'
  | 'delete-de-file'
  | 'translate-text'
  | 'toggle-devtools'
  | 'dub-start'
  | 'manual-file'
  | 'dub-done'
  | 'dub-error'
  | 'dub-status'
  | 'dub-log'
  | 'save-error';
