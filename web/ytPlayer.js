// Steuert den eingebetteten YouTube-Player
// OCR-Unterstützung wird dynamisch nachgeladen

// extrahiert die Video-ID aus einer YouTube-URL
export function extractYoutubeId(url) {
    const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return m ? m[1] : '';
}

// ===== Globale OCR-Variablen =====
let ocrWorker = null;        // wird bei Bedarf angelegt
let ocrInterval = null;      // Intervall für Auto-OCR

// OCR-Worker initialisieren
async function initOcrWorker() {
    if (ocrWorker) return;
    const t = await import('tesseract.js');
    ocrWorker = t.createWorker();
    await ocrWorker.load();
    await ocrWorker.loadLanguage('eng');
    await ocrWorker.initialize('eng');
}

// beendet Worker und Intervall
function terminateOcr() {
    if (ocrInterval) { clearInterval(ocrInterval); ocrInterval = null; }
    if (ocrWorker) { ocrWorker.terminate(); ocrWorker = null; }
}

// Screenshot des Overlays erstellen und per OCR auswerten
async function captureAndOcr() {
    try {
        await initOcrWorker();
        let bitmap;
        if (window.desktopCapturer) {
            const src = (await window.desktopCapturer.getSources({ types: ['screen'] }))[0];
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: src.id } }
            });
            const track = stream.getVideoTracks()[0];
            const capture = new ImageCapture(track);
            bitmap = await capture.grabFrame();
            track.stop();
        } else if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const track = stream.getVideoTracks()[0];
            const capture = new ImageCapture(track);
            bitmap = await capture.grabFrame();
            track.stop();
        } else {
            return false;
        }

        const h = Math.floor(bitmap.height * 0.2);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, bitmap.height - h, canvas.width, h, 0, 0, canvas.width, h);
        const { data: { text } } = await ocrWorker.recognize(canvas);
        const txt = text.trim();
        if (txt) {
            const area = document.getElementById('ocrText');
            if (area) {
                area.value += (area.value ? '\n' : '') + txt;
                area.scrollTop = area.scrollHeight;
                area.style.background = 'yellow';
                setTimeout(() => { area.style.background = ''; }, 500);
            }
            if (window.currentYT && window.currentYT.getPlayerState && window.currentYT.getPlayerState() === YT.PlayerState.PLAYING) {
                window.currentYT.pauseVideo();
            }
            return true;
        }
    } catch (e) {
        console.error('OCR-Fehler', e);
    }
    return false;
}

function startAutoOcr() {
    if (ocrInterval) return;
    ocrInterval = setInterval(async () => {
        const hit = await captureAndOcr();
        if (hit) stopAutoOcr();
    }, 1500);
}

function stopAutoOcr() {
    if (ocrInterval) { clearInterval(ocrInterval); ocrInterval = null; }
}

// veraltete Funktion – ruft intern den neuen Dialog auf
export function openPlayer(bookmark, index) {
    console.warn('openPlayer ist veraltet und ruft nun openVideoDialog auf');
    openVideoDialog(bookmark, index);
}

// öffnet einen modalen Dialog mit YouTube-Player
export function openVideoDialog(bookmark, index) {
    const dlg    = document.getElementById('videoMgrDialog');
    const player = document.getElementById('videoPlayerSection');
    if (!dlg || !player) return;
    if (!dlg.open) dlg.showModal();

    player.classList.remove('hidden');
    // gleich nach dem Einblenden neu skalieren
    if (typeof window.adjustVideoPlayerSize === 'function') {
        window.adjustVideoPlayerSize(true);
    }
    player.dataset.index = index;
    player.querySelector('#playerDialogTitle').textContent = bookmark.title;

    // alten Player sauber entfernen, damit das IFrame neu erstellt werden kann
    if (window.currentYT && window.currentYT.destroy) {
        window.currentYT.destroy();
    }

    // IFrame ggf. neu anlegen, falls es durch destroy() verschwunden ist
    let iframe = document.getElementById('videoPlayerFrame');
    if (!iframe || iframe.tagName !== 'IFRAME') {
        if (iframe) iframe.remove();
        const controls = player.querySelector('.player-controls');
        iframe = document.createElement('iframe');
        iframe.id = 'videoPlayerFrame';
        iframe.setAttribute('allow', 'autoplay; fullscreen');
        player.insertBefore(iframe, controls);
    }

    // neue URL setzen und Player initialisieren
    iframe.src = `https://www.youtube.com/embed/${extractYoutubeId(bookmark.url)}?start=${Math.floor(bookmark.time)}&enablejsapi=1`;
    window.currentYT = new YT.Player('videoPlayerFrame');

    const slider = document.getElementById('videoSlider');
    const cur = document.getElementById('videoCurrent');
    const dur = document.getElementById('videoDuration');
    const playBtn = document.getElementById('videoPlay');
    const backBtn = document.getElementById('videoBack');
    const fwdBtn = document.getElementById('videoForward');
    const reloadBtn = document.getElementById('videoReload');
    const ocrBtn = document.getElementById('ocrToggle');
    const ocrOverlay = document.getElementById('ocrOverlay');
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
            if (ocrBtn && ocrBtn.classList.contains('active')) startAutoOcr();
        } else {
            window.currentYT.pauseVideo();
            stopAutoOcr();
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
    if (ocrBtn) {
        ocrBtn.onclick = () => {
            ocrBtn.classList.toggle('active');
            player.classList.toggle('ocr-active', ocrBtn.classList.contains('active'));
            if (ocrBtn.classList.contains('active')) {
                startAutoOcr();
            } else {
                stopAutoOcr();
            }
        };
    }
    // Lösch-Button ruft nun die neue Funktion auf
    deleteBtn.onclick = deleteCurrentVideo;
    closeBtn.onclick = closeVideoDialog;



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

    if (typeof window.adjustVideoDialogHeight === 'function') {
        window.adjustVideoDialogHeight();
    }
    if (typeof window.adjustVideoPlayerSize === 'function') {
        // beim Öffnen sofort skalieren
        window.adjustVideoPlayerSize(true);
    }
    // zwei Layout-Ticks warten und erneut anpassen
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            if (typeof window.adjustVideoPlayerSize === 'function') {
                window.adjustVideoPlayerSize(true);
            }
        });
    });
}

// schließt den Video-Dialog und speichert die Zeit
export async function closeVideoDialog() {
    const dlg    = document.getElementById('videoMgrDialog');
    const player = document.getElementById('videoPlayerSection');
    if (!dlg || !player) return;
    if (dlg.__closing) return;
    dlg.__closing = true;
    player.classList.add('hidden');
    const frame = document.getElementById('videoPlayerFrame');
    if (frame) frame.src = '';
    const ocrBtn = document.getElementById('ocrToggle');
    if (ocrBtn) ocrBtn.classList.remove('active');
    player.classList.remove('ocr-active');
    terminateOcr();

    let exactTime;
    if (window.currentYT && typeof window.currentYT.getCurrentTime === 'function') {
        try { exactTime = window.currentYT.getCurrentTime(); } catch(e) {}
    }
    if (window.currentYT && window.currentYT.destroy) { window.currentYT.destroy(); }
    window.currentYT = null;

    // Wenn das IFrame durch destroy() entfernt wurde, neu anlegen
    if (!document.getElementById('videoPlayerFrame')) {
        const controls = player.querySelector('.player-controls');
        const nf = document.createElement('iframe');
        nf.id = 'videoPlayerFrame';
        nf.setAttribute('allow', 'autoplay; fullscreen');
        player.insertBefore(nf, controls);
    }

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

    if (typeof window.adjustVideoDialogHeight === 'function') {
        window.adjustVideoDialogHeight();
    }
    if (typeof window.adjustVideoPlayerSize === 'function') {
        // auch im geschlossenen Zustand Größe neu berechnen
        window.adjustVideoPlayerSize(true);
    }
}

// löscht das aktuell geöffnete Video aus der Bookmark-Liste
export async function deleteCurrentVideo() {
    if (!window.__ytPlayerState) return;
    if (!confirm('Wirklich löschen?')) return;
    const { index } = window.__ytPlayerState;
    const list = await window.videoApi.loadBookmarks();
    list.splice(index, 1);
    await window.videoApi.saveBookmarks(list);
    // verhindert erneutes Speichern des gelöschten Eintrags
    window.__ytPlayerState.index = -1;
    closeVideoDialog();
    if (window.refreshTable) window.refreshTable();
}

// veraltete Funktion – ruft intern den neuen Dialog zu
// und gibt weiterhin ein Promise zurück
export async function closePlayer() {
    console.warn('closePlayer ist veraltet und ruft nun closeVideoDialog auf');
    await closeVideoDialog();
}

// globaler Keydown-Listener für den Video-Dialog
document.addEventListener('keydown', e => {
    const dlg    = document.getElementById('videoMgrDialog');
    const player = document.getElementById('videoPlayerSection');
    if (!dlg || !dlg.open || !player || player.classList.contains('hidden')) return;
    const playBtn = document.getElementById('videoPlay');
    const backBtn = document.getElementById('videoBack');
    const fwdBtn  = document.getElementById('videoForward');
    if (e.key === 'Escape') {
        e.preventDefault();
        closeVideoDialog();
    }
    if (e.key === ' ') {
        e.preventDefault();
        if (playBtn) playBtn.click();
    }
    if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (backBtn) backBtn.click();
    }
    if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (fwdBtn) fwdBtn.click();
    }
    if (e.key === 'F9') {
        e.preventDefault();
        captureAndOcr();
    }
});

// Node-kompatibler Export für Tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openPlayer,
        closePlayer,
        extractYoutubeId,
        openVideoDialog,
        closeVideoDialog,
        deleteCurrentVideo
    };
}
