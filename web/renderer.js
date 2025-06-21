// Elemente abrufen
const urlInput  = document.getElementById('videoUrlInput');
const addBtn    = document.getElementById('addVideoBtn');

const openVideoManager = document.getElementById('openVideoManager');
const videoMgrDialog   = document.getElementById('videoMgrDialog');
const videoTableBody   = document.querySelector('#videoTable tbody');
const videoFilter      = document.getElementById('videoFilter');
const closeVideoDlg    = document.getElementById('closeVideoDlg');
// schmale Variante des Schließen-Knopfs
const closeVideoDlgSmall = document.getElementById('closeVideoDlgSmall');
const exportVideoBtn   = document.getElementById('exportVideoBtn');

// gespeicherten Suchbegriff wiederherstellen
const gespeicherterFilter = localStorage.getItem('hla_videoFilter') || '';
if (gespeicherterFilter) videoFilter.value = gespeicherterFilter;

let extractYoutubeId, openVideoDialog, closeVideoDialog;
import('./ytPlayer.js').then(m => {
    extractYoutubeId = m.extractYoutubeId;
    openVideoDialog  = m.openVideoDialog;
    closeVideoDialog = m.closeVideoDialog;
    // im Fenster verfügbar machen, damit openVideoUrl darauf zugreifen kann
    window.openVideoDialog = openVideoDialog;
});

// Fallback auf LocalStorage, falls die Electron-API fehlt
if (!window.videoApi) {
    console.log('Video-API fehlt, verwende LocalStorage');
    window.videoApi = {
        loadBookmarks: async () => {
            const data = localStorage.getItem('hla_videoBookmarks');
            try {
                return data ? JSON.parse(data) : [];
            } catch (e) {
                console.warn('Lese LocalStorage fehlgeschlagen', e);
                return [];
            }
        },
        saveBookmarks: async list => {
            try {
                localStorage.setItem('hla_videoBookmarks', JSON.stringify(list ?? []));
            } catch (e) {
                console.error('Speichern im LocalStorage fehlgeschlagen', e);
            }
            return true;
        }
    };
}

// Hilfsfunktion: fügt jedem Bookmark seinen ursprünglichen Index hinzu
async function getBookmarks() {
    const list = await window.videoApi.loadBookmarks();
    return list.map((b, i) => ({ ...b, origIndex: i }));
}

// Dialog-Unterstützung sicherstellen
function ensureDialogSupport(d) {
    if (typeof d.showModal !== 'function') {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = 'https://cdnjs.cloudflare.com/ajax/libs/dialog-polyfill/0.5.6/dialog-polyfill.min.css';
        document.head.appendChild(l);
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/dialog-polyfill/0.5.6/dialog-polyfill.min.js';
        s.onload = () => window.dialogPolyfill.registerDialog(d);
        document.head.appendChild(s);
    }
}
ensureDialogSupport(videoMgrDialog);

// Beobachter passt Größe bei jeder Dialog-Änderung an
// Vermeidet eine Endlosschleife durch Throttling über requestAnimationFrame
let resizeScheduled = false;
const resizeObserver = new ResizeObserver(() => {
    if (resizeScheduled) return;
    resizeScheduled = true;
    window.requestAnimationFrame(() => {
        adjustVideoDialogHeight();
        resizeScheduled = false;
    });
});
resizeObserver.observe(videoMgrDialog);

function delayedPlayerResize() {
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            if (typeof adjustVideoPlayerSize === 'function') {
                adjustVideoPlayerSize(true);
            }
        });
    });
}

// passt Höhe und Breite des Video-Managers dynamisch an
function adjustVideoDialogHeight() {
    // Maximale Höhe auf 90 % des Fensters begrenzen
    const maxH = window.innerHeight * 0.9;
    videoMgrDialog.style.height = 'auto';
    const benoetigtH = videoMgrDialog.scrollHeight;
    videoMgrDialog.style.height = Math.min(benoetigtH, maxH) + 'px';

    // Dialog vorübergehend auf Maximalbreite setzen
    const maxW = window.innerWidth * 0.9;
    videoMgrDialog.style.width = maxW + 'px';

    // Player anhand dieser Breite skalieren
    if (typeof adjustVideoPlayerSize === 'function') {
        adjustVideoPlayerSize();
    }

    // Benötigte Breite ermitteln und endgültig setzen
    videoMgrDialog.style.width = 'auto';
    const benoetigtW = videoMgrDialog.scrollWidth;
    videoMgrDialog.style.width = Math.min(benoetigtW, maxW) + 'px';

    // Player erneut anpassen, falls sich die Breite geändert hat
    if (typeof adjustVideoPlayerSize === 'function') {
        adjustVideoPlayerSize();
    }

    // nach dem Layout zwei Frames warten und erneut anpassen
    delayedPlayerResize();
}
// Funktion global verfügbar machen
window.adjustVideoDialogHeight = adjustVideoDialogHeight;

// ===== Neuer Algorithmus für die Player-Anpassung =====
let layoutData = {};

// ermittelt Breite und Höhe des verfügbaren Bereichs
function calcUsableWidthHeight() {
    const MIN_H = 180; // minimale Höhe für den Player
    const MIN_W = 320; // minimale Breite für den Player

    const dlg      = document.getElementById('videoMgrDialog');
    const list     = document.querySelector('.video-list-section');
    const panel    = document.getElementById('ocrResultPanel');
    const controls = document.querySelector('.player-controls');
    if (!dlg) return;

    const pad = parseInt(getComputedStyle(dlg).paddingLeft) || 0;
    const leftListWidth = list ? list.offsetWidth : 0;
    const panelWidth = panel && !panel.classList.contains('hidden')
        ? panel.offsetWidth : 0;
    const controlsH = controls ? controls.offsetHeight : 0;

    let usableWidth = dlg.clientWidth - leftListWidth - panelWidth - 2 * pad;
    if (usableWidth < 0) usableWidth = 0;

    let width  = usableWidth;
    let height = width * 9 / 16;

    const maxH = dlg.clientHeight - pad;
    if (height + controlsH > maxH) {
        height = maxH - controlsH;
        if (height < 0) height = 0;
        width = height * 16 / 9;
    }

    // Mindestgroesse erzwingen
    if (width < MIN_W) {
        width  = MIN_W;
        height = width * 9 / 16;
    }
    if (height < MIN_H) {
        height = MIN_H;
        width  = height * 16 / 9;
    }

    layoutData = { width, height, leftListWidth, panelWidth, pad, controlsH };
}

// setzt Breite und Höhe des IFrames
function positionIframe() {
    const frame = document.getElementById('videoPlayerFrame');
    if (!frame) return;
    // Groesse laut Berechnung setzen
    frame.style.width  = layoutData.width + 'px';
    frame.style.height = layoutData.height + 'px';
}

// platziert die Steuerleiste direkt unter dem IFrame
function positionControls() {
    const controls = document.querySelector('.player-controls');
    const frame    = document.getElementById('videoPlayerFrame');
    const dlg      = document.getElementById('videoMgrDialog');
    if (!controls || !frame || !dlg) return;
    const fRect  = frame.getBoundingClientRect();
    const dRect  = dlg.getBoundingClientRect();
    controls.style.position = 'absolute';
    controls.style.left     = (layoutData.leftListWidth + layoutData.pad) + 'px';
    controls.style.top      = (fRect.bottom - dRect.top + 4) + 'px';
    controls.style.width    = layoutData.width + 'px';
    controls.style.zIndex   = 10;
}

// positioniert das OCR-Overlay im unteren Videobereich
function positionOverlay() {
    const overlay  = document.getElementById('ocrOverlay');
    const frame    = document.getElementById('videoPlayerFrame');
    const controls = document.querySelector('.player-controls');
    const dlg      = document.getElementById('videoMgrDialog');
    if (!overlay || !frame || !controls || !dlg) return;
    const fRect  = frame.getBoundingClientRect();
    const dRect  = dlg.getBoundingClientRect();
    const oHeight = layoutData.height * 0.18;
    const oTop = fRect.bottom - oHeight - layoutData.controlsH - 4;
    overlay.style.left   = (layoutData.leftListWidth + layoutData.pad) + 'px';
    overlay.style.top    = (oTop - dRect.top) + 'px';
    overlay.style.width  = layoutData.width + 'px';
    overlay.style.height = oHeight + 'px';
}

// richtet das OCR-Ergebnis-Panel aus
function positionOcrPanel() {
    const panel = document.getElementById('ocrResultPanel');
    if (!panel) return;
    panel.style.position = 'absolute';
    panel.style.right    = layoutData.pad + 'px';
    panel.style.top      = layoutData.pad + 'px';
    panel.style.height   = layoutData.height + 'px';
}

// kompatible Schnittstelle zu früheren Aufrufen
function adjustVideoPlayerSize(force = false) {
    const section = document.getElementById('videoPlayerSection');
    if (!section) return;
    if (!force && section.classList.contains('hidden')) return;
    calcUsableWidthHeight();
    positionIframe();
    positionControls();
    positionOverlay();
    positionOcrPanel();
}
window.adjustVideoPlayerSize = adjustVideoPlayerSize;

// auch bei Fenstergröße aktualisieren
window.addEventListener('resize', () => {
    adjustVideoDialogHeight();
    // Player auch im verborgenen Zustand neu skalieren
    adjustVideoPlayerSize(true);
    if (typeof window.positionOverlay === 'function') {
        window.positionOverlay();
    }
});

openVideoManager.onclick = async () => {
    await refreshTable();
    videoMgrDialog.showModal();
    adjustVideoDialogHeight();
};
closeVideoDlg.onclick = () => {
    videoMgrDialog.close();
    if (typeof closeVideoDialog === 'function') closeVideoDialog();
    adjustVideoDialogHeight();
};
if (closeVideoDlgSmall) {
    // kompakte Variante fuer schmale Fenster
    closeVideoDlgSmall.onclick = () => {
        videoMgrDialog.close();
        if (typeof closeVideoDialog === 'function') closeVideoDialog();
        adjustVideoDialogHeight();
    };
}
videoMgrDialog.addEventListener('cancel', () => {
    if (typeof closeVideoDialog === 'function') closeVideoDialog();
    adjustVideoDialogHeight();
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && videoMgrDialog.open) {
        if (typeof closeVideoDialog === 'function') closeVideoDialog();
    }
});

let asc = true;
async function refreshTable(sortKey='title', dir=true) {
    let list = await getBookmarks();
    const q = videoFilter.value.toLowerCase();
    if (q) list = list.filter(b => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q));
    // Bei "index" die ursprüngliche Reihenfolge nutzen
    // Zeit numerisch sortieren, sonst localeCompare verwenden
    list.sort((a,b)=> {
        if (sortKey === 'index') {
            return dir ? a.origIndex - b.origIndex : b.origIndex - a.origIndex;
        }
        if (sortKey === 'time') {
            return dir ? a.time - b.time : b.time - a.time;
        }
        return dir
            ? (''+a[sortKey]).localeCompare(b[sortKey], 'de')
            : (''+b[sortKey]).localeCompare(a[sortKey], 'de');
    });
    videoTableBody.innerHTML = '';
    list.forEach((b,i) => {
        const tr = document.createElement('tr');
        tr.dataset.idx = b.origIndex;
        const thumbUrl = `https://i.ytimg.com/vi/${extractYoutubeId(b.url)}/default.jpg`;
        tr.innerHTML = `
            <td><img src="${thumbUrl}" data-idx="${b.origIndex}" class="video-thumb"></td>
            <td class="video-title" data-idx="${b.origIndex}" title="${b.title}">${b.title}</td>
            <td>${formatTime(b.time)}</td>
            <td class="video-actions">
                <button class="delete" data-idx="${b.origIndex}" title="Video löschen">🗑️</button>
                <button class="rename" data-idx="${b.origIndex}" title="Titel bearbeiten">✏️</button>
            </td>`;
        videoTableBody.appendChild(tr);
    });
}

// Delegierte Button-Events
videoTableBody.onclick = async e => {
    const btn  = e.target.closest('button');
    const row  = e.target.closest('tr');
    if (btn) {
        const origIdx = Number(btn.dataset.idx);
        let list = await window.videoApi.loadBookmarks();
        const bm = list[origIdx];
        switch(btn.className){
            case 'rename':
                const t = prompt('Neuer Titel', bm.title);
                if (t && t.trim()) {
                    bm.title = t.trim();
                    await window.videoApi.saveBookmarks(list);
                    refreshTable();
                    adjustVideoDialogHeight();
                }
                break;
            case 'delete':
                if (confirm('Wirklich löschen?')) {
                    list.splice(origIdx,1);
                    await window.videoApi.saveBookmarks(list);
                    refreshTable();
                    adjustVideoDialogHeight();
                }
                break;
        }
    } else if (row) {
        const origIdx = Number(row.dataset.idx);
        let list = await window.videoApi.loadBookmarks();
        const bm = list[origIdx];
        openVideoDialog(bm, origIdx);
    }
};

// Sortierbare Header
document.querySelectorAll('#videoTable thead th').forEach(th => {
    th.onclick = () => {
        const keyMap = {0:'index',1:'title',2:'time'};
        const key = keyMap[Array.from(th.parentNode.children).indexOf(th)];
        if (!key) return; // Aktionen-Spalte ignorieren
        asc = th.dataset.asc !== 'false';
        th.dataset.asc = !asc;
        refreshTable(key, asc);
    };
});

videoFilter.oninput = () => {
    localStorage.setItem('hla_videoFilter', videoFilter.value);
    refreshTable();
    adjustVideoDialogHeight();
};

function formatTime(sec){
    const m=Math.floor(sec/60);
    const s=Math.floor(sec%60);
    return m+':'+('0'+s).slice(-2);
}


// Add-Button Status
function updateAddBtn(){ addBtn.disabled = urlInput.value.trim() === ''; }
updateAddBtn();
urlInput.addEventListener('input', updateAddBtn);
addBtn.onclick = async () => {
    const raw = urlInput.value.trim();
    if (!raw) { alert('URL fehlt'); return; }
    const ytre = /^https?:\/\/(www\.)?youtube\.com\/watch\?v=/i;
    const yb = /^https?:\/\/youtu\.be\//i;
    if (!ytre.test(raw) && !yb.test(raw)) { alert('Keine g\u00fcltige YouTube-Adresse'); return; }

    let list = await window.videoApi.loadBookmarks();
    if (list.some(b => b.url === raw)) return;

    let title;
    try {
        const res = await fetch('https://www.youtube.com/oembed?url='+encodeURIComponent(raw)+'&format=json');
        if (!res.ok) throw new Error('oEmbed fehlgeschlagen');
        ({ title } = await res.json());
    } catch(err) {
        // Falls oEmbed fehlschlägt, URL als Titel verwenden und nur Hinweis zeigen
        alert('Titel konnte nicht geladen werden – verwende URL als Titel');
        title = raw;
    }

    list.push({ url: raw, title, time: 0 });
    list.sort((a,b)=>a.title.localeCompare(b.title,'de'));
    await window.videoApi.saveBookmarks(list);
    refreshTable();
    adjustVideoDialogHeight();
    urlInput.value = '';
    updateAddBtn();
};

// Exportiert die gespeicherten Bookmarks als JSON-Datei
exportVideoBtn.onclick = async () => {
    const list = await window.videoApi.loadBookmarks();
    const blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'videoBookmarks.json';
    a.click();
    URL.revokeObjectURL(url);
};
