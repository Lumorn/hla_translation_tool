const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Speichert große Dateien in einem Content-Addressed Storage.
// Die Daten landen unter .hla_store/objects/<sha256-prefix>/<sha256>
// und die Funktion gibt eine Referenz "blob://sha256:<hash>" zurück.
async function storeBlob(data, baseDir = '.hla_store') {
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    const objDir = path.join(baseDir, 'objects', hash.slice(0, 2));
    await fs.promises.mkdir(objDir, { recursive: true });
    const file = path.join(objDir, hash);
    try {
        await fs.promises.access(file);
    } catch {
        await fs.promises.writeFile(file, data);
    }
    return `blob://sha256:${hash}`;
}

// Ermittelt den Pfad zu einem gespeicherten Blob anhand seiner Referenz.
function getBlobPath(ref, baseDir = '.hla_store') {
    const m = /^blob:\/\/sha256:([a-f0-9]{64})$/.exec(ref);
    if (!m) throw new Error('Ungültige Blob-Referenz');
    const hash = m[1];
    return path.join(baseDir, 'objects', hash.slice(0, 2), hash);
}

// Lädt einen zuvor gespeicherten Blob und gibt den Puffer zurück.
async function readBlob(ref, baseDir = '.hla_store') {
    const file = getBlobPath(ref, baseDir);
    return fs.promises.readFile(file);
}

// Schreibt die Daten eines Kapitels als NDJSON-Datei nach data/chapters/<id>.ndjson.
// Dadurch lassen sich große Projektdateien in kleinere Shards aufteilen.
async function writeChapterShard(id, items, baseDir = path.join('data', 'chapters')) {
    await fs.promises.mkdir(baseDir, { recursive: true });
    const file = path.join(baseDir, `${id}.ndjson`);
    const content = items.map(obj => JSON.stringify(obj)).join('\n') + '\n';
    await fs.promises.writeFile(file, content, 'utf8');
    return file;
}

// Lädt eine NDJSON-Datei und gibt ein Array der Objekte zurück.
async function readChapterShard(id, baseDir = path.join('data', 'chapters')) {
    const file = path.join(baseDir, `${id}.ndjson`);
    const content = await fs.promises.readFile(file, 'utf8');
    return content.trim().split(/\n+/).filter(Boolean).map(line => JSON.parse(line));
}

// Hilfsfunktionen für strikt namen­gespacete Schlüssel.
function projectKey(id, part) {
    return `project:${id}:${part}`;
}

function cacheKey(type, hash) {
    return `cache:${type}:${hash}`;
}

module.exports = {
    storeBlob,
    getBlobPath,
    readBlob,
    writeChapterShard,
    readChapterShard,
    projectKey,
    cacheKey
};
