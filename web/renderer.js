// Elemente abrufen
const urlInput  = document.getElementById('videoUrlInput');
const addBtn    = document.getElementById('addVideoBtn');

const openVideoManager = document.getElementById('openVideoManager');
const videoMgrDialog   = document.getElementById('videoMgrDialog');
const videoTableBody   = document.querySelector('#videoTable tbody');
const videoFilter      = document.getElementById('videoFilter');
const closeVideoDlg    = document.getElementById('closeVideoDlg');

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

// passt die Höhe des Video-Managers dynamisch an
function adjustVideoDialogHeight() {
    const max = window.innerHeight * 0.9;
    videoMgrDialog.style.height = 'auto';
    const benoetigt = videoMgrDialog.scrollHeight;
    videoMgrDialog.style.height = Math.min(benoetigt, max) + 'px';
    // danach den Player anpassen
    if (typeof adjustVideoPlayerSize === 'function') {
        adjustVideoPlayerSize();
    }
}
// Funktion global verfügbar machen
window.adjustVideoDialogHeight = adjustVideoDialogHeight;

// passt den Videoplayer dynamisch an das 16:9-Format an
function adjustVideoPlayerSize() {
    const section = document.getElementById('videoPlayerSection');
    const frame   = document.getElementById('videoPlayerFrame');
    if (!section || !frame || section.classList.contains('hidden')) return;

    const header   = section.querySelector('.player-header');
    const controls = section.querySelector('.player-controls');
    const frei = section.clientHeight
        - (header ? header.offsetHeight : 0)
        - (controls ? controls.offsetHeight : 0);
    const maxBreite = frei * 16 / 9;
    const bereichBreite = section.clientWidth;
    const nutzBreite = Math.min(bereichBreite, maxBreite);
    const nutzHoehe = nutzBreite * 9 / 16;

    frame.style.width  = nutzBreite + 'px';
    frame.style.height = nutzHoehe + 'px';
}
window.adjustVideoPlayerSize = adjustVideoPlayerSize;

// auch bei Fenstergröße aktualisieren
window.addEventListener('resize', () => {
    adjustVideoDialogHeight();
    adjustVideoPlayerSize();
});

openVideoManager.onclick = async () => {
    await refreshTable();
    videoMgrDialog.showModal();
    adjustVideoDialogHeight();
    adjustVideoPlayerSize();
};
closeVideoDlg.onclick = () => {
    videoMgrDialog.close();
    if (typeof closeVideoDialog === 'function') closeVideoDialog();
    adjustVideoDialogHeight();
    adjustVideoPlayerSize();
};
videoMgrDialog.addEventListener('cancel', () => {
    if (typeof closeVideoDialog === 'function') closeVideoDialog();
    adjustVideoDialogHeight();
    adjustVideoPlayerSize();
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
