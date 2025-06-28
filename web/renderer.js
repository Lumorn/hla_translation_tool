// Verwaltet die gespeicherten YouTube-Links
// Alle Bookmarks werden dauerhaft im LocalStorage abgelegt

const urlInput  = document.getElementById('videoUrlInput');
const addBtn    = document.getElementById('addVideoBtn');
const openMgr   = document.getElementById('openVideoManager');
const videoDlg  = document.getElementById('videoMgrDialog');
const closeDlg  = document.getElementById('closeVideoDlg');
const closeDlgSmall = document.getElementById('closeVideoDlgSmall');
const videoGrid = document.getElementById('videoGrid');
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
    const h = Math.floor(sec/3600);
    const m = Math.floor((sec%3600)/60);
    const s = Math.floor(sec%60);
    return h.toString().padStart(2,'0')+':' +
           m.toString().padStart(2,'0')+':' +
           s.toString().padStart(2,'0');
}

async function refreshTable(sortKey='title', dir=true) {
    let list = await getBookmarks();
    const q = videoFilter.value.toLowerCase();
    if (q) list = list.filter(b => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q));
    list.sort((a,b)=>a[sortKey].localeCompare ? (dir?a[sortKey].localeCompare(b[sortKey],'de'):b[sortKey].localeCompare(a[sortKey],'de')) : (dir?a[sortKey]-b[sortKey]:b[sortKey]-a[sortKey]));
    videoGrid.innerHTML = '';
    for (const b of list) {
        const div = document.createElement('div');
        div.className = 'video-item';
        div.dataset.idx = b.origIndex;
        const thumb = `https://i.ytimg.com/vi/${extractYoutubeId(b.url)}/hqdefault.jpg`;
        div.innerHTML =
            `<div class="thumb-wrapper">
                <img src="${thumb}" class="video-thumb" data-idx="${b.origIndex}">
                <div class="thumb-overlay"><div class="progress-bar"><div class="progress-fill"></div></div></div>
             </div>`+
            `<div class="video-title" data-idx="${b.origIndex}" title="${b.title}">${b.title}</div>`+
            `<div class="video-time">${formatTime(b.time)}</div>`+
            `<button class="btn btn-blue update" data-idx="${b.origIndex}">Aktualisieren</button>`+
            `<button class="btn btn-danger delete" data-idx="${b.origIndex}" title="Video löschen">🗑️</button>`;
        videoGrid.appendChild(div);

        const overlay = div.querySelector('.thumb-overlay');
        const imgElem = div.querySelector('img.video-thumb');
        if (window.videoApi && window.videoApi.getFrame) {
            // Nur in der Desktop-Version steht eine API bereit, um Screenshots zu laden
            overlay.classList.add('active');
            window.videoApi.getFrame({ url: b.url, time: b.time })
                .then(data => {
                    overlay.classList.remove('active');
                    if (data) {
                        imgElem.src = `data:image/jpeg;base64,${data}`;
                        overlay.remove();
                    } else {
                        overlay.classList.add('error');
                    }
                })
                .catch(() => {
                    overlay.classList.remove('active');
                    overlay.classList.add('error');
                });
        } else {
            // In der reinen Web-Version gibt es keine Video-API – Ladeanzeige entfernen
            overlay.remove();
        }
    }
}

videoGrid.addEventListener('click', async e=>{
    const btn = e.target.closest('button');
    const item = e.target.closest('.video-item');
    const list = await window.videoApi.loadBookmarks();
    if (btn && btn.classList.contains('delete')) {
        const idx = Number(btn.dataset.idx);
        list.splice(idx,1);
        await window.videoApi.saveBookmarks(list);
        refreshTable();
    } else if (btn && btn.classList.contains('update')) {
        const idx = Number(btn.dataset.idx);
        const raw = urlInput.value.trim();
        if (!/^https:\/\/\S+$/i.test(raw)) { alert('Ungültige URL'); return; }
        await updateBookmark(idx, raw, list);
    } else if (item) {
        const idx = Number(item.dataset.idx);
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
    const id = extractYoutubeId(raw);
    let title = raw;
    try {
        const res = await fetch('https://www.youtube.com/oembed?url='+encodeURIComponent(raw)+'&format=json');
        if (res.ok) ({ title } = await res.json());
    } catch {}
    const time = extractTime(raw);
    const existingIdx = list.findIndex(b=>extractYoutubeId(b.url)===id);
    if (existingIdx>=0) {
        list[existingIdx] = { url: raw, title, time };
    } else {
        list.push({ url: raw, title, time });
    }
    list.sort((a,b)=>a.title.localeCompare(b.title,'de'));
    await window.videoApi.saveBookmarks(list);
    urlInput.value='';
    updateAddBtn();
    refreshTable();
}

async function updateBookmark(index, raw, list){
    const id = extractYoutubeId(raw);
    let title = raw;
    try {
        const res = await fetch('https://www.youtube.com/oembed?url='+encodeURIComponent(raw)+'&format=json');
        if (res.ok) ({ title } = await res.json());
    } catch {}
    const time = extractTime(raw);
    const sameIdx = list.findIndex((b,i)=>i!==index && extractYoutubeId(b.url)===id);
    if (sameIdx>=0) {
        list[sameIdx].time = time;
        list.splice(index,1);
    } else if (extractYoutubeId(list[index].url)===id) {
        list[index].time = time;
    } else {
        list[index] = { url: raw, title, time };
    }
    list.sort((a,b)=>a.title.localeCompare(b.title,'de'));
    await window.videoApi.saveBookmarks(list);
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
