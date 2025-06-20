// Elemente holen
const videoUrlInput = document.getElementById('videoUrlInput');
const addVideoBtn   = document.getElementById('addVideoBtn');

const openVideoManager = document.getElementById('openVideoManager');
const videoMgrDialog   = document.getElementById('videoMgrDialog');
const videoTableBody   = document.querySelector('#videoTable tbody');
const videoFilter      = document.getElementById('videoFilter');
const closeVideoDlg    = document.getElementById('closeVideoDlg');

let openPlayer, closePlayer;
import('./ytPlayer.js').then(m => {
    openPlayer = m.openPlayer;
    closePlayer = m.closePlayer;
});

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

openVideoManager.onclick = async () => { await refreshTable(); videoMgrDialog.showModal(); };
closeVideoDlg.onclick = () => {
    videoMgrDialog.close();
    if (typeof closePlayer === 'function') closePlayer();
};

let asc = true;
async function refreshTable(sortKey='title', dir=true) {
    let list = await window.videoApi.loadBookmarks();
    const q = videoFilter.value.toLowerCase();
    if (q) list = list.filter(b => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q));
    list.sort((a,b)=> dir ? (''+a[sortKey]).localeCompare(b[sortKey],'de') : (''+b[sortKey]).localeCompare(a[sortKey],'de'));
    videoTableBody.innerHTML = '';
    list.forEach((b,i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${i+1}</td>
            <td title="${b.title}">${b.title.slice(0,40)}</td>
            <td title="${b.url}">${b.url.slice(0,30)}…</td>
            <td>${formatTime(b.time)}</td>
            <td class="video-actions">
                <button class="start" data-idx="${i}">▶</button>
                <button class="rename" data-idx="${i}">✎</button>
                <button class="delete" data-idx="${i}">🗑</button>
            </td>`;
        videoTableBody.appendChild(tr);
    });
}

// Delegierte Button-Events
videoTableBody.onclick = async e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    let list = await window.videoApi.loadBookmarks();
    const bm = list[idx];
    switch(btn.className){
        case 'start':
            if (typeof closePlayer === 'function') await closePlayer();
            openPlayer(bm);
            break;
        case 'rename':
            const t = prompt('Neuer Titel', bm.title);
            if (t) { bm.title = t; await window.videoApi.saveBookmarks(list); refreshTable(); }
            break;
        case 'delete':
            if (confirm('Löschen?')) { list.splice(idx,1); await window.videoApi.saveBookmarks(list); refreshTable(); }
            break;
    }
};

// Sortierbare Header
document.querySelectorAll('#videoTable thead th').forEach(th => {
    th.onclick = () => {
        const keyMap = {0:'index',1:'title',2:'url',3:'time'};
        const key = keyMap[Array.from(th.parentNode.children).indexOf(th)];
        asc = th.dataset.asc !== 'false';
        th.dataset.asc = !asc;
        refreshTable(key, asc);
    };
});

videoFilter.oninput = () => refreshTable();

function formatTime(sec){
    const m=Math.floor(sec/60);
    const s=Math.floor(sec%60);
    return m+':'+('0'+s).slice(-2);
}

// extrahiert die Video-ID aus einer YouTube-URL
function getYoutubeId(u){
    const m = u.match(/[?&]v=([^&]+)/) || u.match(/youtu\.be\/([^?]+)/);
    return m ? m[1] : '';
}

// Add-Button Status
function updateAddBtn(){ addVideoBtn.disabled = videoUrlInput.value.trim() === ''; }
updateAddBtn();
videoUrlInput.addEventListener('input', updateAddBtn);
addVideoBtn.addEventListener('click', async () => {
    const url = videoUrlInput.value.trim();
    if (!url || !url.startsWith('https://')) {
        alert('Ungültige URL');
        return;
    }
    if (!getYoutubeId(url)) {
        alert('Keine gültige YouTube-URL');
        return;
    }

    let list = await window.videoApi.loadBookmarks();
    if (list.some(b => b.url === url)) {
        alert('Schon vorhanden');
        return;
    }

    let title = url;
    try {
        const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
        if (res.ok) {
            const data = await res.json();
            title = data.title;
        }
    } catch (err) {
        console.warn('Titel konnte nicht geladen werden', err);
    }

    list.push({ url, title, time: 0 });
    list.sort((a, b) => a.title.localeCompare(b.title, 'de'));
    await window.videoApi.saveBookmarks(list);
    videoUrlInput.value = '';
    updateAddBtn();
    if (videoMgrDialog.open) refreshTable();
    if (typeof showToast === 'function') showToast('Video gespeichert');
});
