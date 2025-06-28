// Hilfsfunktionen fuer YouTube-Videos
// Kommentare werden hier immer auf Deutsch geschrieben

// Extrahiert die Startzeit aus einer YouTube-URL
export function extractTime(url) {
    const m1 = url.match(/[?&#]t=([^&#]+)/);
    if (m1) {
        if (/^\d+$/.test(m1[1])) return Number(m1[1]);
        let sec = 0;
        m1[1].replace(/(\d+)(h|m|s)/g, (_, num, unit) => {
            num = Number(num);
            if (unit === 'h') sec += num * 3600;
            else if (unit === 'm') sec += num * 60;
            else if (unit === 's') sec += num;
        });
        return sec;
    }
    const m2 = url.match(/[?&#]start=(\d+)/);
    return m2 ? Number(m2[1]) : 0;
}

// Cache fuer geladene Storyboard-Spezifikationen
const specCache = new Map();

// Laedt die Storyboard-Spezifikation eines Videos und speichert sie im Cache
export async function fetchStoryboardSpec(videoId) {
    if (specCache.has(videoId)) return specCache.get(videoId);
    try {
        const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`);
        if (!res.ok) throw new Error('Antwort war nicht OK');
        const text = await res.text();
        const m = text.match(/"storyboard_spec":"([^"]+)"/);
        if (!m) throw new Error('Kein storyboard_spec gefunden');
        const spec = m[1].replace(/\\u0026/g, '&');
        specCache.set(videoId, spec);
        return spec;
    } catch (e) {
        console.debug('fetchStoryboardSpec fehlgeschlagen', e);
        specCache.set(videoId, null);
        return null;
    }
}

// Erstellt aus der Spezifikation die voll signierte URL zu einer Kachel
export function buildTileURL(spec, seconds) {
    if (!spec) return null;
    const parts = spec.split('|');
    const base = parts[0];
    let bestInterval = Infinity;
    for (const p of parts.slice(1)) {
        const vals = p.split('#');
        const interval = Number(vals[5]);
        if (!isNaN(interval) && interval < bestInterval) bestInterval = interval;
    }
    if (!isFinite(bestInterval)) return null;
    const cols = 5, rows = 5;
    const frameIdx = Math.floor(seconds * 1000 / bestInterval);
    const sheet = Math.floor(frameIdx / (cols * rows));
    const tile = frameIdx % (cols * rows);
    return base.replace('L$L', `L${sheet}`).replace('$N', `M${tile}`);
}

// Holt das Vorschaubild aus dem Storyboard und gibt es als data:URL zurueck
export async function fetchStoryboardFrame(videoUrl, seconds) {
    try {
        const idMatch = videoUrl.match(/[?&]v=([^&#]+)/) || videoUrl.match(/youtu\.be\/([^?&#]+)/);
        if (!idMatch) throw new Error('Keine gueltige Video-ID');
        const spec = await fetchStoryboardSpec(idMatch[1]);
        if (!spec) return null;
        const tileUrl = buildTileURL(spec, seconds);
        if (!tileUrl) return null;

        // Intervall erneut bestimmen, um die Position der Kachel zu berechnen
        const tracks = spec.split('|').slice(1);
        let interval = Infinity;
        for (const t of tracks) {
            const v = Number(t.split('#')[5]);
            if (!isNaN(v) && v < interval) interval = v;
        }
        const cols = 5, rows = 5;
        const frameIdx = Math.floor(seconds * 1000 / interval);
        const tile = frameIdx % (cols * rows);
        const sx = (tile % cols) * 160;
        const sy = Math.floor(tile / cols) * 90;

        const img = await new Promise((resolve, reject) => {
            const i = new Image();
            i.crossOrigin = 'anonymous';
            i.referrerPolicy = 'no-referrer';
            i.onload = () => resolve(i);
            i.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
            i.src = tileUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 90;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, sx, sy, 160, 90, 0, 0, 160, 90);
        return canvas.toDataURL('image/png');
    } catch (e) {
        console.debug('fetchStoryboardFrame fehlgeschlagen', e);
        return null;
    }
}
