// Elemente holen
const urlInput       = document.getElementById('videoUrlInput');
const addBtn         = document.getElementById('addVideoBtn');
const videoMgrBtn    = document.getElementById('openVideoManager');
const videoDialog    = document.getElementById('videoMgrDialog');
const videoTableBody = document.getElementById('videoTableBody');
const closeVideoMgr  = document.getElementById('closeVideoMgr');
const closePlayerBtn = document.getElementById('closePlayerBtn');

let openPlayer, closePlayer;
import('./ytPlayer.js').then(mod => {
    openPlayer = mod.openPlayer;
    closePlayer = mod.closePlayer;
});

let list = [];

// Dialog-Unterstützung prüfen und ggf. Polyfill laden
function ensureDialogSupport(dlg) {
    if (typeof dlg.showModal !== 'function') {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = 'https://cdnjs.cloudflare.com/ajax/libs/dialog-polyfill/0.5.6/dialog-polyfill.min.css';
        document.head.appendChild(l);
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/dialog-polyfill/0.5.6/dialog-polyfill.min.js';
        s.onload = () => window.dialogPolyfill.registerDialog(dlg);
        document.head.appendChild(s);
    }
}
ensureDialogSupport(videoDialog);

videoMgrBtn.addEventListener('click', () => {
    refreshTable();
    videoDialog.showModal();
});
closeVideoMgr.addEventListener('click', () => videoDialog.close());
closePlayerBtn.addEventListener('click', () => closePlayer());
videoDialog.addEventListener('keydown', e => { if (e.key === 'Escape') closePlayer(); });
document.addEventListener('video-start', ({detail}) => {
    if (openPlayer) openPlayer(list[detail]);
});

// Tabelle neu aufbauen
async function refreshTable() {
    list = await window.videoApi.loadBookmarks();
    videoTableBody.innerHTML = '';
    list.forEach((b, i) => {
        const tr = document.createElement('tr');
        const urlCell = document.createElement('td');
        urlCell.textContent = b.url;
        const timeCell = document.createElement('td');
        timeCell.textContent = b.time ?? 0;
        const startCell = document.createElement('td');
        const startBtn = document.createElement('button');
        startBtn.textContent = 'Start';
        startBtn.addEventListener('click', () => {
            videoDialog.dispatchEvent(new CustomEvent('video-start', { detail: i }));
            console.log('Starte Video', i);
        });
        startCell.appendChild(startBtn);
        const delCell = document.createElement('td');
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Löschen';
        delBtn.addEventListener('click', async () => {
            list.splice(i, 1);
            await window.videoApi.saveBookmarks(list);
            refreshTable();
        });
        delCell.appendChild(delBtn);
        tr.append(urlCell, timeCell, startCell, delCell);
        videoTableBody.appendChild(tr);
    });
}

// Button-Status je nach Eingabe anpassen
function updateAddBtn() {
    addBtn.disabled = urlInput.value.trim() === '';
}

// Initial deaktivieren, falls kein Text
updateAddBtn();

// Eingaben überwachen
urlInput.addEventListener('input', updateAddBtn);

// Klick auf "Hinzufügen"
addBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url) return;
    list = await window.videoApi.loadBookmarks();
    if (list.some(b => b.url === url)) { alert('Schon vorhanden'); return; }
    list.push({url, time:0});
    await window.videoApi.saveBookmarks(list);
    refreshTable();
    alert('Gespeichert');
});
