// Benötigt das npm-Paket 'chokidar'
const chokidar = require('chokidar');
const fs = require('fs');
const { DL_WATCH_PATH } = require('./config.js');

// Überwacht den Download-Ordner und ruft den Callback
// für jede neu angelegte Datei auf.
function watchDownloadFolder(onFile) {
  if (!fs.existsSync(DL_WATCH_PATH)) {
    console.warn('Download-Ordner fehlt:', DL_WATCH_PATH);
  } else {
    console.log('Beobachte Download-Ordner:', DL_WATCH_PATH);
  }
  chokidar.watch(DL_WATCH_PATH, { ignoreInitial: true })
    .on('add', filePath => onFile(filePath));
}

module.exports = { watchDownloadFolder };
