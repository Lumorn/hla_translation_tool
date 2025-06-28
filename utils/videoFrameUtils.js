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

const sheetCache = new Map();

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Bild konnte nicht geladen werden'));
        img.src = url;
    });
}

// Lädt die passende Vorschau aus dem YouTube‑Storyboard
export async function fetchStoryboardFrame(url, sec) {
    try {
        const idMatch = url.match(/[?&]v=([^&#]+)/) || url.match(/youtu\.be\/([^?&#]+)/);
        if (!idMatch) return null;
        const id = idMatch[1];

        // Mehrstufiger Fallback: storyboard3.json ➜ 2 ➜ 1 ➜ 0 ➜ storyboard.json
        const variants = [3, 2, 1, 0, ''];
        let text = null;
        for (const v of variants) {
            const sb = v === '' ? 'storyboard.json' : `storyboard${v}.json`;
            const res = await fetch(`https://i.ytimg.com/sb/${id}/${sb}`);
            if (res.ok) { text = await res.text(); break; }
        }
        if (!text) return null;
        const line = text.split('\n')[0].trim();
        const parts = line.split('|');
        if (parts.length < 2) return null;
        const tracks = parts.slice(1).map(t => t.split('#'));
        if (!tracks.length) return null;
        let best = tracks[0];
        for (const t of tracks) {
            if (Number(t[6]) < Number(best[6])) best = t;
        }
        const width = Number(best[0]);
        const height = Number(best[1]);
        const cols = Number(best[3]);
        const rows = Number(best[2]);
        const interval = Number(best[6]);
        const frameIndex = Math.floor(sec * 1000 / interval);
        const sheet = Math.floor(frameIndex / (cols * rows));
        const tile = frameIndex % (cols * rows);
        const base = parts[0];
        const src = base.replace('L$L', `L${sheet}`).replace('$M', `M${tile}`) + '&sigh=' + parts.at(-1);
        const cacheKey = `${id}-${sheet}`;
        let img = sheetCache.get(cacheKey);
        if (!img) {
            img = await loadImage(src);
            sheetCache.set(cacheKey, img);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const sx = (tile % cols) * width;
        const sy = Math.floor(tile / cols) * height;
        ctx.drawImage(img, sx, sy, width, height, 0, 0, width, height);
        return canvas.toDataURL('image/png');
    } catch {
        return null;
    }
}
