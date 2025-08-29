const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Schreibt eine Datei zuerst als *.tmp und benennt sie danach um.
// Gleichzeitig wird ein Journal geführt, um unvollständige Vorgänge
// beim nächsten Start abschließen zu können.
async function writeFileSicher(ziel, daten, basis = path.dirname(ziel)) {
    const tmp = `${ziel}.tmp`;
    const journal = path.join(basis, 'journal.json');
    // Vorgang protokollieren
    await fs.promises.writeFile(journal, JSON.stringify({ ziel, tmp }));
    // Temporäre Datei schreiben
    await fs.promises.writeFile(tmp, daten);
    // Atomar umbenennen
    await fs.promises.rename(tmp, ziel);
    // Journal wieder entfernen
    await fs.promises.unlink(journal);
}

// Prüft beim Start, ob ein Journal existiert und stellt den letzten
// Schreibvorgang fertig. So bleiben keine korrupten Dateien zurück.
async function journalWiederherstellen(basis = '.hla_store') {
    const journal = path.join(basis, 'journal.json');
    try {
        const eintrag = JSON.parse(await fs.promises.readFile(journal, 'utf8'));
        // Falls eine temporäre Datei existiert, als Ziel übernehmen
        await fs.promises.rename(eintrag.tmp, eintrag.ziel);
        await fs.promises.unlink(journal);
    } catch {
        // Kein Journal vorhanden oder Wiederherstellung nicht nötig
    }
}

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
        await writeFileSicher(file, data, baseDir);
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
    await writeFileSicher(file, content, baseDir);
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

// Sammelt alle in Manifesten referenzierten SHA-256 und entfernt
// nicht benötigte Objekte aus dem Speicher. Bei "dryRun" werden
// lediglich Statistikwerte geliefert.
async function garbageCollect(manifestPfadListe, basis = '.hla_store', dryRun = false) {
    const referenzen = new Set();
    const regex = /blob:\/\/sha256:([a-f0-9]{64})/g;
    for (const mf of manifestPfadListe) {
        const inhalt = await fs.promises.readFile(mf, 'utf8');
        let m;
        while ((m = regex.exec(inhalt))) {
            referenzen.add(m[1]);
        }
    }

    const objectsDir = path.join(basis, 'objects');
    let geloescht = 0;
    let freiBytes = 0;

    async function walk(dir) {
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        for (const ent of entries) {
            const voll = path.join(dir, ent.name);
            if (ent.isDirectory()) {
                await walk(voll);
            } else {
                const hash = ent.name;
                if (!referenzen.has(hash)) {
                    const stat = await fs.promises.stat(voll);
                    if (!dryRun) {
                        await fs.promises.unlink(voll);
                    }
                    geloescht++;
                    freiBytes += stat.size;
                }
            }
        }
    }

    await walk(objectsDir);
    return { geloescht, freiBytes };
}

// Beim Laden des Moduls gleich prüfen, ob ein Journal zu erledigen ist
journalWiederherstellen().catch(() => {});

module.exports = {
    storeBlob,
    getBlobPath,
    readBlob,
    writeChapterShard,
    readChapterShard,
    projectKey,
    cacheKey,
    journalWiederherstellen,
    garbageCollect
};
