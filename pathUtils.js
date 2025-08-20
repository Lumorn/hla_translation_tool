const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

// Liefert den ersten vorhandenen Ordnernamen aus der Liste
// und prüft, ob überhaupt Namen übergeben wurden
function chooseExisting(base, names) {
  if (names.length === 0)
    throw new Error('Namen-Liste darf nicht leer sein');
  for (const name of names) {
    if (fs.existsSync(path.join(base, name))) return name;
  }
  return names[0];
}

/**
 * Kopiert bzw. verschiebt eine heruntergeladene Dub-Datei an den
 * entsprechenden Ort unterhalb von ...\web\Sounds\DE\...
 * Dabei wird exakt das Segment "EN" im Pfad durch "DE" ersetzt.
 * @param {string} originalPath Voller Pfad der englischen Originaldatei
 * @param {string} tempDubPath  Temporärer Pfad der heruntergeladenen Dub-Datei
 * @param {boolean} move        true => Datei verschieben, false => nur kopieren
 * @returns {Promise<string>}   Zielpfad der deutschen Datei
 */
async function copyDubbedFile(originalPath, tempDubPath, move = true) {
  const sep = path.sep;
  const parts = originalPath.split(sep);
  const enIndex = parts.indexOf('EN');
  if (enIndex === -1)
    throw new Error(`Pfad enthält kein "EN": ${originalPath}`);

  parts[enIndex] = 'DE';
  const destPath = parts.join(sep);

  await fsp.mkdir(path.dirname(destPath), { recursive: true });

  if (move) {
    await fsp.rename(tempDubPath, destPath);
  } else {
    await fsp.copyFile(tempDubPath, destPath);
  }

  return destPath;
}

module.exports = { chooseExisting, copyDubbedFile };
