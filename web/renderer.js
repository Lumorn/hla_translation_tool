// Verwaltet die gespeicherten YouTube-Links
// Alle Bookmarks werden dauerhaft im LocalStorage abgelegt

const urlInput  = document.getElementById('videoUrlInput');
const addBtn    = document.getElementById('addVideoBtn');
const openMgr   = document.getElementById('openVideoManager');
const videoDlg  = document.getElementById('videoMgrDialog');
const closeDlg  = document.getElementById('closeVideoDlg');
const closeDlgSmall = document.getElementById('closeVideoDlgSmall');
const videoTableBody = document.querySelector('#videoTable tbody');
const videoFilter    = document.getElementById('videoFilter');

// Fallback wenn keine externe API vorhanden ist
if (!window.videoApi) {
    window.videoApi = {
        loadBookmarks: async () => {
            try { return JSON.parse(localStorage.getItem('hla_videoBookmarks')) || []; } catch { return []; }
        },
        saveBookmarks: async list => {
            try { localStorage.setItem('hla_videoBookmarks', JSON.stringify(list ?? [])); } catch {}
            return true;
        }
    };
}

function extractYoutubeId(url) {
    const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return m ? m[1] : '';
}

function extractTime(url) {
    const m = url.match(/[?&#]t=(\d+)/) || url.match(/[?&#]start=(\d+)/);
    return m ? Number(m[1]) : 0;
}

async function getBookmarks() {
    const list = await window.videoApi.loadBookmarks();
    return list.map((b,i)=>({ ...b, origIndex:i }));
}

function formatTime(sec) {
    const m = Math.floor(sec/60);
    const s = Math.floor(sec%60);
    return m + ':' + ('0'+s).slice(-2);
}

async function refreshTable(sortKey='title', dir=true) {
    let list = await getBookmarks();
    const q = videoFilter.value.toLowerCase();
    if (q) list = list.filter(b => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q));
    list.sort((a,b)=>a[sortKey].localeCompare ? (dir?a[sortKey].localeCompare(b[sortKey],'de'):b[sortKey].localeCompare(a[sortKey],'de')) : (dir?a[sortKey]-b[sortKey]:b[sortKey]-a[sortKey]));
    videoTableBody.innerHTML = '';
    list.forEach(b=>{
        const tr = document.createElement('tr');
        tr.dataset.idx = b.origIndex;
        const thumb = `https://i.ytimg.com/vi/${extractYoutubeId(b.url)}/default.jpg`;
        tr.innerHTML = `<td><img src="${thumb}" class="video-thumb" data-idx="${b.origIndex}"></td>`+
                       `<td class="video-title" data-idx="${b.origIndex}" title="${b.title}">${b.title}</td>`+
                       `<td>${formatTime(b.time)}</td>`+
                       `<td><button class="delete" data-idx="${b.origIndex}" title="Video löschen">🗑️</button></td>`;
        videoTableBody.appendChild(tr);
    });
}

videoTableBody.addEventListener('click', async e=>{
    const btn = e.target.closest('button');
    const row = e.target.closest('tr');
    const list = await window.videoApi.loadBookmarks();
    if (btn) {
        const idx = Number(btn.dataset.idx);
        list.splice(idx,1);
        await window.videoApi.saveBookmarks(list);
        refreshTable();
    } else if (row) {
        const idx = Number(row.dataset.idx);
        const bm = list[idx];
        if (!bm) return;
        if (window.electronAPI && window.electronAPI.openExternal) {
            window.electronAPI.openExternal(bm.url);
        } else {
            window.open(bm.url,'_blank');
        }
    }
});

videoFilter.addEventListener('input', ()=>{
    localStorage.setItem('hla_videoFilter', videoFilter.value);
    refreshTable();
});

function updateAddBtn(){ addBtn.disabled = urlInput.value.trim() === ''; }
updateAddBtn();
urlInput.addEventListener('input', updateAddBtn);

addBtn.addEventListener('click', () => {
    const raw = urlInput.value.trim();
    if (!/^https:\/\/\S+$/i.test(raw)) { alert('Ungültige URL'); return; }
    addVideoFromUrl(raw);
});

async function addVideoFromUrl(raw){
    const ytre = /^https?:\/\/(www\.)?youtube\.com\/watch\?v=/i;
    const yb = /^https?:\/\/youtu\.be\//i;
    if (!ytre.test(raw) && !yb.test(raw)) { alert('Keine gültige YouTube-Adresse'); return; }
    let list = await window.videoApi.loadBookmarks();
    if (list.some(b=>b.url===raw)) return;
    let title = raw;
    try {
        const res = await fetch('https://www.youtube.com/oembed?url='+encodeURIComponent(raw)+'&format=json');
        if (res.ok) ({ title } = await res.json());
    } catch {}
    list.push({ url: raw, title, time: extractTime(raw) });
    list.sort((a,b)=>a.title.localeCompare(b.title,'de'));
    await window.videoApi.saveBookmarks(list);
    urlInput.value='';
    updateAddBtn();
    refreshTable();
}

openMgr.addEventListener('click', async ()=>{
    if (videoDlg.open) return;
    videoDlg.showModal();
    await refreshTable();
});

function closeDialog(){
    if (typeof videoDlg.close==='function') videoDlg.close(); else videoDlg.removeAttribute('open');
}
closeDlg.addEventListener('click', closeDialog);
if (closeDlgSmall) closeDlgSmall.addEventListener('click', closeDialog);
videoDlg.addEventListener('cancel', closeDialog);

const savedFilter = localStorage.getItem('hla_videoFilter') || '';
if (savedFilter) videoFilter.value = savedFilter;

refreshTable();
