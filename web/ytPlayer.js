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
let ocrActive = false;       // Toggle-Status
let ocrPaused = false;       // wurde nach einem Treffer pausiert?
let ocrWindow = null;        // separates Fenster für erkannte Texte
let ocrDebug  = false;       // zeigt das Debug-Fenster mit Screenshot
// Einstellungen zur Bildaufbereitung
let ocrSettings = loadOcrSettings();

// kleine Hilfsfunktion zum Entprellen von Events
function debounce(fn, ms) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

// Overlay an die Größe des IFrames anpassen
// prueft die Helligkeit des potenziellen Textbereichs
async function pruefeHelligkeit(bitmap, roi, frameH) {
    const canvas = document.createElement('canvas');
    // fruehzeitig abbrechen, falls der Bereich keine gueltige Groesse besitzt
    if (roi.width <= 0 || roi.height <= 0) return 0;
    const tmpW = 32;                              // kleines Hilfs-Canvas für schnelle Analyse
    const tmpH = Math.max(1, Math.round(tmpW * roi.height / Math.max(1, roi.width)));
    canvas.width = tmpW;
    canvas.height = tmpH;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, roi.x, roi.y, roi.width, roi.height, 0, 0, tmpW, tmpH);
    const data = ctx.getImageData(0, 0, tmpW, tmpH).data;
    let bright = 0;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] + data[i + 1] + data[i + 2] > 600) bright++;
    }
    // Wird der Schwellenwert nicht erreicht, pruefen wir 2 % hoeher bzw. tiefer
    if (bright < 20) {
        const off = Math.round(frameH * 0.02);
        ctx.clearRect(0, 0, tmpW, tmpH);
        ctx.drawImage(bitmap, roi.x, roi.y - off, roi.width, roi.height, 0, 0, tmpW, tmpH);
        const upData = ctx.getImageData(0, 0, tmpW, tmpH).data;
        let upBright = 0;
        for (let i = 0; i < upData.length; i += 4) {
            if (upData[i] + upData[i + 1] + upData[i + 2] > 600) upBright++;
        }
        ctx.clearRect(0, 0, tmpW, tmpH);
        ctx.drawImage(bitmap, roi.x, roi.y + off, roi.width, roi.height, 0, 0, tmpW, tmpH);
        const downData = ctx.getImageData(0, 0, tmpW, tmpH).data;
        let downBright = 0;
        for (let i = 0; i < downData.length; i += 4) {
            if (downData[i] + downData[i + 1] + downData[i + 2] > 600) downBright++;
        }
        if (upBright > bright && upBright >= downBright) return -off;
        if (downBright > bright) return off;
    }
    return 0;
}

// prueft, ob im angegebenen Bereich ausreichend helle Pixel vorhanden sind
function roiHasText(bitmap, roi) {
    const c = document.createElement('canvas');
    const tmpW = 32;
    const tmpH = Math.max(1, Math.round(tmpW * roi.height / Math.max(1, roi.width)));
    c.width = tmpW;
    c.height = tmpH;
    const ctx = c.getContext('2d');
    ctx.drawImage(bitmap, roi.x, roi.y, roi.width, roi.height, 0, 0, tmpW, tmpH);
    const data = ctx.getImageData(0, 0, tmpW, tmpH).data;
    let bright = 0;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] + data[i + 1] + data[i + 2] > 600) bright++;
    }
    return bright >= 20;
}

// merkt sich die letzte Position des Overlays (in Prozent)
const OVERLAY_KEY = 'hla_ocrOverlayRect';

function ladeOverlaySettings() {
    try {
        return JSON.parse(localStorage.getItem(OVERLAY_KEY));
    } catch {
        return null;
    }
}

function speichereOverlaySettings(rect) {
    try { localStorage.setItem(OVERLAY_KEY, JSON.stringify(rect)); } catch {}
}

// speichert die Einstellungen zur Bildverarbeitung
const SETTINGS_KEY = 'hla_ocrImageSettings';
function loadOcrSettings() {
    try {
        return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {
            invert: false,
            brightness: 100,
            contrast: 150,
            sharpen: false,
            threshold: 140,
            psm: '3',
            whitelist: ''
        };
    } catch {
        return {
            invert: false,
            brightness: 100,
            contrast: 150,
            sharpen: false,
            threshold: 140,
            psm: '3',
            whitelist: ''
        };
    }
}
function saveOcrSettings(cfg) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(cfg)); } catch {}
}

// erlaubt Verschieben und Skalieren des Overlays mit der Maus
function initOverlayDrag() {
    const overlay = document.getElementById('ocrOverlay');
    if (!overlay || overlay.__dragInit) return;
    overlay.__dragInit = true;

    let mode = null;
    let startX = 0, startY = 0;
    let startRect = null;

    overlay.addEventListener('pointerdown', e => {
        const rect = overlay.getBoundingClientRect();
        const edge = 8;
        startX = e.clientX;
        startY = e.clientY;
        startRect = {
            left: parseFloat(overlay.style.left) || 0,
            top: parseFloat(overlay.style.top) || 0,
            width: parseFloat(overlay.style.width) || rect.width,
            height: parseFloat(overlay.style.height) || rect.height
        };
        const offX = e.clientX - rect.left;
        const offY = e.clientY - rect.top;
        mode = (offX > rect.width - edge && offY > rect.height - edge) ? 'resize' : 'move';
        overlay.classList.toggle('resizing', mode === 'resize');
        overlay.setPointerCapture(e.pointerId);
    });

    overlay.addEventListener('pointermove', e => {
        if (!mode) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (mode === 'move') {
            overlay.style.left = startRect.left + dx + 'px';
            overlay.style.top  = startRect.top  + dy + 'px';
        } else {
            overlay.style.width  = Math.max(30, startRect.width  + dx) + 'px';
            overlay.style.height = Math.max(20, startRect.height + dy) + 'px';
        }
    });

    function finish(e) {
        if (!mode) return;
        overlay.releasePointerCapture(e.pointerId);
        overlay.classList.remove('resizing');
        mode = null;
        const iframe = document.getElementById('videoPlayerFrame');
        if (!iframe) return;
        const iframeRect = iframe.getBoundingClientRect();
        const oRect = overlay.getBoundingClientRect();
        if (iframeRect.width > 0 && iframeRect.height > 0) {
            const saved = {
                left: (oRect.left - iframeRect.left) / iframeRect.width,
                top:  (oRect.top  - iframeRect.top ) / iframeRect.height,
                width:  oRect.width  / iframeRect.width,
                height: oRect.height / iframeRect.height
            };
            speichereOverlaySettings(saved);
        }
    }
    overlay.addEventListener('pointerup', finish);
    overlay.addEventListener('pointercancel', finish);
}

// Overlay an die Größe des IFrames anpassen und Helligkeit pruefen
async function positionOverlay() {
    const section  = document.getElementById('videoPlayerSection');
    const iframe   = document.getElementById('videoPlayerFrame');
    const overlay  = document.getElementById('ocrOverlay');
    const controls = section?.querySelector('.player-controls');
    if (!section || !iframe || !overlay) return;
    const iframeRect = iframe.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();
    const saved = ladeOverlaySettings();
    if (saved) {
        overlay.style.left   = (iframeRect.left - sectionRect.left + saved.left * iframeRect.width) + 'px';
        overlay.style.top    = (iframeRect.top  - sectionRect.top  + saved.top  * iframeRect.height) + 'px';
        overlay.style.width  = (saved.width  * iframeRect.width) + 'px';
        overlay.style.height = (saved.height * iframeRect.height) + 'px';
        return;
    }
    const ctrlH = controls ? controls.offsetHeight : 0;
    const slider = controls?.querySelector('#videoSlider');
    const sliderTop = slider ? slider.getBoundingClientRect().top : iframeRect.bottom - ctrlH;
    const oH = iframeRect.height * 0.12;
    // Oberkante leicht absenken, damit das YouTube-Overlay frei bleibt
    // zwei Pixel zusaetzlich, damit "Weitere Videos" nicht ueberdeckt wird
    const top = sliderTop + 3 - oH - sectionRect.top;
    overlay.style.top    = top + 'px';
    overlay.style.left   = (iframeRect.left - sectionRect.left) + 'px';
    overlay.style.width  = iframeRect.width + 'px';
    overlay.style.height = oH + 'px';

    try {
        const dpr = window.devicePixelRatio || 1;
        const bounds = {
            x: Math.round(iframeRect.left * dpr),
            y: Math.round(iframeRect.top * dpr),
            width: Math.round(iframeRect.width * dpr),
            height: Math.round(iframeRect.height * dpr)
        };
        const png = await window.api.captureFrame(bounds);
        if (png) {
            const blob = new Blob([png], { type: 'image/png' });
            const bmp = await createImageBitmap(blob);
            const oRect = overlay.getBoundingClientRect();
            const roi = {
                x: (oRect.left - iframeRect.left) * dpr,
                y: (oRect.top - iframeRect.top) * dpr,
                width: oRect.width * dpr,
                height: oRect.height * dpr
            };
            const diff = await pruefeHelligkeit(bmp, roi, iframeRect.height * dpr);
            if (diff) {
                overlay.style.top = (parseFloat(overlay.style.top) + diff / dpr) + 'px';
            }
        }
    } catch(e) { console.error('Helligkeitspruefung fehlgeschlagen', e); }
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
        const coreUrl   = new URL('./src/lib/tesseract-core-simd.wasm.js', window.location.href).href;
        // Worker mit lokalem corePath starten, damit keine externen Ressourcen geladen werden
        ocrWorker = await createWorker({ workerPath: workerUrl, corePath: coreUrl });
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
        await ocrWorker.setParameters({
            preserve_interword_spaces: '1',
            user_defined_dpi: '200'
        });
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
window.initOverlayDrag = initOverlayDrag;

// öffnet oder schließt den Einstell-Drawer für das OCR-Tuning
async function openOcrSettings() {
    const drawer = document.getElementById('ocrSettingsDrawer');
    if (!drawer) return;
    const open = drawer.classList.toggle('open');
    drawer.classList.toggle('hidden', !open);
    if (!open) return;

    const preview  = drawer.querySelector('#ocrPreview');
    const ctx      = preview.getContext('2d');
    const invert   = drawer.querySelector('#setInvert');
    const sharpen  = drawer.querySelector('#setSharpen');
    const bright   = drawer.querySelector('#setBright');
    const contrast = drawer.querySelector('#setContrast');
    const thresh   = drawer.querySelector('#setThreshold');
    const psm      = drawer.querySelector('#setPsm');
    const wlist    = drawer.querySelector('#setWhitelist');
    const result   = drawer.querySelector('#ocrResultPreview');
    const resetBtn = drawer.querySelector('#ocrReset');

    invert.checked   = ocrSettings.invert;
    sharpen.checked  = ocrSettings.sharpen;
    bright.value     = ocrSettings.brightness;
    contrast.value   = ocrSettings.contrast;
    thresh.value     = ocrSettings.threshold;
    psm.value        = ocrSettings.psm;
    wlist.value      = ocrSettings.whitelist;

    const debounced = debounce(async () => {
        saveOcrSettings(ocrSettings);
        const res = await captureAndOcr(ocrSettings);
        if (res.img) {
            const img = new Image();
            img.onload = () => { ctx.clearRect(0,0,preview.width,preview.height); ctx.drawImage(img,0,0,preview.width,preview.height); };
            img.src = res.img;
        }
        result.textContent = res.text || '';
        result.classList.remove('green','yellow','red');
        if (res.confidence < 40) result.classList.add('red');
        else if (res.confidence < 70) result.classList.add('yellow');
        else result.classList.add('green');
    }, 250);

    function updateSettings() {
        ocrSettings.invert    = invert.checked;
        ocrSettings.sharpen   = sharpen.checked;
        ocrSettings.brightness= Number(bright.value);
        ocrSettings.contrast  = Number(contrast.value);
        ocrSettings.threshold = Number(thresh.value);
        ocrSettings.psm       = psm.value;
        ocrSettings.whitelist = wlist.value;
        debounced();
    }

    invert.onchange = updateSettings;
    sharpen.onchange = updateSettings;
    bright.oninput = updateSettings;
    contrast.oninput = updateSettings;
    thresh.oninput = updateSettings;
    psm.onchange = updateSettings;
    wlist.oninput = updateSettings;
    resetBtn.onclick = () => {
        ocrSettings = {
            invert: false,
            brightness: 100,
            contrast: 150,
            sharpen: false,
            threshold: 140,
            psm: '3',
            whitelist: ''
        };
        openOcrSettings();
        openOcrSettings();
    };

    updateSettings();
}

window.openOcrSettings = openOcrSettings;

// bereitet den Screenshot im OffscreenCanvas für die OCR auf
// verarbeitet das Bild mit den aktuellen Einstellungen
// bereitet das Ergebnis für die Texterkennung vor
async function refineBlob(pngBlob, settings = ocrSettings) {
    const bmp = await createImageBitmap(pngBlob);
    const W = bmp.width * 2;
    const H = bmp.height * 2;
    const off = new OffscreenCanvas(W, H);
    const ctx = off.getContext('2d', { willReadFrequently: true });
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bmp, 0, 0, W, H);
    // Kontrast und Helligkeit nach Nutzerwunsch anpassen
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = `brightness(${settings.brightness}%) contrast(${settings.contrast}%)`;
    ctx.drawImage(off, 0, 0);
    // Farben optional invertieren
    if (settings.invert) {
        const invData = ctx.getImageData(0, 0, W, H);
        const inv = invData.data;
        for (let i = 0; i < inv.length; i += 4) {
            inv[i] = 255 - inv[i];
            inv[i + 1] = 255 - inv[i + 1];
            inv[i + 2] = 255 - inv[i + 2];
        }
        ctx.putImageData(invData, 0, 0);
    }
    // optional leicht schaerfen
    if (settings.sharpen) {
        const tmp = new OffscreenCanvas(W, H);
        const tctx = tmp.getContext('2d');
        tctx.drawImage(off, 0, 0);
        tctx.filter = 'blur(1px)';
        tctx.drawImage(off, 0, 0);
        ctx.globalCompositeOperation = 'overlay';
        ctx.drawImage(tmp, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
    }
    // entsaetten -> Graustufen
    const imgData = ctx.getImageData(0, 0, W, H);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
        const y = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        // harter Schwellwert zur Binarisierung
        const bw = y > settings.threshold ? 255 : 0;
        d[i] = d[i + 1] = d[i + 2] = bw;
    }
    ctx.putImageData(imgData, 0, 0);

    return off.convertToBlob({ type: 'image/png' });
}

// Screenshot des Overlays erstellen und per OCR auswerten
// erstellt einen Screenshot und führt die Texterkennung aus
async function captureAndOcr(settings = ocrSettings) {
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
        if (!png) return { text: '', img: null };
        const rawBlob = new Blob([png], { type: 'image/png' });
        // Screenshot verfeinern, um die Texterkennung zu verbessern
        const refinedBlob = await refineBlob(rawBlob, settings);
        const bitmap = await createImageBitmap(refinedBlob);

        const overlay = document.getElementById('ocrOverlay');
        const orect = overlay ? overlay.getBoundingClientRect() : rect;

        let cropX = (orect.left - rect.left) * dpr;
        let cropY = (orect.top  - rect.top ) * dpr;
        const cropW = orect.width  * dpr;
        const cropH = orect.height * dpr;

        // Helligkeit pruefen und ROI ggf. leicht verschieben
        const diff = await pruefeHelligkeit(bitmap, { x: cropX, y: cropY, width: cropW, height: cropH }, rect.height * dpr);
        if (diff) {
            cropY += diff;
            if (overlay) {
                overlay.style.top = (parseFloat(overlay.style.top) + diff / dpr) + 'px';
            }
        }
        // falls der Bereich zu dunkel ist, Durchlauf abbrechen
        if (!roiHasText(bitmap, { x: cropX, y: cropY, width: cropW, height: cropH })) {
            return { text: '', img: null };
        }

        const canvas = document.createElement('canvas');
        canvas.width = cropW;
        canvas.height = cropH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(bitmap, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        const imgUrl = ocrDebug ? canvas.toDataURL('image/png') : null;

        await ocrWorker.setParameters({
            tessedit_char_whitelist: settings.whitelist || '',
            tessedit_pageseg_mode: settings.psm || '3',
            preserve_interword_spaces: '1',
            user_defined_dpi: '200'
        });
        const { data: { text, confidence } } = await ocrWorker.recognize(canvas);
        console.log('OCR-Text:', text);
        return { text: text.trim(), img: imgUrl, confidence };
    } catch (e) {
        console.error('OCR-Fehler', e);
    }
    return { text: '', img: null };
}

// Haengt Text im Ergebnis-Panel an
function appendText(t) {
    const area = document.getElementById('ocrText');
    if (!area) return;
    area.textContent += (area.textContent ? '\n' : '') + t;
    area.scrollTop = area.scrollHeight;
}

// Öffnet ein neues Fenster und zeigt den erkannten Text an
// sendet Daten per postMessage an das Debug-Fenster
function sendDebugData(imgUrl, text) {
    if (!ocrWindow || ocrWindow.closed) return;
    ocrWindow.postMessage({ imgUrl, text }, '*');
}

// Fuehrt einen OCR-Durchlauf aus und verarbeitet das Ergebnis
async function runOcr() {
    if (!ocrActive) return; // nur wenn Toggle aktiv ist
    const result = await captureAndOcr();
    const text = result.text;
    const img  = result.img;
    const conf = result.confidence || 0;
    // Debug-Daten sofort uebermitteln
    if (ocrDebug) sendDebugData(img, text);
    // bei keinem Treffer das Intervall anhalten, CPU sparen
    if (!text) {
        stopAutoLoop();
        return;
    }
    if (text.length <= 3) {
        return;
    }
    appendText(text);
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
    ocrPaused = true;
    stopAutoLoop(true);
}


function startAutoLoop() {
    if (autoLoop) return;
    const dlg  = document.getElementById('videoMgrDialog');
    const btn  = document.getElementById('ocrToggle');
    const area = document.getElementById('ocrText');
    if (!dlg || !dlg.open || !btn || !area || !btn.classList.contains('active')) return;
    // nur starten, wenn das Video tatsaechlich laeuft
    if (!window.currentYT ||
        window.currentYT.getPlayerState() !== YT.PlayerState.PLAYING) {
        return;
    }
    ocrPaused = false;
    if (typeof window.positionOverlay === 'function') {
        window.positionOverlay();
    }
    // visuelles Feedback für laufende Erkennung
    btn.title = 'Auto-OCR aktiv';
    autoLoop = setInterval(runOcr, 1000); // maximal ein Durchlauf pro Sekunde
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
    const debugBtn = document.getElementById('ocrDebug');
    const settingsBtn = document.getElementById('ocrSettings');
    const ocrOverlay = document.getElementById('ocrOverlay');
    const ocrPanel = document.getElementById('ocrResultPanel');
    const deleteBtn = document.getElementById('videoDelete');
    const closeBtn = document.getElementById('videoClose');
    if (ocrOverlay) {
        initOverlayDrag();
    }

    if (ocrBtn) {
        // Standardzustand ohne aktive OCR
        ocrBtn.title = 'OCR aktivieren (F9)';
        ocrBtn.classList.remove('active');
    }
    ocrActive = false;
    ocrPaused = false;
    player.classList.remove('ocr-active');
    if (ocrOverlay) ocrOverlay.classList.add('hidden');
    if (ocrPanel) ocrPanel.classList.add('hidden');
    if (debugBtn) {
        debugBtn.classList.remove('active');
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
                stopAutoLoop(); // eventuell laufenden Blink beenden
                startAutoLoop();
            }
            ocrPaused = false;
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
            ocrActive = active;
            ocrPaused = false;
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
    if (debugBtn) {
        debugBtn.onclick = () => {
            // Schalterzustand wechseln
            debugBtn.classList.toggle('active');
            ocrDebug = debugBtn.classList.contains('active');
            if (ocrDebug) {
                // Fenster sofort öffnen, falls noch nicht vorhanden
                if (!ocrWindow || ocrWindow.closed) {
                    ocrWindow = window.open('ocr_debug.html', '_blank', 'width=600,height=400');
                    if (ocrWindow && typeof ocrWindow.addEventListener === 'function') {
                        ocrWindow.addEventListener('beforeunload', () => {
                            ocrWindow = null;
                            ocrDebug = false;
                            debugBtn.classList.remove('active');
                            stopAutoLoop();
                        });
                    }
                }
            } else if (ocrWindow && !ocrWindow.closed) {
                // Bei Deaktivierung das Fenster schließen
                ocrWindow.close();
                stopAutoLoop();
            }
        };
    }
    if (settingsBtn) {
        settingsBtn.onclick = openOcrSettings;
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
    ocrActive = false;
    ocrPaused = false;
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
    const drawer  = document.getElementById('ocrSettingsDrawer');
    if (e.key === 'Escape') {
        if (drawer && drawer.classList.contains('open')) {
            // Bei Escape zuerst nur den Einstell-Drawer schließen
            e.preventDefault();
            openOcrSettings();
            return;
        }
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
    if (e.key.toLowerCase() === 'o' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        openOcrSettings();
    }
    if (e.key.toLowerCase() === 'r') {
        const drawer = document.getElementById('ocrSettingsDrawer');
        if (drawer && drawer.classList.contains('open')) {
            e.preventDefault();
            drawer.querySelector('#ocrReset')?.click();
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
        deleteCurrentVideo,
        openOcrSettings
    };
}
