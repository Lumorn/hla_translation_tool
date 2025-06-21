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

// Overlay an die Groesse des IFrames anpassen
function updateOcrOverlay() {
    const section = document.getElementById('videoPlayerSection');
    const iframe  = document.getElementById('videoPlayerFrame');
    const overlay = document.getElementById('ocrOverlay');
    if (!section || !iframe || !overlay) return;
    const rect  = iframe.getBoundingClientRect();
    const prect = section.getBoundingClientRect();
    const controls = section.querySelector('.player-controls');

    // Unterer Rand des Overlays soll nicht in die Buttons ragen
    const bottom = controls ? controls.offsetTop : rect.height;
    const oH = rect.height * 0.20;
    const oTop = bottom - oH;

    overlay.style.left   = (rect.left - prect.left) + 'px';
    overlay.style.top    = (oTop - prect.top) + 'px';
    overlay.style.width  = rect.width + 'px';
    overlay.style.height = oH + 'px';
}

// OCR-Worker initialisieren
async function initOcrWorker() {
    if (ocrWorker) return true;
    try {
        const t = await import('tesseract.js');
        ocrWorker = t.createWorker();
        await ocrWorker.load();
        await ocrWorker.loadLanguage('eng');
        await ocrWorker.initialize('eng');
        return true;
    } catch (e) {
        console.error('Worker-Init fehlgeschlagen', e);
        const btn = document.getElementById('ocrToggle');
        if (btn) btn.title = 'OCR nicht verfügbar';
        ocrWorker = null;
        return false;
    }
}

// beendet Worker und Intervall
function terminateOcr() {
    if (ocrInterval) { clearInterval(ocrInterval); ocrInterval = null; }
    if (ocrWorker) { ocrWorker.terminate(); ocrWorker = null; }
}
window.updateOcrOverlay = updateOcrOverlay;

// Screenshot des Overlays erstellen und per OCR auswerten
async function captureAndOcr() {
    try {
        const ok = await initOcrWorker();
        if (!ok) return false;
        const iframe = document.getElementById('videoPlayerFrame');
        if (!iframe) return false;
        let bitmap;
        let fromFrame = false;

        try {
            const stream = iframe.contentWindow.document.documentElement.captureStream();
            const track = stream.getVideoTracks()[0];
            const capture = new ImageCapture(track);
            bitmap = await capture.grabFrame();
            track.stop();
            fromFrame = true;
        } catch(e) {}

        if (!fromFrame) {
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
                try {
                    const vid = iframe.contentWindow.document.querySelector('video');
                    if (vid) {
                        const c = document.createElement('canvas');
                        const dpr = window.devicePixelRatio || 1;
                        c.width  = vid.videoWidth * dpr;
                        c.height = vid.videoHeight * dpr;
                        c.getContext('2d').drawImage(vid, 0, 0, c.width, c.height);
                        bitmap = c;
                    } else {
                        return false;
                    }
                } catch(err) {
                    return false;
                }
            }
        }

        const overlay = document.getElementById('ocrOverlay');
        const rect = iframe.getBoundingClientRect();
        const orect = overlay ? overlay.getBoundingClientRect() : rect;
        const dpr = window.devicePixelRatio || 1;

        // Skalierung zwischen Screenshot und sichtbarem Bereich berechnen
        const scaleX = bitmap.width / (fromFrame ? rect.width * dpr : window.innerWidth * dpr);
        const scaleY = bitmap.height / (fromFrame ? rect.height * dpr : window.innerHeight * dpr);

        const baseX = fromFrame ? (orect.left - rect.left) : orect.left;
        const baseY = fromFrame ? (orect.top  - rect.top ) : orect.top;
        const cropX = baseX * dpr * scaleX;
        const cropY = baseY * dpr * scaleY;
        const cropW = orect.width  * dpr * scaleX;
        const cropH = orect.height * dpr * scaleY;

        const canvas = document.createElement('canvas');
        canvas.width = cropW;
        canvas.height = cropH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        const { data: { text } } = await ocrWorker.recognize(canvas);
        console.log(text);
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
            stopAutoOcr();
            return true;
        }
    } catch (e) {
        console.error('OCR-Fehler', e);
    }
    return false;
}

function startAutoOcr() {
    if (ocrInterval) return;
    const dlg  = document.getElementById('videoMgrDialog');
    const btn  = document.getElementById('ocrToggle');
    const area = document.getElementById('ocrText');
    if (!dlg || !dlg.open || !btn || !area || !btn.classList.contains('active')) return;
    if (typeof window.updateOcrOverlay === 'function') {
        window.updateOcrOverlay();
    }
    ocrInterval = setInterval(async () => {
        const hit = await captureAndOcr();
        if (hit) {
            btn.classList.add('blink');
            btn.title = 'Treffer erkannt – Video pausiert';
            stopAutoOcr();
        }
    }, 1500);
}

function stopAutoOcr() {
    if (ocrInterval) { clearInterval(ocrInterval); ocrInterval = null; }
    const btn = document.getElementById('ocrToggle');
    if (btn) {
        btn.classList.remove('blink');
        btn.title = btn.classList.contains('active')
            ? 'OCR aktiv (F9), erneut klicken zum Deaktivieren'
            : 'OCR aktivieren (F9)';
    }
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
    if (typeof window.updateOcrOverlay === 'function') {
        window.updateOcrOverlay();
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

    if (ocrBtn) {
        ocrBtn.title = 'OCR aktivieren (F9)';
    }

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
            if (ocrBtn && ocrBtn.classList.contains('active')) {
                stopAutoOcr(); // eventuell laufenden Blink beenden
                startAutoOcr();
            }
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
                ocrBtn.title = 'OCR aktiv (F9), erneut klicken zum Deaktivieren';
                startAutoOcr();
            } else {
                stopAutoOcr();
                terminateOcr();
                ocrBtn.title = 'OCR aktivieren (F9)';
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
        if (typeof window.updateOcrOverlay === 'function') {
            window.updateOcrOverlay();
        }
    }
    // zwei Layout-Ticks warten und erneut anpassen
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            if (typeof window.adjustVideoPlayerSize === 'function') {
                window.adjustVideoPlayerSize(true);
                if (typeof window.updateOcrOverlay === 'function') {
                    window.updateOcrOverlay();
                }
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
        const btn = document.getElementById('ocrToggle');
        if (btn) {
            btn.click();
        }
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
