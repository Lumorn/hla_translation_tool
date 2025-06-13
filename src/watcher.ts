import chokidar from 'chokidar';
import { DL_WATCH_PATH } from './config.js';

/**
 * Überwacht den Download-Ordner und ruft den Callback
 * für jede neu angelegte Datei auf.
 */
export function watchDownloadFolder(onFile: (filePath: string) => void) {
  chokidar.watch(DL_WATCH_PATH, { ignoreInitial: true })
    .on('add', filePath => onFile(filePath));
}
