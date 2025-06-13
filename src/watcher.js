const chokidar = require('chokidar');
const { DL_WATCH_PATH } = require('./config.js');

// Überwacht den Download-Ordner und ruft den Callback
// für jede neu angelegte Datei auf.
function watchDownloadFolder(onFile) {
  chokidar.watch(DL_WATCH_PATH, { ignoreInitial: true })
    .on('add', filePath => onFile(filePath));
}

module.exports = { watchDownloadFolder };
