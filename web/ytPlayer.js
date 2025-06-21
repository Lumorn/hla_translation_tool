// Steuert den eingebetteten YouTube-Player
// OCR-Unterstützung wird dynamisch nachgeladen

// extrahiert die Video-ID aus einer YouTube-URL
export function extractYoutubeId(url) {
    const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
    return m ? m[1] : '';
}

// ===== Globale OCR-Variablen =====
let ocrWorker = null;        // wird bei Bedarf angelegt
let autoLoop = null;         // Intervall für Auto-OCR
let ocrActive = false;       // aktueller Status
let ocrWindow = null;        // separates Fenster für erkannte Texte

// Overlay an die Größe des IFrames anpassen
function positionOverlay() {
    const section  = document.getElementById('videoPlayerSection');
    const iframe   = document.getElementById('videoPlayerFrame');
    const overlay  = document.getElementById('ocrOverlay');
    const controls = section?.querySelector('.player-controls');
    if (!section || !iframe || !overlay) return;
    const iframeRect = iframe.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();
    const ctrlH = controls ? controls.offsetHeight : 0;
    const oH = iframeRect.height * 0.18;
    // Top relativ zum Player-Abschnitt berechnen
    const top = iframeRect.bottom - oH - ctrlH - sectionRect.top;
    overlay.style.top    = top + 'px';
    overlay.style.left   = (iframeRect.left - sectionRect.left) + 'px';
    overlay.style.width  = iframeRect.width + 'px';
    overlay.style.height = oH + 'px';
}

// OCR-Worker initialisieren
async function initOcrWorker() {
    if (ocrWorker) return true;
    try {
        // tesseract.js wird lokal geladen, damit die OCR auch ohne Internet funktioniert
        // Modul laden und createWorker extrahieren (Default- oder Named-Export)
        const mod = await import('./src/lib/tesseract.esm.min.js');
        // createWorker kann je nach Build an unterschiedlichen Stellen liegen
        const createWorker = mod.createWorker || mod.default?.createWorker;
        if (typeof createWorker !== 'function') {
            throw new Error('createWorker nicht gefunden');
        }
        // Worker-Pfad absolut aufloesen, damit er auch in Electron korrekt
        // gefunden wird und keine externen Skripte benoetigt werden
        const workerUrl = new URL('./src/lib/tesseract-worker.min.js', window.location.href).href;
        ocrWorker = await createWorker({ workerPath: workerUrl });
        // einige Builds liefern ein Promise zurück
        if (typeof ocrWorker.then === 'function') {
            ocrWorker = await ocrWorker;
        }
        // aktuelle Worker sind direkt einsatzbereit, der Ladeschritt entfällt
        if (typeof ocrWorker.loadLanguage !== 'function' || typeof ocrWorker.initialize !== 'function') {
            throw new Error('Ungültiges Worker-Objekt');
        }
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
    if (autoLoop) { clearInterval(autoLoop); autoLoop = null; }
    if (ocrWorker) { ocrWorker.terminate(); ocrWorker = null; }
}
window.positionOverlay = positionOverlay;

// Screenshot des Overlays erstellen und per OCR auswerten
async function captureAndOcr() {
    try {
        const ok = await initOcrWorker();
        if (!ok) return '';
        const iframe = document.getElementById('videoPlayerFrame');
        if (!iframe) return '';

        const dpr = window.devicePixelRatio || 1;
        const rect = iframe.getBoundingClientRect();
        const bounds = {
            x: Math.round(rect.left * dpr),
            y: Math.round(rect.top * dpr),
            width: Math.round(rect.width * dpr),
            height: Math.round(rect.height * dpr)
        };

        // Screenshot des IFrames vom Hauptfenster anfordern
        const png = await window.api.captureFrame(bounds);
        if (!png) return '';
        const blob = new Blob([png], { type: 'image/png' });
        const bitmap = await createImageBitmap(blob);

        const overlay = document.getElementById('ocrOverlay');
        const orect = overlay ? overlay.getBoundingClientRect() : rect;

        const cropX = (orect.left - rect.left) * dpr;
        const cropY = (orect.top  - rect.top ) * dpr;
        const cropW = orect.width  * dpr;
        const cropH = orect.height * dpr;

        const canvas = document.createElement('canvas');
        canvas.width = cropW;
        canvas.height = cropH;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        const { data: { text } } = await ocrWorker.recognize(canvas);
        console.log('OCR-Text:', text);
        return text.trim();
    } catch (e) {
        console.error('OCR-Fehler', e);
    }
    return '';
}

// Haengt Text im Ergebnis-Panel an
function appendText(t) {
    const area = document.getElementById('ocrText');
    if (!area) return;
    area.textContent += (area.textContent ? '\n' : '') + t;
    area.scrollTop = area.scrollHeight;
}

// Öffnet ein neues Fenster und zeigt den erkannten Text an
function showOcrWindow(text) {
    // bereits geöffnetes Fenster wiederverwenden
    if (!ocrWindow || ocrWindow.closed) {
        ocrWindow = window.open('', '_blank', 'width=600,height=400');
        if (!ocrWindow) return;
        ocrWindow.document.title = 'OCR-Ergebnis';
    }
    ocrWindow.document.body.innerHTML = '';
    const pre = ocrWindow.document.createElement('pre');
    pre.textContent = text;
    ocrWindow.document.body.appendChild(pre);
}

// Fuehrt einen OCR-Durchlauf aus und verarbeitet das Ergebnis
async function runOcr() {
    const text = await captureAndOcr();
    if (!text) return;
    appendText(text);
    showOcrWindow(text);
    // Treffer markieren und Benutzer informieren
    const btn = document.getElementById('ocrToggle');
    if (btn) {
        btn.title = 'Treffer erkannt – Video pausiert';
        btn.classList.add('blink');
        setTimeout(() => btn.classList.remove('blink'), 1000);
    }
    if (window.currentYT && window.currentYT.pauseVideo) {
        window.currentYT.pauseVideo();
    }
    stopAutoLoop(true);
}


function startAutoLoop() {
    if (autoLoop) return;
    const dlg  = document.getElementById('videoMgrDialog');
    const btn  = document.getElementById('ocrToggle');
    const area = document.getElementById('ocrText');
    if (!dlg || !dlg.open || !btn || !area || !btn.classList.contains('active')) return;
    if (typeof window.positionOverlay === 'function') {
        window.positionOverlay();
    }
    // visuelles Feedback fuer laufende Erkennung
    btn.title = 'Auto-OCR aktiv';
    autoLoop = setInterval(runOcr, 1500);
}

function stopAutoLoop(keepBlink = false) {
    if (autoLoop) { clearInterval(autoLoop); autoLoop = null; }
    const btn = document.getElementById('ocrToggle');
    if (btn) {
        // Blink-Effekt optional beibehalten
        if (!keepBlink) btn.classList.remove('blink');
        btn.title = 'OCR an/aus (F9)';
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
    if (typeof window.positionOverlay === 'function') {
        window.positionOverlay();
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
    const ocrPanel = document.getElementById('ocrResultPanel');
    const deleteBtn = document.getElementById('videoDelete');
    const closeBtn = document.getElementById('videoClose');

    if (ocrBtn) {
        // Standardzustand ohne aktive OCR
        ocrBtn.title = 'OCR aktivieren (F9)';
        ocrBtn.classList.remove('active');
    }
    player.classList.remove('ocr-active');
    if (ocrOverlay) ocrOverlay.classList.add('hidden');
    if (ocrPanel) ocrPanel.classList.add('hidden');

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
                stopAutoLoop(); // eventuell laufenden Blink beenden
                startAutoLoop();
            }
        } else {
            window.currentYT.pauseVideo();
            stopAutoLoop();
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
            const active = ocrBtn.classList.contains('active');
            player.classList.toggle('ocr-active', active);
            if (ocrOverlay) {
                ocrOverlay.classList.toggle('hidden', !active);
            }
            if (ocrPanel) {
                ocrPanel.classList.toggle('hidden', !active);
            }
            if (active) {
                ocrBtn.title = 'OCR an/aus (F9)';
                startAutoLoop();
            } else {
                stopAutoLoop();
                terminateOcr();
                ocrBtn.title = 'OCR an/aus (F9)';
            }
            if (typeof window.adjustVideoPlayerSize === 'function') {
                window.adjustVideoPlayerSize(true);
            }
            if (typeof window.positionOverlay === 'function') {
                window.positionOverlay();
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
        if (typeof window.positionOverlay === 'function') {
            window.positionOverlay();
        }
    }
    // zwei Layout-Ticks warten und erneut anpassen
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            if (typeof window.adjustVideoPlayerSize === 'function') {
                window.adjustVideoPlayerSize(true);
                if (typeof window.positionOverlay === 'function') {
                    window.positionOverlay();
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
    const ocrOverlay = document.getElementById('ocrOverlay');
    const ocrPanel = document.getElementById('ocrResultPanel');
    if (ocrBtn) ocrBtn.classList.remove('active');
    if (ocrOverlay) ocrOverlay.classList.add('hidden');
    if (ocrPanel) ocrPanel.classList.add('hidden');
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
