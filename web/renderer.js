// Elemente abrufen
const urlInput  = document.getElementById('videoUrlInput');
const addBtn    = document.getElementById('addVideoBtn');

const openVideoManager = document.getElementById('openVideoManager');
// schneller Zugriff auf den Video-Dialog
const videoDlg = document.getElementById('videoMgrDialog');
const videoTableBody   = document.querySelector('#videoTable tbody');
const videoTableWrapper = document.getElementById('videoTableWrapper');
const videoFilter      = document.getElementById('videoFilter');
// Passiver Scroll-Handler für ruckelfreie Videolisten
if (videoTableWrapper) {
    videoTableWrapper.addEventListener('wheel', () => {}, { passive: true });
}
const closeVideoDlg    = document.getElementById('closeVideoDlg');
// schmale Variante des Schließen-Knopfs
const closeVideoDlgSmall = document.getElementById('closeVideoDlgSmall');
const exportVideoBtn   = document.getElementById('exportVideoBtn');
const screenshotBtn    = document.getElementById('screenshotBtn');
const playerControls   = document.getElementById('playerControls');

// Aktions-Buttons direkt unter die Player-Steuerung hängen
if (playerControls) {
    ['exportVideoBtn','screenshotBtn','ocrToggle','videoDelete','videoClose']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) playerControls.append(el);
        });
}

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
ensureDialogSupport(videoDlg);

// Macht den Dialog verschieb- und skalierbar
// Drag- und Resize-Funktion entfallen beim festen Dialog

// Erlaubt das Ablegen von YouTube-Links im Dialog
videoDlg.addEventListener('dragover', e => { e.preventDefault(); });
videoDlg.addEventListener('drop', e => {
    e.preventDefault();
    const url = e.dataTransfer.getData('text/plain');
    if (url) addVideoFromUrl(url.trim());
});

// ResizeObserver bleibt erhalten, ruft aber keine Höhenberechnung mehr auf
const ro = new ResizeObserver(() => {});
ro.observe(videoDlg);
// Beobachter global ablegen, damit andere Skripte ihn abmelden koennen
window.videoDialogObserver = ro;

// Beobachtet Dialog- und OCR-Panelgroesse fuer dynamische Layout-Anpassung
const layoutObserver = new ResizeObserver(() => {
    if (typeof calcLayout === 'function') {
        calcLayout();
    }
});
layoutObserver.observe(videoDlg);
const obsPanel = document.getElementById('ocrOutputSection');
if (obsPanel) layoutObserver.observe(obsPanel);

function delayedPlayerResize() {
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            if (typeof adjustVideoPlayerSize === 'function') {
                adjustVideoPlayerSize(true);
                // nach der Höhe auch die Breite neu berechnen
                if (typeof calcLayout === 'function') {
                    calcLayout();
                }
            }
        });
    });
}

// passt Höhe und Breite des Video-Managers dynamisch an
// Funktion zur Höheneinstellung entfällt durch feste Inset-Werte

// ===== Einfache Player-Anpassung =====
// nutzt das gleiche Schema wie calcLayout()
function adjustVideoPlayerSize(force = false) {
    const section = document.getElementById('videoPlayerSection');
    if (!section) return;
    if (!force && section.classList.contains('hidden')) return;

    const header   = section.querySelector('.player-header');
    const controls = section.querySelector('.video-controls');
    const frame    = section.querySelector('iframe');
    if (!frame) return;

    const availableH = section.clientHeight - (header ? header.offsetHeight : 0) - (controls ? controls.offsetHeight : 0);
    let w = section.clientWidth;
    let h = w * 9 / 16;
    if (h > availableH) {
        h = availableH;
        w = h * 16 / 9;
    }

    frame.style.width  = w + 'px';
    frame.style.height = h + 'px';
    if (controls) controls.style.width = w + 'px';
}
window.adjustVideoPlayerSize = adjustVideoPlayerSize;

// auch bei Fenstergröße aktualisieren
window.addEventListener('resize', () => {
    // Player auch im verborgenen Zustand neu skalieren
    adjustVideoPlayerSize(true);
    if (typeof calcLayout === 'function') {
        calcLayout();
    }
    if (typeof window.positionOverlay === 'function') {
        window.positionOverlay();
    }
});

// Dialog oeffnen; verwendet addEventListener und bietet Fallback fuer alte Electron-Versionen
openVideoManager.addEventListener('click', async () => {
    // schon offen? – dann einfach ignorieren
    if (videoDlg.open) return;

    videoDlg.showModal();
    if (window.videoDialogObserver) window.videoDialogObserver.observe(videoDlg);
    await refreshTable();
    adjustVideoPlayerSize(true);
    if (typeof calcLayout === 'function') {
        calcLayout();
    }
});

// Gemeinsame Funktion zum Schliessen des Dialogs
function hideVideoDialog() {
    if (typeof videoDlg.close === 'function') {
        videoDlg.close();
    } else {
        videoDlg.removeAttribute('open');
    }
    if (typeof closeVideoDialog === 'function') closeVideoDialog();
    if (window.videoDialogObserver) window.videoDialogObserver.unobserve(videoDlg);
}

// "Schließen"-Button mit addEventListener verbinden
closeVideoDlg.addEventListener('click', hideVideoDialog);
if (closeVideoDlgSmall) {
    // kompakte Variante fuer schmale Fenster
    closeVideoDlgSmall.addEventListener('click', hideVideoDialog);
}
videoDlg.addEventListener('cancel', hideVideoDialog);
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && videoDlg.open) {
        if (typeof closeVideoDialog === 'function') closeVideoDialog();
    }
    if (e.ctrlKey && e.key.toLowerCase() === 'f' && videoDlg.open) {
        e.preventDefault();
        videoFilter.focus();
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
    const sel = Number(localStorage.getItem('videoSelectedIndex') || '-1');
    list.forEach((b,i) => {
        const tr = document.createElement('tr');
        tr.dataset.idx = b.origIndex;
        if (b.origIndex === sel) tr.classList.add('selected-row');
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
    const selRow = videoTableBody.querySelector('tr.selected-row');
    if (selRow) selRow.scrollIntoView({ block: 'nearest' });
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
                }
                break;
            case 'delete':
                if (confirm('Wirklich löschen?')) {
                    list.splice(origIdx,1);
                    await window.videoApi.saveBookmarks(list);
                    refreshTable();
                }
                break;
        }
    } else if (row) {
        const origIdx = Number(row.dataset.idx);
        let list = await window.videoApi.loadBookmarks();
        const bm = list[origIdx];
        localStorage.setItem('videoSelectedIndex', origIdx);
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
};

function formatTime(sec){
    const m=Math.floor(sec/60);
    const s=Math.floor(sec%60);
    return m+':'+('0'+s).slice(-2);
}

// berechnet Breite und Hoehe des Players dynamisch
function calcLayout() {
    if (typeof window.positionOverlay === 'function') {
        window.positionOverlay();
    }
}


// Add-Button Status
function updateAddBtn(){ addBtn.disabled = urlInput.value.trim() === ''; }
updateAddBtn();
urlInput.addEventListener('input', updateAddBtn);
addBtn.onclick = () => {
    const raw = urlInput.value.trim();
    if (!raw) { alert('URL fehlt'); return; }
    addVideoFromUrl(raw);
};

// fügt ein Video anhand einer URL hinzu
async function addVideoFromUrl(raw){
    const ytre = /^https?:\/\/(www\.)?youtube\.com\/watch\?v=/i;
    const yb = /^https?:\/\/youtu\.be\//i;
    if (!ytre.test(raw) && !yb.test(raw)) { alert('Keine gültige YouTube-Adresse'); return; }

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

// Löst einen Screenshot des Players aus
if (screenshotBtn) {
    screenshotBtn.onclick = () => {
        if (window.screenshotFrame) window.screenshotFrame();
    };
}
