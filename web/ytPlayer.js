// Steuert den eingebetteten YouTube-Player

// extrahiert die Video-ID aus einer YouTube-URL
export function extractYoutubeId(url) {
    const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return m ? m[1] : '';
}

// öffnet den Player für ein Bookmark
export function openPlayer(bookmark, index) {
    const div = document.getElementById('ytPlayerBox');
    if (!div) return;
    div.style.display = 'block';
    div.innerHTML = `<iframe id="ytIframe" width="100%" height="100%"
        src="https://www.youtube.com/embed/${extractYoutubeId(bookmark.url)}?start=${Math.floor(bookmark.time)}&enablejsapi=1"
        allow="autoplay; fullscreen" frameborder="0"></iframe>`;
    if (window.currentYT && window.currentYT.destroy) {
        window.currentYT.destroy();
    }
    window.currentYT = new YT.Player('ytIframe');

    // lokale Speicherung der Abspielposition alle 2 Sekunden
    let currentTime = bookmark.time;
    const interval = setInterval(async () => {
        if (window.currentYT &&
            window.currentYT.getPlayerState() === YT.PlayerState.PLAYING) {
            currentTime = window.currentYT.getCurrentTime();
        }
    }, 2000);

    // stellt sicher, dass Zeit und Interval auch beim Schließen verfügbar sind
    window.__ytPlayerState = { bookmark, index, interval, get time() { return currentTime; } };
}

// öffnet einen modalen Dialog mit YouTube-Player
export function openVideoDialog(bookmark, index) {
    const dlg = document.getElementById('videoPlayerDialog');
    if (!dlg) return;
    if (typeof dlg.showModal !== 'function' && window.dialogPolyfill) {
        window.dialogPolyfill.registerDialog(dlg);
    }
    dlg.showModal();

    dlg.dataset.index = index;
    dlg.querySelector('#playerDialogTitle').textContent = bookmark.title;

    const iframe = document.getElementById('videoPlayerFrame');
    iframe.id = 'videoPlayerFrame';
    iframe.src = `https://www.youtube.com/embed/${extractYoutubeId(bookmark.url)}?start=${Math.floor(bookmark.time)}&enablejsapi=1`;

    if (window.currentYT && window.currentYT.destroy) {
        window.currentYT.destroy();
    }
    window.currentYT = new YT.Player('videoPlayerFrame');

    const slider = document.getElementById('videoSlider');
    const cur = document.getElementById('videoCurrent');
    const dur = document.getElementById('videoDuration');
    const playBtn = document.getElementById('videoPlay');
    const backBtn = document.getElementById('videoBack');
    const fwdBtn = document.getElementById('videoForward');
    const reloadBtn = document.getElementById('videoReload');
    const deleteBtn = document.getElementById('videoDelete');
    const closeBtn = document.getElementById('videoClose');

    function formatTime(sec){
        const m=Math.floor(sec/60); const s=Math.floor(sec%60); return m+':'+('0'+s).slice(-2);
    }

    // hält die aktuelle Abspielzeit für das spätere Speichern fest
    let currentTime = bookmark.time;

    // Aktualisiert die UI jede Sekunde
    const uiInterval = setInterval(async () => {
        if (window.currentYT) {
            const d = window.currentYT.getDuration();
            const t = window.currentYT.getCurrentTime();
            slider.max = d;
            slider.value = t;
            cur.textContent = formatTime(t);
            dur.textContent = formatTime(d);
        }
    }, 1000);

    // eigenes Intervall wie im einfachen Player
    const interval = setInterval(async () => {
        if (window.currentYT &&
            window.currentYT.getPlayerState() === YT.PlayerState.PLAYING) {
            currentTime = window.currentYT.getCurrentTime();
        }
    }, 2000);

    slider.oninput = () => {
        if (window.currentYT && window.currentYT.seekTo) {
            window.currentYT.seekTo(Number(slider.value), true);
        }
    };
    playBtn.onclick = () => {
        if (!window.currentYT) return;
        const st = window.currentYT.getPlayerState();
        if (st === YT.PlayerState.PAUSED || st === YT.PlayerState.CUED) {
            window.currentYT.playVideo();
        } else {
            window.currentYT.pauseVideo();
        }
    };
    backBtn.onclick = () => {
        if (window.currentYT) window.currentYT.seekTo(Math.max(0, window.currentYT.getCurrentTime() - 10), true);
    };
    fwdBtn.onclick = () => {
        if (window.currentYT) window.currentYT.seekTo(window.currentYT.getCurrentTime() + 10, true);
    };
    reloadBtn.onclick = () => {
        if (window.currentYT) window.currentYT.seekTo(0, true);
    };
    deleteBtn.onclick = async () => {
        if (!confirm('Wirklich löschen?')) return;
        const list = await window.videoApi.loadBookmarks();
        list.splice(index,1);
        await window.videoApi.saveBookmarks(list);
        closeVideoDialog();
        if (window.refreshTable) window.refreshTable();
    };
    closeBtn.onclick = closeVideoDialog;

    dlg.__playerKey = function(e){
        if (!dlg.open) return;
        if (e.key === 'Escape') { e.preventDefault(); closeVideoDialog(); }
        if (e.key === ' ') { e.preventDefault(); playBtn.click(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); backBtn.click(); }
        if (e.key === 'ArrowRight') { e.preventDefault(); fwdBtn.click(); }
    };
    document.addEventListener('keydown', dlg.__playerKey);

    // speichert auch bei nativen Dialog-Schließen
    dlg.addEventListener('close', () => {
        if (!dlg.__closing) {
            closeVideoDialog();
        }
    });

    // globaler Zugriff für das Schließen
    window.__ytPlayerState = {
        bookmark,
        index,
        interval,
        uiInterval,
        get time() { return currentTime; }
    };
}

// schließt den Video-Dialog und speichert die Zeit
export async function closeVideoDialog() {
    const dlg = document.getElementById('videoPlayerDialog');
    if (!dlg) return;
    if (dlg.__closing) return;
    dlg.__closing = true;
    if (dlg.open) dlg.close();
    if (dlg.__playerKey) { document.removeEventListener('keydown', dlg.__playerKey); dlg.__playerKey = null; }
    document.getElementById('videoPlayerFrame').src = '';

    let exactTime;
    if (window.currentYT && typeof window.currentYT.getCurrentTime === 'function') {
        try { exactTime = window.currentYT.getCurrentTime(); } catch(e) {}
    }
    if (window.currentYT && window.currentYT.destroy) { window.currentYT.destroy(); }
    window.currentYT = null;

    if (window.__ytPlayerState) {
        clearInterval(window.__ytPlayerState.interval);
        if (window.__ytPlayerState.uiInterval) clearInterval(window.__ytPlayerState.uiInterval);
        const { bookmark, index, time } = window.__ytPlayerState;
        bookmark.time = (typeof exactTime === 'number') ? exactTime : time;
        const list = await window.videoApi.loadBookmarks();
        if (list[index]) {
            list[index] = bookmark;
            await window.videoApi.saveBookmarks(list);
        }
        window.__ytPlayerState = null;
    }
    dlg.__closing = false;
}

// blendet den Player wieder aus
// blendet den Player wieder aus und speichert die letzte Position
export async function closePlayer() {
    const div = document.getElementById('ytPlayerBox');
    if (!div) return;
    div.style.display = 'none';
    div.innerHTML = '';
    // vor dem Zerstören die exakte Abspielzeit sichern, falls möglich
    let exactTime;
    if (window.currentYT && typeof window.currentYT.getCurrentTime === 'function') {
        try {
            exactTime = window.currentYT.getCurrentTime();
        } catch (e) {
            // ignorieren und später auf time zurückfallen
        }
    }

    if (window.currentYT && window.currentYT.destroy) {
        window.currentYT.destroy();
    }
    window.currentYT = null;

    if (window.__ytPlayerState) {
        clearInterval(window.__ytPlayerState.interval);
        if (window.__ytPlayerState.uiInterval) clearInterval(window.__ytPlayerState.uiInterval);
        const { bookmark, index, time } = window.__ytPlayerState;
        // falls vorhanden, verwende die exakte Zeit des Players
        bookmark.time = (typeof exactTime === 'number') ? exactTime : time;
        const list = await window.videoApi.loadBookmarks();
        list[index] = bookmark;
        await window.videoApi.saveBookmarks(list);
        window.__ytPlayerState = null;
    }
}

// Node-kompatibler Export für Tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openPlayer,
        closePlayer,
        extractYoutubeId,
        openVideoDialog,
        closeVideoDialog
    };
}
