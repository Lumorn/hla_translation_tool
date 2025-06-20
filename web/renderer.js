// Elemente holen
const urlInput = document.getElementById('videoUrlInput');
const addBtn   = document.getElementById('addVideoBtn');

const openBtn   = document.getElementById('openVideoManager');
const dlg       = document.getElementById('videoMgrDialog');
const tbody     = document.querySelector('#videoTable tbody');
const filterInp = document.getElementById('videoFilter');

let openPlayer;
import('./ytPlayer.js').then(m => { openPlayer = m.openPlayer; });

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
ensureDialogSupport(dlg);

openBtn.onclick = async () => { await refreshTable(); dlg.showModal(); };
document.getElementById('closeVideoDlg').onclick = () => dlg.close();

let asc = true;
async function refreshTable(sortKey='title', dir=true) {
    let list = await window.videoApi.loadBookmarks();
    const q = filterInp.value.toLowerCase();
    if (q) list = list.filter(b => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q));
    list.sort((a,b)=> dir ? (''+a[sortKey]).localeCompare(b[sortKey],'de') : (''+b[sortKey]).localeCompare(a[sortKey],'de'));
    tbody.innerHTML = '';
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
        tbody.appendChild(tr);
    });
}

// Delegierte Button-Events
tbody.onclick = async e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const idx = Number(btn.dataset.idx);
    let list = await window.videoApi.loadBookmarks();
    const bm = list[idx];
    switch(btn.className){
        case 'start':
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

filterInp.oninput = () => refreshTable();

function formatTime(sec){
    const m=Math.floor(sec/60);
    const s=Math.floor(sec%60);
    return m+':'+('0'+s).slice(-2);
}

// Add-Button Status
function updateAddBtn(){ addBtn.disabled = urlInput.value.trim() === ''; }
updateAddBtn();
urlInput.addEventListener('input', updateAddBtn);
addBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) return;
    let list = await window.videoApi.loadBookmarks();
    if (list.some(b => b.url === url)) { alert('Schon vorhanden'); return; }
    list.push({title:url, url, time:0});
    await window.videoApi.saveBookmarks(list);
    refreshTable();
    alert('Gespeichert');
});
