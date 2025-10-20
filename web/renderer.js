// Verwaltet die gespeicherten YouTube-Links
// Alle Bookmarks werden dauerhaft im gewählten Speicher abgelegt

// Zugriff auf den globalen Speicher
const storage = window.storage;

// =========================== ARBEITSBEREICH-TABS START ===========================
/**
 * Richtet die Registerkarten im Kopfbereich ein, damit die Werkzeugleisten
 * weniger Platz einnehmen und trotzdem vollständig erreichbar bleiben.
 */
function initWorkspaceTabs() {
    const tabButtons = Array.from(document.querySelectorAll('.toolbar-tab'));
    const panels = Array.from(document.querySelectorAll('.toolbar-panel'));
    if (!tabButtons.length || !panels.length) {
        return;
    }

    const storageKey = 'workspaceToolbarTab';
    const buttonByPanel = new Map(tabButtons.map(btn => [btn.dataset.panel, btn]));

    /**
     * Aktiviert die gewünschte Registerkarte und speichert die Wahl.
     * @param {string} panelId - Kennung des Ziel-Panels
     * @param {boolean} focusTab - Fokus nach der Umschaltung setzen
     */
    function activate(panelId, focusTab = false) {
        for (const btn of tabButtons) {
            const isActive = btn.dataset.panel === panelId;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
            btn.setAttribute('tabindex', isActive ? '0' : '-1');
        }

        for (const panel of panels) {
            const isActive = panel.dataset.panel === panelId;
            panel.classList.toggle('is-active', isActive);
            panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        }

        try {
            window.localStorage?.setItem(storageKey, panelId);
        } catch (error) {
            console.warn('Tab-Auswahl konnte nicht gespeichert werden:', error);
        }

        if (focusTab) {
            const target = buttonByPanel.get(panelId);
            target?.focus();
        }
    }

    tabButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => activate(btn.dataset.panel));
        btn.addEventListener('keydown', event => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
                return;
            }
            event.preventDefault();
            const direction = event.key === 'ArrowRight' ? 1 : -1;
            const nextIndex = (index + direction + tabButtons.length) % tabButtons.length;
            const nextBtn = tabButtons[nextIndex];
            if (nextBtn) {
                activate(nextBtn.dataset.panel, true);
            }
        });
    });

    const storedPanel = (() => {
        try {
            return window.localStorage?.getItem(storageKey) || null;
        } catch {
            return null;
        }
    })();

    if (storedPanel && buttonByPanel.has(storedPanel)) {
        activate(storedPanel);
    } else {
        const defaultPanel = tabButtons[0]?.dataset.panel;
        if (defaultPanel) {
            activate(defaultPanel);
        }
    }
}

document.addEventListener('DOMContentLoaded', initWorkspaceTabs);
// =========================== ARBEITSBEREICH-TABS END =============================

let urlInput;
let addBtn;
let openMgr;
let videoDlg;
let closeDlg;
let closeDlgSmall;
let videoGrid;
let videoFilter;

// Zeitstempel aus einer YouTube-URL extrahieren
import { extractTime } from '../utils/videoFrameUtils.js';

// Liefert das passende Vorschaubild für einen Bookmark
// Das Storyboard wird übersprungen und direkt der ffmpeg-Fallback genutzt.
// Ist dieser nicht verfügbar, erscheint das reguläre YouTube-Thumbnail.
async function previewFor(b) {
    if (window.videoApi?.getFrame) {
        const data = await window.videoApi.getFrame({ url: b.url, time: b.time });
        if (data) return /^data:/.test(data) ? data : `data:image/jpeg;base64,${data}`;
    }
    return `https://i.ytimg.com/vi/${extractYoutubeId(b.url)}/hqdefault.jpg`;
}

// Fallback wenn keine externe API vorhanden ist
if (!window.videoApi) {
    window.videoApi = {
        loadBookmarks: async () => {
            try { return JSON.parse(storage.getItem('hla_videoBookmarks')) || []; } catch { return []; }
        },
        saveBookmarks: async list => {
            try { storage.setItem('hla_videoBookmarks', JSON.stringify(list ?? [])); } catch {}
            return true;
        }
    };
}

function extractYoutubeId(url) {
    const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return m ? m[1] : '';
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
    if (!videoGrid) return;
    let list = await getBookmarks();
    const q = (videoFilter?.value ?? '').toLowerCase();
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
                <button class="refresh-thumb" data-idx="${b.origIndex}" title="Bild neu laden">⟳</button>
                <div class="thumb-overlay"><div class="progress-bar"><div class="progress-fill"></div></div></div>
             </div>`+
            `<div class="video-title" data-idx="${b.origIndex}" title="${b.title}">${b.title}</div>`+
            `<div class="video-time">${formatTime(b.time)}</div>`+
            `<button class="btn btn-blue update" data-idx="${b.origIndex}">Aktualisieren</button>`+
            `<button class="btn btn-danger delete" data-idx="${b.origIndex}" title="Video löschen">🗑️</button>`;
        if (!videoGrid) return;
        videoGrid.appendChild(div);

        const overlay = div.querySelector('.thumb-overlay');
        const imgElem = div.querySelector('img.video-thumb');
        overlay.classList.add('active');
        imgElem.src = await previewFor(b);
        imgElem.referrerPolicy = 'no-referrer';
        imgElem.crossOrigin    = 'anonymous';
        overlay.remove();
    }
}

async function handleVideoGridClick(e){
    const target = e?.target;
    if (!target) return;
    const refreshBtn = target.closest('.refresh-thumb');
    const btn = target.closest('button');
    const item = target.closest('.video-item');
    const list = await window.videoApi.loadBookmarks();
    if (refreshBtn) {
        const idx = Number(refreshBtn.dataset.idx);
        const bm  = list[idx];
        if (!bm) return;
        const wrapper = refreshBtn.closest('.thumb-wrapper');
        if (!wrapper) return;
        const overlay = document.createElement('div');
        overlay.className = 'thumb-overlay active';
        overlay.innerHTML = '<div class="progress-bar"><div class="progress-fill"></div></div>';
        wrapper.appendChild(overlay);
        const imgElem = wrapper.querySelector('img.video-thumb');
        if (!imgElem) { overlay.remove(); return; }
        imgElem.src = await previewFor(bm);
        imgElem.referrerPolicy = 'no-referrer';
        imgElem.crossOrigin    = 'anonymous';
        overlay.remove();
    } else if (btn && btn.classList.contains('delete')) {
        const idx = Number(btn.dataset.idx);
        list.splice(idx,1);
        await window.videoApi.saveBookmarks(list);
        refreshTable();
    } else if (btn && btn.classList.contains('update')) {
        if (!urlInput) return;
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
}

function handleVideoFilterInput(){
    refreshTable();
}

function updateAddBtn(){
    if (addBtn) addBtn.disabled = !urlInput || urlInput.value.trim() === '';
}

function handleUrlInput(){
    updateAddBtn();
}

function handleAddBtnClick(){
    if (!urlInput) return;
    const raw = urlInput.value.trim();
    if (!/^https:\/\/\S+$/i.test(raw)) { alert('Ungültige URL'); return; }
    addVideoFromUrl(raw);
}

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
    if (urlInput) urlInput.value='';
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

function closeDialog(){
    if (!videoDlg) return;
    videoDlg.classList.add('hidden');
    if (typeof videoDlg.close==='function') videoDlg.close(); else videoDlg.removeAttribute('open');
}

function initVideoManager(){
    const newUrlInput = document.getElementById('videoUrlInput');
    if (urlInput) urlInput.removeEventListener('input', handleUrlInput);
    urlInput = newUrlInput;
    if (urlInput) urlInput.addEventListener('input', handleUrlInput);

    const newAddBtn = document.getElementById('addVideoBtn');
    if (addBtn) addBtn.removeEventListener('click', handleAddBtnClick);
    addBtn = newAddBtn;
    if (addBtn) addBtn.addEventListener('click', handleAddBtnClick);

    openMgr = document.getElementById('openVideoManager');

    const newVideoDlg = document.getElementById('videoMgrDialog');
    if (videoDlg) videoDlg.removeEventListener('cancel', closeDialog);
    videoDlg = newVideoDlg;
    if (videoDlg) videoDlg.addEventListener('cancel', closeDialog);

    const newCloseDlg = document.getElementById('closeVideoDlg');
    if (closeDlg) closeDlg.removeEventListener('click', closeDialog);
    closeDlg = newCloseDlg;
    if (closeDlg) closeDlg.addEventListener('click', closeDialog);

    const newCloseDlgSmall = document.getElementById('closeVideoDlgSmall');
    if (closeDlgSmall) closeDlgSmall.removeEventListener('click', closeDialog);
    closeDlgSmall = newCloseDlgSmall;
    if (closeDlgSmall) closeDlgSmall.addEventListener('click', closeDialog);

    const newVideoGrid = document.getElementById('videoGrid');
    if (videoGrid) videoGrid.removeEventListener('click', handleVideoGridClick);
    videoGrid = newVideoGrid;
    if (videoGrid) videoGrid.addEventListener('click', handleVideoGridClick);

    const newVideoFilter = document.getElementById('videoFilter');
    if (videoFilter) videoFilter.removeEventListener('input', handleVideoFilterInput);
    videoFilter = newVideoFilter;
    if (videoFilter) videoFilter.addEventListener('input', handleVideoFilterInput);

    updateAddBtn();

    window.videoManager = {
        get button(){ return openMgr; },
        get dialog(){ return videoDlg; },
        get filter(){ return videoFilter; },
        get grid(){ return videoGrid; },
        get urlInput(){ return urlInput; },
        get addButton(){ return addBtn; }
    };
}

window.initVideoManager = initVideoManager;
initVideoManager();
refreshTable();
