// Hilfsfunktionen fuer YouTube-Videos
// Alle Kommentare sind auf Deutsch

// Extrahiert die Startzeit aus einer YouTube-URL
export function extractTime(url){
    const m1 = url.match(/[?&#]t=([^&#]+)/);
    if(m1){
        if(/^\d+$/.test(m1[1])) return Number(m1[1]);
        let sek = 0;
        m1[1].replace(/(\d+)(h|m|s)/g, (_,n,e)=>{
            n = Number(n);
            if(e==='h') sek += n*3600;
            else if(e==='m') sek += n*60;
            else if(e==='s') sek += n;
        });
        return sek;
    }
    const m2 = url.match(/[?&#]start=(\d+)/);
    return m2 ? Number(m2[1]) : 0;
}

// Cache fuer bereits geladene Spezifikationen
const specCache = new Map();

// Laedt den storyboard_spec eines Videos
export async function fetchStoryboardSpec(videoId){
    if(specCache.has(videoId)) return specCache.get(videoId);
    try{
        const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`);
        if(!res.ok) throw new Error('Antwort war nicht OK');
        const text = await res.text();
        const m = text.match(/"storyboard_spec":"([^"]+)"/);
        if(!m) throw new Error('Kein storyboard_spec gefunden');
        const spec = m[1].replace(/\\u0026/g,'&');
        specCache.set(videoId, spec);
        return spec;
    }catch(e){
        console.debug('fetchStoryboardSpec fehlgeschlagen', e);
        specCache.set(videoId, null);
        return null;
    }
}

// Zerlegt den spec-String in einzelne Tracks
export function parseTracks(spec){
    const [baseUrl, ...tracksRaw] = spec.split('|');
    return tracksRaw.map(raw=>{
        const p = raw.split('#');
        return {
            base: baseUrl,
            w:     +p[0],
            h:     +p[1],
            total: +p[2],
            cols:  +p[3],
            rows:  +p[4],
            step:  +p[5]
        };
    });
}

// Berechnet die URL zu einer bestimmten Kachel
export function buildTileURL(spec, seconds){
    const best = parseTracks(spec).sort((a,b)=>a.step-b.step)[0];
    const idx  = Math.min(Math.floor(seconds*1000/best.step), best.total-1);
    const sheet= Math.floor(idx / (best.cols*best.rows));
    const tile = idx % (best.cols*best.rows);
    return best.base
        .replace('L$L', `L${sheet}`)
        .replace('M$M', `M${tile}`);
}

// Holt ein Vorschaubild aus dem Storyboard
export async function fetchStoryboardFrame(url, seconds){
    const m = url.match(/[?&]v=([^&#]+)/) || url.match(/youtu\.be\/([^?&#]+)/);
    if(!m) return null;
    let spec = await fetchStoryboardSpec(m[1]);
    if(!spec) return null;

    const load = async () => new Promise((resolve,reject)=>{
        const tileUrl = buildTileURL(spec, seconds);
        console.debug('[Storyboard] URL', tileUrl);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.referrerPolicy = 'no-referrer';
        img.onload = () => resolve({img,tileUrl});
        img.onerror = () => reject(tileUrl);
        img.src = tileUrl;
    });

    let data;
    try{
        data = await load();
    }catch(tileUrl){
        console.debug('Storyboard 403, starte neuen Token-Fetch');
        spec = await fetchStoryboardSpec(m[1]);
        if(!spec) return null;
        try{
            data = await load();
        }catch(url2){
            console.warn('[Storyboard] endgültig fehlgeschlagen, Fallback ffmpeg', url2);
            return null;
        }
    }

    const best = parseTracks(spec).sort((a,b)=>a.step-b.step)[0];
    const idx = Math.min(Math.floor(seconds*1000/best.step), best.total-1);
    const tile = idx % (best.cols*best.rows);
    const sx = (tile % best.cols) * best.w;
    const sy = Math.floor(tile / best.cols) * best.h;

    const canvas = document.createElement('canvas');
    canvas.width = best.w;
    canvas.height = best.h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(data.img, sx, sy, best.w, best.h, 0, 0, best.w, best.h);
    return canvas.toDataURL('image/png');
}

// Export fuer Tests
if(typeof module !== 'undefined'){
    module.exports = {
        extractTime,
        fetchStoryboardSpec,
        parseTracks,
        buildTileURL,
        fetchStoryboardFrame
    };
}
