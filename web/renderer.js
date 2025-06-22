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
    videoTableWrapper.addEventListener('wheel', () => {
        // Höhe dynamisch anpassen, ohne das Scrollen zu blockieren
        adjustVideoDialogHeight();
    }, { passive: true });
}
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
ensureDialogSupport(videoDlg);

// Neuer ResizeObserver verhindert Endlosschleifen
const ro = new ResizeObserver(() => {
    if (!window.__dlgRAF) {
        window.__dlgRAF = requestAnimationFrame(() => {
            window.__dlgRAF = null;
            adjustVideoDialogHeight();
        });
    }
});
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
const obsPanel = document.getElementById('ocrResultPanel');
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
function adjustVideoDialogHeight() {
    const dlg = videoDlg;
    const maxH = Math.floor(window.innerHeight * 0.9);
    const needH = dlg.scrollHeight;
    const newH  = Math.min(maxH, needH);
    // Nur Werte setzen, wenn sie sich geaendert haben
    if (dlg.__lastH !== newH) {
        dlg.style.height = newH + 'px';
        dlg.__lastH = newH;
    }

    const maxW = Math.floor(window.innerWidth * 0.9);
    const needW = dlg.scrollWidth;
    const newW  = Math.min(maxW, needW);
    if (dlg.__lastW !== newW) {
        dlg.style.width = newW + 'px';
        dlg.__lastW = newW;
    }

    if (typeof adjustVideoPlayerSize === 'function') adjustVideoPlayerSize();
}
// Funktion global verfügbar machen
window.adjustVideoDialogHeight = adjustVideoDialogHeight;

// ===== Einfache Player-Anpassung =====
// nutzt das gleiche Schema wie calcLayout()
function adjustVideoPlayerSize(force = false) {
    const section = document.getElementById('videoPlayerSection');
    if (!section) return;
    if (!force && section.classList.contains('hidden')) return;

    const dialog   = document.getElementById('videoMgrDialog');
    const header   = section.querySelector('.player-header');
    const controls = section.querySelector('.player-controls');
    const frame    = section.querySelector('iframe');
    const list     = dialog?.querySelector('.video-list-section');
    const ocrPanel = document.getElementById('ocrResultPanel');
    if (!frame || !dialog) return;

    const pad       = parseFloat(getComputedStyle(dialog).paddingLeft) || 0;
    const listW     = list ? list.offsetWidth : 0;
    let panelW = 0;
    if (ocrPanel && !ocrPanel.classList.contains('hidden')) {
        const style = getComputedStyle(ocrPanel);
        // Breite nur abziehen, wenn das Panel neben dem Video steht
        if (style.position !== 'static') {
            panelW = ocrPanel.offsetWidth;
        }
    }

    // verfügbare Fläche im Dialog
    const dialogW   = dialog.clientWidth;
    const dialogH   = dialog.clientHeight;
    let freeW       = dialogW - listW - 2 * pad;
    // Panelbreite abziehen, damit das Video nicht verdeckt wird
    freeW          -= panelW;
    const headerH   = header ? header.offsetHeight : 0;
    const controlsH = controls ? controls.offsetHeight : 0;
    const freeH     = dialogH - headerH - controlsH - 2 * pad;

    let h = freeW * 9 / 16;
    let w = freeW;
    if (h > freeH) {
        h = freeH;
        w = h * 16 / 9;
    }

    frame.style.width  = w + 'px';
    frame.style.height = h + 'px';
    if (controls) controls.style.width = w + 'px';
    if (ocrPanel && !ocrPanel.classList.contains('hidden')) {
        const style = getComputedStyle(ocrPanel);
        // Höhe nur setzen, wenn das Panel neben dem Video liegt
        if (style.position !== 'static') {
            ocrPanel.style.height = frame.clientHeight + 'px';
        } else {
            ocrPanel.style.height = 'auto';
        }
    }
}
window.adjustVideoPlayerSize = adjustVideoPlayerSize;

// auch bei Fenstergröße aktualisieren
window.addEventListener('resize', () => {
    adjustVideoDialogHeight();
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

    // Dialoggröße an Fenster anpassen
    videoDlg.style.width  = Math.min(window.innerWidth  * 0.9, 1100) + 'px';
    videoDlg.style.height = Math.min(window.innerHeight * 0.9,  750) + 'px';

    videoDlg.showModal();
    if (window.videoDialogObserver) window.videoDialogObserver.observe(videoDlg);
    await refreshTable();
    adjustVideoDialogHeight();
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
    adjustVideoDialogHeight();
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

// berechnet Breite und Hoehe des Players dynamisch
function calcLayout() {
    const dlg = document.getElementById('videoMgrDialog');
    const player = document.getElementById('videoPlayerSection');
    if (!dlg || !player) return;

    const iframe   = player.querySelector('iframe');
    const controls = player.querySelector('.player-controls');
    const header   = player.querySelector('.player-header');
    const list     = dlg.querySelector('.video-list-section');
    const ocrPanel = document.getElementById('ocrResultPanel');

    if (!iframe || !controls) return;

    const pad = parseFloat(getComputedStyle(dlg).paddingLeft) || 0;
    const leftListW = list ? list.offsetWidth : 0;
    const ocrPanelW = (ocrPanel && !ocrPanel.classList.contains('hidden'))
        ? ocrPanel.offsetWidth : 0;

    // verfügbare Breite und Höhe im Dialog ermitteln
    const dialogW = dlg.clientWidth;
    const dialogH = dlg.clientHeight;
    const freeW = dialogW - leftListW - ocrPanelW - 2 * pad;
    const headerH = header ? header.offsetHeight : 0;
    const controlsH = controls.offsetHeight;
    const freeH = dialogH - headerH - controlsH - 2 * pad;
    let width  = freeW;
    if (width <= 0) return;
    let height = width * 9 / 16;
    // passt Höhe an freie Fläche an und korrigiert Breite bei Bedarf
    if (height > freeH) {
        height = freeH;
        width  = height * 16 / 9;
    }

    iframe.style.width  = width + 'px';
    iframe.style.height = height + 'px';
    controls.style.width = width + 'px';

    if (ocrPanel && !ocrPanel.classList.contains('hidden')) {
        // Panel am Dialog-Padding ausrichten
        ocrPanel.style.top = pad + 'px';
        ocrPanel.style.right = pad + 'px';
        ocrPanel.style.height = height + 'px';
    }

    if (typeof window.positionOverlay === 'function') {
        window.positionOverlay();
        if (ocrPanel && !ocrPanel.classList.contains('hidden')) {
            // Panel-Höhe dem Video anpassen
            ocrPanel.style.height = iframe.clientHeight + 'px';
        }
    }
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
