// Hilfsfunktionen fuer YouTube-Videos
// Alle Kommentare sind auf Deutsch

// Extrahiert die Startzeit aus einer YouTube-URL
export function extractTime(url) {
    const m1 = url.match(/[?&#]t=([^&#]+)/);
    if (m1) {
        if (/^\d+$/.test(m1[1])) return Number(m1[1]);
        let sekunden = 0;
        m1[1].replace(/(\d+)(h|m|s)/g, (_, num, einheit) => {
            num = Number(num);
            if (einheit === 'h') sekunden += num * 3600;
            else if (einheit === 'm') sekunden += num * 60;
            else if (einheit === 's') sekunden += num;
        });
        return sekunden;
    }
    const m2 = url.match(/[?&#]start=(\d+)/);
    return m2 ? Number(m2[1]) : 0;
}

// Cache fuer geladene Spezifikationen
const specCache = new Map();

// Laedt die Storyboard-Spezifikation eines Videos
export async function fetchStoryboardSpec(videoId) {
    if (specCache.has(videoId)) return specCache.get(videoId);
    try {
        const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`);
        if (!res.ok) throw new Error('Antwort war nicht OK');
        const text = await res.text();
        let m = text.match(/"storyboard_spec":"([^"]+)"/);
        if (!m) m = text.match(/"playerStoryboardSpecRenderer":\{"spec":"([^"]+)"/);
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

// Zerlegt eine Spezifikation in einzelne Tracks
export function parseTracks(spec) {
    if (!spec) return [];
    // Der erste Teil enthält den Host. Diesen sichern wir,
    // damit sich aus den kurzen Track-Angaben wieder eine komplette URL bilden lässt.
    const [baseUrl, ...tracks] = spec.split('|');
    return tracks.map(t => {
        const p = t.split('#');
        if (p.length < 6) return null;
        const [w, h, frames, cols, rows, step] = p;
        return {
            base: baseUrl,
            width: Number(w),
            height: Number(h),
            total: Number(frames),
            cols: Number(cols),
            rows: Number(rows),
            step: Number(step)
        };
    }).filter(Boolean);
}

// Sucht den Track mit dem kleinsten Intervall
export function chooseBestTrack(tracks) {
    return tracks.reduce((best, t) => {
        if (!t) return best;
        if (!best || t.step < best.step) return t;
        return best;
    }, null);
}

// Baut die URL zu einer bestimmten Kachel
export function buildTileURL(spec, seconds) {
    const track = chooseBestTrack(parseTracks(spec));
    if (!track) return null;

    // Der kleinste Schritt bestimmt die genaue Kachel
    const index = Math.min(Math.floor(seconds * 1000 / track.step), track.total - 1);
    const perSheet = track.cols * track.rows;
    const sheet = Math.floor(index / perSheet);
    const tile = index % perSheet;

    return track.base
        .replace('L$L', `L${sheet}`)
        .replace('M$M', `M${tile}`);
}

// Holt ein Vorschaubild aus dem Storyboard
export async function fetchStoryboardFrame(videoUrl, seconds) {
    const idMatch = videoUrl.match(/[?&]v=([^&#]+)/) || videoUrl.match(/youtu\.be\/([^?&#]+)/);
    if (!idMatch) return null;
    let spec = await fetchStoryboardSpec(idMatch[1]);
    if (!spec) return null;

    const tryLoad = async () => {
        const url = buildTileURL(spec, seconds);
        if (!url) return null;
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.referrerPolicy = 'no-referrer';
            img.onload = () => resolve(img);
            img.onerror = e => {
                if (e.target.naturalWidth === 0) reject('403');
                else reject('error');
            };
            img.src = url;
        });
    };

    let img;
    try {
        img = await tryLoad();
    } catch (err) {
        if (err === '403') {
            console.debug('Storyboard 403, starte neuen Token-Fetch', buildTileURL(spec, seconds));
            spec = await fetchStoryboardSpec(idMatch[1]);
            if (!spec) return null;
            try {
                img = await tryLoad();
            } catch {
                console.warn('Storyboard nicht verfügbar, fallback ffmpeg', buildTileURL(spec, seconds));
                return null;
            }
        } else {
            console.warn('Storyboard nicht verfügbar, fallback ffmpeg', buildTileURL(spec, seconds));
            return null;
        }
    }

    const track = chooseBestTrack(parseTracks(spec));
    const index = Math.min(Math.floor(seconds * 1000 / track.step), track.total - 1);
    const tile = index % (track.cols * track.rows);
    const sx = (tile % track.cols) * track.width;
    const sy = Math.floor(tile / track.cols) * track.height;

    const canvas = document.createElement('canvas');
    canvas.width = track.width;
    canvas.height = track.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, sx, sy, track.width, track.height, 0, 0, track.width, track.height);
    return canvas.toDataURL('image/png');
}

// CommonJS-Export fuer Tests
if (typeof module !== 'undefined') {
    module.exports = {
        extractTime,
        fetchStoryboardSpec,
        parseTracks,
        chooseBestTrack,
        buildTileURL,
        fetchStoryboardFrame
    };
}
