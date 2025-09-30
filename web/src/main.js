// =========================== SPEICHERINITIALISIERUNG START ===========================
// Standardmäßig auf LocalStorage zurückgreifen
let storage = window.localStorage;
window.storage = storage;

if (typeof module === 'undefined' || !module.exports) {
    (async () => {
        // Speicher-Adapter dynamisch laden
        const { createStorage, migrateStorage } = await import('./storage/storageAdapter.js');
        const { acquireProjectLock } = await import('./storage/projectLock.js');
        let storageMode = window.localStorage.getItem('hla_storageMode');
        // Gewählten Speicher herstellen
        storage = createStorage(storageMode || 'localStorage');
        // Global verfügbar machen
        window.storage = storage;
        window.createStorage = createStorage;
        window.migrateStorage = migrateStorage;
        window.acquireProjectLock = acquireProjectLock;
        // Wörterbuch aus dem gewählten Speicher laden
        await loadWordLists();
        // Bei aktivem Datei-Modus nach Altlasten im LocalStorage suchen
        if (storageMode === 'indexedDB') {
            const { cleanupLegacyLocalStorage } = await import('./storage/legacyCleanup.mjs');
            cleanupLegacyLocalStorage();
        }
        // Beim ersten Start Auswahl anbieten
        if (!storageMode) {
            window.addEventListener('DOMContentLoaded', () => {
                const html = `<h3>Speichermodus wählen</h3>
                    <p>Bitte Speichersystem auswählen:</p>
                    <div class="dialog-buttons">
                        <button id="chooseLocal" class="btn btn-secondary">LocalStorage</button>
                        <button id="chooseNew" class="btn btn-primary">Neues System</button>
                    </div>`;
                const ov = showModal(html);
                const dlg = ov.querySelector('.dialog');
                dlg.addEventListener('click', e => e.stopPropagation());
                dlg.querySelector('#chooseLocal').onclick = () => setMode('localStorage');
                dlg.querySelector('#chooseNew').onclick = () => setMode('indexedDB');
                function setMode(mode) {
                    window.localStorage.setItem('hla_storageMode', mode);
                    storage = createStorage(mode);
                    window.storage = storage;
                    updateStorageIndicator(mode);
                    // Nach Moduswechsel Wörterbuch neu laden
                    loadWordLists();
                    ov.remove();
                }
            });
        }
    })();
}
// =========================== SPEICHERINITIALISIERUNG END ===========================

// Aktualisiert Anzeige und Beschriftung für das aktuelle Speichersystem
function updateStorageIndicator(mode) {
    const indicator = document.getElementById('storageModeIndicator');
    const button = document.getElementById('switchStorageButton');
    if (!indicator || !button) return;
    // Klarer Text für beide Modi
    let text = mode === 'indexedDB' ? 'Datei-Modus (OPFS)' : 'LocalStorage';
    // Zusatzhinweis, falls das IndexedDB-Backend auf den Base64-Fallback ausweicht
    const caps = window.storage && window.storage.capabilities;
    if (mode === 'indexedDB' && caps) {
        text = caps.blobs === 'opfs' ? 'Datei-Modus (OPFS)' : 'Datei-Modus (Base64)';
    }
    indicator.textContent = text;
    button.textContent = mode === 'indexedDB' ? 'Wechsel zu LocalStorage' : 'Wechsel zu Datei-Modus';
}

// Fordert persistenten Speicher an und zeigt die verfügbare Menge an
async function requestPersistentStorage() {
    if (!(navigator.storage && navigator.storage.persist)) return;
    const ok = await navigator.storage.persist();
    if (!ok) {
        showToast('Persistenter Speicher wurde nicht gewährt');
        return;
    }
    const { quota, usage } = await navigator.storage.estimate();
    const frei = ((quota - usage) / (1024 * 1024)).toFixed(1);
    showToast(`Lokaler Speicher gesichert, verfügbar: ${frei} MB`);
}

// Wechselt das Speichersystem ohne automatische Migration der Daten
async function switchStorage(targetMode) {
    const currentMode = window.localStorage.getItem('hla_storageMode') || 'localStorage';
    const newMode = targetMode || (currentMode === 'localStorage' ? 'indexedDB' : 'localStorage');
    const zielLabel = newMode === 'indexedDB' ? 'Datei-Modus' : 'LocalStorage';
    // Hinweis auf den bevorstehenden Wechsel anzeigen
    updateStatus(`Lade ${zielLabel}...`);
    showToast(`Wechsle zu ${zielLabel} (ohne Kopieren der Daten)`);
    const newBackend = window.createStorage(newMode);
    // Beim Wechsel werden keine Daten übertragen
    resetGlobalState();
    window.storage = newBackend;
    // Aktive Projekt-Locks sichern, damit parallele Tabs ihre Sperren behalten
    const gesicherteLocks = {};
    for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith('project-lock:')) {
            gesicherteLocks[key] = window.localStorage.getItem(key);
        }
    }
    // LocalStorage leeren und Modus direkt wieder setzen
    window.localStorage.clear();
    window.localStorage.setItem('hla_storageMode', newMode);
    // Gesicherte Lock-Einträge wiederherstellen
    for (const [key, value] of Object.entries(gesicherteLocks)) {
        window.localStorage.setItem(key, value);
    }
    // Wörterbuch aus neuem Speicher laden, falls Funktion vorhanden
    if (typeof loadWordLists === 'function') {
        await loadWordLists();
    }
    updateStorageIndicator(newMode);
    // Abschlussmeldung ausgeben
    updateStatus(`${zielLabel} geladen`);
    showToast(`Jetzt im ${zielLabel}`);
    // Projektliste nach Speichermodus-Wechsel vollständig neu laden
    if (typeof reloadProjectList === 'function') {
        await reloadProjectList(false);
    } else if (typeof loadProjects === 'function') {
        await loadProjects();
    }
}

// Setzt alle globalen Zustände zurück, um Reste des alten Backends zu vermeiden
function resetGlobalState() {
    projectResetActive = true;
    if (typeof window !== 'undefined') {
        window.projectResetActive = projectResetActive;
    }
    // Laufende Übersetzungsprozesse immer zuerst abbrechen, damit kein später Rückläufer mehr speichert
    cancelTranslationQueue('Globaler Reset');
    if (typeof projects !== 'undefined') {
        // Projektliste in-place leeren, damit Fenster-Referenzen erhalten bleiben
        if (Array.isArray(projects)) {
            projects.length = 0;
        } else {
            projects = [];
        }
        if (typeof window !== 'undefined') {
            window.projects = projects;
        }
    }
    if (typeof levelColors !== 'undefined') levelColors = {};
    if (typeof levelOrders !== 'undefined') levelOrders = {};
    if (typeof levelIcons !== 'undefined') levelIcons = {};
    if (typeof levelColorHistory !== 'undefined') levelColorHistory = [];
    if (typeof currentProjectLock !== 'undefined' && currentProjectLock && typeof currentProjectLock.release === 'function') {
        currentProjectLock.release();
    }
    if (typeof currentProject !== 'undefined') {
        currentProject = null;
        if (typeof window !== 'undefined') {
            window.currentProject = currentProject;
        }
    }
    if (typeof currentProjectLock !== 'undefined') {
        currentProjectLock = null;
        if (typeof window !== 'undefined') {
            window.currentProjectLock = currentProjectLock;
        }
    }
    if (typeof readOnlyMode !== 'undefined') readOnlyMode = false;
    if (typeof files !== 'undefined') files = [];
    if (typeof textDatabase !== 'undefined') textDatabase = {};
    if (typeof filePathDatabase !== 'undefined') filePathDatabase = {};
    if (typeof audioFileCache !== 'undefined') audioFileCache = {};
    if (typeof deAudioCache !== 'undefined') deAudioCache = {};
    if (typeof deAudioCacheIndex !== 'undefined') deAudioCacheIndex = {};
    if (typeof audioDurationCache !== 'undefined') audioDurationCache = {};
    if (typeof historyPresenceCache !== 'undefined') historyPresenceCache = {};
    if (typeof folderCustomizations !== 'undefined') folderCustomizations = {};
    if (typeof isDirty !== 'undefined') isDirty = false;
    if (typeof aktiveOrdnerDateien !== 'undefined') aktiveOrdnerDateien = [];
    if (typeof segmentInfo !== 'undefined') segmentInfo = null;
    if (typeof segmentAssignments !== 'undefined') segmentAssignments = {};
    if (typeof segmentPlayer !== 'undefined' && segmentPlayer) {
        try { segmentPlayer.pause && segmentPlayer.pause(); } catch (e) {}
        segmentPlayer = null;
    }
    if (typeof segmentSelection !== 'undefined') segmentSelection = [];
    if (typeof segmentPlayerUrl !== 'undefined' && segmentPlayerUrl) {
        URL.revokeObjectURL(segmentPlayerUrl);
        segmentPlayerUrl = null;
    }
    if (typeof ignoredSegments !== 'undefined' && ignoredSegments.clear) ignoredSegments.clear();
    if (typeof projectIndex !== 'undefined') projectIndex = null;
    // Click-Listener für die Projektliste zurücksetzen, damit er neu gebunden wird
    if (typeof projectListClickBound !== 'undefined') projectListClickBound = false;
}

// Verwaltung der neuen Dropdown-Menüs im Arbeitsbereich
let activeWorkspaceMenu = null;
let workspaceMenusInitialized = false;

function handleWorkspaceMenuOutsideClick(event) {
    if (!activeWorkspaceMenu) return;
    const { menu, button } = activeWorkspaceMenu;
    if (menu.contains(event.target) || (button && button.contains(event.target))) {
        return;
    }
    closeWorkspaceMenu();
}

function closeWorkspaceMenu() {
    if (!activeWorkspaceMenu) return;
    const { menu, button } = activeWorkspaceMenu;
    menu.classList.remove('menu-open');
    if (button) {
        button.classList.remove('menu-toggle-active');
        button.setAttribute('aria-expanded', 'false');
    }
    activeWorkspaceMenu = null;
    document.removeEventListener('click', handleWorkspaceMenuOutsideClick);
}

function toggleWorkspaceMenu(menuId, buttonId) {
    const menu = document.getElementById(menuId);
    if (!menu) return;
    const button = buttonId ? document.getElementById(buttonId) : null;
    const isSameMenu = activeWorkspaceMenu && activeWorkspaceMenu.menu === menu;
    closeWorkspaceMenu();
    if (!isSameMenu) {
        menu.classList.add('menu-open');
        if (button) {
            button.classList.add('menu-toggle-active');
            button.setAttribute('aria-expanded', 'true');
        }
        activeWorkspaceMenu = { menu, button };
        document.addEventListener('click', handleWorkspaceMenuOutsideClick);
    }
}

function initializeWorkspaceMenus() {
    if (workspaceMenusInitialized) return;
    workspaceMenusInitialized = true;
    const toggles = document.querySelectorAll('[data-menu-toggle]');
    toggles.forEach(toggle => {
        toggle.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            const menuId = toggle.getAttribute('data-menu-toggle');
            toggleWorkspaceMenu(menuId, toggle.id);
        });
    });

    const dropdowns = document.querySelectorAll('.workspace-dropdown');
    dropdowns.forEach(menu => {
        menu.addEventListener('click', event => {
            const actionable = event.target.closest('.dropdown-item, .settings-item, button');
            if (actionable) {
                closeWorkspaceMenu();
            }
        });
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeWorkspaceMenu();
        }
    });
}

window.toggleWorkspaceMenu = toggleWorkspaceMenu;

// Prüft, in welchem Speichersystem ein Schlüssel liegt und zeigt den Status an
async function visualizeFileStorage(key) {
    // Beide Backends erstellen, ohne den globalen Speicher zu ändern
    const local = window.createStorage('localStorage');
    const indexed = window.createStorage('indexedDB');
    const localValue = await local.getItem(key);
    const indexedValue = await indexed.getItem(key);
    let message;
    if (indexedValue && !localValue) {
        message = `„${key}“ liegt im neuen Speichersystem.`;
    } else if (!indexedValue && localValue) {
        message = `„${key}“ liegt noch im LocalStorage.`;
    } else if (indexedValue && localValue) {
        message = `„${key}“ existiert in beiden Speichersystemen.`;
    } else {
        message = `„${key}“ wurde in keinem Speichersystem gefunden.`;
    }
    updateStatus(message);
    return { local: !!localValue, indexedDB: !!indexedValue };
}

// Öffnet den Ordner des neuen Speichersystems im Dateimanager
async function openStorageFolder() {
    if (!debugInfo.userDataPath || !window.electronAPI) {
        showToast('Pfad zum neuen Speichersystem ist nicht verfügbar');
        return;
    }
    const pfad = window.electronAPI.join(debugInfo.userDataPath, 'IndexedDB');
    await window.electronAPI.openPath(pfad);
}

// Aktualisiert Fortschrittsbalken und Text für den belegten Speicher
async function updateStorageUsage() {
    if (!(navigator.storage && navigator.storage.estimate)) return;
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    const usedMb = (usage / (1024 * 1024)).toFixed(1);
    const quotaMb = quota ? (quota / (1024 * 1024)).toFixed(1) : '0';
    const percent = quota ? (usage / quota) * 100 : 0;
    const fill = document.getElementById('storageUsageFill');
    const label = document.getElementById('storageUsageLabel');
    if (fill) fill.style.width = percent.toFixed(1) + '%';
    if (label) label.textContent = `${usedMb} MB von ${quotaMb} MB`;
}

// Zeigt das Datum der letzten Bereinigung an
function updateLastCleanup() {
    const label = document.getElementById('lastCleanupLabel');
    if (!label) return;
    const ts = window.localStorage.getItem('hla_lastCleanup');
    label.textContent = ts ? `Zuletzt bereinigt am ${new Date(ts).toLocaleString()}` : 'Noch nie bereinigt';
}

// Startet die Garbage-Collection des Speichers
async function runCleanup() {
    if (window.storage && window.storage.garbageCollect) {
        await window.storage.garbageCollect();
        window.localStorage.setItem('hla_lastCleanup', new Date().toISOString());
        updateLastCleanup();
        updateStorageUsage();
        showToast('Speicher bereinigt');
    }
}

// Lokaler Suchindex
let projectIndex = null;

// Baut den Index für ein gegebenes Projekt neu auf
async function rebuildProjectIndex(project) {
    const { LocalIndex } = await import('./localIndex.js');
    projectIndex = new LocalIndex();
    (project.files || []).forEach(f => {
        if (f.text) projectIndex.add(f.id, f.text);
    });
}

// Durchsucht den lokalen Index
function searchLocal(term) {
    if (!projectIndex) return [];
    return projectIndex.search(term);
}

// Virtuelle Tabelle vorbereiten (Platzhalter)
let virtualTable = null;
async function initVirtualTable() {
    const container = document.querySelector('.table-container');
    if (!container) return;
    const { createVirtualList } = await import('./virtualList.js');
    virtualTable = createVirtualList(container, 40, () => document.createElement('div'));
}

// Globale Bereitstellung und Initialisierung nach DOM-Ladevorgang
window.updateStorageIndicator = updateStorageIndicator;
window.switchStorage = switchStorage;
window.visualizeFileStorage = visualizeFileStorage;
window.openStorageFolder = openStorageFolder;
window.rebuildProjectIndex = rebuildProjectIndex;
window.searchLocal = searchLocal;
window.addEventListener('DOMContentLoaded', () => {
    const mode = window.localStorage.getItem('hla_storageMode') || 'localStorage';
    updateStorageIndicator(mode);
    const btn = document.getElementById('switchStorageButton');
    if (btn) btn.addEventListener('click', () => switchStorage());
    requestPersistentStorage();
    updateStorageUsage();
    updateLastCleanup();
    initializeWorkspaceMenus();
    const cleanBtn = document.getElementById('cleanupButton');
    if (cleanBtn) cleanBtn.addEventListener('click', runCleanup);
    initVirtualTable();
});

// =========================== GLOBAL STATE START ===========================
let projects               = [];
window.projects            = projects; // Globale Referenz auf die Projektliste
// Hilfsfunktion, damit Modul- und Fenster-Referenz stets identisch bleiben
function replaceProjectList(newList) {
    const kopie = Array.isArray(newList) ? [...newList] : [];
    projects = kopie;
    window.projects = projects;
    return projects;
}
window.replaceProjectList = replaceProjectList;
let projectResetActive     = false; // Merker, ob ein globaler Reset läuft
if (typeof window !== 'undefined') {
    window.projectResetActive = projectResetActive;
}
let levelColors            = {}; // ⬅️ NEU: globale Level-Farben
let levelOrders            = {}; // ⬅️ NEU: Reihenfolge der Level
let levelIcons             = {}; // ⬅️ NEU: Icon je Level
let levelColorHistory     = JSON.parse(storage.getItem('hla_levelColorHistory') || '[]'); // ➡️ Merkt letzte 5 Farben
let currentProject         = null;
let currentProjectLock     = null; // Lock-Objekt für Schreibzugriff
let readOnlyMode           = false; // Wahr, wenn nur lesen erlaubt ist
let files                  = [];
let textDatabase           = {};
let filePathDatabase       = {}; // Dateiname → Pfade
let audioFileCache         = {}; // Zwischenspeicher für Audio-Dateien
let deAudioCache           = {}; // Zwischenspeicher für DE-Audios
let deAudioCacheIndex      = {}; // Zusätzlicher Index für case-insensitive Zugriffe
let deAudioCacheIndexFallbackTriggered = false; // Merker, ob eine Notfall-Reindizierung durchgeführt wurde
let audioDurationCache    = {}; // Cache für ermittelte Audiodauern
let historyPresenceCache   = {}; // Merkt vorhandene History-Dateien
let folderCustomizations   = {}; // Speichert Icons/Farben pro Ordner
let isDirty                = false; // Merker für ungespeicherte Änderungen
let saveDelayTimer         = null;  // Timer für verzögertes Speichern

// Merkt Änderungen und löst nach kurzer Zeit automatisch das Speichern aus
function markDirty() {
    isDirty = true;
    clearTimeout(saveDelayTimer);
    saveDelayTimer = setTimeout(() => saveCurrentProject(), 500);
}
// Funktion global bereitstellen
window.markDirty = markDirty;
let aktiveOrdnerDateien    = []; // Aktuelle Dateiliste im Ordner-Browser
let debugInfo              = {}; // Pfadinformationen von Electron
let segmentInfo            = null; // Ergebnisse der Audio-Segmentierung
let segmentAssignments    = {};    // Zuordnung Segmente -> Zeilen
let segmentPlayer         = null;  // Wiedergabe der Ausschnitte
let segmentSelection      = [];    // aktuell ausgewaehlte Segmente
let segmentPlayerUrl      = null;  // zuletzt erzeugte Object-URL
let ignoredSegments       = new Set(); // ignorierte Segmente

// Verfügbarkeit der Electron-API einmalig prüfen
const isElectron = !!window.electronAPI;
if (!isElectron) {
    console.warn('🚫 Electron-API nicht verfügbar – Fallback auf Browser-Modus');
}

// Beim Schließen des Fensters Lock freigeben
window.addEventListener('beforeunload', () => {
    if (currentProjectLock) {
        currentProjectLock.release();
    }
});

// Hilfsfunktionen zum Kodieren und Dekodieren von Audiodaten
// wandelt ein ArrayBuffer sicher in Base64 um, auch bei großen Dateien
function arrayBufferToBase64(buf){
    const bytes = new Uint8Array(buf);
    const chunkSize = 0x8000; // 32 kB pro Teilstück
    let bin = '';
    for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        bin += String.fromCharCode.apply(null, chunk);
    }
    return btoa(bin);
}
function base64ToArrayBuffer(str){
    const bin=atob(str);const len=bin.length;const buf=new Uint8Array(len);
    for(let i=0;i<len;i++) buf[i]=bin.charCodeAt(i);
    return buf.buffer;
}

// Segment-Daten projektweise merken und serialisierbar speichern
function storeSegmentState() {
    if (!currentProject) return;
    // Erste Anlage der versteckten Felder
    if (!Object.prototype.hasOwnProperty.call(currentProject, '_segmentInfo')) {
        Object.defineProperty(currentProject, '_segmentInfo', {
            value: segmentInfo,
            writable: true,
            enumerable: false,
            configurable: true
        });
            } else {
        currentProject._segmentInfo = segmentInfo;
    }
    if (!Object.prototype.hasOwnProperty.call(currentProject, '_segmentAssignments')) {
        Object.defineProperty(currentProject, '_segmentAssignments', {
            value: segmentAssignments,
            writable: true,
            enumerable: false,
            configurable: true
        });
    } else {
        currentProject._segmentAssignments = segmentAssignments;
    }
    if (!Object.prototype.hasOwnProperty.call(currentProject, '_segmentIgnored')) {
        Object.defineProperty(currentProject, '_segmentIgnored', {
            value: ignoredSegments,
            writable: true,
            enumerable: false,
            configurable: true
        });
    } else {
        currentProject._segmentIgnored = ignoredSegments;
    }
    currentProject.segmentAssignments = segmentAssignments;
    currentProject.segmentSegments = segmentInfo ? segmentInfo.segments : null;
    currentProject.segmentIgnored = Array.from(ignoredSegments);
    markDirty();
}

let projektOrdnerHandle    = null; // Gewählter Projektordner
let deOrdnerHandle         = null; // Handle für den DE-Ordner
let enOrdnerHandle         = null; // Handle für den EN-Ordner
let enDateien              = [];   // Gefundene EN-Audiodateien
let aktuellerUploadPfad    = null; // Zielpfad für hochgeladene Dateien
let currentHistoryPath     = null; // Pfad für History-Anzeige

let editStartTrim          = 0;    // Start-Schnitt in ms
let editEndTrim            = 0;    // End-Schnitt in ms
let editDurationMs         = 0;    // Gesamtdauer der Datei in ms
let editDragging           = null; // "start" oder "end" beim Ziehen
let editEnBuffer           = null; // AudioBuffer der angezeigten EN-Datei
let rawEnBuffer            = null; // Unveränderte EN-Referenz für erneute Berechnungen
let editProgressTimer      = null; // Intervall für Fortschrittsanzeige
let editPlaying            = null; // "orig" oder "de" während Wiedergabe
let editPaused             = false; // merkt Pausenstatus
// Eigene Cursorpositionen für EN und DE
let editOrigCursor         = 0;    // Position der EN-Wiedergabe in ms
let editDeCursor           = 0;    // Position der DE-Wiedergabe in ms
let editBlobUrl            = null; // aktuelle Blob-URL

// Markierung eines EN-Ausschnitts für das Runterkopieren
let enSelectStart          = 0;    // Start der Auswahl in ms
let enSelectEnd            = 0;    // Ende der Auswahl in ms
let enSelecting            = false; // Wahr während Ziehen
let enMarkerDragging       = null; // "start" oder "end" beim Verschieben der Markierung
let enDragStart            = null; // Startposition beim Ziehen
let enPrevStart            = 0;    // Vorheriger Start zur Wiederherstellung bei Klick
let enPrevEnd              = 0;    // Vorheriges Ende zur Wiederherstellung bei Klick

// Zusätzliche Marker für Ignorier-Bereiche
let editIgnoreRanges      = [];    // Liste der zu überspringenden Bereiche
let manualIgnoreRanges    = [];    // Merker für manuelle Bereiche
let ignoreTempStart       = null;  // Startpunkt für neuen Bereich
let ignoreDragging        = null;  // {index, side} beim Ziehen
let editSilenceRanges     = [];    // Bereiche zum Einfügen von Stille
let manualSilenceRanges   = [];    // Merker für manuelle Stille
let silenceTempStart      = null;  // Startpunkt für Stille-Bereich
let silenceDragging       = null;  // {index, side} beim Ziehen der Stille
let autoIgnoreMs          = 400;   // Schwelle für Pausen in ms

// Anzeigeeinstellungen für die Wellenformen
const WAVE_ZOOM_MIN       = 0.8;
const WAVE_ZOOM_MAX       = 2.5;
const WAVE_ZOOM_STEP      = 0.1;
let waveZoomLevel         = parseFloat(storage.getItem('hla_waveZoomLevel')) || 1.0; // Basiszoom für große Monitore
let waveHeightPx          = parseInt(storage.getItem('hla_waveHeightPx'), 10) || 80; // Höhe der Wellenform
let waveSyncScroll        = storage.getItem('hla_waveSyncScroll') === 'true'; // Gemeinsames Scrollen aktiv?
let waveScrollSyncing     = false; // Sperre beim synchronen Scrollen
let currentEnSeconds      = 0;     // Länge der EN-Datei in Sekunden
let currentDeSeconds      = 0;     // Länge der DE-Datei in Sekunden
let maxWaveSeconds        = 0;     // Maximale Länge zur Skalierung

// Zustandsverwaltung für das neue Debug-Protokoll in der DE-Bearbeitung
let deDebugEntries        = [];    // Alle protokollierten Meldungen
let deDebugPanelVisible   = false; // Merker, ob das seitliche Fenster sichtbar ist
let deDebugSetupDone      = false; // Verhindert mehrfaches Initialisieren der Listener
let deDebugLastInputLog   = 0;     // Zeitstempel für letzte Live-Protokollierung (Drosselung bei Schiebereglern)
const MAX_DE_DEBUG_LINES  = 500;   // Obergrenze für gespeicherte Zeilen

// Formatiert Sekundenwerte als mm:ss.mmm für das Debug-Protokoll
function formatDeDebugSeconds(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) {
        return '00:00.000';
    }
    const totalMs = Math.round(seconds * 1000);
    const minutes = Math.floor(totalMs / 60000);
    const secs = Math.floor((totalMs % 60000) / 1000);
    const millis = totalMs % 1000;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
}

// Sorgt dafür, dass das Debug-Fenster nur einmal initialisiert wird
function ensureDeDebugPanel() {
    if (deDebugSetupDone) return;
    const dialog = document.querySelector('#deEditDialog .dialog');
    const panel = document.getElementById('deDebugPanel');
    if (!dialog || !panel) return;

    const copyBtn = document.getElementById('deDebugCopyBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            const text = deDebugEntries.join('\n');
            const kopiert = await safeCopy(text);
            if (kopiert && typeof showToast === 'function') {
                showToast('Debug-Protokoll kopiert', 'success');
            } else if (!kopiert && typeof showToast === 'function') {
                showToast('Kopieren fehlgeschlagen', 'error');
            }
            logDeDebug('safeCopy', 'Debug-Protokoll', kopiert ? 'In Zwischenablage übernommen' : 'Zwischenablage nicht verfügbar');
        });
    }

    dialog.addEventListener('click', handleDeDebugClick, true);
    dialog.addEventListener('change', handleDeDebugChange, true);
    dialog.addEventListener('input', handleDeDebugInput, true);

    panel.setAttribute('aria-hidden', 'true');
    deDebugSetupDone = true;
}

// Aktualisiert die Textfläche mit den gesammelten Meldungen
function updateDeDebugConsole() {
    const consoleEl = document.getElementById('deDebugConsole');
    if (!consoleEl) return;
    consoleEl.value = deDebugEntries.join('\n');
    consoleEl.scrollTop = consoleEl.scrollHeight;
}

// Erstellt eine neue Debug-Zeile und hält die maximale Anzahl ein
function logDeDebug(functionName, subAction = '', extra = '') {
    const zeit = new Date().toLocaleTimeString('de-DE', { hour12: false });
    const enText = formatDeDebugSeconds(currentEnSeconds);
    const deText = formatDeDebugSeconds(currentDeSeconds);
    let meldung = `[${zeit}] EN: ${enText} • DE: ${deText} • Funktion: ${functionName}`;
    if (subAction) meldung += ` • Unterfunktion: ${subAction}`;
    if (extra) meldung += ` • Hinweis: ${extra}`;
    deDebugEntries.push(meldung);
    if (deDebugEntries.length > MAX_DE_DEBUG_LINES) {
        deDebugEntries = deDebugEntries.slice(-MAX_DE_DEBUG_LINES);
    }
    updateDeDebugConsole();
}

// Setzt das Protokoll für eine neue Datei zurück und dokumentiert den Start
function resetDeDebugLog(dateiLabel) {
    deDebugEntries = [];
    updateDeDebugConsole();
    const beschreibung = dateiLabel ? `Bearbeitung gestartet für ${dateiLabel}` : 'Bearbeitung gestartet';
    logDeDebug('openDeEdit', 'Initialisierung', beschreibung);
}

// =========================== OPENDEEDIT START ===============================
// Öffnet den Bearbeitungsdialog für eine DE-Datei ohne Tempo-Anpassungen
async function openDeEdit(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    currentEditFile = file;
    const enSrc = `sounds/EN/${getFullPath(file)}`;
    const rel = getDeFilePath(file) || getFullPath(file);
    let deSrc = deAudioCache[rel];
    if (!deSrc) return;
    // Aktuelle DE-Datei mit Cache-Buster laden, ansonsten Backup verwenden
    try {
        const src = typeof deSrc === 'string' ? `${deSrc}?v=${Date.now()}` : deSrc;
        originalEditBuffer = await loadAudioBuffer(src);
    } catch {
        const backupSrc = `sounds/DE-Backup/${rel}`;
        originalEditBuffer = await loadAudioBuffer(backupSrc);
    }

    savedOriginalBuffer = originalEditBuffer;
    volumeMatchedBuffer = null;
    isVolumeMatched = false;
    radioEffectBuffer = null;
    isRadioEffect = false;
    hallEffectBuffer = null;
    isHallEffect = false;
    emiEffectBuffer = null;
    isEmiEffect = false;
    neighborEffectBuffer = null;
    isNeighborEffect = false;
    tableMicEffectBuffer = null;
    isTableMicEffect = false;
    neighborHall = !!file.neighborHall;
    tableMicRoomType = file.tableMicRoom || 'wohnzimmer';

    const enBuffer = await loadAudioBuffer(enSrc);
    editEnBuffer = enBuffer;
    rawEnBuffer = enBuffer;

    const enSeconds = enBuffer.length / enBuffer.sampleRate;
    const deSeconds = originalEditBuffer.length / originalEditBuffer.sampleRate;
    const maxSeconds = Math.max(enSeconds, deSeconds);
    editDurationMs = originalEditBuffer.length / originalEditBuffer.sampleRate * 1000;
    normalizeDeTrim();
    currentEnSeconds = enSeconds;
    currentDeSeconds = deSeconds;
    maxWaveSeconds = Math.max(maxSeconds, 0.001);

    ensureDeDebugPanel();
    resetDeDebugLog(getFullPath(file));

    editOrigCursor = 0;
    editDeCursor = 0;
    editPaused = false;
    editPlaying = null;
    if (editBlobUrl) {
        URL.revokeObjectURL(editBlobUrl);
        editBlobUrl = null;
    }

    editStartTrim = file.trimStartMs || 0;
    editEndTrim = file.trimEndMs || 0;
    normalizeDeTrim();

    editIgnoreRanges = Array.isArray(file.ignoreRanges) ? file.ignoreRanges.map(r => ({ start: r.start, end: r.end })) : [];
    manualIgnoreRanges = editIgnoreRanges.map(r => ({ start: r.start, end: r.end }));
    editSilenceRanges = Array.isArray(file.silenceRanges) ? file.silenceRanges.map(r => ({ start: r.start, end: r.end })) : [];
    manualSilenceRanges = editSilenceRanges.map(r => ({ start: r.start, end: r.end }));
    ignoreTempStart = null;
    silenceTempStart = null;

    // Schnelle optische Rückmeldung bei Trigger-Buttons
    const triggerPulse = (elementId, fallbackSelector) => {
        const el = document.getElementById(elementId) || (fallbackSelector ? document.querySelector(fallbackSelector) : null);
        if (!el) return;
        el.classList.add('trigger-pulse');
        setTimeout(() => el.classList.remove('trigger-pulse'), 400);
    };

    const focusTrimCard = () => {
        const trimCard = document.querySelector('#deEditDialog .trim-card');
        if (trimCard) {
            trimCard.classList.add('focused-card');
            setTimeout(() => trimCard.classList.remove('focused-card'), 800);
            trimCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        const startInput = document.getElementById('editStart');
        if (startInput) {
            startInput.focus();
            startInput.select();
        }
    };

    setTrimInputValueSafe(document.getElementById('editStart'), editStartTrim);
    setTrimInputValueSafe(document.getElementById('editEnd'), editDurationMs - editEndTrim);
    document.getElementById('editStart').oninput = e => {
        const val = parseInt(e.target.value) || 0;
        editStartTrim = Math.max(0, Math.min(val, editDurationMs));
        validateDeSelection();
        scheduleWaveformUpdate();
    };
    document.getElementById('editEnd').oninput = e => {
        const val = parseInt(e.target.value) || 0;
        const clamped = Math.max(0, Math.min(val, editDurationMs));
        editEndTrim = Math.max(0, editDurationMs - clamped);
        validateDeSelection();
        scheduleWaveformUpdate();
    };
    validateDeSelection();

    const runAutoTrim = () => {
        const vals = detectSilenceTrim(savedOriginalBuffer);
        editStartTrim = vals.start;
        editEndTrim = vals.end;
        updateDeEditWaveforms();
        validateDeSelection();
    };

    const autoTrim = document.getElementById('autoTrimBtn');
    if (autoTrim) autoTrim.onclick = runAutoTrim;

    const quickTrim = document.getElementById('quickFocusTrim');
    if (quickTrim) quickTrim.onclick = () => {
        focusTrimCard();
    };

    const quickAutoTrim = document.getElementById('quickAutoTrim');
    if (quickAutoTrim) quickAutoTrim.onclick = () => {
        runAutoTrim();
        triggerPulse('autoTrimBtn');
    };

    const quickVolume = document.getElementById('quickVolumeMatch');
    if (quickVolume) quickVolume.onclick = () => {
        applyVolumeMatch();
        triggerPulse('volumeMatchBoxBtn');
    };

    const quickRadio = document.getElementById('quickRadioEffect');
    if (quickRadio) quickRadio.onclick = () => {
        applyRadioEffect();
        triggerPulse('radioEffectBoxBtn');
    };

    // Standardwert für die automatische Pausenerkennung setzen
    autoIgnoreMs = 400;

    const autoChk = document.getElementById('autoIgnoreChk');
    const autoMs = document.getElementById('autoIgnoreMs');
    if (autoChk && autoMs) {
        autoChk.checked = false;
        autoMs.value = 400;
        autoChk.onchange = () => {
            if (autoChk.checked) {
                manualIgnoreRanges = editIgnoreRanges.map(r => ({ start: r.start, end: r.end }));
                autoIgnoreMs = parseInt(autoMs.value) || 400;
                editIgnoreRanges = detectPausesInBuffer(savedOriginalBuffer, autoIgnoreMs);
            } else {
                editIgnoreRanges = manualIgnoreRanges.map(r => ({ start: r.start, end: r.end }));
            }
            refreshIgnoreList();
            updateDeEditWaveforms();
        };
        autoMs.oninput = () => {
            if (autoChk.checked) {
                autoIgnoreMs = parseInt(autoMs.value) || 400;
                editIgnoreRanges = detectPausesInBuffer(savedOriginalBuffer, autoIgnoreMs);
                refreshIgnoreList();
                updateDeEditWaveforms();
            }
        };
    }

    const autoBtn = document.getElementById('autoAdjustBtn');
    if (autoBtn) autoBtn.onclick = () => autoAdjustLength();

    refreshIgnoreList();
    refreshSilenceList();

    const deCanvas = document.getElementById('waveEdited');
    const origCanvas = document.getElementById('waveOriginal');

    const startField = document.getElementById('enSegStart');
    const endField = document.getElementById('enSegEnd');

    if (startField) {
        startField.oninput = () => {
            enSelectStart = parseInt(startField.value) || 0;
            validateEnSelection();
            scheduleWaveformUpdate();
        };
        enSelectStart = parseInt(startField.value) || 0;
    }
    if (endField) {
        endField.oninput = () => {
            enSelectEnd = parseInt(endField.value) || 0;
            validateEnSelection();
            scheduleWaveformUpdate();
        };
        enSelectEnd = parseInt(endField.value) || 0;
    }

    origCanvas.onmousedown = e => {
        if (!editEnBuffer) return;
        activeWave = 'en';
        const rect = origCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const dur = editEnBuffer.length / editEnBuffer.sampleRate * 1000;
        const startX = Math.min(enSelectStart, enSelectEnd) / dur * origCanvas.width;
        const endX = Math.max(enSelectStart, enSelectEnd) / dur * origCanvas.width;
        const grip = 8;
        if (enSelectStart !== enSelectEnd && Math.abs(x - startX) <= grip) {
            enMarkerDragging = 'start';
            return;
        }
        if (enSelectStart !== enSelectEnd && Math.abs(x - endX) <= grip) {
            enMarkerDragging = 'end';
            return;
        }
        enPrevStart = enSelectStart;
        enPrevEnd = enSelectEnd;
        enDragStart = x / origCanvas.width * dur;
        enSelecting = true;
    };

    origCanvas.onmousemove = e => {
        if (enSelecting && editEnBuffer) {
            const rect = origCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const dur = editEnBuffer.length / editEnBuffer.sampleRate * 1000;
            enSelectStart = enDragStart;
            enSelectEnd = x / origCanvas.width * dur;
            if (startField) startField.value = Math.round(Math.min(enSelectStart, enSelectEnd));
            if (endField) endField.value = Math.round(Math.max(enSelectStart, enSelectEnd));
            validateEnSelection();
            scheduleWaveformUpdate();
        } else if (enMarkerDragging && editEnBuffer) {
            const rect = origCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const dur = editEnBuffer.length / editEnBuffer.sampleRate * 1000;
            const pos = x / origCanvas.width * dur;
            if (enMarkerDragging === 'start') {
                enSelectStart = pos;
                if (startField) startField.value = Math.round(pos);
            } else {
                enSelectEnd = pos;
                if (endField) endField.value = Math.round(pos);
            }
            validateEnSelection();
            scheduleWaveformUpdate();
        }
    };

    origCanvas.ondblclick = () => {
        enSelectStart = 0;
        enSelectEnd = 0;
        if (startField) startField.value = '';
        if (endField) endField.value = '';
        resetCanvasZoom(origCanvas);
        validateEnSelection();
        scheduleWaveformUpdate();
    };

    initWaveToolbar();
    updateWaveCanvasDimensions();

    const waveLabelOriginal = document.getElementById('waveLabelOriginal');
    if (waveLabelOriginal) waveLabelOriginal.textContent = `EN (Original) - ${enSeconds.toFixed(2)}s`;
    const waveLabelEdited = document.getElementById('waveLabelEdited');
    if (waveLabelEdited) waveLabelEdited.textContent = `DE (bearbeiten) - ${deSeconds.toFixed(2)}s`;

    const enTextEl = document.getElementById('editEnText');
    if (enTextEl) enTextEl.textContent = file.enText || '';
    const deTextEl = document.getElementById('editDeText');
    if (deTextEl) deTextEl.textContent = file.deText || '';
    const emoTextEl = document.getElementById('editEmoText');
    if (emoTextEl) emoTextEl.textContent = file.emotionalText || '';

    updateDeEditWaveforms();
    updateMasterTimeline();
    document.getElementById('deEditDialog').classList.remove('hidden');

    const rStrength = document.getElementById('radioStrength');
    const rStrengthDisp = document.getElementById('radioStrengthDisplay');
    if (rStrength && rStrengthDisp) {
        rStrength.value = radioEffectStrength;
        rStrengthDisp.textContent = Math.round(radioEffectStrength * 100) + '%';
        rStrength.oninput = e => {
            radioEffectStrength = parseFloat(e.target.value);
            storage.setItem('hla_radioEffectStrength', radioEffectStrength);
            rStrengthDisp.textContent = Math.round(radioEffectStrength * 100) + '%';
            if (isRadioEffect) recomputeEditBuffer();
        };
    }

    const rHigh = document.getElementById('radioHighpass');
    if (rHigh) {
        rHigh.value = radioHighpass;
        rHigh.oninput = e => {
            radioHighpass = parseFloat(e.target.value);
            storage.setItem('hla_radioHighpass', radioHighpass);
            if (isRadioEffect) recomputeEditBuffer();
        };
    }

    const rLow = document.getElementById('radioLowpass');
    if (rLow) {
        rLow.value = radioLowpass;
        rLow.oninput = e => {
            radioLowpass = parseFloat(e.target.value);
            storage.setItem('hla_radioLowpass', radioLowpass);
            if (isRadioEffect) recomputeEditBuffer();
        };
    }

    const rSat = document.getElementById('radioSaturation');
    const rSatDisp = document.getElementById('radioSaturationDisplay');
    if (rSat && rSatDisp) {
        rSat.value = radioSaturation;
        rSatDisp.textContent = Math.round(radioSaturation * 100) + '%';
        rSat.oninput = e => {
            radioSaturation = parseFloat(e.target.value);
            storage.setItem('hla_radioSaturation', radioSaturation);
            rSatDisp.textContent = Math.round(radioSaturation * 100) + '%';
            if (isRadioEffect) recomputeEditBuffer();
        };
    }

    const rNoise = document.getElementById('radioNoise');
    if (rNoise) {
        rNoise.value = radioNoise;
        rNoise.oninput = e => {
            radioNoise = parseFloat(e.target.value);
            storage.setItem('hla_radioNoise', radioNoise);
            if (isRadioEffect) recomputeEditBuffer();
        };
    }

    const rCrackle = document.getElementById('radioCrackle');
    const rCrackleDisp = document.getElementById('radioCrackleDisplay');
    if (rCrackle && rCrackleDisp) {
        rCrackle.value = radioCrackle;
        rCrackleDisp.textContent = Math.round(radioCrackle * 100) + '%';
        rCrackle.oninput = e => {
            radioCrackle = parseFloat(e.target.value);
            storage.setItem('hla_radioCrackle', radioCrackle);
            rCrackleDisp.textContent = Math.round(radioCrackle * 100) + '%';
            if (isRadioEffect) recomputeEditBuffer();
        };
    }

    const hRoom = document.getElementById('hallRoom');
    if (hRoom) {
        hRoom.value = hallRoom;
        hRoom.oninput = e => {
            hallRoom = parseFloat(e.target.value);
            storage.setItem('hla_hallRoom', hallRoom);
            if (isHallEffect) recomputeEditBuffer();
        };
    }

    const hAmount = document.getElementById('hallAmount');
    const hAmountDisp = document.getElementById('hallAmountDisplay');
    if (hAmount && hAmountDisp) {
        hAmount.value = hallAmount;
        hAmountDisp.textContent = Math.round(hallAmount * 100) + '%';
        hAmount.oninput = e => {
            hallAmount = parseFloat(e.target.value);
            storage.setItem('hla_hallAmount', hallAmount);
            hAmountDisp.textContent = Math.round(hallAmount * 100) + '%';
            if (isHallEffect) recomputeEditBuffer();
        };
    }

    const hDelay = document.getElementById('hallDelay');
    if (hDelay) {
        hDelay.value = hallDelay;
        hDelay.oninput = e => {
            hallDelay = parseFloat(e.target.value);
            storage.setItem('hla_hallDelay', hallDelay);
            if (isHallEffect) recomputeEditBuffer();
        };
    }

    const hToggle = document.getElementById('hallToggle');
    if (hToggle) {
        hToggle.checked = isHallEffect;
        hToggle.onchange = e => toggleHallEffect(e.target.checked);
    }

    const nHall = document.getElementById('neighborHallToggle');
    if (nHall) {
        nHall.checked = neighborHall;
        nHall.onchange = e => toggleNeighborHall(e.target.checked);
    }

    const nToggle = document.getElementById('neighborToggle');
    if (nToggle) {
        nToggle.checked = isNeighborEffect;
        nToggle.onchange = e => toggleNeighborEffect(e.target.checked);
    }

    const tToggle = document.getElementById('tableMicToggle');
    if (tToggle) {
        tToggle.checked = isTableMicEffect;
        tToggle.onchange = e => toggleTableMicEffect(e.target.checked);
    }

    const tRoom = document.getElementById('tableMicRoom');
    if (tRoom) {
        tRoom.value = tableMicRoomType;
        tRoom.onchange = e => {
            tableMicRoomType = e.target.value;
            if (isTableMicEffect) recomputeEditBuffer();
        };
    }

    const emiVoice = document.getElementById('emiVoiceDampToggle');
    if (emiVoice) {
        emiVoice.checked = emiVoiceDamp;
        emiVoice.onchange = e => toggleEmiVoiceDamp(e.target.checked);
    }

    const emiLevelEl = document.getElementById('emiLevel');
    const emiLevelDisp = document.getElementById('emiLevelDisplay');
    if (emiLevelEl && emiLevelDisp) {
        emiLevelEl.value = emiNoiseLevel;
        emiLevelDisp.textContent = Math.round(emiNoiseLevel * 100) + '%';
        emiLevelEl.oninput = e => {
            emiNoiseLevel = parseFloat(e.target.value);
            storage.setItem('hla_emiNoiseLevel', emiNoiseLevel);
            emiLevelDisp.textContent = Math.round(emiNoiseLevel * 100) + '%';
            if (isEmiEffect) recomputeEditBuffer();
        };
    }

    const emiRamp = document.getElementById('emiRamp');
    const emiRampDisp = document.getElementById('emiRampDisplay');
    if (emiRamp && emiRampDisp) {
        emiRamp.value = emiRampPosition;
        emiRampDisp.textContent = Math.round(emiRampPosition * 100) + '%';
        emiRamp.oninput = e => {
            emiRampPosition = parseFloat(e.target.value);
            storage.setItem('hla_emiRamp', emiRampPosition);
            emiRampDisp.textContent = Math.round(emiRampPosition * 100) + '%';
        };
    }

    const emiModeEl = document.getElementById('emiMode');
    if (emiModeEl) {
        emiModeEl.value = emiRampMode;
        emiModeEl.onchange = e => {
            emiRampMode = e.target.value;
            storage.setItem('hla_emiMode', emiRampMode);
        };
    }

    const emiDropProb = document.getElementById('emiDropoutProb');
    const emiDropProbDisp = document.getElementById('emiDropoutProbDisplay');
    if (emiDropProb && emiDropProbDisp) {
        emiDropProb.value = emiDropoutProb;
        emiDropProbDisp.textContent = (emiDropoutProb * 100).toFixed(2) + '%';
        emiDropProb.oninput = e => {
            emiDropoutProb = parseFloat(e.target.value);
            storage.setItem('hla_emiDropoutProb', emiDropoutProb);
            emiDropProbDisp.textContent = (emiDropoutProb * 100).toFixed(2) + '%';
        };
    }

    const emiDropDur = document.getElementById('emiDropoutDur');
    const emiDropDurDisp = document.getElementById('emiDropoutDurDisplay');
    if (emiDropDur && emiDropDurDisp) {
        emiDropDur.value = emiDropoutDur;
        emiDropDurDisp.textContent = Math.round(emiDropoutDur * 1000) + ' ms';
        emiDropDur.oninput = e => {
            emiDropoutDur = parseFloat(e.target.value);
            storage.setItem('hla_emiDropoutDur', emiDropoutDur);
            emiDropDurDisp.textContent = Math.round(emiDropoutDur * 1000) + ' ms';
        };
    }

    const emiCrackleProb = document.getElementById('emiCrackleProb');
    const emiCrackleProbDisp = document.getElementById('emiCrackleProbDisplay');
    if (emiCrackleProb && emiCrackleProbDisp) {
        emiCrackleProb.value = emiCrackleProb;
        emiCrackleProbDisp.textContent = (emiCrackleProb * 100).toFixed(2) + '%';
        emiCrackleProb.oninput = e => {
            emiCrackleProb = parseFloat(e.target.value);
            storage.setItem('hla_emiCrackleProb', emiCrackleProb);
            emiCrackleProbDisp.textContent = (emiCrackleProb * 100).toFixed(2) + '%';
            if (isEmiEffect) recomputeEditBuffer();
        };
    }

    const emiCrackleAmp = document.getElementById('emiCrackleAmp');
    const emiCrackleAmpDisp = document.getElementById('emiCrackleAmpDisplay');
    if (emiCrackleAmp && emiCrackleAmpDisp) {
        emiCrackleAmp.value = emiCrackleAmp;
        emiCrackleAmpDisp.textContent = Math.round(emiCrackleAmp * 100) + '%';
        emiCrackleAmp.oninput = e => {
            emiCrackleAmp = parseFloat(e.target.value);
            storage.setItem('hla_emiCrackleAmp', emiCrackleAmp);
            emiCrackleAmpDisp.textContent = Math.round(emiCrackleAmp * 100) + '%';
            if (isEmiEffect) recomputeEditBuffer();
        };
    }

    const emiSpikeProb = document.getElementById('emiSpikeProb');
    const emiSpikeProbDisp = document.getElementById('emiSpikeProbDisplay');
    if (emiSpikeProb && emiSpikeProbDisp) {
        emiSpikeProb.value = emiSpikeProb;
        emiSpikeProbDisp.textContent = (emiSpikeProb * 100).toFixed(2) + '%';
        emiSpikeProb.oninput = e => {
            emiSpikeProb = parseFloat(e.target.value);
            storage.setItem('hla_emiSpikeProb', emiSpikeProb);
            emiSpikeProbDisp.textContent = (emiSpikeProb * 100).toFixed(2) + '%';
            if (isEmiEffect) recomputeEditBuffer();
        };
    }

    const emiSpikeAmp = document.getElementById('emiSpikeAmp');
    const emiSpikeAmpDisp = document.getElementById('emiSpikeAmpDisplay');
    if (emiSpikeAmp && emiSpikeAmpDisp) {
        emiSpikeAmp.value = emiSpikeAmp;
        emiSpikeAmpDisp.textContent = Math.round(emiSpikeAmp * 100) + '%';
        emiSpikeAmp.oninput = e => {
            emiSpikeAmp = parseFloat(e.target.value);
            storage.setItem('hla_emiSpikeAmp', emiSpikeAmp);
            emiSpikeAmpDisp.textContent = Math.round(emiSpikeAmp * 100) + '%';
            if (isEmiEffect) recomputeEditBuffer();
        };
    }

    const emiPresetSelect = document.getElementById('emiPresetSelect');
    if (emiPresetSelect) {
        updateEmiPresetList();
        emiPresetSelect.onchange = e => loadEmiPreset(e.target.value);
    }

    updateEffectButtons();

    window.onmousemove = e => {
        if (!deCanvas) return;
        if (editDragging) {
            const rect = deCanvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const time = Math.max(0, Math.min(x / deCanvas.width * editDurationMs, editDurationMs));
            if (editDragging === 'start') {
                editStartTrim = Math.min(time, editDurationMs - editEndTrim - 1);
            } else if (editDragging === 'end') {
                editEndTrim = Math.min(editDurationMs - time, editDurationMs - editStartTrim - 1);
            }
            const sField = document.getElementById('editStart');
            const eField = document.getElementById('editEnd');
            setTrimInputValueSafe(sField, editStartTrim);
            setTrimInputValueSafe(eField, editDurationMs - editEndTrim);
            validateDeSelection();
            scheduleWaveformUpdate();
            return;
        }
        if (ignoreDragging) {
            const r = editIgnoreRanges[ignoreDragging.index];
            if (ignoreDragging.side === 'start') {
                r.start = Math.min(time, r.end - 1);
            } else {
                r.end = Math.max(time, r.start + 1);
            }
            refreshIgnoreList();
            scheduleWaveformUpdate();
            return;
        }
        if (silenceDragging) {
            const r = editSilenceRanges[silenceDragging.index];
            if (silenceDragging.side === 'start') {
                r.start = Math.min(time, r.end - 1);
            } else {
                r.end = Math.max(time, r.start + 1);
            }
            refreshSilenceList();
            scheduleWaveformUpdate();
            return;
        }
    };

    window.onmouseup = e => {
        if (enSelecting && editEnBuffer) {
            enSelecting = false;
            const start = Math.min(enSelectStart, enSelectEnd);
            const end = Math.max(enSelectStart, enSelectEnd);
            if (Math.abs(end - start) < 2) {
                enSelectStart = enPrevStart;
                enSelectEnd = enPrevEnd;
                if (startField) startField.value = Math.round(enSelectStart);
                if (endField) endField.value = Math.round(enSelectEnd);
                editOrigCursor = start;
                if (editPlaying === 'orig') {
                    const audio = document.getElementById('audioPlayer');
                    audio.currentTime = Math.min(editOrigCursor, editDurationMs) / 1000;
                }
            } else {
                if (startField) startField.value = Math.round(start);
                if (endField) endField.value = Math.round(end);
            }
            validateEnSelection();
            updateDeEditWaveforms();
        } else if (enMarkerDragging && editEnBuffer) {
            const start = Math.min(enSelectStart, enSelectEnd);
            const end = Math.max(enSelectStart, enSelectEnd);
            if (startField) startField.value = Math.round(start);
            if (endField) endField.value = Math.round(end);
            validateEnSelection();
            updateDeEditWaveforms();
        } else if (deSelecting) {
            deSelecting = false;
            const rect = deCanvas.getBoundingClientRect();
            const finalTime = (e.clientX - rect.left) / rect.width * editDurationMs;
            const start = Math.min(deDragStart, finalTime);
            const end = Math.max(deDragStart, finalTime);
            if (Math.abs(end - start) < 2) {
                editStartTrim = dePrevStartTrim;
                editEndTrim = dePrevEndTrim;
                const sField = document.getElementById('editStart');
                const eField = document.getElementById('editEnd');
                setTrimInputValueSafe(sField, editStartTrim);
                setTrimInputValueSafe(eField, editDurationMs - editEndTrim);
                editDeCursor = start;
                if (editPlaying === 'de') {
                    const audio = document.getElementById('audioPlayer');
                    const dur = editDurationMs - editStartTrim - editEndTrim;
                    audio.currentTime = Math.min(Math.max(editDeCursor - editStartTrim, 0), dur) / 1000;
                }
            }
            validateDeSelection();
            updateDeEditWaveforms();
        }
        enMarkerDragging = null;
        editDragging = null;
        ignoreDragging = null;
        silenceDragging = null;
    };

    deEditEscHandler = e => {
        if (e.key === 'Escape') {
            if (activeWave === 'en') {
                enSelectStart = 0;
                enSelectEnd = 0;
                if (startField) startField.value = '';
                if (endField) endField.value = '';
                resetCanvasZoom(origCanvas);
                validateEnSelection();
                scheduleWaveformUpdate();
            } else if (activeWave === 'de') {
                editStartTrim = 0;
                editEndTrim = 0;
                const sField = document.getElementById('editStart');
                const eField = document.getElementById('editEnd');
                setTrimInputValueSafe(sField, 0);
                setTrimInputValueSafe(eField, editDurationMs);
                resetCanvasZoom(deCanvas);
                validateDeSelection();
                scheduleWaveformUpdate();
            }
            scheduleWaveformUpdate();
        }
    };

    window.addEventListener('keydown', deEditEscHandler);
    updateEffectButtons();
}
// =========================== OPENDEEDIT END ================================

// Liefert einen sprechenden Namen für ausgelöste Funktionen
function determineDeDebugFunction(target) {
    if (!target) return 'Unbekannte Funktion';
    if (target.dataset && target.dataset.deDebugFunc) return target.dataset.deDebugFunc;
    const handler = target.onclick || target.onchange || target.oninput;
    if (typeof handler === 'function' && handler.name) return handler.name;
    if (target.getAttribute) {
        const attr = target.getAttribute('onclick') || target.getAttribute('onchange') || target.getAttribute('oninput');
        const inlineName = extractInlineFunctionName(attr);
        if (inlineName) return inlineName;
    }
    if (target.id) return target.id;
    if (target.name) return target.name;
    return target.tagName ? target.tagName.toLowerCase() : 'Unbekannte Funktion';
}

// Liest Funktionsnamen aus Inline-Handlern
function extractInlineFunctionName(attr) {
    if (!attr) return '';
    const match = attr.match(/^[\s\(]*([\w$.]+)/);
    return match ? match[1] : '';
}

// Beschreibt das angeklickte Element für das Protokoll
function describeDeEditTarget(target) {
    if (!target) return 'unbekanntes Element';
    const teile = [];
    if (target.tagName) teile.push(target.tagName.toLowerCase());
    if (target.id) teile.push(`#${target.id}`);
    if (target.name) teile.push(`name=${target.name}`);
    const label = target.getAttribute ? (target.getAttribute('aria-label') || target.title || '') : '';
    let text = '';
    if (!label && target.textContent) {
        text = target.textContent.trim().replace(/\s+/g, ' ');
    }
    const beschriftung = label || text;
    if (beschriftung) teile.push(`„${beschriftung}”`);
    return teile.join(' ');
}

// Reagiert auf alle Klicks innerhalb des Dialogs und protokolliert sie streng
function handleDeDebugClick(event) {
    const dialog = document.getElementById('deEditDialog');
    if (!dialog) return;
    const rawTarget = event.target.closest('button, input[type="button"], input[type="submit"], input[type="checkbox"], input[type="radio"], label');
    if (!rawTarget || !dialog.contains(rawTarget)) return;
    if (rawTarget.id === 'deDebugConsole') return;
    let target = rawTarget;
    if (rawTarget.tagName && rawTarget.tagName.toLowerCase() === 'label' && rawTarget.htmlFor) {
        const related = document.getElementById(rawTarget.htmlFor);
        if (related) {
            target = related;
        }
    }
    const funktion = determineDeDebugFunction(target);
    const zielBeschreibung = target === rawTarget
        ? describeDeEditTarget(target)
        : `${describeDeEditTarget(rawTarget)} → ${describeDeEditTarget(target)}`;
    let extra = '';
    if (target instanceof HTMLInputElement && (target.type === 'checkbox' || target.type === 'radio')) {
        extra = target.checked ? 'Status: aktiv' : 'Status: inaktiv';
    }
    logDeDebug(funktion, `Klick auf ${zielBeschreibung}`, extra);
}

// Zeichnet Änderungen an Eingaben und Auswahlelementen auf
function handleDeDebugChange(event) {
    const dialog = document.getElementById('deEditDialog');
    const target = event.target;
    if (!dialog || !target || !dialog.contains(target) || target.id === 'deDebugConsole') return;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement)) return;
    const funktion = determineDeDebugFunction(target);
    const beschreibung = describeDeEditTarget(target);
    let wert = '';
    if (target instanceof HTMLInputElement) {
        if (target.type === 'checkbox' || target.type === 'radio') {
            wert = target.checked ? 'aktiv' : 'inaktiv';
        } else {
            wert = target.value;
        }
    } else {
        wert = target.value;
    }
    logDeDebug(funktion, `Änderung an ${beschreibung}`, `Wert: ${wert}`);
}

// Protokolliert kontinuierliche Änderungen an Schiebereglern, ohne zu fluten
function handleDeDebugInput(event) {
    const dialog = document.getElementById('deEditDialog');
    const target = event.target;
    if (!dialog || !target || !dialog.contains(target)) return;
    if (!(target instanceof HTMLInputElement) || target.type !== 'range') return;
    const jetzt = Date.now();
    if (jetzt - deDebugLastInputLog < 200) return; // Drosselung, damit das Protokoll lesbar bleibt
    deDebugLastInputLog = jetzt;
    const funktion = determineDeDebugFunction(target);
    const beschreibung = describeDeEditTarget(target);
    logDeDebug(funktion, `Live-Wert an ${beschreibung}`, `Wert: ${target.value}`);
}

// Blendet das Debug-Fenster ein oder aus
function toggleDeDebugPanel(forceState, options = {}) {
    ensureDeDebugPanel();
    const dialog = document.querySelector('#deEditDialog .dialog');
    const panel = document.getElementById('deDebugPanel');
    const button = document.getElementById('deDebugBtn');
    if (!dialog || !panel) return false;
    const silent = options && options.silent === true;
    const show = typeof forceState === 'boolean' ? forceState : !deDebugPanelVisible;
    deDebugPanelVisible = show;
    panel.setAttribute('aria-hidden', show ? 'false' : 'true');
    dialog.classList.toggle('debug-open', show);
    panel.classList.toggle('visible', show);
    if (button) {
        button.classList.toggle('debug-active', show);
    }
    if (!silent) {
        logDeDebug('toggleDeDebugPanel', show ? 'Fenster geöffnet' : 'Fenster geschlossen');
    }
    return show;
}

// Stellt sicher, dass andere Skripte das Toggle ebenfalls nutzen können
if (typeof window !== 'undefined') {
    window.toggleDeDebugPanel = toggleDeDebugPanel;
    window.openDeDebugPanel = () => toggleDeDebugPanel(true);
    window.closeDeDebugPanel = () => toggleDeDebugPanel(false);
}

// Sichert Eingabewerte für Trim-Felder gegen Überläufe oberhalb der Gesamtdauer ab
function setTrimInputValueSafe(input, valueMs, maxDurationMs = editDurationMs) {
    if (!input) return;
    const sichereDauer = Number.isFinite(maxDurationMs) && maxDurationMs > 0 ? Math.floor(maxDurationMs) : 0;
    const kandidat = Number.isFinite(valueMs) ? Math.floor(valueMs) : 0;
    input.value = Math.max(0, Math.min(kandidat, sichereDauer));
}

// Normalisiert die Trim-Werte nach Änderungen der Gesamtdauer und hält die Eingabefelder konsistent
function normalizeDeTrim() {
    // Unerwartete Dauern abfangen und auf 0 begrenzen
    if (!Number.isFinite(editDurationMs) || editDurationMs < 0) {
        editDurationMs = 0;
    }
    const maxDuration = editDurationMs;
    // Start begrenzen
    editStartTrim = Math.max(0, Math.min(editStartTrim, maxDuration));
    // End-Trim darf nicht über die verbleibende Länge hinausgehen
    const maxEndTrim = Math.max(0, maxDuration - editStartTrim);
    editEndTrim = Math.max(0, Math.min(editEndTrim, maxEndTrim));

    // Eingabefelder synchronisieren
    const startInput = document.getElementById('editStart');
    setTrimInputValueSafe(startInput, editStartTrim, maxDuration);
    const endInput = document.getElementById('editEnd');
    setTrimInputValueSafe(endInput, maxDuration - editEndTrim, maxDuration);

    validateDeSelection();
}

if (!Number.isFinite(waveZoomLevel) || waveZoomLevel <= 0) {
    waveZoomLevel = 1.0;
} else {
    waveZoomLevel = Math.max(WAVE_ZOOM_MIN, Math.min(WAVE_ZOOM_MAX, waveZoomLevel));
}
if (!Number.isFinite(waveHeightPx) || waveHeightPx < 60) {
    waveHeightPx = 80;
}

let deDragStart           = null;  // Startposition beim Ziehen im DE-Wave
let deSelecting           = false; // Wahr während Ziehen im DE-Wave
let dePrevStartTrim       = 0;     // Vorheriger Start-Trim
let dePrevEndTrim         = 0;     // Vorheriger End-Trim
let activeWave            = null;  // Merkt die letzte aktive Wellenform
let updateWaveTimer       = null;  // Debounce-Timer für die Zeichnung
let deEditEscHandler      = null;  // Handler zum Entfernen bei ESC
let deSelectionActive     = false; // Gibt an, ob eine DE-Markierung existiert

// Aktualisierung der Wellenbilder begrenzt ausführen, damit das Ziehen live sichtbar bleibt
function scheduleWaveformUpdate() {
    if (updateWaveTimer) return;
    updateWaveTimer = setTimeout(() => {
        updateDeEditWaveforms();
        updateWaveTimer = null;
    }, 120);
}

// Zoomt eine Canvas auf den angegebenen Bereich
function zoomCanvasToRange(canvas, startMs, endMs, totalMs) {
    if (!canvas) return;
    const ratio = (endMs - startMs) / totalMs;
    const scale = Math.min(10, 1 / ratio);
    const selWidth = canvas.width * ratio * scale;
    const container = canvas.parentElement;
    const cWidth = container ? container.clientWidth : canvas.width;
    const offset = -startMs / totalMs * canvas.width * scale + (cWidth - selWidth) / 2;
    canvas.style.transformOrigin = '0 0';
    canvas.style.transform = `translateX(${offset}px) scaleX(${scale})`;
}

// Setzt den Zoom einer Canvas zurück
function resetCanvasZoom(canvas) {
    if (canvas) canvas.style.transform = '';
}

// Aktualisiert die Anzeige der Zoom- und Höheneinstellungen im Toolbarbereich
function updateWaveToolbarDisplays() {
    const zoomDisplay = document.getElementById('waveZoomDisplay');
    if (zoomDisplay) {
        zoomDisplay.textContent = `${Math.round(waveZoomLevel * 100)}%`;
    }
    const zoomRange = document.getElementById('waveZoomRange');
    if (zoomRange) {
        zoomRange.value = waveZoomLevel.toFixed(1);
    }
    const heightDisplay = document.getElementById('waveHeightDisplay');
    if (heightDisplay) {
        heightDisplay.textContent = `${waveHeightPx}px`;
    }
    const heightRange = document.getElementById('waveHeightRange');
    if (heightRange) {
        heightRange.value = waveHeightPx;
    }
    const syncCheckbox = document.getElementById('waveSyncScroll');
    if (syncCheckbox) {
        syncCheckbox.checked = waveSyncScroll;
    }
    syncTimelineWithControls();
}

// Aktualisiert die Dimensionen der Wellenform-Canvas entsprechend der aktuellen Einstellungen
function updateWaveCanvasDimensions() {
    const canvases = [
        { canvas: document.getElementById('waveOriginal'), ratio: maxWaveSeconds ? currentEnSeconds / maxWaveSeconds : 1 },
        { canvas: document.getElementById('waveEdited'), ratio: maxWaveSeconds ? currentDeSeconds / maxWaveSeconds : 1 }
    ];
    const baseWidth = 640;
    const minWidth = 60;
    canvases.forEach(entry => {
        const { canvas, ratio } = entry;
        if (!canvas) return;
        const effectiveRatio = Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
        const widthPx = Math.max(minWidth, Math.round(baseWidth * waveZoomLevel * effectiveRatio));
        canvas.width = widthPx;
        canvas.height = waveHeightPx;
        // Breite jetzt in Pixeln setzen, damit lange DE-Spuren proportional dargestellt werden
        canvas.style.width = `${widthPx}px`;
        canvas.style.height = `${waveHeightPx}px`;
    });
    updateWaveRulers();
    bindWaveScrollSync();
    updateMasterTimeline();
}

// Zentriert einen Zeitabschnitt innerhalb eines Scroll-Containers
function centerScrollOnRange(container, startMs, endMs, totalMs) {
    if (!container || totalMs <= 0) return;
    const scrollable = container.scrollWidth - container.clientWidth;
    if (scrollable <= 0) return;
    const center = (startMs + endMs) / 2;
    const ratio = Math.min(1, Math.max(0, center / totalMs));
    container.scrollLeft = scrollable * ratio;
}

// Synchronisiert die Scrollposition eines Zielcontainers mit der Quelle
function syncScrollPositions(source, target) {
    if (!source || !target) return;
    const sourceScrollable = source.scrollWidth - source.clientWidth;
    const targetScrollable = target.scrollWidth - target.clientWidth;
    if (sourceScrollable <= 0 || targetScrollable <= 0) {
        target.scrollLeft = 0;
        return;
    }
    const ratio = source.scrollLeft / sourceScrollable;
    target.scrollLeft = ratio * targetScrollable;
}

// Aktiviert das gekoppelte Scrollen beider Wellenformen
function bindWaveScrollSync() {
    const origScroll = document.getElementById('waveOriginalScroll');
    const deScroll = document.getElementById('waveEditedScroll');
    if (!origScroll || !deScroll) return;
    origScroll.onscroll = () => {
        if (waveSyncScroll && !waveScrollSyncing) {
            waveScrollSyncing = true;
            syncScrollPositions(origScroll, deScroll);
            waveScrollSyncing = false;
        }
        updateMasterTimeline();
    };
    deScroll.onscroll = () => {
        if (waveSyncScroll && !waveScrollSyncing) {
            waveScrollSyncing = true;
            syncScrollPositions(deScroll, origScroll);
            waveScrollSyncing = false;
        }
        updateMasterTimeline();
    };
}

// Fokussiert die aktuelle Auswahl oder den Cursor in der Ansicht
function focusWaveSelection() {
    let handled = false;
    const origScroll = document.getElementById('waveOriginalScroll');
    if (origScroll && editEnBuffer && Math.abs(enSelectEnd - enSelectStart) > 5) {
        const totalMs = editEnBuffer.length / editEnBuffer.sampleRate * 1000;
        const start = Math.min(enSelectStart, enSelectEnd);
        const end = Math.max(enSelectStart, enSelectEnd);
        centerScrollOnRange(origScroll, start, end, totalMs);
        handled = true;
    }
    const deScroll = document.getElementById('waveEditedScroll');
    if (deScroll && originalEditBuffer) {
        if (deSelectionActive) {
            const start = editStartTrim;
            const end = editDurationMs - editEndTrim;
            if (end > start) {
                centerScrollOnRange(deScroll, start, end, editDurationMs);
                handled = true;
            }
        } else if (!handled && editDurationMs > 0) {
            const cursor = Math.min(editDeCursor, editDurationMs);
            centerScrollOnRange(deScroll, cursor - 100, cursor + 100, editDurationMs);
            handled = true;
        }
    }
    if (!handled) {
        if (origScroll) origScroll.scrollLeft = 0;
        if (deScroll) deScroll.scrollLeft = 0;
    }
}

// Zeichnet die Zeitmarken für eine Wellenform
function drawWaveRuler(rulerEl, canvas, buffer) {
    if (!rulerEl || !canvas || !buffer) return;
    const totalMs = buffer.length / buffer.sampleRate * 1000;
    if (!Number.isFinite(totalMs) || totalMs <= 0) {
        rulerEl.innerHTML = '';
        return;
    }
    const pxPerMs = canvas.width / totalMs;
    const step = computeRulerStep(totalMs);
    rulerEl.innerHTML = '';
    rulerEl.style.width = `${canvas.width}px`;
    for (let t = 0; t <= totalMs; t += step) {
        const mark = document.createElement('div');
        mark.className = 'wave-ruler-mark';
        mark.style.left = `${t * pxPerMs}px`;
        const seconds = t / 1000;
        const decimals = step >= 1000 ? 0 : 1;
        mark.innerHTML = `<span>${seconds.toFixed(decimals)}s</span>`;
        rulerEl.appendChild(mark);
    }
}

// Wählt einen passenden Schritt für die Zeitmarken abhängig von der Gesamtlänge
function computeRulerStep(totalMs) {
    const steps = [100, 200, 250, 500, 1000, 2000, 5000, 10000, 20000, 30000, 60000];
    for (const step of steps) {
        if (totalMs / step <= 12) {
            return step;
        }
    }
    return 120000;
}

// Aktualisiert beide Lineale basierend auf den aktuellen Canvas-Größen
function updateWaveRulers() {
    const origCanvas = document.getElementById('waveOriginal');
    const origRuler = document.getElementById('waveOriginalRuler');
    if (origCanvas && origRuler && editEnBuffer) {
        drawWaveRuler(origRuler, origCanvas, editEnBuffer);
    }
    const deCanvas = document.getElementById('waveEdited');
    const deRuler = document.getElementById('waveEditedRuler');
    if (deCanvas && deRuler && originalEditBuffer) {
        drawWaveRuler(deRuler, deCanvas, originalEditBuffer);
    }
}

// Ermittelt aktuelle Maße der DE-Wellenform für die Timeline
function gatherWaveViewportMetrics() {
    const deScroll = document.getElementById('waveEditedScroll');
    const deCanvas = document.getElementById('waveEdited');
    if (!deScroll || !deCanvas) return null;
    const scrollable = Math.max(0, deScroll.scrollWidth - deScroll.clientWidth);
    const fraction = scrollable > 0 ? deScroll.scrollLeft / scrollable : 0;
    return {
        scrollLeft: deScroll.scrollLeft,
        viewportWidth: deScroll.clientWidth,
        canvasWidth: deCanvas.width,
        scrollFraction: fraction
    };
}

// Synchronisiert Sliderwerte der Timeline mit den aktuellen Zuständen
function syncTimelineWithControls() {
    if (typeof syncWaveTimelineControls !== 'function') return;
    const metrics = gatherWaveViewportMetrics();
    const fraction = metrics ? metrics.scrollFraction : 0;
    syncWaveTimelineControls({ zoom: waveZoomLevel, scrollFraction: fraction });
}

// Zeichnet Timeline und Marker entsprechend der aktuellen Positionen
function updateMasterTimeline() {
    const metrics = gatherWaveViewportMetrics();
    const fraction = metrics ? metrics.scrollFraction : 0;
    if (typeof renderWaveTimeline === 'function') {
        renderWaveTimeline({
            zoom: waveZoomLevel,
            scrollFraction: fraction
        });
    } else {
        syncTimelineWithControls();
    }
}

// Übernimmt einen neuen Zoomwert aus der Timeline
function handleTimelineZoomChange(value) {
    if (!Number.isFinite(value)) return;
    const clamped = Math.max(WAVE_ZOOM_MIN, Math.min(WAVE_ZOOM_MAX, value));
    if (Math.abs(clamped - waveZoomLevel) < 0.001) {
        syncTimelineWithControls();
        return;
    }
    waveZoomLevel = clamped;
    storage.setItem('hla_waveZoomLevel', waveZoomLevel.toFixed(2));
    updateWaveToolbarDisplays();
    updateWaveCanvasDimensions();
    scheduleWaveformUpdate();
}

// Schrittweises Zoom-Update aus den Timeline-Knöpfen
function handleTimelineZoomStep(delta) {
    handleTimelineZoomChange(waveZoomLevel + delta);
}

// Setzt die Scrollposition beider Wellenformen synchronisiert
function setWaveScrollPosition(newScrollLeft) {
    const deScroll = document.getElementById('waveEditedScroll');
    if (!deScroll) return;
    const maxScroll = Math.max(0, deScroll.scrollWidth - deScroll.clientWidth);
    const clamped = Math.max(0, Math.min(maxScroll, newScrollLeft));
    waveScrollSyncing = true;
    deScroll.scrollLeft = clamped;
    if (waveSyncScroll) {
        const origScroll = document.getElementById('waveOriginalScroll');
        if (origScroll) {
            syncScrollPositions(deScroll, origScroll);
        }
    }
    waveScrollSyncing = false;
    updateMasterTimeline();
}

// Scrollt anhand der Knöpfe um einen halben Viewport
function handleTimelineScrollStep(direction) {
    const deScroll = document.getElementById('waveEditedScroll');
    if (!deScroll || !Number.isFinite(direction)) return;
    const step = deScroll.clientWidth * 0.5;
    setWaveScrollPosition(deScroll.scrollLeft + direction * step);
}

// Springt anhand des Positions-Sliders auf einen relativen Anteil
function handleTimelineScrollFraction(fraction) {
    const deScroll = document.getElementById('waveEditedScroll');
    if (!deScroll) return;
    const clamped = Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0));
    const maxScroll = Math.max(0, deScroll.scrollWidth - deScroll.clientWidth);
    setWaveScrollPosition(maxScroll * clamped);
}

// Initialisiert die Bedienelemente der Wave-Toolbar
function initWaveToolbar() {
    updateWaveToolbarDisplays();
    const zoomRange = document.getElementById('waveZoomRange');
    if (zoomRange) {
        zoomRange.oninput = e => {
            const val = parseFloat(e.target.value);
            if (!Number.isFinite(val)) return;
            waveZoomLevel = Math.max(WAVE_ZOOM_MIN, Math.min(WAVE_ZOOM_MAX, val));
            storage.setItem('hla_waveZoomLevel', waveZoomLevel.toFixed(2));
            updateWaveToolbarDisplays();
            updateWaveCanvasDimensions();
            scheduleWaveformUpdate();
        };
        zoomRange.onchange = zoomRange.oninput;
    }
    const heightRange = document.getElementById('waveHeightRange');
    if (heightRange) {
        heightRange.oninput = e => {
            const val = parseInt(e.target.value, 10);
            if (!Number.isFinite(val)) return;
            waveHeightPx = Math.max(60, Math.min(220, val));
            storage.setItem('hla_waveHeightPx', waveHeightPx.toString());
            updateWaveToolbarDisplays();
            updateWaveCanvasDimensions();
            scheduleWaveformUpdate();
        };
        heightRange.onchange = heightRange.oninput;
    }
    const syncCheckbox = document.getElementById('waveSyncScroll');
    if (syncCheckbox) {
        syncCheckbox.onchange = e => {
            waveSyncScroll = !!e.target.checked;
            storage.setItem('hla_waveSyncScroll', waveSyncScroll ? 'true' : 'false');
            bindWaveScrollSync();
        };
    }
    const fitBtn = document.getElementById('waveFitFullBtn');
    if (fitBtn) {
        fitBtn.onclick = () => {
            resetCanvasZoom(document.getElementById('waveOriginal'));
            resetCanvasZoom(document.getElementById('waveEdited'));
            const origScroll = document.getElementById('waveOriginalScroll');
            const deScroll = document.getElementById('waveEditedScroll');
            if (origScroll) origScroll.scrollLeft = 0;
            if (deScroll) deScroll.scrollLeft = 0;
        };
    }
    const focusBtn = document.getElementById('waveFocusSelectionBtn');
    if (focusBtn) {
        focusBtn.onclick = () => {
            focusWaveSelection();
        };
    }
    bindWaveScrollSync();
    if (typeof mountWaveTimeline === 'function') {
        mountWaveTimeline({
            onZoomChange: handleTimelineZoomChange,
            onZoomStep: handleTimelineZoomStep,
            onScrollStep: handleTimelineScrollStep,
            onScrollFractionChange: handleTimelineScrollFraction
        });
        syncTimelineWithControls();
    }
}

let draggedElement         = null;
let currentlyPlaying       = null;
let selectedRow            = null; // für Tastatur-Navigation
let pendingSelectId        = null; // Merkt die ID der zuletzt hinzugefügten Datei
let contextMenuFile        = null; // Rechtsklick-Menü-Datei
let versionMenuFile        = null; // Menü für Versionsauswahl
let projectContextId       = null; // Rechtsklick-Menü-Projekt
let levelContextName       = null; // Rechtsklick-Menü-Level
let chapterContextName     = null; // Rechtsklick-Menü-Kapitel
let currentSort            = { column: 'position', direction: 'asc' };
let displayOrder           = []; // Original-Dateireihenfolge
let expandedLevel          = null; // aktuell geöffneter Level
let levelChapters         = {}; // Zuordnung Level → Kapitel
let chapterOrders         = {}; // Reihenfolge der Kapitel
let expandedChapter       = null; // aktuell geöffnetes Kapitel
let chapterColors         = {}; // Farbe pro Kapitel
let currentRowNumber      = 1;  // Merkt die aktuelle Zeilennummer im Projekt
let currentRowElement     = null; // HTML-Element der aktuell markierten Zeile
let isAutoScrolling       = false; // Wahr, solange ein automatischer Scroll läuft
let autoScrollTimeout     = null;  // Timer zum Zurücksetzen von isAutoScrolling

// Status für Projekt-Wiedergabe
let projectPlayState       = 'stopped'; // 'playing', 'paused'
let projectPlayIndex       = 0;        // Aktuelle Datei im Projekt
let playbackFiles          = [];       // Gefilterte Liste fuer Projekt-Wiedergabe
let playbackStatus         = {};       // Merkt Existenz, Reihenfolge und Abspiel-Erfolg
let playbackProtocol       = '';       // Protokoll der Wiedergabe

// Automatische Backup-Einstellungen
let autoBackupInterval = parseInt(storage.getItem('hla_autoBackupInterval')) || 10; // Minuten
let autoBackupLimit    = parseInt(storage.getItem('hla_autoBackupLimit')) || 10;
let autoBackupTimer    = null;
// Maximale Anzahl an Sound-ZIP-Backups
let soundBackupLimit   = 5;

// Warteschlange für automatische Übersetzungen
let autoRetryDone      = false; // wurde eine fehlgeschlagene Übersetzung nach Neustart bereits neu versucht?
let translateQueue     = [];
let translateRunning   = false;
let translateCounter   = 0;
let translateCancelled = false;      // merkt, ob ein Abbruch aktiv ist
let currentTranslateProjectId = null; // merkt das Projekt der aktiven Übersetzung
let activeTranslateQueue      = null; // aktuell abgearbeitete Dateien
let activeTranslateIndex      = 0;    // Fortschritt innerhalb der aktiven Warteschlange
const pendingTranslations = new Map();

// Bricht alle offenen Übersetzungsaufträge ab und setzt die Fortschrittsanzeige zurück
function cancelTranslationQueue(grund = 'Übersetzung abgebrochen') {
    const fehler = grund instanceof Error ? grund : new Error(String(grund || 'Übersetzung abgebrochen'));

    translateCancelled = true;
    translateQueue.length = 0;
    activeTranslateQueue = null;
    activeTranslateIndex = 0;
    translateRunning = false;
    currentTranslateProjectId = null;

    for (const [id, eintrag] of pendingTranslations.entries()) {
        pendingTranslations.delete(id);
        if (eintrag && typeof eintrag.reject === 'function') {
            eintrag.reject(fehler);
        } else if (eintrag && typeof eintrag.resolve === 'function') {
            eintrag.resolve();
        }
    }

    updateTranslationQueueDisplay();

    const progress = document.getElementById('translateProgress');
    const status   = document.getElementById('translateStatus');
    const fill     = document.getElementById('translateFill');
    if (progress) progress.classList.remove('active');
    if (fill) fill.style.width = '0%';
    if (status) status.textContent = '';
}

if (typeof window !== 'undefined') {
    window.cancelTranslationQueue = cancelTranslationQueue;
}

// API-Key für ElevenLabs und hinterlegte Stimmen pro Ordner
let elevenLabsApiKey   = storage.getItem('hla_elevenLabsApiKey') || '';
// Gespeicherter API-Key für ChatGPT (wird verschlüsselt auf der Festplatte gespeichert)
let openaiApiKey       = '';
let openaiModel        = '';
// Merkt Szene und Zeilen für den GPT-Testdialog
let gptPromptData      = null;
// Speichert die Ergebnisse der letzten GPT-Bewertung
let gptEvaluationResults = null;
// Soll der GPT-Vorschlag sofort übernommen werden?
let autoApplySuggestion = storage.getItem('hla_autoApplySuggestion') === 'true';
if (typeof window !== 'undefined') {
    window.autoApplySuggestion = autoApplySuggestion;
}

// Liest gespeicherte GPT-Einstellungen beim Start ein
async function ladeGptEinstellungen() {
    if (window.electronAPI?.loadOpenaiSettings) {
        try {
            const data = await window.electronAPI.loadOpenaiSettings();
            openaiApiKey = data.key || '';
            openaiModel  = data.model || '';
        } catch (e) {
            console.error('GPT-Einstellungen konnten nicht geladen werden', e);
        }
    }
}
// Liste der verfügbaren Stimmen der API
let availableVoices    = [];
// Manuell hinzugefügte Stimmen
let customVoices       = JSON.parse(storage.getItem('hla_customVoices') || '[]');
// Zwischenspeicher für eingelesene Untertitel
let subtitleData       = null;
// Gespeicherte Voice-Settings aus dem LocalStorage laden
let storedVoiceSettings = JSON.parse(storage.getItem('hla_voiceSettings') || 'null');

// Setzt alle GPT-bezogenen Zustände zurück und entfernt UI-Reste
function clearGptState() {
    // Laufende GPT-Anfragen abbrechen
    if (typeof cancelGptRequests === 'function') {
        try { cancelGptRequests('Reset'); } catch {}
    } else if (typeof window !== 'undefined' && typeof window.cancelGptRequests === 'function') {
        try { window.cancelGptRequests('Reset'); } catch {}
    }
    // Globale Variablen leeren
    if (typeof files !== 'undefined') files = [];
    if (typeof gptPromptData !== 'undefined') gptPromptData = null;
    if (typeof gptEvaluationResults !== 'undefined') gptEvaluationResults = null;
    if (typeof displayOrder !== 'undefined') displayOrder = []; // Zeilenreihenfolge zurücksetzen
    // Vorschlagsboxen und Kommentare aus dem DOM entfernen
    if (typeof document !== 'undefined') {
        document.querySelectorAll('.suggestion-box, .comment-box, .emo-reason-box').forEach(el => el.remove());
        const tabs = document.getElementById('gptTestTabs');
        if (tabs) tabs.innerHTML = '';
    }
}
if (typeof window !== 'undefined') {
    window.clearGptState = clearGptState;
}

// Aktualisiert die Anzeige der gespeicherten Dubbing-Parameter im API-Dialog
function updateVoiceSettingsDisplay() {
    const list = document.getElementById('voiceSettingsDisplay');
    if (!list) return;
    list.innerHTML = '';
    if (!storedVoiceSettings) {
        list.textContent = 'Keine gespeichert';
        return;
    }
    const entries = [
        ['Stability', storedVoiceSettings.stability],
        ['Similarity Boost', storedVoiceSettings.similarity_boost],
        ['Style', storedVoiceSettings.style],
        ['Speed', storedVoiceSettings.speed],
        ['Speaker-Boost', storedVoiceSettings.use_speaker_boost]
    ];
    entries.forEach(([label, val]) => {
        const li = document.createElement('li');
        li.textContent = `${label}: ${val}`;
        list.appendChild(li);
    });
}
// Bevorzugtes Zeilenende für CSV-Dateien
let csvLineEnding = storage.getItem('hla_lineEnding') || 'LF';
// Merkt die Datei, für die der Dubbing-Dialog geöffnet wurde
let currentDubbingFileId = null;
// Gewählter Modus für Dubbing: 'beta' oder 'manual'
let currentDubMode = 'beta';
// Sprache des Dubbings: 'de' oder 'emo'
let currentDubLang = 'de';

// Letzte Einstellungen des Funk-Effekts
// Wet bestimmt das Mischverhältnis zwischen Original und Effekt
let radioEffectStrength = parseFloat(storage.getItem('hla_radioEffectStrength') || '0.85');
let radioHighpass      = parseFloat(storage.getItem('hla_radioHighpass') || '300');
let radioLowpass       = parseFloat(storage.getItem('hla_radioLowpass') || '3200');
let radioSaturation    = parseFloat(storage.getItem('hla_radioSaturation') || '0.2');
let radioNoise         = parseFloat(storage.getItem('hla_radioNoise') || '-26');
let radioCrackle       = parseFloat(storage.getItem('hla_radioCrackle') || '0.1');
// Gespeicherte Presets und zuletzt genutztes Preset
let radioPresets = JSON.parse(storage.getItem('hla_radioPresets') || '{}');
let lastRadioPreset = storage.getItem('hla_lastRadioPreset') || '';

// Letzte Einstellungen des Hall-Effekts
let hallRoom   = parseFloat(storage.getItem('hla_hallRoom') || '0.5');
let hallAmount = parseFloat(storage.getItem('hla_hallAmount') || '0.5');
let hallDelay  = parseFloat(storage.getItem('hla_hallDelay')  || '80');

// Merkt, ob der Nebenraum-Effekt zusätzlich mit Hall versehen werden soll
let neighborHall = storage.getItem('hla_neighborHall') === '1';

// Letzte Einstellungen für elektromagnetische Störgeräusche
let emiNoiseLevel = parseFloat(storage.getItem('hla_emiNoiseLevel') || '0.5');
// Startposition, ab der die Störung stärker wird (0 = sofort)
let emiRampPosition = parseFloat(storage.getItem('hla_emiRamp') || '0');
// Verlauf der Störung (konstant, Anstieg, Anstieg & Abfall, Abfall)
let emiRampMode = storage.getItem('hla_emiMode') || 'constant';
// Häufigkeit und Dauer der Aussetzer
let emiDropoutProb = parseFloat(storage.getItem('hla_emiDropoutProb') || '0.0005');
let emiDropoutDur  = parseFloat(storage.getItem('hla_emiDropoutDur')  || '0.02');
// Häufigkeit kurzer Knackser und deren Stärke
let emiCrackleProb = parseFloat(storage.getItem('hla_emiCrackleProb') || '0.005');
let emiCrackleAmp  = parseFloat(storage.getItem('hla_emiCrackleAmp')  || '0.3');
// Häufigkeit großer Ausreißer und deren Amplitude
let emiSpikeProb   = parseFloat(storage.getItem('hla_emiSpikeProb')   || '0.001');
let emiSpikeAmp    = parseFloat(storage.getItem('hla_emiSpikeAmp')    || '1.0');

// Dämpfung des Originalsignals bei Störereignissen
let emiVoiceDamp = storage.getItem('hla_emiVoiceDamp') === '1';

// Gespeicherte Presets für elektromagnetische Störgeräusche
let emiPresets = JSON.parse(storage.getItem('hla_emiPresets') || '{}');
// Zuletzt verwendetes EM-Preset
let lastEmiPreset = storage.getItem('hla_lastEmiPreset') || '';

// Gespeicherte URL für das Dubbing-Video (wird beim Start asynchron geladen)
let savedVideoUrl      = '';

// Listen für eigene Wörter
// Phonetische Umschrift und Übersetzungen werden erst nach dem Laden des Speichers gefüllt
let phoneticList    = [];
let translationList = [];

// Lädt beide Wörterbuchlisten aus dem aktuellen Speicher
async function loadWordLists() {
    try {
        // Phonetische Einträge lesen
        const phonRaw = await storage.getItem('hla_wordList');
        phoneticList = phonRaw ? JSON.parse(phonRaw) : [];
    } catch (e) {
        console.error('Phonetische Wörter konnten nicht geladen werden', e);
        phoneticList = [];
    }
    try {
        // Übersetzungen lesen
        const transRaw = await storage.getItem('hla_translationList');
        translationList = transRaw ? JSON.parse(transRaw) : [];
    } catch (e) {
        console.error('Übersetzungen konnten nicht geladen werden', e);
        translationList = [];
    }
}

// Beim Start initial aus dem aktuellen Speicher lesen
loadWordLists();

// Merkt das aktuell angezeigte Studio-Fenster
let studioModal = null;
// Zuletzt angezeigte Datei im "Download warten"-Dialog
window.waitDialogFileId = null;

// === Stacks für Undo/Redo ===
let undoStack          = [];
let redoStack          = [];

// Version wird zur Laufzeit ersetzt
// Aktuelle Programmversion
const APP_VERSION = '1.40.126';
// Basis-URL der API
const API = 'https://api.elevenlabs.io/v1';

// Debug-Schalter: true zeigt Konsolenlogs und Debug-Anzeige
const DEBUG_MODE = storage.getItem('hla_debug_mode') === 'true';

// Statusinformationen der geladenen Module für das Debug-Fenster
const moduleStatus = {
    elevenlabs:       { loaded: false, source: '' },
    dubbing:         { loaded: false, source: "" },
    elevenlabsLib:    { loaded: false, source: '' },
    extensionUtils:   { loaded: false, source: '' },
    closecaptionParser:{ loaded: false, source: '' },
    fileUtils:        { loaded: false, source: '' },
    videoFrameUtils: { loaded: false, source: '' },
    pathUtils:        { loaded: false, source: '' },
    gptService:       { loaded: false, source: '' },
    projectEvaluate:  { loaded: false, source: '' },
    projectStats:     { loaded: false, source: '' }
};

// Gemeinsame Funktionen aus elevenlabs.js laden
let downloadDubbingAudio, renderLanguage, pollRender;
let repairFileExtensions;
let loadClosecaptions;
let calculateTextSimilarity, levenshteinDistance;
let extractTime;
let extractRelevantFolder;
let pathUtilsPromise;
let evaluateScene;
let applyEvaluationResults;
let scoreVisibleLines;
let scoreCellTemplate, attachScoreHandlers, scoreClass, getContrastingTextColor, SCORE_COLORS;
// Platzhalter für Dubbing-Funktionen
let showDubbingSettings, showEmoDubbingSettings,
    closeEmoDubbingSettings, confirmEmoDubbingSettings,
    createDubbingCSV, validateCsv, msToSeconds, isDubReady,
    startDubbing, startEmoDubbing, redownloadDubbing, redownloadEmo,
    openDubbingPage, openLocalFile, startDubAutomation,
    showDownloadWaitDialog, copyFolderName, copyDownloadFolder,
    openStudioAndWait, dubStatusClicked, downloadDe,
    mountWaveTimeline, renderWaveTimeline, syncWaveTimelineControls;
let sharedProjectStatsCalculator;
if (typeof module !== 'undefined' && module.exports) {
    ({ downloadDubbingAudio, renderLanguage, pollRender } = require('../../elevenlabs'));
    moduleStatus.elevenlabs = { loaded: true, source: 'Main' };

    ({ showDubbingSettings, createDubbingCSV, validateCsv, msToSeconds, isDubReady,
       startDubbing, redownloadDubbing, openDubbingPage, openLocalFile,
       startDubAutomation, showDownloadWaitDialog, copyFolderName,
       copyDownloadFolder, openStudioAndWait, dubStatusClicked, downloadDe,
       mountWaveTimeline, renderWaveTimeline, syncWaveTimelineControls } = require('./dubbing.js'));
    moduleStatus.dubbing = { loaded: true, source: 'Main' };

    ({ repairFileExtensions } = require('../../extensionUtils'));
    moduleStatus.extensionUtils = { loaded: true, source: 'Main' };

    ({ loadClosecaptions } = require('../../closecaptionParser'));
    moduleStatus.closecaptionParser = { loaded: true, source: 'Main' };

    ({ calculateTextSimilarity, levenshteinDistance } = require('./fileUtils.js'));
    moduleStatus.fileUtils = { loaded: true, source: 'Main' };
    try {
        ({ extractTime } = require('../../utils/videoFrameUtils.js'));
        moduleStatus.videoFrameUtils = { loaded: true, source: 'Main' };
    } catch (err) {
        // Fallback: Wenn CommonJS den Helfer nicht parsen kann, dynamisch als ES-Modul laden
        moduleStatus.videoFrameUtils = { loaded: false, source: 'Main' };
        import('../../utils/videoFrameUtils.js').then(mod => {
            extractTime = mod.extractTime;
            moduleStatus.videoFrameUtils = { loaded: true, source: 'Main' };
        }).catch(() => { moduleStatus.videoFrameUtils = { loaded: false, source: 'Main' }; });
    }
    ({ extractRelevantFolder } = require('./pathUtils.js'));
    moduleStatus.pathUtils = { loaded: true, source: 'Main' };
    ({ calculateProjectStats: sharedProjectStatsCalculator } = require('./calculateProjectStats.js'));
    moduleStatus.projectStats = { loaded: true, source: 'Main' };
    import('./gptService.js').then(() => {
        evaluateScene = window.evaluateScene;
        moduleStatus.gptService = { loaded: true, source: 'Main' };
    }).catch(() => { moduleStatus.gptService = { loaded: false, source: 'Main' }; });
    import('./scoreColumn.js').then(mod => {
        scoreCellTemplate = mod.scoreCellTemplate;
        attachScoreHandlers = mod.attachScoreHandlers;
        scoreClass = mod.scoreClass;
        getContrastingTextColor = mod.getContrastingTextColor;
        SCORE_COLORS = mod.SCORE_COLORS;
        if (typeof window !== 'undefined') {
            window.attachScoreHandlers = attachScoreHandlers;
        }
    }).catch(() => { scoreCellTemplate = () => ''; attachScoreHandlers = () => {}; scoreClass = () => 'score-none'; getContrastingTextColor = () => '#fff'; SCORE_COLORS = {}; });
    import('./actions/projectEvaluate.js').then(mod => {
        // Funktionen entweder aus dem Modul oder von window uebernehmen
        applyEvaluationResults = mod.applyEvaluationResults ||
                                (mod.default && mod.default.applyEvaluationResults) ||
                                window.applyEvaluationResults;
        scoreVisibleLines = mod.scoreVisibleLines ||
                           (mod.default && mod.default.scoreVisibleLines) ||
                           window.scoreVisibleLines;
        moduleStatus.projectEvaluate = { loaded: true, source: 'Main' };
    }).catch(() => { moduleStatus.projectEvaluate = { loaded: false, source: 'Main' }; });
} else {
    const statsModule = window.hlaProjectStats;
    if (statsModule && typeof statsModule.calculateProjectStats === 'function') {
        sharedProjectStatsCalculator = statsModule.calculateProjectStats;
        moduleStatus.projectStats = { loaded: true, source: 'Ausgelagert' };
    } else {
        moduleStatus.projectStats = { loaded: false, source: 'Ausgelagert' };
    }
    import('./elevenlabs.js').then(mod => {
        downloadDubbingAudio = mod.downloadDubbingAudio;
        moduleStatus.elevenlabs = { loaded: true, source: 'Ausgelagert' };
    }).catch(() => { moduleStatus.elevenlabs = { loaded: false, source: 'Ausgelagert' }; });
    import('./lib/elevenlabs.js').then(mod => {
        renderLanguage = mod.renderLanguage;
        pollRender = mod.pollRender;
        moduleStatus.elevenlabsLib = { loaded: true, source: 'Ausgelagert' };
    }).catch(() => { moduleStatus.elevenlabsLib = { loaded: false, source: 'Ausgelagert' }; });
    // Funktionen aus extensionUtils.js stehen jetzt direkt unter window bereit
    repairFileExtensions = window.repairFileExtensions;
    moduleStatus.extensionUtils = { loaded: typeof repairFileExtensions === 'function', source: 'Ausgelagert' };
    // closecaptionParser als ES-Modul laden und Fallback auf window verwenden
    import('../../closecaptionParser.js').then(mod => {
        // Bei fehlendem Export wird die Funktion trotzdem unter window angelegt
        loadClosecaptions = mod.loadClosecaptions || window.loadClosecaptions;
        moduleStatus.closecaptionParser = { loaded: true, source: 'Ausgelagert' };
    }).catch(() => { moduleStatus.closecaptionParser = { loaded: false, source: 'Ausgelagert' }; });
    import('./fileUtils.mjs').then(mod => {
        calculateTextSimilarity = mod.calculateTextSimilarity;
        levenshteinDistance = mod.levenshteinDistance;
        moduleStatus.fileUtils = { loaded: true, source: 'Ausgelagert' };
    }).catch(() => { moduleStatus.fileUtils = { loaded: false, source: 'Ausgelagert' }; });
    import('../../utils/videoFrameUtils.js').then(mod => {
        extractTime = mod.extractTime;
        moduleStatus.videoFrameUtils = { loaded: true, source: 'Ausgelagert' };
    }).catch(() => { moduleStatus.videoFrameUtils = { loaded: false, source: 'Ausgelagert' }; });
    pathUtilsPromise = import('./pathUtils.mjs').then(mod => {
        extractRelevantFolder = mod.extractRelevantFolder;
        moduleStatus.pathUtils = { loaded: true, source: 'Ausgelagert' };
    }).catch(() => { moduleStatus.pathUtils = { loaded: false, source: 'Ausgelagert' }; });
    import('./gptService.js').then(() => {
        evaluateScene = window.evaluateScene;
        moduleStatus.gptService = { loaded: true, source: 'Ausgelagert' };
    }).catch(() => { moduleStatus.gptService = { loaded: false, source: 'Ausgelagert' }; });
    import('./scoreColumn.js').then(mod => {
        scoreCellTemplate = mod.scoreCellTemplate;
        attachScoreHandlers = mod.attachScoreHandlers;
        scoreClass = mod.scoreClass;
        getContrastingTextColor = mod.getContrastingTextColor;
        SCORE_COLORS = mod.SCORE_COLORS;
        if (typeof window !== 'undefined') {
            window.attachScoreHandlers = attachScoreHandlers;
        }
    }).catch(() => { scoreCellTemplate = () => ''; attachScoreHandlers = () => {}; scoreClass = () => 'score-none'; getContrastingTextColor = () => '#fff'; SCORE_COLORS = {}; });
    import('./actions/projectEvaluate.js').then(mod => {
        // Fallback auf window, falls keine Exporte vorhanden sind
        applyEvaluationResults = mod.applyEvaluationResults ||
                                (mod.default && mod.default.applyEvaluationResults) ||
                                window.applyEvaluationResults;
        scoreVisibleLines = mod.scoreVisibleLines ||
                           (mod.default && mod.default.scoreVisibleLines) ||
                           window.scoreVisibleLines;
        moduleStatus.projectEvaluate = { loaded: true, source: 'Ausgelagert' };
    }).catch(() => { moduleStatus.projectEvaluate = { loaded: false, source: 'Ausgelagert' }; });
    moduleStatus.dubbing = { loaded: false, source: 'Ausgelagert' };
}

// =========================== GLOBAL STATE END ===========================

// Entfernt versehentlich falsch gespeicherte Einträge aus dem DE-Cache
// =========================== DE-AUDIO-CACHE-HILFEN START ===========================
// Vereinheitlicht Schlüssel für den DE-Audio-Cache
function normalizeDeAudioCacheKey(key) {
    if (!key || typeof key !== 'string') return '';
    return key.replace(/^sounds\/DE\//i, '').toLowerCase();
}

// Aktualisiert den Index für einen bestimmten Schlüssel
function updateDeAudioCacheIndex(key) {
    const norm = normalizeDeAudioCacheKey(key);
    if (!norm) return;
    deAudioCacheIndex[norm] = key;
}

// Entfernt einen Schlüssel vollständig aus dem Index
function removeDeAudioCacheIndex(key) {
    const norm = normalizeDeAudioCacheKey(key);
    if (!norm) return;
    if (deAudioCacheIndex[norm] === key) {
        delete deAudioCacheIndex[norm];
    }
}

// Baut den kompletten Index neu auf
function rebuildDeAudioCacheIndex() {
    deAudioCacheIndex = {};
    for (const key of Object.keys(deAudioCache)) {
        updateDeAudioCacheIndex(key);
    }
    // Nach einem manuellen Neuaufbau darf der Fallback wieder aktiv werden
    deAudioCacheIndexFallbackTriggered = false;
}

// Schreibt einen Eintrag in den Cache und pflegt den Index
function setDeAudioCacheEntry(key, value) {
    if (!key) return;
    deAudioCache[key] = value;
    updateDeAudioCacheIndex(key);
}

// Löscht einen Eintrag und den passenden Indexeintrag
function deleteDeAudioCacheEntry(key) {
    if (!key) return;
    if (Object.prototype.hasOwnProperty.call(deAudioCache, key)) {
        delete deAudioCache[key];
        removeDeAudioCacheIndex(key);
    }
}

// Liefert den tatsächlichen Schlüssel anhand einer case-insensitiven Suche
function findDeAudioCacheKeyInsensitive(key) {
    const norm = normalizeDeAudioCacheKey(key);
    if (!norm) return null;
    if (Object.prototype.hasOwnProperty.call(deAudioCacheIndex, norm)) {
        const realKey = deAudioCacheIndex[norm];
        if (Object.prototype.hasOwnProperty.call(deAudioCache, realKey)) {
            return realKey;
        }
    }
    // Nur einmalig eine geschützte Reindizierung anstoßen, um kaputte Indizes zu reparieren
    if (!deAudioCacheIndexFallbackTriggered) {
        rebuildDeAudioCacheIndex();
        // Fallback-Zustand aktiv halten, damit dieser Weg nicht mehrfach genutzt wird
        deAudioCacheIndexFallbackTriggered = true;
        if (Object.prototype.hasOwnProperty.call(deAudioCacheIndex, norm)) {
            const realKey = deAudioCacheIndex[norm];
            if (Object.prototype.hasOwnProperty.call(deAudioCache, realKey)) {
                return realKey;
            }
        }
    }
    return null;
}

// Globale Bereitstellung der Helfer, damit andere Module sie nutzen können
if (typeof window !== 'undefined') {
    window.setDeAudioCacheEntry = setDeAudioCacheEntry;
    window.deleteDeAudioCacheEntry = deleteDeAudioCacheEntry;
    window.rebuildDeAudioCacheIndex = rebuildDeAudioCacheIndex;
    window.findDeAudioCacheKeyInsensitive = findDeAudioCacheKeyInsensitive;
}
// =========================== DE-AUDIO-CACHE-HILFEN END =============================

function cleanupDubCache() {
    for (const key of Object.keys(deAudioCache)) {
        if (key.match(/^sounds\/DE\//i)) {
            const neu = key.replace(/^sounds\/DE\//i, '');
            if (!deAudioCache[neu]) {
                setDeAudioCacheEntry(neu, deAudioCache[key]);
            }
            deleteDeAudioCacheEntry(key);
        } else {
            updateDeAudioCacheIndex(key);
        }
    }
    rebuildDeAudioCacheIndex();
}

// Bündelt alle Aktionsknöpfe der Toolbar in einer separaten Funktion
function setupToolbarActionButtons() {
    if (typeof document !== "undefined" && typeof document.getElementById === "function") {
        // Alle relevanten Buttons aus der Oberfläche holen
        const gptBtn = document.getElementById("gptScoreButton");
        const emoBtn = document.getElementById("generateEmotionsButton");
        const sendBtn = document.getElementById("sendTextV2Button");
        const copyBtn = document.getElementById("copyAssistantButton");
        const copyBtn2 = document.getElementById("copyAssistant2Button");
        const copyAllEmosBtn = document.getElementById("copyAllEmosButton"); // sammelt alle Emotionstexte
        const subtitleAllBtn = document.getElementById("subtitleSearchAllButton");
        const subtitleAllBtnInline = document.getElementById("subtitleSearchAllButtonInline");

        // Einzelne Klick-Listener nach Bedarf setzen
        if (gptBtn) {
            gptBtn.addEventListener("click", () => {
                if (currentProject?.gptTests?.length) {
                    openSavedGptTests();
                } else {
                    showGptStartDialog();
                }
            });
        }
        if (emoBtn) {
            emoBtn.addEventListener("click", generateEmotionsForAll);
        }
        if (sendBtn) {
            sendBtn.addEventListener("click", sendEmoTextsToApi);
        }
        if (copyBtn) {
            copyBtn.addEventListener("click", openCopyAssistant);
        }
        if (copyBtn2) {
            copyBtn2.addEventListener("click", openCopyAssistant2);
        }
        if (copyAllEmosBtn) {
            copyAllEmosBtn.addEventListener("click", copyAllEmotionsToClipboard);
        }
        if (subtitleAllBtn) {
            subtitleAllBtn.addEventListener("click", runGlobalSubtitleSearch);
        }
        if (subtitleAllBtn && subtitleAllBtnInline) {
            subtitleAllBtnInline.addEventListener("click", event => {
                // Weiterleitung auf den ursprünglichen Button, damit bestehende Logik greift
                event.preventDefault();
                event.stopPropagation();
                subtitleAllBtn.click();
            });
        }

        // Checkbox für Rest-Modus nach Projektwechsel neu verbinden
        const restBox = document.getElementById("restTranslationCheckbox");
        if (restBox) {
            restBox.addEventListener("change", e => {
                if (currentProject) {
                    currentProject.restTranslation = e.target.checked;
                    saveProjects();
                    if (window.setRestMode) {
                        window.setRestMode(e.target.checked);
                    } else {
                        window.restTranslationFlag = e.target.checked;
                    }
                }
            });
        }
    }
}

// Öffnet die gespeicherten GPT-Tabs ohne neue Bewertung
function openSavedGptTests() {
    renderGptTestTabs();
    if (currentProject && currentProject.gptTests?.length) {
        const idx = currentProject.gptTabIndex ?? 0;
        selectGptTestTab(Math.min(idx, currentProject.gptTests.length - 1));
    }
    document.getElementById('gptPromptDialog').classList.remove('hidden');
}

// Öffnet einen Dialog mit Zeilenzahl und Sprechern
function showGptStartDialog() {
    const visible = displayOrder.filter(item => {
        const row = document.querySelector(`tr[data-id='${item.file.id}']`);
        return row && row.offsetParent !== null;
    });
    const info = document.getElementById('gptStartInfo');
    const list = document.getElementById('gptStartSpeakers');
    const speakers = [...new Set(visible.map(v => v.file.folder))].sort();
    const lines = visible.map(v => ({ en: v.file.enText || '', de: v.file.deText || '' }));
    const unique = new Set(lines.map(l => `${l.en}\u0000${l.de}`)).size;
    const dup = lines.length - unique;
    if (info) {
        info.textContent = dup > 0
            ? `${lines.length} Zeilen, ${unique} werden übertragen (${dup} doppelt).`
            : `${lines.length} Zeilen werden übertragen.`;
    }
    if (list) list.innerHTML = speakers.map(s => `<li>${s}</li>`).join('');
    document.getElementById('gptStartDialog').classList.remove('hidden');
}

function closeGptStartDialog() {
    document.getElementById('gptStartDialog').classList.add('hidden');
}

// Startet die eigentliche Bewertung nach Bestätigung
function startGptScoring() {
    closeGptStartDialog();
    const visible = displayOrder.filter(item => {
        const row = document.querySelector(`tr[data-id='${item.file.id}']`);
        return row && row.offsetParent !== null;
    });
    const lines = visible.map(({ file }) => ({
        id: file.id,
        // Charakter entspricht dem Ordnernamen
        character: file.character || file.folder || '',
        en: file.enText || '',
        de: file.deText || ''
    }));
    const scene = currentProject?.levelName || '';
    gptPromptData = { scene, lines };
    showGptPromptDialog();
}

// Zeigt den Testdialog mit dem kompletten Prompt
function showGptPromptDialog() {
    const area = document.getElementById('gptPromptArea');
    if (!area || !gptPromptData) return;
    const sys = typeof window.getSystemPrompt === 'function'
        ? window.getSystemPrompt() : '';
    const promptText = `System:\n${sys}\n\nUser:\n${JSON.stringify(gptPromptData, null, 2)}`;
    area.value = promptText;
    const resultArea = document.getElementById('gptResultArea');
    if (resultArea) resultArea.value = '';
    resetGptProgressUI(gptPromptData.lines ? gptPromptData.lines.length : 0);
    const summaryBody = document.querySelector('#gptSummaryTable tbody');
    if (summaryBody) summaryBody.innerHTML = '';
    // Einfüge-Knopf deaktivieren und alte Ergebnisse löschen
    gptEvaluationResults = null;
    const insertBtn = document.getElementById('gptPromptInsert');
    if (insertBtn) insertBtn.disabled = true;
    renderGptTestTabs();
    document.getElementById('gptPromptDialog').classList.remove('hidden');
}

function closeGptPromptDialog() {
    document.getElementById('gptPromptDialog').classList.add('hidden');
}

// Setzt alle Fortschrittsanzeigen auf den Ausgangszustand
function resetGptProgressUI(total = 0) {
    const steps = ['prepare', 'send', 'process', 'apply'];
    steps.forEach(step => setGptStepState(step, 'idle', 'Wartet…'));
    setGptStepState('prepare', total > 0 ? 'done' : 'idle', total > 0 ? 'Prompt erstellt' : 'Wartet…');
    updateGptProgressMeter(0, total);
    const logBox = document.getElementById('gptProgressLog');
    if (logBox) logBox.textContent = '';
}

// Aktualisiert Text und Füllstand des Fortschrittsbalkens
function updateGptProgressMeter(done, total) {
    const label = document.getElementById('gptProgressLabel');
    const fill = document.getElementById('gptProgressFill');
    if (label) {
        const safeTotal = Math.max(total || 0, 0);
        label.textContent = `${Math.min(done, safeTotal)} / ${safeTotal} Zeilen`;
    }
    if (fill) {
        const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
        fill.style.width = `${pct}%`;
    }
}

// Wechselt den Status eines Fortschrittschritts
function setGptStepState(step, state, message) {
    const container = document.querySelector(`.gpt-step[data-step='${step}']`);
    if (!container) return;
    container.classList.remove('gpt-step--idle', 'gpt-step--active', 'gpt-step--done', 'gpt-step--error');
    const stateClass = state ? `gpt-step--${state}` : 'gpt-step--idle';
    container.classList.add(stateClass);
    const label = container.querySelector('.gpt-step-state');
    if (label && typeof message === 'string') label.textContent = message;
}

// Hängt eine neue Meldung im Logfeld an
function appendGptProgressLog(text) {
    const logBox = document.getElementById('gptProgressLog');
    if (!logBox || typeof text !== 'string') return;
    const timestamp = new Date().toLocaleTimeString('de-DE', { hour12: false });
    logBox.textContent += `[${timestamp}] ${text}\n`;
    logBox.scrollTop = logBox.scrollHeight;
}

// Sendet den Prompt an die API und zeigt die Antwort an
async function sendGptPrompt() {
    const btn = document.getElementById('gptPromptSend');
    const resultArea = document.getElementById('gptResultArea');
    if (!gptPromptData || !btn || !resultArea) return;
    btn.disabled = true;
    setGptStepState('send', 'active', 'Verbindung wird aufgebaut…');
    setGptStepState('process', 'idle', 'Wartet…');
    setGptStepState('apply', 'idle', 'Wartet…');
    resultArea.value = 'Sende...';
    try {
        appendGptProgressLog('Übertrage Daten an GPT.');
        const progressHandler = (evt) => {
            if (!evt) return;
            if (evt.type === 'start') {
                setGptStepState('prepare', 'done', 'Doppelte Zeilen bereinigt');
                updateGptProgressMeter(0, evt.total || 0);
            } else if (evt.type === 'progress') {
                updateGptProgressMeter(evt.done || 0, evt.total || 0);
            } else if (evt.type === 'log') {
                appendGptProgressLog(evt.message || '');
            } else if (evt.type === 'stage') {
                if (evt.stage === 'request') {
                    const status = evt.status === 'done' ? 'done' : (evt.status === 'error' ? 'error' : 'active');
                    setGptStepState('send', status, evt.message || (status === 'done' ? 'Übertragung abgeschlossen' : status === 'error' ? 'Übertragung fehlgeschlagen' : 'Übertragung läuft…'));
                }
                if (evt.stage === 'process') {
                    const status = evt.status === 'done' ? 'done' : (evt.status === 'error' ? 'error' : 'active');
                    setGptStepState('process', status, evt.message || (status === 'done' ? 'Antwort ausgewertet' : status === 'error' ? 'Antwort konnte nicht verarbeitet werden' : 'Antwort wird ausgewertet…'));
                }
                if (evt.stage === 'merge') {
                    const status = evt.status === 'done' ? 'done' : (evt.status === 'error' ? 'error' : 'active');
                    setGptStepState('apply', status, evt.message || (status === 'done' ? 'Ergebnisse bereit' : status === 'error' ? 'Ergebnisse konnten nicht gespeichert werden' : 'Ergebnisse werden vorbereitet…'));
                }
            }
        };
        const results = await evaluateScene({
            scene: gptPromptData.scene,
            lines: gptPromptData.lines,
            key: openaiApiKey,
            model: openaiModel,
            // projectId sorgt dafür, dass Einfügungen nur im passenden Projekt landen
            projectId: currentProject?.id,
            onProgress: progressHandler
        });
        setGptStepState('process', 'done', 'Antwort ausgewertet');
        resultArea.value = JSON.stringify(results, null, 2);
        gptEvaluationResults = results;
        updateGptSummary(results);
        setGptStepState('apply', 'active', 'Ergebnisse werden gespeichert…');
        const insertBtn = document.getElementById('gptPromptInsert');
        if (insertBtn) insertBtn.disabled = false;
        if (currentProject) {
            if (!Array.isArray(currentProject.gptTests)) currentProject.gptTests = [];
            const promptText = document.getElementById('gptPromptArea')?.value || '';
            currentProject.gptTests.push({
                prompt: promptText,
                result: resultArea.value,
                summary: results
            });
            currentProject.gptTabIndex = currentProject.gptTests.length - 1;
            markDirty();
            // Änderungen merken, damit Tabs gespeichert werden
            saveCurrentProject();
            renderGptTestTabs();
        }
        setGptStepState('apply', 'done', 'Ergebnisse gespeichert');
        appendGptProgressLog('Bewertung erfolgreich abgeschlossen.');
    } catch (e) {
        resultArea.value = String(e);
        setGptStepState('send', 'error', 'Fehler beim Senden');
        setGptStepState('process', 'error', 'Fehler bei der Verarbeitung');
        setGptStepState('apply', 'error', 'Ergebnisse nicht verfügbar');
        appendGptProgressLog(`Fehler: ${e?.message || e}`);
    }
    btn.disabled = false;
}

// Übernimmt die letzten GPT-Ergebnisse in die Tabelle
async function insertGptResults() {
    const btn = document.getElementById('gptPromptInsert');
    if (!btn) return;
    // Fehlendes Modul bei Bedarf nachladen
    if (typeof applyEvaluationResults !== 'function') {
        if (typeof require !== 'undefined') {
            try {
                ({ applyEvaluationResults } = require('./actions/projectEvaluate.js'));
            } catch {}
        }
        if (typeof applyEvaluationResults !== 'function') {
            const mod = await import('./actions/projectEvaluate.js');
            // Nach dem Laden auch window pruefen
            applyEvaluationResults = mod.applyEvaluationResults ||
                                    (mod.default && mod.default.applyEvaluationResults) ||
                                    window.applyEvaluationResults;
        }
    }
    btn.disabled = true;
    let results = gptEvaluationResults;
    if (!results) {
        const area = document.getElementById('gptResultArea');
        // Manuell eingefügten JSON-Text verwenden
        results = window.parseEvaluationResults?.(area?.value);
    }
    // Kein gültiges Ergebnis gefunden
    if (!results) { btn.disabled = false; return; }
    // Ergebnisse nur dem aktiven Projekt zuordnen
    applyEvaluationResults(results, files, currentProject);
    await renderFileTable();
    const tbody = document.getElementById('fileTableBody');
    if (tbody && typeof attachScoreHandlers === 'function') {
        attachScoreHandlers(tbody, files);
    }
    if (typeof saveCurrentProject === 'function') {
        saveCurrentProject();
    }
    closeGptPromptDialog();
}

// Erstellt eine Übersicht der GPT-Ergebnisse
function updateGptSummary(results) {
    const body = document.querySelector('#gptSummaryTable tbody');
    if (!body || !Array.isArray(results)) { if (body) body.innerHTML = ''; return; }
    // Tabelle leeren
    body.innerHTML = '';
    for (const r of results) {
        // IDs als Strings vergleichen, um Ganzzahlen und Gleitkommazahlen sicher zu finden
        const f = files.find(fl => String(fl.id) === String(r.id));
        const name = f?.name || '';
        const folder = f?.folder || '';
        const score = r.score ?? '';
        const suggestion = (r.suggestion || '').replace(/\n/g, ' ');
        const comment = (r.comment || '').replace(/\n/g, ' ');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.id}</td>
            <td>${name}</td>
            <td>${folder}</td>
            <td>${score}</td>
            <td>${suggestion}</td>
            <td>${comment}</td>`;
        body.appendChild(tr);
    }
}

// Zeichnet die Tabs des GPT-Tests neu
function renderGptTestTabs() {
    const container = document.getElementById('gptTestTabs');
    if (!container || !currentProject) return;
    const list = currentProject.gptTests || [];
    const active = currentProject.gptTabIndex ?? (list.length - 1);
    container.innerHTML = '';
    list.forEach((_, idx) => {
        const tab = document.createElement('div');
        tab.className = 'gpt-tab' + (idx === active ? ' active' : '');
        tab.textContent = `#${idx + 1}`;
        tab.onclick = () => selectGptTestTab(idx);
        const x = document.createElement('span');
        x.textContent = '×';
        x.className = 'gpt-tab-close';
        x.onclick = ev => { ev.stopPropagation(); deleteGptTestTab(idx); };
        tab.appendChild(x);
        container.appendChild(tab);
    });
}

// Aktiviert einen gespeicherten GPT-Test
function selectGptTestTab(index) {
    if (!currentProject || !currentProject.gptTests) return;
    const test = currentProject.gptTests[index];
    if (!test) return;
    currentProject.gptTabIndex = index;
    markDirty();
    // Aktive Tab-Position speichern
    saveCurrentProject();
    const area = document.getElementById('gptPromptArea');
    const res  = document.getElementById('gptResultArea');
    if (area) area.value = test.prompt || '';
    if (res)  res.value = test.result || '';
    gptEvaluationResults = test.summary || null;
    updateGptSummary(test.summary || []);
    const insertBtn = document.getElementById('gptPromptInsert');
    if (insertBtn) insertBtn.disabled = !gptEvaluationResults;
    renderGptTestTabs();
}

// Entfernt einen gespeicherten GPT-Test
function deleteGptTestTab(index) {
    if (!currentProject || !currentProject.gptTests) return;
    currentProject.gptTests.splice(index, 1);
    if (currentProject.gptTabIndex >= currentProject.gptTests.length) {
        currentProject.gptTabIndex = currentProject.gptTests.length - 1;
    }
    markDirty();
    // Tab-Liste wurde geändert
    saveCurrentProject();
    renderGptTestTabs();
    if (currentProject.gptTabIndex >= 0) {
        selectGptTestTab(currentProject.gptTabIndex);
    } else {
        const area = document.getElementById('gptPromptArea');
        const res = document.getElementById('gptResultArea');
        if (area) area.value = '';
        if (res) res.value = '';
        updateGptSummary([]);
        gptEvaluationResults = null;
    }
}

// Bewertet aktuell sichtbare Zeilen über ChatGPT


// =========================== DEBUG LOG START ===========================
// Schreibt Meldungen in die Browser-Konsole und die Debug-Anzeige
function debugLog(...args) {
    if (!DEBUG_MODE) return;
    console.log(...args);
    const div = document.getElementById('debugConsole');
    if (div) {
        div.textContent += args.join(' ') + '\n';
        div.scrollTop = div.scrollHeight;
    }
}
window.debugLog = debugLog;

// =========================== FEHLERBEHANDLUNG START ===========================
// Leitet JavaScript-Fehler detailliert in die Debug-Konsole um
window.addEventListener('error', (event) => {
    const { message, filename, lineno, colno, error } = event;
    debugLog('FEHLER:', message, `${filename}:${lineno}:${colno}`);
    if (error && error.stack) {
        debugLog('STAPEL:', error.stack);
    }
});
// Fängt unbehandelte Promise-Ablehnungen ab
window.addEventListener('unhandledrejection', (event) => {
    const grund = event.reason;
    debugLog('UNBEHANDELTE PROMISE:', grund);
    if (grund && grund.stack) {
        debugLog('STAPEL:', grund.stack);
    }
});
// Ergänzt console.error, damit Fehler im Debug-Bereich auftauchen
const origConsoleError = console.error;
console.error = function(...args) {
    origConsoleError.apply(console, args);
    debugLog('FEHLER:', ...args);
    for (const arg of args) {
        if (arg && arg.stack) {
            debugLog('STAPEL:', arg.stack);
        }
    }
};
// =========================== ZWISCHENABLAGE HELFER ==========================
// Versucht zuerst das Browser-Clipboard und nutzt bei Fehlern Electron
async function safeCopy(text) {
    if (!text) return false;
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Kopieren fehlgeschlagen:', err);
        if (window.electronAPI && window.electronAPI.writeClipboard) {
            try {
                window.electronAPI.writeClipboard(text);
                return true;
            } catch (e) {
                console.error('Electron-Clipboard fehlgeschlagen:', e);
            }
        }
    }
    return false;
}
// =========================== ERROR-HANDLING END =============================

// =========================== DUBBING-LOG START ===========================
// Aktuelles Dubbing-Protokoll
let dubbingLogMessages = [];
let dubbingLog        = []; // Merkt jeden API-Aufruf

function logApiCall(method, url, status) {
    // Zeitstempel erzeugen und Eintrag merken
    const time = new Date().toLocaleString();
    dubbingLog.push({ time, method, url, status });
    renderProtocolList();
}

function renderProtocolList() {
    const ul = document.getElementById('protocolList');
    if (!ul) return;
    ul.innerHTML = dubbingLog.map(entry => {
        const color = entry.status >= 400 ? 'error' : '';
        return `<li class="${color}">${entry.time} ${entry.method} ${entry.url} → ${entry.status}</li>`;
    }).join('');
}

function addDubbingLog(msg) {
    // Neue Meldung anhängen, aber nur im Arbeitsspeicher behalten
    dubbingLogMessages.push(msg);
    const logPre = document.getElementById('dubbingLog');
    if (logPre) {
        logPre.textContent = dubbingLogMessages.join('\n');
        logPre.scrollTop = logPre.scrollHeight;
    }
}

function openDubbingLog() {
    // Aktuellen Text und Protokoll anzeigen
    const logPre = document.getElementById('dubbingLog');
    if (logPre) {
        logPre.textContent = dubbingLogMessages.join('\n');
        logPre.scrollTop = logPre.scrollHeight;
    }
    renderProtocolList();
    document.getElementById('dubbingLogDialog').classList.remove('hidden');
}

function closeDubbingLog() {
    document.getElementById('dubbingLogDialog').classList.add('hidden');
}

function copyDubbingLog() {
    safeCopy(dubbingLogMessages.join('\n')).then(ok => {
        if (ok) updateStatus('Dubbing-Log kopiert');
    });
}

function clearDubbingLog() {
    // Log-Einträge entfernen (keine Speicherung mehr)
    dubbingLogMessages = [];
    const logPre = document.getElementById('dubbingLog');
    if (logPre) logPre.textContent = '';
    updateStatus('Dubbing-Log gelöscht');
}
// =========================== DUBBING-LOG END ===========================

// Öffnet das Wörterbuch-Fenster und baut die Tabelle auf
function openWordList() {
    renderWordList();
    document.getElementById('wordListDialog').classList.remove('hidden');
}

// Schließt das Wörterbuch-Fenster
function closeWordList() {
    document.getElementById('wordListDialog').classList.add('hidden');
}

// Zeigt alle gespeicherten Wörter an
function renderWordList() {
    const phonBody = document.querySelector('#phoneticTable tbody');
    const transBody = document.querySelector('#translationTable tbody');
    if (phonBody) {
        phonBody.innerHTML = '';
        phoneticList.forEach(entry => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td><input type="text" class="text-input word-input" value="${entry.word}"></td>`+
                           `<td><input type="text" class="text-input phon-input" value="${entry.phonetic}"></td>`+
                           `<td><button class="btn btn-secondary" onclick="deleteWordRow(this)">🗑️</button></td>`;
            phonBody.appendChild(tr);
        });
    }
    if (transBody) {
        transBody.innerHTML = '';
        translationList.forEach(entry => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td><input type="text" class="text-input trans-word-input" value="${entry.word}"></td>`+
                           `<td><input type="text" class="text-input trans-de-input" value="${entry.translation}"></td>`+
                           `<td><button class="btn btn-secondary" onclick="deleteWordRow(this)">🗑️</button></td>`;
            transBody.appendChild(tr);
        });
    }
}

// Fügt eine neue Zeile im Wörterbuch ein
function addPhonRow() {
    const tbody = document.querySelector('#phoneticTable tbody');
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input type="text" class="text-input word-input"></td>`+
                   `<td><input type="text" class="text-input phon-input"></td>`+
                   `<td><button class="btn btn-secondary" onclick="deleteWordRow(this)">🗑️</button></td>`;
    tbody.appendChild(tr);
}

function addTransRow() {
    const tbody = document.querySelector('#translationTable tbody');
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><input type="text" class="text-input trans-word-input"></td>`+
                   `<td><input type="text" class="text-input trans-de-input"></td>`+
                   `<td><button class="btn btn-secondary" onclick="deleteWordRow(this)">🗑️</button></td>`;
    tbody.appendChild(tr);
}

// Entfernt eine Zeile aus dem Wörterbuch
function deleteWordRow(btn) {
    btn.closest('tr').remove();
}

// Speichert die aktuellen Wörter im aktiven Speicher
async function saveWordList() {
    const rowsPhon = document.querySelectorAll('#phoneticTable tbody tr');
    phoneticList = Array.from(rowsPhon).map(row => {
        return {
            word: row.querySelector('.word-input').value.trim(),
            phonetic: row.querySelector('.phon-input').value.trim()
        };
    }).filter(e => e.word || e.phonetic);

    const rowsTrans = document.querySelectorAll('#translationTable tbody tr');
    translationList = Array.from(rowsTrans).map(row => {
        return {
            word: row.querySelector('.trans-word-input').value.trim(),
            translation: row.querySelector('.trans-de-input').value.trim()
        };
    }).filter(e => e.word || e.translation);

    await storage.setItem('hla_wordList', JSON.stringify(phoneticList));
    await storage.setItem('hla_translationList', JSON.stringify(translationList));
    closeWordList();
}

// Laedt bei Bedarf die verfuegbaren Stimmen von ElevenLabs
async function ensureVoiceList() {
    if (availableVoices.length || !elevenLabsApiKey) return;
    try {
        const res = await fetch(`${API}/voices`, { headers: { 'xi-api-key': elevenLabsApiKey } });
        if (res.ok) {
            const data = await res.json();
            availableVoices = data.voices || [];
            availableVoices.push(...customVoices);
        }
    } catch (e) {
        console.error('Stimmen konnten nicht geladen werden', e);
    }
}

// =========================== COPY ASSISTANT START ==========================
let copyAssistIndex = 0;
let copyAssistStep = 0; // 0 = Name kopieren, 1 = Emotion kopieren
let copyAssist2Index = 0; // Einfacher Durchlauf fuer Kopierhilfe 2

// Prüft, ob die Zwischenablage zum angezeigten Schritt passt
async function verifyCopyAssistClipboard() {
    const expected = copyAssistStep === 0
        ? document.getElementById('copyName').textContent
        : document.getElementById('copyEmo').textContent;
    try {
        const current = (await navigator.clipboard.readText()).trim();
        if (current !== expected.trim()) {
            await safeCopy(expected);
            if (typeof showToast === 'function') {
                showToast('Zwischenablage korrigiert', 'error');
            }
        }
    } catch (e) {
        console.error('Zwischenablage konnte nicht gelesen werden', e);
    }
}

async function openCopyAssistant() {
    // Zuletzt verwendete Position und Schritt wiederherstellen
    copyAssistIndex = parseInt(storage.getItem('copyAssistIndex') || '0');
    copyAssistStep = parseInt(storage.getItem('copyAssistStep') || '0');
    await ensureVoiceList();
    showCopyAssistant();
    document.getElementById('copyAssistantDialog').classList.remove('hidden');
    // Beim Öffnen nur den aktuellen Schritt kopieren, ohne weiterzuschalten
    await copyAssistCopyCurrent();
    verifyCopyAssistClipboard();
}

function closeCopyAssistant() {
    storage.setItem('copyAssistIndex', copyAssistIndex);
    storage.setItem('copyAssistStep', copyAssistStep);
    document.getElementById('copyAssistantDialog').classList.add('hidden');
}

function copyAssistCopy(field) {
    const map = {
        folder: document.getElementById('copyFolder').textContent,
        id: document.getElementById('copyId').textContent,
        name: document.getElementById('copyName').textContent,
        en: document.getElementById('copyEn').textContent,
        de: document.getElementById('copyDe').textContent,
        emo: document.getElementById('copyEmo').textContent
    };
    safeCopy(map[field]);
}

// Kopiert den Text des aktuellen Schritts, ohne den Fortschritt zu ändern
async function copyAssistCopyCurrent() {
    const text = copyAssistStep === 0
        ? document.getElementById('copyName').textContent
        : document.getElementById('copyEmo').textContent;
    await safeCopy(text);
}

function copyAssistNext() {
    const file = files[copyAssistIndex];
    if (!file) return closeCopyAssistant();
    if (copyAssistStep === 0) {
        const name = document.getElementById('copyName').textContent;
        safeCopy(name);
        copyAssistStep = 1;
    } else {
        const emo = document.getElementById('copyEmo').textContent;
        safeCopy(emo);
        copyAssistIndex++;
        copyAssistStep = 0;
    }
    storage.setItem('copyAssistIndex', copyAssistIndex);
    storage.setItem('copyAssistStep', copyAssistStep);
    showCopyAssistant();
}

function copyAssistPrev() {
    if (copyAssistStep === 1) {
        // Einen Schritt zurück innerhalb derselben Datei
        copyAssistStep = 0;
    } else {
        // Zur vorherigen Datei springen
        if (copyAssistIndex > 0) {
            copyAssistIndex--;
            copyAssistStep = 1;
        }
    }
    showCopyAssistant();
    // Automatisch den aktuell sichtbaren Schritt kopieren
    const text = copyAssistStep === 0
        ? document.getElementById('copyName').textContent
        : document.getElementById('copyEmo').textContent;
    safeCopy(text);
    storage.setItem('copyAssistIndex', copyAssistIndex);
    storage.setItem('copyAssistStep', copyAssistStep);
}

function showCopyAssistant() {
    const file = files[copyAssistIndex];
    const total = files.length;
    const countSpan = document.getElementById('copyAssistCount');
    const stepSpan = document.getElementById('copyAssistStep');
    const prog = document.getElementById('copyAssistProgress');
    if (!file) {
        countSpan.textContent = 'Fertig';
        stepSpan.textContent = '';
        prog.style.width = '100%';
        return;
    }
    const voiceId = folderCustomizations[file.folder]?.voiceId || '';
    let voiceName = voiceId;
    const allVoices = [...availableVoices, ...customVoices];
    const v = allVoices.find(v => v.voice_id === voiceId);
    if (v) voiceName = v.name;
    document.getElementById('copyFolder').textContent = file.folder || '';
    document.getElementById('copyId').textContent = voiceId;
    document.getElementById('copyName').textContent = voiceName;
    document.getElementById('copyEn').textContent = file.enText || '';
    document.getElementById('copyDe').textContent = file.deText || '';
    document.getElementById('copyEmo').textContent = file.emotionalText || '';
    countSpan.textContent = `Datei ${copyAssistIndex + 1} von ${total}`;
    stepSpan.textContent = `Schritt ${copyAssistStep + 1} / 2`;
    prog.style.width = `${(copyAssistIndex / total) * 100}%`;
    verifyCopyAssistClipboard();
}
// =========================== COPY ASSISTANT END ============================

// =========================== COPY ASSISTANT 2 START =======================
// Einfacher Dialog zum Durchblättern der Einträge
function openCopyAssistant2() {
    copyAssist2Index = 0;
    showCopyAssistant2();
    document.getElementById('copyAssistant2Dialog').classList.remove('hidden');
}

function closeCopyAssistant2() {
    document.getElementById('copyAssistant2Dialog').classList.add('hidden');
}

function copyAssist2Next() {
    if (copyAssist2Index < files.length - 1) {
        copyAssist2Index++;
        showCopyAssistant2();
    } else {
        closeCopyAssistant2();
    }
}

function copyAssist2Prev() {
    if (copyAssist2Index > 0) {
        copyAssist2Index--;
        showCopyAssistant2();
    }
}

function showCopyAssistant2() {
    const file = files[copyAssist2Index];
    if (!file) return;
    const total = files.length;
    document.getElementById('copy2Name').textContent = file.folder || '';
    document.getElementById('copy2De').textContent = file.deText || '';
    document.getElementById('copy2Emo').textContent = file.emotionalText || '';
    document.getElementById('copyAssist2Page').textContent = `Seite ${copyAssist2Index + 1} von ${total}`;
}
// =========================== COPY ASSISTANT 2 END ==========================

// Kopiert alle Emotionstexte nacheinander in die Zwischenablage
function normalizeEmotionalText(text) {
    if (!text) return '';
    // Zeilenumbrüche entfernen und mehrfaches Leerzeichen reduzieren
    let cleaned = text.replace(/[\r\n]+/g, ' ');
    cleaned = cleaned.replace(/(\[[^\]]+\])(?!\s)/g, '$1 ');
    cleaned = cleaned.replace(/\s{2,}/g, ' ');
    return cleaned.trim();
}

// Fügt in die erste Emotionstag-Klammer die Anweisung „extrem schnell reden“ ein, falls gewünscht
function addExtremeSpeedInstruction(text) {
    if (!text) return '';
    const bracketMatch = text.match(/^\s*\[([^\]]+)\]/);
    if (!bracketMatch) {
        return text;
    }
    const inner = bracketMatch[1];
    if (/extrem schnell reden/i.test(inner)) {
        return text;
    }
    const wordMatch = inner.match(/^([^\s,|]+)(.*)$/);
    if (!wordMatch) {
        return text;
    }
    const first = wordMatch[1];
    const rest = wordMatch[2] ?? '';
    const updated = `[${first}, extrem schnell reden${rest}]`;
    return text.replace(/^\s*\[[^\]]+\]/, updated);
}

// Kopiert alle Emotionstexte nacheinander in die Zwischenablage
// Optional: Zeit vorne anfügen und drei Striche am Ende setzen
async function copyAllEmotionsToClipboard() {
    const blocks = [];
    // Optionen aus den Checkboxen lesen
    const addTime = document.getElementById('copyIncludeTime')?.checked;
    const addDashes = document.getElementById('copyAddDashes')?.checked;
    const addExtremeSpeed = document.getElementById('copyAddExtremeSpeed')?.checked;
    for (const f of files) {
        let entry = normalizeEmotionalText(f.emotionalText || '');
        if (addExtremeSpeed) {
            entry = addExtremeSpeedInstruction(entry);
        }
        if (addTime) {
            // Zeit berechnen und voranstellen
            let dur = null;
            if (f && f.filename && f.folder) {
                const enSrc = `sounds/EN/${getFullPath(f)}`;
                dur = await getAudioDurationFn(enSrc);
            }
            const durStr = dur != null ? dur.toFixed(2).replace('.', ',') + 'sec' : '?sec';
            entry = `[${durStr}] ${entry}`;
        }
        if (addDashes) {
            // Gewünschte Trennstriche hinten anfügen
            entry += ' ---';
        }
        blocks.push(entry);
    }
    const texts = blocks.join('\n\n');
    await safeCopy(texts);
    if (typeof showToast === 'function') {
        showToast('Alle Emotionstexte kopiert');
    }
}

// Stoppt aktuell laufende Wiedergabe und setzt alle Buttons zurück
function stopCurrentPlayback() {
    const audio = document.getElementById('audioPlayer');
    if (audio) {
        audio.pause();
        audio.currentTime = 0;
    }

    document.querySelectorAll('.play-btn').forEach(btn => {
        btn.classList.remove('playing');
        btn.textContent = '▶';
    });

    document.querySelectorAll('.de-play-btn').forEach(btn => {
        btn.classList.remove('playing');
        btn.textContent = '▶';
    });

    document.querySelectorAll('.folder-file-play').forEach(btn => {
        btn.textContent = '▶';
        btn.style.background = '#444';
    });

    currentlyPlaying = null;
}
// =========================== DEBUG LOG END ===========================


// =========================== DOM READY INITIALISIERUNG ===========================
document.addEventListener('DOMContentLoaded', async () => {
    // Pfad-Helfer sicherstellen
    if (pathUtilsPromise) {
        await pathUtilsPromise;
    }
    // Gespeicherte GPT-Einstellungen laden
    await ladeGptEinstellungen();
    // Checkbox zum automatischen Übernehmen der GPT-Vorschläge anlegen
    const menu = document.getElementById('settingsMenu');
    if (menu) {
        const label = document.createElement('label');
        label.className = 'settings-item';
        label.innerHTML = `<input type="checkbox" id="autoApplySuggestionToggle"> GPT-Vorschläge automatisch übernehmen`;
        menu.appendChild(label);
        const cb = label.querySelector('input');
        cb.checked = autoApplySuggestion;
        cb.onchange = () => {
            autoApplySuggestion = cb.checked;
            storage.setItem('hla_autoApplySuggestion', autoApplySuggestion);
            if (typeof window !== 'undefined') {
                window.autoApplySuggestion = autoApplySuggestion;
            }
        };
    }
    // Dubbing-Modul nachladen, bevor Funktionen verwendet werden
    if (!moduleStatus.dubbing.loaded) {
        try {
            const dub = await import('./dubbing.js');
            // Bei ES-Modulen stehen die Funktionen direkt im Importobjekt
            // Fallback auf window für klassische Skripte ohne Exporte
            showDubbingSettings = dub.showDubbingSettings || window.showDubbingSettings;
            showEmoDubbingSettings = dub.showEmoDubbingSettings || window.showEmoDubbingSettings;
            closeEmoDubbingSettings = dub.closeEmoDubbingSettings || window.closeEmoDubbingSettings;
            confirmEmoDubbingSettings = dub.confirmEmoDubbingSettings || window.confirmEmoDubbingSettings;
            createDubbingCSV   = dub.createDubbingCSV   || window.createDubbingCSV;
            validateCsv        = dub.validateCsv        || window.validateCsv;
            msToSeconds        = dub.msToSeconds        || window.msToSeconds;
            isDubReady         = dub.isDubReady         || window.isDubReady;
            startDubbing       = dub.startDubbing       || window.startDubbing;
            startEmoDubbing    = dub.startEmoDubbing    || window.startEmoDubbing;
            redownloadDubbing  = dub.redownloadDubbing  || window.redownloadDubbing;
            redownloadEmo      = dub.redownloadEmo      || window.redownloadEmo;
            openDubbingPage    = dub.openDubbingPage    || window.openDubbingPage;
            openLocalFile      = dub.openLocalFile      || window.openLocalFile;
            startDubAutomation = dub.startDubAutomation || window.startDubAutomation;
            showDownloadWaitDialog = dub.showDownloadWaitDialog || window.showDownloadWaitDialog;
            copyFolderName     = dub.copyFolderName     || window.copyFolderName;
            copyDownloadFolder = dub.copyDownloadFolder || window.copyDownloadFolder;
            openStudioAndWait  = dub.openStudioAndWait  || window.openStudioAndWait;
            dubStatusClicked   = dub.dubStatusClicked   || window.dubStatusClicked;
            downloadDe         = dub.downloadDe         || window.downloadDe;
            mountWaveTimeline  = dub.mountWaveTimeline  || window.mountWaveTimeline;
            renderWaveTimeline = dub.renderWaveTimeline || window.renderWaveTimeline;
            syncWaveTimelineControls = dub.syncWaveTimelineControls || window.syncWaveTimelineControls;
            moduleStatus.dubbing = { loaded: true, source: 'Ausgelagert' };
        } catch (e) {
            console.error('Dubbing-Modul konnte nicht geladen werden', e);
            moduleStatus.dubbing = { loaded: false, source: 'Ausgelagert' };
        }
    }
    updateProjectPlaybackButtons();
    // Beim Start alte, falsch gespeicherte Cache-Einträge entfernen
    cleanupDubCache();
    if (window.electronAPI && window.electronAPI.getDebugInfo) {
        debugInfo = await window.electronAPI.getDebugInfo();
    }
    // DevTools-Knopf wird immer eingeblendet


    // Desktop-Version: automatisch EN- und DE-Ordner einlesen
    if (window.electronAPI) {
        window.electronAPI.scanFolders().then(async data => {
            // EN-Dateien einlesen (nur Pfade)
            await verarbeiteGescannteDateien(data.enFiles);
            // DE-Dateien als Pfade merken
            data.deFiles.forEach(file => {
                setDeAudioCacheEntry(file.fullPath, `sounds/DE/${file.fullPath}`);
            });
            // Nach dem Einlesen Projekte und Zugriffsstatus aktualisieren
            updateAllProjectsAfterScan();
            if (repairFileExtensions) {
                const count = repairFileExtensions(projects, filePathDatabase, textDatabase);
                if (count > 0) debugLog('Dateiendungen aktualisiert:', count);
            }
            updateFileAccessStatus();
        });

        // Meldung bei neuen Dateien aus dem Download-Ordner
        if (window.electronAPI.onManualFile) {
            window.electronAPI.onManualFile(async file => {
                // Nach aktivem Dubbing-Item suchen
                let ziel = getActiveDubItem();

                if (!ziel) {
                    // Kein aktives Item -> per Dateinamen oder Dubbing-ID suchen
                    const basis = file.substring(file.lastIndexOf('/') + 1)
                                      .replace(/\.(mp3|wav|ogg)$/i, '');
                    ziel = files.find(f => f.dubbingId === basis ||
                        f.filename.replace(/\.(mp3|wav|ogg)$/i, '') === basis);
                }

                if (!ziel) return; // Keine Zuordnung möglich

                const rel = getFullPath(ziel).replace(/\.(mp3|wav|ogg)$/i, '');
                const ext = file.substring(file.lastIndexOf('.'));
                // Führende Unterordner wie "sounds", "EN" oder "DE" entfernen
                let cleanedRel = rel.replace(/^sounds[\\/]/i, '');
                cleanedRel = cleanedRel.replace(/^(?:EN|DE)[\\/]/i, '');
                const destRel = `${cleanedRel}${ext}`;
                const dest = `sounds/DE/${destRel}`;

                await window.electronAPI.moveFile(file, dest);
                setDeAudioCacheEntry(destRel, dest);
                await updateHistoryCache(destRel);
                ziel.dubReady = true;
                ziel.waitingForManual = false;
                renderFileTable();
                saveCurrentProject();
                const name = dest.split('/').pop();
                showToast(`${name} importiert.`);
                updateStatus('DE-Datei gespeichert');
                updateDownloadWaitDialog(name, dest);
            });
        }

        // Automatischer Import abgeschlossen
        if (window.electronAPI.onDubDone) {
            window.electronAPI.onDubDone(async info => {
                // Pfade der Original- und Zieldatei im Log ausgeben
                if (info.sourcePath) addDubbingLog('Originalpfad: ' + info.sourcePath);
                if (info.destPath)   addDubbingLog('Zielpfad: ' + info.destPath);
                if (info.srcValid !== undefined) {
                    addDubbingLog('Prüfung Download-Datei: ' + (info.srcValid ? 'OK' : 'FEHLER'));
                }
                if (info.destValid !== undefined) {
                    addDubbingLog('Prüfung Ziel-Datei: ' + (info.destValid ? 'OK' : 'FEHLER'));
                }
                markDubAsReady(info.fileId, info.dest);
                await resolveDuplicateAfterCopy(info.dest.replace(/^sounds\/DE\//, ''));
                showToast(`Dubbing fertig: ${info.dest.split('/').pop()}`);
                if (info.fileId === window.waitDialogFileId) {
                    updateDownloadWaitDialog(info.dest.split('/').pop(), info.dest);
                }
            });
        }
        // Fehler beim Import
        if (window.electronAPI.onDubError) {
            window.electronAPI.onDubError(info => {
                showToast(`Dubbing-Fehler: ${info.error}`, 'error');
            });
        }
        // Fortschritt-Updates
        if (window.electronAPI.onDubStatus) {
            window.electronAPI.onDubStatus(info => {
                const f = files.find(fl => fl.id === info.fileId);
                if (f) {
                    f.dubReady = info.ready;
                    updateDubStatusIcon(f);
                }
            });
        }
        if (window.electronAPI.onDubLog) {
            window.electronAPI.onDubLog(msg => {
                addDubbingLog(msg);
            });
        }
        // Speicherfehler per Toast melden, falls API vorhanden
        if (window.electronAPI.onSaveError) {
            window.electronAPI.onSaveError(msg =>
                showToast('Fehler beim Speichern: ' + msg, 'error'));
        }
        if (window.electronAPI.onTranslateFinished) {
            window.electronAPI.onTranslateFinished(({ id, text, error }) => {
                const entry = pendingTranslations.get(id);
                if (!entry) return;
                pendingTranslations.delete(id);
                const { file, resolve, reject, projectId } = entry;
                const safeText = typeof text === 'string' ? text : '';
                const safeError = error ? String(error) : '';
                if (projectResetActive) {
                    if (typeof resolve === 'function') {
                        resolve(safeText);
                    } else if (typeof reject === 'function') {
                        reject(new Error('Übersetzung verworfen: Reset aktiv'));
                    }
                    updateTranslationQueueDisplay();
                    return;
                }
                if (safeText) {
                    // Erfolgreiche Übersetzung übernehmen
                    file.autoTranslation = safeText;
                } else {
                    // Bei Fehler einen Hinweis eintragen und die genaue Ursache anzeigen
                    file.autoTranslation = '[Übersetzung fehlgeschlagen]';
                    if (safeError) {
                        console.error('Übersetzung:', safeError);
                        if (typeof showToast === 'function') {
                            showToast('Automatische Übersetzung fehlgeschlagen: ' + safeError, 'error');
                        }
                    } else if (typeof showToast === 'function') {
                        showToast('Automatische Übersetzung fehlgeschlagen', 'error');
                    }
                }
                // Quelle merken, damit nicht erneut automatisch übersetzt wird
                file.autoSource = file.enText;
                if (projectId) {
                    // Sicherstellen, dass die Projektdaten auch bei offenen anderen Projekten aktualisiert werden
                    const targetProject = projects.find(p => p.id === projectId);
                    if (targetProject?.files) {
                        const storedFile = targetProject.files.find(f => f.id === file.id);
                        if (storedFile && storedFile !== file) {
                            Object.assign(storedFile, {
                                autoTranslation: file.autoTranslation,
                                autoSource: file.autoSource,
                            });
                        }
                    }
                }
                markDirty();
                updateTranslationDisplay(file.id);
                // Direkt speichern, damit übersetzte Texte auch nach Projektwechsel sichtbar sind
                saveProjects();
                resolve(safeText);
                updateTranslationQueueDisplay();
            });
        }
        if (window.electronAPI.onSoundBackupProgress) {
            window.electronAPI.onSoundBackupProgress(prog => {
                const fill = document.getElementById('soundBackupFill');
                const status = document.getElementById('soundBackupStatus');
                if (!fill || !status) return;
                const total = prog.entries.total || 0;
                const processed = prog.entries.processed || 0;
                const percent = total ? Math.round((processed / total) * 100) : 0;
                fill.style.width = percent + '%';
                status.textContent = `Backup ${processed}/${total} Dateien`;
            });
        }
    }

    // 🟩 NEU: Level-Farben laden
    const savedLevelColors = await storage.getItem('hla_levelColors');
    if (savedLevelColors) {
        levelColors = JSON.parse(savedLevelColors);
    }

    const savedLevelOrders = await storage.getItem('hla_levelOrders');
    if (savedLevelOrders) {
        levelOrders = JSON.parse(savedLevelOrders);
    }

    const savedLevelIcons = await storage.getItem('hla_levelIcons');
    if (savedLevelIcons) {
        levelIcons = JSON.parse(savedLevelIcons);
    }

    const savedLevelChapters = await storage.getItem('hla_levelChapters');
    if (savedLevelChapters) {
        levelChapters = JSON.parse(savedLevelChapters);
    }

    const savedChapterOrders = await storage.getItem('hla_chapterOrders');
    if (savedChapterOrders) {
        chapterOrders = JSON.parse(savedChapterOrders);
    }

    const savedChapterColors = await storage.getItem('hla_chapterColors');
    if (savedChapterColors) {
        chapterColors = JSON.parse(savedChapterColors);
    }

    // Wichtig: Kapitel-Daten müssen vor dem Laden der Projekte vorhanden sein,
    // sonst sortiert sich die Liste beim ersten Start falsch
    // Projektliste dabei direkt mit gespeicherten Projekten abgleichen
    if (typeof reloadProjectList === 'function') {
        await reloadProjectList(false);
    } else {
        await loadProjects();
    }

    initializeEventListeners();

    const urlInput = document.getElementById('videoUrlInput');
    if (urlInput) {
        // Gespeicherte Video-URL aus dem Speicher laden
        savedVideoUrl = await storage.getItem('hla_videoUrl') || '';
        urlInput.value = savedVideoUrl;
        urlInput.addEventListener('change', saveVideoUrl);
    }

    // 📁 Ordner-Anpassungen laden
    const savedCustomizations = await storage.getItem('hla_folderCustomizations');
    if (savedCustomizations) {
        folderCustomizations = JSON.parse(savedCustomizations);
    }

    // 📂 Datei-Pfad-Datenbank laden
    const savedPathDB = await storage.getItem('hla_filePathDatabase');
    if (savedPathDB) {
        filePathDatabase = JSON.parse(savedPathDB);
    }
    // Verwaiste Ordner-Anpassungen bereinigen
    cleanupOrphanCustomizations();
    // Datei-Input einmalig verbinden
    const segInput = document.getElementById('segmentFileInput');
    if (segInput) {
        segInput.addEventListener('change', analyzeSegmentFile);
    }

    if (!window.electronAPI) {
        // 👉 Browser-Version: Ordner ist fest "sounds"
        projektOrdnerHandle = { name: 'sounds' };
        updateProjectFolderPathDisplay();
    } else {
        // 👉 Desktop-Version: Ordnerpfad ist fest definiert
        projektOrdnerHandle = { name: 'sounds' };
        updateProjectFolderPathDisplay();
    }

    // 💾 Auto-Save alle 30 Sekunden
    setInterval(saveCurrentProject, 30000);

    // Alle 60 Sekunden Status von offenen Dubbings prüfen
    setInterval(updatePendingDubStatuses, 60000);

    // Automatische Backups starten
    startAutoBackup();

    // 💡 Speichern beim Verlassen
    window.addEventListener('beforeunload', (e) => {
        if (isDirty) {
            saveCurrentProject();
        }
    });
});
// =========================== DOM READY INITIALISIERUNG ENDE ===========================


/* =========================== LEVEL COLOR HELPERS START =========================== */
function getLevelColor(levelName) {
    // Rückfallfarbe, falls Level noch keine Farbe hat
    return levelColors[levelName] || '#444444';
}

function setLevelColor(levelName, color) {
    levelColors[levelName] = color;

    // Alle Projekte dieses Levels einfärben
    projects.forEach(p => {
        if (p.levelName === levelName) p.color = color;
    });

    saveProjects();
    saveLevelColors();
    renderProjects();        // sofort neu zeichnen
}
/* =========================== LEVEL COLOR HELPERS END =========================== */

/* =========================== LEVEL ORDER HELPERS START ======================== */
function getLevelOrder(levelName) {
    // Standardwert, falls keine Reihenfolge gesetzt ist
    return levelOrders[levelName] || 9999;
}

function setLevelOrder(levelName, order) {
    levelOrders[levelName] = order;
    saveLevelOrders();
}
/* =========================== LEVEL ORDER HELPERS END ========================== */


/* =========================== LEVEL-ICON-HILFSFUNKTIONEN START ============== */
function getLevelIcon(levelName) {
    return levelIcons[levelName] || '📁';
}

function setLevelIcon(levelName, icon) {
    levelIcons[levelName] = icon || '📁';
    saveLevelIcons();
}
/* =========================== LEVEL-ICON-HILFSFUNKTIONEN ENDE =============== */

/* =========================== VERSION-FARBEN START ========================== */
// Funktion in colorUtils.js ausgelagert
/* =========================== VERSION-FARBEN ENDE =========================== */

/* =========================== KAPITEL-HILFSFUNKTIONEN START ================= */
function getLevelChapter(levelName) {
    return levelChapters[levelName] || '–';
}

function setLevelChapter(levelName, chapterName) {
    levelChapters[levelName] = chapterName;
    saveLevelChapters();
}

function getChapterOrder(chapterName) {
    return chapterOrders[chapterName] || 9999;
}

function setChapterOrder(chapterName, order) {
    chapterOrders[chapterName] = order;
    saveChapterOrders();
}

function getChapterColor(chapterName) {
    return chapterColors[chapterName] || '#222';
}

function setChapterColor(chapterName, color) {
    chapterColors[chapterName] = color || '#222';
    saveChapterColors();
}
/* =========================== KAPITEL-HILFSFUNKTIONEN ENDE ================== */

// =========================== SAVELEVELCOLORS START ===========================
function saveLevelColors() {
    try {
        // Lokalen Speicher aktualisieren
        storage.setItem('hla_levelColors', JSON.stringify(levelColors));
    } catch (e) {
        console.error('[saveLevelColors] Speichern fehlgeschlagen:', e);
    }
}
// =========================== SAVELEVELCOLORS END ===========================

// =========================== SAVELEVELORDERS START ==========================
function saveLevelOrders() {
    try {
        storage.setItem('hla_levelOrders', JSON.stringify(levelOrders));
    } catch (e) {
        console.error('[saveLevelOrders] Speichern fehlgeschlagen:', e);
    }
}
// =========================== SAVELEVELORDERS END ============================

// =========================== SAVELEVELICONS START ===========================
function saveLevelIcons() {
    try {
        storage.setItem('hla_levelIcons', JSON.stringify(levelIcons));
    } catch (e) {
        console.error('[saveLevelIcons] Speichern fehlgeschlagen:', e);
    }
}
// =========================== SAVELEVELICONS END =============================

// =========================== SAVELEVELCHAPTERS START ========================
function saveLevelChapters() {
    try {
        storage.setItem('hla_levelChapters', JSON.stringify(levelChapters));
    } catch (e) {
        console.error('[saveLevelChapters] Speichern fehlgeschlagen:', e);
    }
}
// =========================== SAVELEVELCHAPTERS END ==========================

// =========================== SAVECHAPTERORDERS START ========================
function saveChapterOrders() {
    try {
        storage.setItem('hla_chapterOrders', JSON.stringify(chapterOrders));
    } catch (e) {
        console.error('[saveChapterOrders] Speichern fehlgeschlagen:', e);
    }
}
// =========================== SAVECHAPTERCOLORS START ========================
function saveChapterColors() {
    try {
        storage.setItem('hla_chapterColors', JSON.stringify(chapterColors));
    } catch (e) {
        console.error('[saveChapterColors] Speichern fehlgeschlagen:', e);
    }
}
// =========================== SAVECHAPTERCOLORS END ==========================
// =========================== SAVECHAPTERORDERS END ==========================
/* =========================== LEVEL-COLOR-HISTORY START ===================== */
function updateLevelColorHistory(color) {
    const idx = levelColorHistory.indexOf(color);
    if (idx !== -1) levelColorHistory.splice(idx, 1);
    levelColorHistory.unshift(color);
    if (levelColorHistory.length > 5) levelColorHistory.pop();
    saveLevelColorHistory();
}

function saveLevelColorHistory() {
    try {
        storage.setItem('hla_levelColorHistory', JSON.stringify(levelColorHistory));
    } catch (e) {
        console.error('[saveLevelColorHistory] Speichern fehlgeschlagen:', e);
    }
}
/* =========================== LEVEL-COLOR-HISTORY END ======================= */



// Berechne Projekt-Statistiken ueber das gemeinsame Modul
function calculateProjectStats(project) {
    if (!sharedProjectStatsCalculator) {
        console.warn('Projektstatistik-Modul nicht geladen, gebe leere Werte zurueck.');
        return {
            enPercent: 0,
            dePercent: 0,
            deAudioPercent: 0,
            completedPercent: 0,
            totalFiles: 0,
            scoreAvg: 0,
            scoreMin: 0
        };
    }
    return sharedProjectStatsCalculator(project, {
        getDeFilePath,
        isFileCompleted
    });
}

// Handle Access Status Click - für den Button unten rechts
function handleAccessStatusClick() {
    const stats = checkFileAccess();
    
    if (stats.selectedFiles === 0) {
        alert('ℹ️ Dateiberechtigungen\n\nKeine Dateien ausgewählt.\n\nWählen Sie erst Dateien aus, um deren Berechtigung zu prüfen.');
        return;
    }
    
    if (stats.inaccessibleFiles === 0) {
        alert('✅ Dateiberechtigungen\n\nAlle ausgewählten Dateien sind verfügbar!\n\nKein Scan erforderlich.');
        return;
    }
    
    // Auto-scan für nicht verfügbare Dateien
    const shouldScan = confirm(
        `🔒 Dateiberechtigungen erneuern\n\n` +
        `Status: ${stats.accessibleFiles}/${stats.selectedFiles} Dateien verfügbar\n` +
        `${stats.inaccessibleFiles} Dateien benötigen neue Berechtigungen\n\n` +
        `Grund: Browser-Berechtigungen sind abgelaufen oder\n` +
        `Dateien wurden in einem anderen Ordner gefunden.\n\n` +
        `✅ JA - Projektordner wählen\n` +
        `❌ NEIN - Abbrechen\n\n` +
        `Möchten Sie den Ordner-Scan starten?`
    );
    
    if (shouldScan) {
        updateStatus('Erneuere Dateiberechtigungen - Ordner-Scan...');
        // Ordnerauswahl direkt aufrufen, damit die Browser-Berechtigung erhalten bleibt
        waehleProjektOrdner();
    }
}

// =========================== LOAD PROJECTS START ===========================
// Lädt Projekte und zugehörige Einstellungen asynchron aus dem Speicher
// Parameter "skipSelect" verhindert das automatische Öffnen eines Projekts
async function loadProjects(skipSelect = false) {
    // Vorherigen Zustand merken, falls das Laden scheitert
    const previousState = {
        projects,
        levelColors,
        levelOrders,
        levelIcons,
        levelColorHistory
    };
    // Hilfsfunktion für Fehlerhinweise
    const showError = msg => {
        if (window.electronAPI && window.electronAPI.showProjectError) {
            window.electronAPI.showProjectError('Projekt-Ladefehler', msg);
        } else {
            alert('Projekt-Ladefehler:\n' + msg);
        }
    };

    try {
        // Alte Daten verwerfen, damit beim Wechsel kein alter Zustand bleibt
        projects = [];
        levelColors = {};
        levelOrders = {};
        levelIcons = {};
        levelColorHistory = [];

        // 🟩 ERST: Level-Farben laden
        const savedLevelColors = await storage.getItem('hla_levelColors');
        if (savedLevelColors) {
            levelColors = JSON.parse(savedLevelColors);
        }

        // 🟢 Ebenfalls Reihenfolge der Level laden
        const savedLevelOrders = await storage.getItem('hla_levelOrders');
        if (savedLevelOrders) {
            levelOrders = JSON.parse(savedLevelOrders);
        }

        // 🆕 Level-Icons laden
        const savedLevelIcons = await storage.getItem('hla_levelIcons');
        if (savedLevelIcons) {
            levelIcons = JSON.parse(savedLevelIcons);
        }

        // Historie der Level-Farben laden
        const savedHistory = await storage.getItem('hla_levelColorHistory');
        if (savedHistory) {
            levelColorHistory = JSON.parse(savedHistory);
        }

        // DANN: Projekte laden
        const savedProjects = await storage.getItem('hla_projects');
        if (savedProjects) {
            projects = JSON.parse(savedProjects);
            let migrated = false;
            const projErrors = [];
            projects.forEach((p, idx) => {
                const missing = [];
                if (p.id === undefined) { p.id = Date.now() + idx; missing.push('id'); migrated = true; }
                if (typeof p.name !== 'string') { p.name = 'Unbenannt'; missing.push('name'); migrated = true; }
                if (!Array.isArray(p.files)) { p.files = []; missing.push('files'); migrated = true; }
                if (missing.length) projErrors.push(`Projekt ${p.name || idx + 1}: ${missing.join(', ')}`);
                // Alte Icon-Felder entfernen, Projekte erben nun das Level-Icon
                if (p.hasOwnProperty('icon')) { delete p.icon; migrated = true; }
                if (!p.hasOwnProperty('color')) { p.color = '#333333'; migrated = true; }
                if (!p.hasOwnProperty('levelName')) { p.levelName = ''; migrated = true; }
                if (!p.hasOwnProperty('levelPart')) { p.levelPart = 1;  migrated = true; }
                if (!p.hasOwnProperty('gptTests')) { p.gptTests = []; migrated = true; }
                if (!p.hasOwnProperty('gptTabIndex')) { p.gptTabIndex = 0; migrated = true; }
                if (!p.hasOwnProperty('segmentAssignments')) { p.segmentAssignments = {}; migrated = true; }
                if (!p.hasOwnProperty('segmentSegments')) { p.segmentSegments = null; migrated = true; }
                if (!p.hasOwnProperty('segmentAudio')) { p.segmentAudio = null; migrated = true; }
                if (!p.hasOwnProperty('segmentAudioPath')) { p.segmentAudioPath = null; migrated = true; }
                if (!p.hasOwnProperty('segmentIgnored')) { p.segmentIgnored = []; migrated = true; }
                if (!p.hasOwnProperty('restTranslation')) { p.restTranslation = false; migrated = true; }
            });

            // 🔥 WICHTIG: Level-Farben auf Projekte anwenden
            projects.forEach(p => {
                if (p.levelName && levelColors[p.levelName]) {
                    p.color = levelColors[p.levelName];
                    migrated = true;
                }
            });

            if (projErrors.length) {
                showError('Einige Projekte waren unvollständig:\n' + projErrors.join('\n') + '\n\nReparatur: Fehlende Felder wurden mit Standardwerten ergänzt.');
            }

            if (migrated) saveProjects();
        } else {
        // Beispielprojekte fuer einen frischen Start
        const now = Date.now();
        projects = [
            {
                id: now,
                name: 'Entanglement',
                levelName: '1.a1_intro_world',
                levelPart: 1,
                files: [],
                color: '#ff6b1a',
                restTranslation: false,
                gptTests: [],
                gptTabIndex: 0,
                segmentAssignments: {},
                segmentSegments: null,
                segmentAudio: null,
                segmentAudioPath: null,
                segmentIgnored: [],
                fixedStats: {
                    enPercent: 100,
                    dePercent: 100,
                    deAudioPercent: 100,
                    completedPercent: 100,
                    scoreAvg: 100,
                    scoreMin: 100
                }
            },
            {
                id: now + 1,
                name: 'Quarantine Entrance',
                levelName: '3.a2_quarantine_entrance',
                levelPart: 1,
                files: [],
                color: '#ff6b1a',
                restTranslation: false,
                gptTests: [],
                gptTabIndex: 0,
                segmentAssignments: {},
                segmentSegments: null,
                segmentAudio: null,
                segmentAudioPath: null,
                segmentIgnored: [],
                fixedStats: {
                    enPercent: 100,
                    dePercent: 100,
                    deAudioPercent: 100,
                    completedPercent: 100,
                    scoreAvg: 100,
                    scoreMin: 100
                }
            },
            {
                id: now + 2,
                name: 'Security Office',
                levelName: '3.a2_quarantine_entrance',
                levelPart: 2,
                files: [],
                color: '#ff6b1a',
                restTranslation: false,
                gptTests: [],
                gptTabIndex: 0,
                segmentAssignments: {},
                segmentSegments: null,
                segmentAudio: null,
                segmentAudioPath: null,
                fixedStats: {
                    enPercent: 95,
                    dePercent: 85,
                    deAudioPercent: 90,
                    completedPercent: 90,
                    scoreAvg: 92,
                    scoreMin: 92
                }
            }
        ];
        saveProjects();
    }
        // Text- & Pfaddatenbanken laden (unverändert)
        const savedDB  = await storage.getItem('hla_textDatabase');
        if (savedDB)  textDatabase = JSON.parse(savedDB);
        const savedPDB = await storage.getItem('hla_filePathDatabase');
        if (savedPDB) filePathDatabase = JSON.parse(savedPDB);

        renderProjects();
        updateGlobalProjectProgress();

        // Nur ein Projekt wählen, wenn dies nicht explizit unterbunden wurde
        if (!skipSelect) {
            const lastActive = await storage.getItem('hla_lastActiveProject');
            const first     = projects.find(p => p.id == lastActive) || projects[0];
            if (first) selectProject(first.id);
        }
    } catch (err) {
        // Fehler melden und ursprünglichen Zustand wiederherstellen
        showError(`Projekte konnten nicht geladen werden: ${err.message}`);
        projects = previousState.projects || [];
        levelColors = previousState.levelColors || {};
        levelOrders = previousState.levelOrders || {};
        levelIcons = previousState.levelIcons || {};
        levelColorHistory = previousState.levelColorHistory || [];
    }
    window.projects = projects; // Referenz für andere Module aktualisieren
    projectResetActive = false;
    if (typeof window !== 'undefined') {
        window.projectResetActive = projectResetActive;
    }
}
// =========================== LOAD PROJECTS END ===========================


        function saveProjects() {
            window.projects = projects; // Referenz für andere Module aktualisieren
            if (projectResetActive) {
                return;
            }
            storage.setItem('hla_projects', JSON.stringify(projects));
            updateGlobalProjectProgress();
        }

        function saveTextDatabase() {
            storage.setItem('hla_textDatabase', JSON.stringify(textDatabase));
        }

        function saveFilePathDatabase() {
            storage.setItem('hla_filePathDatabase', JSON.stringify(filePathDatabase));
        }

        function saveFolderCustomizations() {
            storage.setItem('hla_folderCustomizations', JSON.stringify(folderCustomizations));
        }

        // =========================== HANDLE-DATENBANK START =====================
        let ordnerHandleDB = null; // IndexedDB-Instanz

        function openOrdnerHandleDB() {
            return new Promise((resolve, reject) => {
                if (ordnerHandleDB) return resolve(ordnerHandleDB);

                const request = indexedDB.open('hla_projectFolder', 1);
                request.onupgradeneeded = () => {
                    request.result.createObjectStore('handles');
                };
                request.onsuccess = () => {
                    ordnerHandleDB = request.result;
                    resolve(ordnerHandleDB);
                };
                request.onerror = () => reject(request.error);
            });
        }

        async function saveProjectFolderHandle(handle) {
            const db = await openOrdnerHandleDB();
            const tx = db.transaction('handles', 'readwrite');
            tx.objectStore('handles').put(handle, 'project');
            return new Promise((res, rej) => {
                tx.oncomplete = () => res();
                tx.onerror = () => rej(tx.error);
            });
        }

        async function loadProjectFolderHandle() {
            const db = await openOrdnerHandleDB();
            const tx = db.transaction('handles', 'readonly');
            const req = tx.objectStore('handles').get('project');
            return new Promise((res) => {
                req.onsuccess = () => res(req.result);
                req.onerror = () => res(null);
            });
        }
        // =========================== HANDLE-DATENBANK END =======================

/* =========================== RENDER PROJECTS START =========================== */
let projectListClickBound = false; // Merker, ob der Klick-Listener gesetzt ist

function renderProjects() {
    const list = document.getElementById('projectList');
    // Event-Delegation nur einmal einrichten, um doppelte Handler zu vermeiden
    if (!projectListClickBound) {
        list.addEventListener('click', e => {
            const item = e.target.closest('.project-item');
            if (item && !e.target.closest('button')) {
                // Falls der sichere Wechsel fehlt, direktes selectProject verwenden
                if (typeof window.switchProjectSafe === 'function') {
                    window.switchProjectSafe(item.dataset.projectId);
                } else {
                    selectProject(item.dataset.projectId);
                }
            }
        });
        projectListClickBound = true;
    }
    list.innerHTML = '';

    // Projekte nach Kapitel und Level gruppieren
    const chapterMap = {};
    projects.forEach(p => {
        const lvl = p.levelName || '–';
        const chp = getLevelChapter(lvl);
        if (!chapterMap[chp]) chapterMap[chp] = {};
        if (!chapterMap[chp][lvl]) chapterMap[chp][lvl] = [];
        chapterMap[chp][lvl].push(p);
    });

    Object.entries(chapterMap)
        .sort((a,b)=> getChapterOrder(a[0]) - getChapterOrder(b[0]))
        .forEach(([chp, levels]) => {
        // Kapitel-Statistiken sammeln
        let chapterProgress = 0;
        let chapterScoreSum = 0;
        let chapterScoreCount = 0;
        const levelStatsMap = {};
        Object.entries(levels).forEach(([lvl, prjs]) => {
            let progSum = 0;
            let scoreSum = 0;
            let scoreCount = 0;
            prjs.forEach(pr => {
                const st = calculateProjectStats(pr);
                progSum += st.completedPercent;
                if (st.scoreMin) { scoreSum += st.scoreMin; scoreCount++; }
            });
            const avgProg = prjs.length ? Math.round(progSum / prjs.length) : 0;
            const avgScore = scoreCount ? Math.round(scoreSum / scoreCount) : 0;
            levelStatsMap[lvl] = { progress: avgProg, score: avgScore };
            chapterProgress += avgProg;
            chapterScoreSum += avgScore;
            chapterScoreCount++;
        });
        chapterProgress = chapterScoreCount ? Math.round(chapterProgress / chapterScoreCount) : 0;
        const chapterScore = chapterScoreCount ? Math.round(chapterScoreSum / chapterScoreCount) : 0;
        const chGroup = document.createElement('div');
        chGroup.className = 'chapter-container';

        const chHeader = document.createElement('div');
        chHeader.className = 'chapter-header';
        chHeader.innerHTML = `
            <span class="chapter-title">${getChapterOrder(chp)}.${chp}</span>
            <span class="star ${scoreClass(chapterScore)}">★ ${chapterScore}</span>
            <button class="chapter-edit-btn" data-chapter="${chp}" onclick="showChapterCustomization(this.dataset.chapter, event)">⚙️</button>
        `;
        chHeader.addEventListener('contextmenu', e => showChapterMenu(e, chp));
        // Kapitel-Header sind reine Überschriften ohne Klick-Funktion
        chGroup.appendChild(chHeader);
        const chBar = document.createElement('div');
        const chFillClass = chapterProgress >= 90 ? 'progress-green'
                            : chapterProgress >= 75 ? 'progress-yellow'
                            : 'progress-red';
        chBar.className = 'progress-bar';
        chBar.innerHTML = `<div class="${chFillClass}" style="width:${chapterProgress}%"></div>`;
        chGroup.appendChild(chBar);

        let chapterDone = true; // Flag, ob alle Level und Projekte fertig sind

        const levelWrap = document.createElement('div');
        levelWrap.className = 'chapter-levels';

        Object.entries(levels)
            .sort((a, b) => getLevelOrder(a[0]) - getLevelOrder(b[0]))
            .forEach(([lvl, prjs]) => {
            const group = document.createElement('div');
            group.className = 'level-container';
            // Aktiver Level-Block erhält spezielle Klasse
            if (expandedLevel === lvl) group.classList.add('active');
            if (expandedLevel && expandedLevel !== lvl) group.classList.add('collapsed');

        const order  = getLevelOrder(lvl);
        const levelStat = levelStatsMap[lvl] || { progress: 0, score: 0 };
        let levelDone = true; // zeigt, ob alle Projekte fertig sind
        const header = document.createElement('div');
        header.className = 'level level-header';
        if (expandedLevel === lvl) header.classList.add('active');
        header.innerHTML = `
            <span class="level-order">${order}.</span><span class="level-id">${lvl}</span>
            <div class="progress-bar"><div class="${levelStat.progress >= 90 ? 'progress-green' : levelStat.progress >= 75 ? 'progress-yellow' : 'progress-red'}" style="width:${levelStat.progress}%"></div></div>
            <span class="level-stats-icon" title="Level-Statistiken">📊</span>
            <span class="level-arrow">${expandedLevel === lvl ? '▼' : '▶'}</span>
        `;
        header.addEventListener('contextmenu', e => showLevelMenu(e, lvl));
        header.onclick = (e) => {
            expandedLevel = expandedLevel === lvl ? null : lvl;
            renderProjects();
        };
        const arrowEl = header.querySelector('.level-arrow');
        const statsEl = header.querySelector('.level-stats-icon');
        // Klick auf das Statistik-Symbol öffnet eine Übersicht der Notizen
        if (statsEl) {
            statsEl.addEventListener('click', ev => {
                ev.stopPropagation();
                showLevelStats(lvl);
            });
        }
        // Pfeil bei Hover vorübergehend nach unten zeigen
        header.addEventListener('mouseenter', () => {
            if (!header.classList.contains('active') && arrowEl) arrowEl.textContent = '▼';
        });
        header.addEventListener('mouseleave', () => {
            if (!header.classList.contains('active') && arrowEl) arrowEl.textContent = '▶';
        });
        group.appendChild(header);

        const wrap = document.createElement('ul');
        wrap.className = 'projects';

        prjs.sort((a,b) => a.levelPart - b.levelPart);

        // Hinweis anzeigen, wenn keine Projekte existieren
        if (prjs.length === 0) {
            const info = document.createElement('li');
            info.className = 'no-projects';
            info.textContent = '– Keine Projekte vorhanden –';
            wrap.appendChild(info);
        }

        prjs.forEach(p => {
            const stats = calculateProjectStats(p);
            const done  = stats.enPercent === 100 &&
                          stats.dePercent === 100 &&
                          stats.deAudioPercent === 100 &&
                          stats.completedPercent === 100;

            if (!done) levelDone = false; // Sobald ein Projekt nicht fertig ist

            const card = document.createElement('li');
            card.className = 'project-item';
            if (done) card.classList.add('completed');
            card.dataset.projectId = p.id;
            card.draggable = true;
            card.style.background = getLevelColor(p.levelName);

            card.innerHTML = `
                <div class="project-row">
                    <div class="top-row">
                        <span class="project-title">${p.levelPart}. ${p.name}</span>
                        <span class="badge-summary">Σ ${stats.completedPercent}%</span>
                        <span class="star ${scoreClass(stats.scoreMin)}">★ ${stats.scoreMin}</span>
                    </div>
                    <div class="details">
                        <span class="badge-detail en">EN ${stats.enPercent}%</span>
                        <span class="badge-detail de">DE ${stats.dePercent}%</span>
                        <span class="badge-detail audio">🔊 ${stats.deAudioPercent}%</span>
                    </div>
                </div>
            `;

            card.title =
                `${p.name}\n` +
                (p.levelName ? `Level: ${p.levelName}\n` : '') +
                `Teil:  ${p.levelPart}\n\n` +
                `• EN: ${stats.enPercent}%  • DE: ${stats.dePercent}%\n` +
                `• DE-Audio: ${stats.deAudioPercent}%  • Fertig: ${stats.completedPercent}%${done ? ' ✅' : ''}\n` +
                `• GPT: ${stats.scoreMin}  • Dateien: ${stats.totalFiles}`;

            // Klick-Handler wird über Event-Delegation gesetzt
            card.addEventListener('contextmenu', e => showProjectMenu(e, p.id));
            card.addEventListener('dragstart', handleProjectDragStart);
            card.addEventListener('dragover',  handleProjectDragOver);
            card.addEventListener('drop',      handleProjectDrop);
            card.addEventListener('dragend',   handleProjectDragEnd);
            card.addEventListener('dragenter', handleProjectDragEnter);
            card.addEventListener('dragleave', handleProjectDragLeave);

            wrap.appendChild(card);
        });

        // Haken an Level-Header anhängen, wenn alle Projekte fertig sind
        if (levelDone) {
            const mark = document.createElement('span');
            mark.className = 'level-done-marker';
            mark.textContent = '✅';
            header.appendChild(mark);
        } else {
            chapterDone = false; // Ein Level ist unvollständig
        }

            group.appendChild(wrap);
            levelWrap.appendChild(group);
        });

        // Haken am Kapitel-Header anzeigen, wenn alles fertig ist
        if (chapterDone) {
            const mark = document.createElement('span');
            mark.className = 'chapter-done-marker';
            mark.textContent = '✅';
            const title = chHeader.querySelector('.chapter-title');
            if (title) title.insertAdjacentElement('afterend', mark);
        }

        chGroup.appendChild(levelWrap);
        list.appendChild(chGroup);
    });
}
/* =========================== RENDER PROJECTS END =========================== */


/* =========================== GLOBAL TEXT STATS FUNCTIONS START =========================== */
function calculateGlobalTextStats() {
    // Zähle EN/DE/Both/Total über die gesamte Datenbank
    let en = 0, de = 0, both = 0, tot = 0;

    Object.entries(textDatabase).forEach(([fileKey, texts]) => {
        if (ignoredFiles[fileKey]) return;

        const hasEN = texts.en && texts.en.trim().length > 0;
        const hasDE = texts.de && texts.de.trim().length > 0;

        if (hasEN) en++;
        if (hasDE) de++;
        if (hasEN && hasDE) both++;
        tot++;
    });

    return { en, de, both, total: tot };
}

function updateGlobalTextStats() {
    // Suche das Element sowohl in der normalen Ansicht als auch im Dialog
    let box = document.getElementById('globalTextStatsValue');
    
    // Falls nicht gefunden, suche in allen möglichen Containern
    if (!box) {
        box = document.querySelector('.folder-stat-item .folder-stat-number');
    }
    
    if (!box) {
        debugLog('[GLOBAL STATS] Element nicht gefunden');
        return;
    }

    const { en, de, both, total } = calculateGlobalTextStats();
    
    debugLog(`[GLOBAL STATS] EN: ${en}, DE: ${de}, Both: ${both}, Total: ${total}`);
    box.textContent = `${en} / ${de} / ${both} / ${total}`;
    
    // Auch die Farbe entsprechend setzen
    if (both === total && total > 0) {
        box.style.color = "#4caf50"; // Grün wenn alles übersetzt
    } else if (both > 0) {
        box.style.color = "#ff9800"; // Orange wenn teilweise übersetzt
    } else {
        box.style.color = "#666"; // Grau wenn nichts übersetzt
    }
}
/* =========================== GLOBAL TEXT STATS FUNCTIONS END =========================== */

/* =========================== GLOBAL PROJECT PROGRESS START ============================ */
function calculateGlobalProjectProgress() {
    let total = 0;
    let done  = 0;

    projects.forEach(p => {
        const pFiles = p.files || [];
        total += pFiles.length;
        done  += pFiles.filter(isFileCompleted).length;
    });

    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    return { percent, done, total };
}

function updateGlobalProjectProgress() {
    const box = document.getElementById('globalProjectProgress');
    const bar = document.getElementById('globalProjectFill');
    if (!box) return;

    const { percent, done, total } = calculateGlobalProjectProgress();

    box.textContent = `${percent}% gesamt (${done}/${total})`;
    box.className = 'progress-stat';
    if (percent >= 80)      box.classList.add('good');
    else if (percent >= 40) box.classList.add('warning');
    if (bar) bar.style.width = percent + '%';
}
/* =========================== GLOBAL PROJECT PROGRESS END ============================== */

// =========================== SHOWFOLDERBROWSER START ===========================
function showFolderBrowser() {
    document.getElementById('folderBrowserDialog').classList.remove('hidden');
    
    // Debug info
    debugLog('Ordner-Browser geöffnet');
    debugLog('filePathDatabase Einträge:', Object.keys(filePathDatabase).length);
    debugLog('Aktuelle Projektdateien:', files.length);
    debugLog('textDatabase Einträge:', Object.keys(textDatabase).length);
    
    // 🔥 KORREKTUR: Erst die Statistiken aktualisieren, dann Grid anzeigen
    renderLevelStats();
    updateGlobalTextStats();
    showFolderGrid();
}
// =========================== SHOWFOLDERBROWSER END ===========================



/* =========================== ADD PROJECT START =========================== */
function addProject() {
    // Platzhalter für ein neues Projekt erstellen, aber noch nicht speichern
    const prj = {
        id: Date.now(),
        name: 'Neues Projekt',
        levelName: '',
        levelPart: 1,
        files: [],
        icon: '🗂️',
        color: '#54428E',
        restTranslation: false
    };

    // Dialog öffnen; erst nach Bestätigung wird es gespeichert
    showProjectCustomization(null, null, prj);
}
/* =========================== ADD PROJECT END =========================== */

/* =========================== QUICK ADD PROJECT START =========================== */
function quickAddProject(levelName) {
    // Alle vergebenen Nummern der "Neu"-Projekte global sammeln
    const usedNums = new Set();
    projects.forEach(p => {
        const m = p.name.match(/^Neu (\d+)$/);
        if (m) usedNums.add(parseInt(m[1]));
    });

    // Kleinste noch freie Nummer ermitteln
    let nextNum = 1;
    while (usedNums.has(nextNum)) {
        nextNum++;
    }

    // Nächste freie Teil-Nummer für dieses Level bestimmen
    const nextPart = Math.max(0, ...projects
        .filter(p => p.levelName === levelName)
        .map(p => p.levelPart)) + 1;

    const prj = {
        id: Date.now(),
        name: `Neu ${nextNum}`,
        levelName: levelName,
        levelPart: nextPart,
        files: [],
        icon: '🗂️',
        color: getLevelColor(levelName),
        restTranslation: false
    };

    projects.push(prj);
    saveProjects();
    renderProjects();
}
/* =========================== QUICK ADD PROJECT END =========================== */



        function deleteProject(id, event) {
            event.stopPropagation();
            if (projects.length <= 1) {
                alert('Das letzte Projekt kann nicht gelöscht werden!');
                return;
            }
            
            if (!confirm('Projekt wirklich löschen?')) return;
            
            projects = projects.filter(p => String(p.id) !== String(id));
            saveProjects();
            renderProjects();
            
            if (currentProject && String(currentProject.id) === String(id)) {
                selectProject(projects[0].id);
            }
        }

// =========================== SELECT PROJECT START ===========================
function selectProject(id){
    // Debug-Ausgabe: Start der Projektwahl
    console.log('[DEBUG] selectProject gestartet', { id, projektAnzahl: projects.length });

    stopProjectPlayback();
    saveCurrentProject(); // Aktuelles Projekt sichern, bevor der GPT-Zustand gelöscht wird
    storeSegmentState(); // Segmentzustand vor dem Reset speichern
    clearGptState(); // GPT-Zustand anschließend bereinigen

    // Projekt anhand String-Vergleich ermitteln, um Typkonflikte zu vermeiden
    currentProject = projects.find(p => String(p.id) === String(id));
    console.log('[DEBUG] selectProject: Projekt gefunden', currentProject);
    if(!currentProject) return;

    // Fehlendes Flag für Reste-Modus ergänzen
    if (!currentProject.hasOwnProperty('restTranslation')) {
        currentProject.restTranslation = false;
    }

    const restBox = document.getElementById('restTranslationCheckbox');
    if (restBox) restBox.checked = !!currentProject.restTranslation;
    if (window.setRestMode) {
        window.setRestMode(!!currentProject.restTranslation);
    } else {
        window.restTranslationFlag = !!currentProject.restTranslation;
    }

    // Vorherigen Lock freigeben und neuen anfordern
    if (currentProjectLock) {
        currentProjectLock.release();
        currentProjectLock = null;
    }
    window.acquireProjectLock(id).then(lock => {
        currentProjectLock = lock;
        readOnlyMode = lock.readOnly;
        if (readOnlyMode) {
            showToast('🔒 Projekt nur lesend geöffnet');
        }
    });

    storage.setItem('hla_lastActiveProject',id);

    expandedLevel = currentProject.levelName;
    expandedChapter = getLevelChapter(currentProject.levelName);
    renderProjects();
    document.querySelectorAll('.project-item')
        .forEach(item=>item.classList.toggle('active',item.dataset.projectId==id));
    const aktivesProjekt = document.querySelector('.project-item.active');
    // Nach dem Wechsel die Projektliste auf den gewählten Eintrag zentrieren
    if (aktivesProjekt && typeof aktivesProjekt.scrollIntoView === 'function') {
        aktivesProjekt.scrollIntoView({ block: 'center', inline: 'nearest' });
    }

    files = currentProject.files || [];
    segmentInfo = currentProject._segmentInfo || null;
    segmentAssignments = currentProject.segmentAssignments || {};
    ignoredSegments = new Set(currentProject.segmentIgnored || []);
    segmentSelection = [];
    // Letzte bearbeitete Zeile für dieses Projekt laden
    currentRowNumber = parseInt(storage.getItem('hla_lastNumber_' + currentProject.id) || '1');

    // Migration: completed-Flag nachziehen
    let migrated=false;
    files.forEach(f=>{
        if(!f.hasOwnProperty('completed')){f.completed=false;migrated=true;}
        if(!f.hasOwnProperty('volumeMatched')){f.volumeMatched=false;migrated=true;}
        if(!f.hasOwnProperty('radioEffect')){f.radioEffect=false;migrated=true;}
        if(!f.hasOwnProperty('radioPreset')){f.radioPreset='';}
        if(!f.hasOwnProperty('hallEffect')){f.hallEffect=false;migrated=true;}
        if(!f.hasOwnProperty('emiEffect')){f.emiEffect=false;migrated=true;}
        if(!f.hasOwnProperty('emiPreset')){f.emiPreset='';}
        if(!f.hasOwnProperty('neighborEffect')){f.neighborEffect=false;migrated=true;}
        if(!f.hasOwnProperty('neighborHall')){f.neighborHall=false;migrated=true;}
        if(!f.hasOwnProperty('tableMicEffect')){f.tableMicEffect=false;migrated=true;}
        if(!f.hasOwnProperty('tableMicRoom')){f.tableMicRoom='wohnzimmer';migrated=true;}
        if(!f.hasOwnProperty('autoTranslation')){f.autoTranslation='';}
        if(!f.hasOwnProperty('autoSource')){f.autoSource='';}
        if(!f.hasOwnProperty('emotionalText')){f.emotionalText='';}
        if(!f.hasOwnProperty('emoReason')){f.emoReason='';}
        if(!f.hasOwnProperty('emoCompleted')){f.emoCompleted=false;}
        if(!f.hasOwnProperty('emoDubbingId')){f.emoDubbingId='';}
        if(!f.hasOwnProperty('emoDubReady')){f.emoDubReady=null;}
        if(!f.hasOwnProperty('emoError')){f.emoError=false;}
        if(!f.hasOwnProperty('ignoreRanges')){f.ignoreRanges=[];migrated=true;}
        if(!f.hasOwnProperty('version')){f.version=1;migrated=true;}
    });
    if(migrated) markDirty();
let needTrans = files.filter(f => f.enText && (!f.autoTranslation || f.autoSource !== f.enText));

    // Nach Neustart fehlgeschlagene Übersetzungen einmalig automatisch neu versuchen
    if (!autoRetryDone) {
        const failed = files.filter(f => f.enText && f.autoTranslation === '[Übersetzung fehlgeschlagen]');
        if (failed.length > 0) {
            const set = new Set(needTrans);
            failed.forEach(f => set.add(f));
            needTrans = Array.from(set);
        }
        autoRetryDone = true;
    }

    runTranslationQueue(needTrans, currentProject?.id);

    renderFileTable();

    // Nach dem Laden des Projekts Textfelder korrekt anpassen
    resizeTextFields();
    updateDubStatusForFiles();
    updateStatus();
    updateFileAccessStatus();
    updateProgressStats();
    updateGlobalProjectProgress();
    updateProjectMetaBar();          //  <-- NEU!
    updateTranslationQueueDisplay();
    // Debug-Ausgabe: Ende der Projektwahl
    console.log('[DEBUG] selectProject abgeschlossen', { id, name: currentProject?.name, dateien: files.length });
}
// =========================== SELECT PROJECT END ===========================


        function saveCurrentProject() {
            if (!currentProject || !isDirty) return;

            currentProject.files = files;
            saveProjects();
            saveTextDatabase();
            saveFilePathDatabase();
            isDirty = false;
            updateProjectMetaBar();
        }

        // Globale Referenz, damit andere Module speichern können
        if (typeof window !== 'undefined') {
            window.saveCurrentProject = saveCurrentProject;
        }
		
		
// =========================== PROJECT META FUNCTIONS START ===========================
function updateProjectMetaBar(){
    const bar=document.getElementById('projectMetaBar');
    const nameEl=document.getElementById('metaProjectName');
    const levelEl=document.getElementById('metaLevelName');
    const partEl=document.getElementById('metaPartNumber');
    // Ohne passende Elemente abbrechen
    if(!bar||!nameEl||!levelEl||!partEl) return;
    if(!currentProject){bar.style.display='none';return;}

    nameEl.textContent=currentProject.name||'–';
    levelEl.textContent=currentProject.levelName||'–';
    partEl.textContent=currentProject.levelPart||1;
    bar.style.display='flex';

    // Level-Name auch im Map-Feld anzeigen
    const mapSel=document.getElementById('mapSelect');
    if(mapSel) mapSel.value=currentProject.levelName||'';
}

/* =========================== LEVEL STATS FUNCTIONS START =========================== */
function renderLevelStats() {
    const panel = document.getElementById('levelStatsContent');
    if (!panel) {
        debugLog('[LEVEL STATS] Panel nicht gefunden');
        return;
    }

    /* Daten sammeln */
    const map = {};   // lvl => { parts:Set, en,de,both,total,complete }

    projects.forEach(p => {
        if (!p.levelName || !p.files) return;
        
        if (!map[p.levelName]) {
            map[p.levelName] = { 
                parts: new Set(), 
                en: 0, 
                de: 0, 
                both: 0, 
                total: 0, 
                complete: 0 
            };
        }

        const bucket = map[p.levelName];
        bucket.parts.add(p.levelPart);

        p.files.forEach(f => {
            const fileKey = `${f.folder}/${f.filename}`;
            
            // Ignorierte Dateien überspringen
            if (ignoredFiles[fileKey]) return;
            
            const hasEN = f.enText && f.enText.trim().length > 0;
            const hasDE = f.deText && f.deText.trim().length > 0;
            
            if (hasEN) bucket.en++;
            if (hasDE) bucket.de++;
            if (hasEN && hasDE) bucket.both++;
            if (f.completed) bucket.complete++;
            bucket.total++;
        });
    });

    const rows = Object.entries(map)
        // Nach Level-Nummer sortieren
        .sort((a, b) => getLevelOrder(a[0]) - getLevelOrder(b[0]));
    if (!rows.length) {
        panel.innerHTML = '<em style="color:#666;">Noch keine Level eingetragen.</em>';
        return;
    }

    /* Tabelle bauen */
    let html = `
        <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:13px;">
            <tr>
                <th style="padding:6px 8px;border-bottom:1px solid #333;text-align:left;">Level</th>
                <th style="padding:6px 8px;border-bottom:1px solid #333;text-align:center;">Teile</th>
                <th style="padding:6px 8px;border-bottom:1px solid #333;text-align:center;">EN / DE / BEIDE / ∑</th>
                <th style="padding:6px 8px;border-bottom:1px solid #333;text-align:center;">Fertig-%</th>
            </tr>
    `;
    
    rows.forEach(([lvl, b]) => {
        const pct  = b.total ? Math.round(b.complete / b.total * 100) : 0;
        const col  = pct === 100 ? '#4caf50' : pct >= 50 ? '#ff9800' : '#f44336';
        const cols = getLevelColor(lvl);

        const ord = getLevelOrder(lvl);
        html += `
          <tr>
            <td style="padding:6px 8px;border-bottom:1px solid #333;color:${cols};font-weight:600;">${ord}.${lvl}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #333;text-align:center;">${b.parts.size}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #333;text-align:center;">${b.en} / ${b.de} / ${b.both} / ${b.total}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #333;text-align:center;color:${col};font-weight:600;">${pct}%</td>
          </tr>`;
    });
    
    html += '</table>';
    panel.innerHTML = html;
    
    debugLog('[LEVEL STATS] Statistiken aktualisiert:', rows.length, 'Level');
}
/* =========================== LEVEL STATS FUNCTIONS END =========================== */

/* =========================== HANDLE TEXT CHANGE START =========================== */
function handleTextChange(file, field, value) {
    file[field] = value;
    markDirty();
    const key = `${file.folder}/${file.filename}`;
    if (!textDatabase[key]) textDatabase[key] = { en: '', de: '' };
    textDatabase[key][field === 'enText' ? 'en' : 'de'] = value;

    saveTextDatabase();
    updateGlobalTextStats();   // neue Kachel sofort aktualisieren
    updateProgressStats();
    renderLevelStats();
}
/* =========================== HANDLE TEXT CHANGE END =========================== */


function copyLevelName(){
    if(!currentProject||!currentProject.levelName) return;
    safeCopy(currentProject.levelName)
        .then(ok=>{ if(ok) updateStatus('Level-Name kopiert'); })
        .catch(()=>alert('Kopieren fehlgeschlagen'));
}
// =========================== PROJECT META FUNCTIONS END ===========================




        // File Management
function addFiles() {
    const input = document.getElementById('fileInput').value.trim();
    if (!input) return;
    
    const filenames = input.split('\n').map(f => f.trim()).filter(f => f);
    const foundFiles = [];
    const notFound = [];
    
    filenames.forEach(searchTerm => {
        let found = false;
        
        // Search in file path database
        for (const [filename, paths] of Object.entries(filePathDatabase)) {
            if (filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                filename.replace(/\.[^/.]+$/, '').toLowerCase().includes(searchTerm.toLowerCase())) {
                
                if (paths.length === 1) {
                    const pathInfo = paths[0];
                    foundFiles.push({
                        filename: filename,
                        folder: pathInfo.folder,
                        fullPath: pathInfo.fullPath
                    });
                    found = true;
                    break;
                }
            }
        }
        
        if (!found) {
            notFound.push(searchTerm);
        }
    });
    
    // Add found files
    let added = 0;
    foundFiles.forEach(({ filename, folder, fullPath }) => {
        if (!files.find(f => f.filename === filename && f.folder === folder)) {
            const fileKey = `${folder}/${filename}`;
            const newFile = {
                id: Date.now() + Math.random(),
                filename: filename,
                folder: folder,
                fullPath: fullPath,
                folderNote: '',
                enText: textDatabase[fileKey]?.en || '',
                deText: textDatabase[fileKey]?.de || '',
                emotionalText: textDatabase[fileKey]?.emo || '',
                emoCompleted: false,
                emoDubbingId: '',
                emoDubReady: null,
                autoTranslation: '',
                autoSource: '',
                selected: true,
                trimStartMs: 0,
                trimEndMs: 0,
                ignoreRanges: [],
                volumeMatched: false,
                radioEffect: false,
                hallEffect: false,
                emiEffect: false,
                neighborEffect: false,
                neighborHall: false,
                tableMicEffect: false,
                version: 1
            };

            files.push(newFile);
            pendingSelectId = newFile.id; // neue Datei vormerken
            updateAutoTranslation(newFile, true);
            added++;
        }
    });
    
    if (added > 0) {
        markDirty();
        renderFileTable();
        renderProjects(); // HINZUGEFÜGT für live Update
        updateStatus(`${added} Dateien hinzugefügt`);
        updateProgressStats();
    }
    
    if (notFound.length > 0) {
        setTimeout(() => {
            alert(`Folgende Dateien wurden nicht gefunden:\n${notFound.join('\n')}\n\nBitte prüfen Sie den EN-Ordner des Projekts.`);
        }, 100);
    }
    
    document.getElementById('fileInput').value = '';
}

        // Enhanced search with similarity matching
        function calculateSimilarity(str1, str2) {
            // Normalize strings: lowercase, remove punctuation
            const normalize = (str) => str.toLowerCase().replace(/[.,!?;:"'\-()]/g, '').trim();
            
            const s1 = normalize(str1);
            const s2 = normalize(str2);
            
            // Exact match after normalization
            if (s1 === s2) return 1.0;
            
            // Contains match
            if (s1.includes(s2) || s2.includes(s1)) return 0.8;
            
            // Word-based similarity
            const words1 = s1.split(/\s+/);
            const words2 = s2.split(/\s+/);
            
            let commonWords = 0;
            words1.forEach(word1 => {
                if (words2.some(word2 => word1.includes(word2) || word2.includes(word1))) {
                    commonWords++;
                }
            });
            
            const wordSimilarity = commonWords / Math.max(words1.length, words2.length);
            
            // Character-based similarity (Levenshtein-inspired)
            const maxLen = Math.max(s1.length, s2.length);
            if (maxLen === 0) return 1.0;
            
            let matches = 0;
            const minLen = Math.min(s1.length, s2.length);
            for (let i = 0; i < minLen; i++) {
                if (s1[i] === s2[i]) matches++;
            }
            
            const charSimilarity = matches / maxLen;
            
            // Combined similarity
            return Math.max(wordSimilarity, charSimilarity);
        }

        // Search functionality with highlighting and similarity
        // Hebt alle Vorkommen des Suchbegriffs hervor und maskiert HTML
        function highlightText(text, query) {
            if (!text || !query) return escapeHtml(text);
            // Mehrere Suchbegriffe unterstuetzen
            const words = query.split(/\s+/)
                .filter(Boolean)
                .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            const regex = new RegExp(`(${words.join('|')})`, 'gi');
            const escaped = escapeHtml(text);
            return escaped.replace(regex, '<span class="search-result-match">$1</span>');
        }

        function initializeEventListeners() {
            const searchInput = document.getElementById('searchInput');
            const searchResults = document.getElementById('searchResults');
            
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.trim();
                if (query.length < 2) {
                    searchResults.style.display = 'none';
                    return;
                }
                
                const results = [];
                const exactMatches = [];
                const similarMatches = [];
                
                // Search in file path database
                Object.entries(filePathDatabase).forEach(([filename, paths]) => {
                    paths.forEach(pathInfo => {
                        const fileKey = `${pathInfo.folder}/${filename}`;
                        const text = textDatabase[fileKey];
                        
                        // Normalize query for comparison
                        const normalizedQuery = query.toLowerCase().replace(/[.,!?;:"'\-()]/g, '').trim();
                        
                        // Check if filename, EN text, or DE text contains the query
                        const filenameMatch = filename.toLowerCase().includes(normalizedQuery);
                        const enTextMatch = text?.en?.toLowerCase().replace(/[.,!?;:"'\-()]/g, '').includes(normalizedQuery);
                        const deTextMatch = text?.de?.toLowerCase().replace(/[.,!?;:"'\-()]/g, '').includes(normalizedQuery);
                        
                        let matchInfo = null;
                        
                        if (filenameMatch || enTextMatch || deTextMatch) {
                            // Exact matches
                            if (filenameMatch) {
                                matchInfo = {
                                    type: 'Dateiname',
                                    preview: highlightText(filename, query),
                                    similarity: 1.0
                                };
                            } else if (enTextMatch) {
                                const enText = text.en;
                                const index = enText.toLowerCase().replace(/[.,!?;:"'\-()]/g, '').indexOf(normalizedQuery);
                                const start = Math.max(0, index - 30);
                                const end = Math.min(enText.length, index + query.length + 30);
                                matchInfo = {
                                    type: 'EN Text',
                                    preview: '...' + highlightText(enText.substring(start, end), query) + '...',
                                    similarity: 1.0
                                };
                            } else if (deTextMatch) {
                                const deText = text.de;
                                const index = deText.toLowerCase().replace(/[.,!?;:"'\-()]/g, '').indexOf(normalizedQuery);
                                const start = Math.max(0, index - 30);
                                const end = Math.min(deText.length, index + query.length + 30);
                                matchInfo = {
                                    type: 'DE Text',
                                    preview: '...' + highlightText(deText.substring(start, end), query) + '...',
                                    similarity: 1.0
                                };
                            }
                            
                            exactMatches.push({
                                filename,
                                folder: pathInfo.folder,
                                fullPath: pathInfo.fullPath,
                                text,
                                matchType: matchInfo.type,
                                matchPreview: matchInfo.preview,
                                similarity: matchInfo.similarity
                            });
                        } else {
                            // Check for similar matches
                            let bestSimilarity = 0;
                            let bestMatch = null;
                            
                            // Check filename similarity
                            const filenameSim = calculateSimilarity(filename, query);
                            if (filenameSim > bestSimilarity && filenameSim >= 0.4) {
                                bestSimilarity = filenameSim;
                                bestMatch = {
                                    type: 'Dateiname (ähnlich)',
                                    preview: filename,
                                    similarity: filenameSim
                                };
                            }
                            
                            // Check EN text similarity
                            if (text?.en) {
                                const enSim = calculateSimilarity(text.en, query);
                                if (enSim > bestSimilarity && enSim >= 0.4) {
                                    bestSimilarity = enSim;
                                    bestMatch = {
                                        type: 'EN Text (ähnlich)',
                                        preview: text.en.length > 60 ? text.en.substring(0, 60) + '...' : text.en,
                                        similarity: enSim
                                    };
                                }
                            }
                            
                            // Check DE text similarity
                            if (text?.de) {
                                const deSim = calculateSimilarity(text.de, query);
                                if (deSim > bestSimilarity && deSim >= 0.4) {
                                    bestSimilarity = deSim;
                                    bestMatch = {
                                        type: 'DE Text (ähnlich)',
                                        preview: text.de.length > 60 ? text.de.substring(0, 60) + '...' : text.de,
                                        similarity: deSim
                                    };
                                }
                            }
                            
                            if (bestMatch) {
                                similarMatches.push({
                                    filename,
                                    folder: pathInfo.folder,
                                    fullPath: pathInfo.fullPath,
                                    text,
                                    matchType: bestMatch.type,
                                    matchPreview: bestMatch.preview,
                                    similarity: bestMatch.similarity
                                });
                            }
                        }
                    });
                });
                
                // Combine and sort results
                const allResults = [...exactMatches, ...similarMatches.sort((a, b) => b.similarity - a.similarity)];
                
                if (allResults.length > 0) {
                    searchResults.innerHTML = allResults.slice(0, 20).map(r => `
                        <div class="search-result-item" onclick='addFromSearch(${JSON.stringify(r).replace(/'/g, "&#39;")})'>
                            <div class="search-result-filename">
                                ${escapeHtml(r.filename)}
                                ${r.similarity < 1.0 ? `<span class="search-result-similarity">${Math.round(r.similarity * 100)}% ähnlich</span>` : ''}
                            </div>
                            <div class="search-result-path">${escapeHtml(r.folder)} • ${escapeHtml(r.matchType)}</div>
                            <div class="search-result-text">${r.matchPreview}</div>
                        </div>
                    `).join('');
                    searchResults.style.display = 'block';
                } else {
                    searchResults.innerHTML = '<div class="search-result-item">Keine Ergebnisse gefunden</div>';
                    searchResults.style.display = 'block';
                }
            });
            
            // Close search results on click outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.search-container')) {
                    searchResults.style.display = 'none';
                }
            });

            // Auto-resize textarea
            const fileInput = document.getElementById('fileInput');
            fileInput.addEventListener('input', function() {
                this.style.height = 'auto';
                const fudge = 2; // kleiner Puffer gegen abschneiden
                this.style.height = (this.scrollHeight + fudge) + 'px';
            });
            
            // Keyboard navigation
            document.addEventListener('keydown', handleKeyboardNavigation);
            
            // Context menu
            document.addEventListener('contextmenu', handleContextMenu);
            document.addEventListener('click', () => {
                hideContextMenu();
                hideAutoTransMenu();
                hideVersionMenu();
                hideProjectMenu();
                hideLevelMenu();
                hideChapterMenu();
            });

            // Scroll-Listener nach Laden der Funktionen setzen
            const tableContainer = document.querySelector('.table-container');
            if (tableContainer) {
                tableContainer.addEventListener('scroll', updateNumberFromScroll);
            }

            // Navigationsfunktionen global zur Verfügung stellen
            window.scrollToNumber = scrollToNumber;
            window.goToNextNumber = goToNextNumber;
            window.goToPreviousNumber = goToPreviousNumber;
            window.updateNumberFromScroll = updateNumberFromScroll;
        }

        // Globale Bereitstellung für Projektwechsel
        window.initializeEventListeners = initializeEventListeners;

        // Keyboard Navigation
        function handleKeyboardNavigation(e) {
            // Skip if user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                if (e.ctrlKey && e.key === 'z') {
                    e.preventDefault();
                    undoEdit();
                    return;
                }
                if (e.ctrlKey && e.key === 'y') {
                    e.preventDefault();
                    redoEdit();
                    return;
                }
                // Tab navigation between text fields
                if (e.key === 'Tab') {
                    handleTabNavigation(e);
                }
                // Space for audio in text fields
                if (e.key === ' ' && e.ctrlKey) {
                    e.preventDefault();
                    const row = e.target.closest('tr');
                    if (row) {
                        const fileId = parseFloat(row.dataset.id);
                        playAudio(fileId);
                    }
                }
                return;
            }
            
            // Global shortcuts
            if (e.ctrlKey) {
                switch(e.key) {
                    case 'z':
                        e.preventDefault();
                        undoEdit();
                        break;
                    case 'y':
                        e.preventDefault();
                        redoEdit();
                        break;
                    case 's':
                        e.preventDefault();
                        saveCurrentProject();
                        updateStatus('Gespeichert');
                        break;
                    case 'i':
                        e.preventDefault();
                        showImportDialog();
                        break;
                    case 'f':
                        e.preventDefault();
                        showFolderBrowser();
                        break;
                }
                return;
            }
            
            // Table navigation
            const tbody = document.getElementById('fileTableBody');
            if (!tbody || files.length === 0) return;
            
            const rows = Array.from(tbody.querySelectorAll('tr'));
            let currentIndex = selectedRow ? rows.indexOf(selectedRow) : -1;
            
            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    currentIndex = Math.max(0, currentIndex - 1);
                    selectRow(rows[currentIndex]);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    currentIndex = Math.min(rows.length - 1, currentIndex + 1);
                    selectRow(rows[currentIndex]);
                    break;
                case ' ':
                    e.preventDefault();
                    if (selectedRow) {
                        const fileId = parseFloat(selectedRow.dataset.id);
                        playAudio(fileId);
                    }
                    break;
                case 'Delete':
                    e.preventDefault();
                    if (selectedRow) {
                        const fileId = parseFloat(selectedRow.dataset.id);
                        deleteFile(fileId);
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (selectedRow) {
                        // Focus first text input in selected row
                        const firstInput = selectedRow.querySelector('.text-input');
                        if (firstInput) {
                            firstInput.focus();
                        }
                    }
                    break;
                case 'Escape':
                    document.querySelectorAll('.dialog-overlay').forEach(d => {
                        d.classList.add('hidden');
                    });
                    hideContextMenu();
                    break;
            }
        }

        function handleTabNavigation(e) {
            const row = e.target.closest('tr');
            if (!row) return;
            
            const inputs = row.querySelectorAll('.text-input');
            const currentIndex = Array.from(inputs).indexOf(e.target);
            
            if (e.shiftKey) {
                // Shift+Tab - go to previous field or previous row
                if (currentIndex > 0) {
                    e.preventDefault();
                    inputs[currentIndex - 1].focus();
                } else {
                    // Go to last field of previous row
                    const prevRow = row.previousElementSibling;
                    if (prevRow) {
                        e.preventDefault();
                        const prevInputs = prevRow.querySelectorAll('.text-input');
                        if (prevInputs.length > 0) {
                            prevInputs[prevInputs.length - 1].focus();
                        }
                    }
                }
            } else {
                // Tab - go to next field or next row
                if (currentIndex < inputs.length - 1) {
                    e.preventDefault();
                    inputs[currentIndex + 1].focus();
                } else {
                    // Go to first field of next row
                    const nextRow = row.nextElementSibling;
                    if (nextRow) {
                        e.preventDefault();
                        const nextInputs = nextRow.querySelectorAll('.text-input');
                        if (nextInputs.length > 0) {
                            nextInputs[0].focus();
                        }
                    }
                }
            }
        }

        function selectRow(row) {
            if (selectedRow) {
                selectedRow.classList.remove('selected-row');
            }
            selectedRow = row;
            if (selectedRow) {
                selectedRow.classList.add('selected-row');
                const cell = selectedRow.querySelector('.row-number');
                const num = cell ? parseInt(cell.textContent, 10) : null;
                // Zeile so scrollen, dass sie vollständig unter dem Tabellenkopf erscheint
                if (num !== null) {
                    scrollToNumber(num);
                } else {
                    // Fallback: Scrollt die Zeile unter Berücksichtigung der Tabellenüberschrift
                    isAutoScrolling = true; // verhindert Updates während des Auto-Scrolls
                    if (autoScrollTimeout) clearTimeout(autoScrollTimeout);
                    scrollRowIntoView(selectedRow);
                    autoScrollTimeout = setTimeout(() => { isAutoScrolling = false; }, 300);
                }
            }
        }

        // ======= Zeilennavigation über Nummern =======
        function getRowByNumber(num) {
            const rows = document.querySelectorAll('#fileTableBody tr');
            for (const row of rows) {
                const cell = row.querySelector('.row-number');
                if (cell && parseInt(cell.textContent) === num) return row;
            }
            return null;
        }

        // Markiert die aktuell aktive Zeile in der Tabelle
        function setActiveRow(row) {
            if (currentRowElement) {
                currentRowElement.classList.remove('current-row');
            }
            currentRowElement = row;
            if (currentRowElement) {
                currentRowElement.classList.add('current-row');
            }
        }

        // Hilfsfunktion: Scrollt eine beliebige Zeile so, dass sie nicht vom Tabellenkopf überdeckt wird
        function scrollRowIntoView(row) {
            const container = document.querySelector('.table-container');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                const rowRect = row.getBoundingClientRect();
                const currentScroll = container.scrollTop;
                const header = container.querySelector('thead');
                const headerHeight = header ? header.getBoundingClientRect().height : 0;
                // Kleiner Sicherheitsabstand unter dem Tabellenkopf
                const abstand = 8; // px
                // Zielposition unterhalb der Überschrift berechnen
                const rowTopOffset = rowRect.top - containerRect.top + currentScroll;
                const target = Math.max(0, rowTopOffset - headerHeight - abstand);
                container.scrollTo({ top: target, behavior: 'smooth' });
            } else {
                // Fallback ohne speziellen Container
                row.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }

        // Springt zu einer bestimmten Nummer und sorgt dafür, dass die Zeile unter dem Tabellenkopf vollständig sichtbar bleibt
        function scrollToNumber(num) {
            if (!files.length) return;
            num = Math.max(1, Math.min(num, files.length));
            isAutoScrolling = true;
            if (autoScrollTimeout) clearTimeout(autoScrollTimeout);
            const row = getRowByNumber(num);
            if (row) {
                if (selectedRow !== row) {
                    if (selectedRow) {
                        selectedRow.classList.remove('selected-row');
                    }
                    selectedRow = row;
                    selectedRow.classList.add('selected-row');
                }
                const container = document.querySelector('.table-container');
                if (container) {
                    // Scroll-Snap kurz deaktivieren, damit der Tabellenkopf nichts überdeckt
                    const originalSnap = container.style.scrollSnapType;
                    container.style.scrollSnapType = 'none';
                    scrollRowIntoView(row);
                    // Scroll-Snap nach kurzer Zeit wieder aktivieren
                    setTimeout(() => { container.style.scrollSnapType = originalSnap; }, 300);
                } else {
                    scrollRowIntoView(row);
                }
                setActiveRow(row);
                currentRowNumber = num;
                if (currentProject) {
                    storage.setItem('hla_lastNumber_' + currentProject.id, num);
                }
            }
            autoScrollTimeout = setTimeout(() => { isAutoScrolling = false; }, 300);
        }

        function goToNextNumber() {
            scrollToNumber(currentRowNumber + 1);
        }

        function goToPreviousNumber() {
            scrollToNumber(currentRowNumber - 1);
        }

        // Aktualisiert die aktuelle Nummer anhand der Bildschirmmitte beim manuellen Scrollen
        function updateNumberFromScroll() {
            if (isAutoScrolling) return; // Ignoriere Scroll-Events während automatischem Scrollen
            const container = document.querySelector('.table-container');
            if (!container) return;
            const containerRect = container.getBoundingClientRect();
            const viewportCenter = containerRect.top + containerRect.height / 2;
            const rows = container.querySelectorAll('#fileTableBody tr');
            for (const row of rows) {
                const rect = row.getBoundingClientRect();
                if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
                    const cell = row.querySelector('.row-number');
                    if (cell) {
                        const num = parseInt(cell.textContent, 10);
                        if (selectedRow !== row) {
                            if (selectedRow) {
                                selectedRow.classList.remove('selected-row');
                            }
                            selectedRow = row;
                            selectedRow.classList.add('selected-row');
                        }
                        setActiveRow(row);
                        currentRowNumber = num;
                        if (currentProject) {
                            storage.setItem('hla_lastNumber_' + currentProject.id, num);
                        }
                    }
                    break;
                }
            }
        }

        // Copy button functionality
        async function copyTextToClipboard(fileId, language, ev) {
            debugLog('Copy button clicked - FileID:', fileId, 'Language:', language);
            
            // Find file more safely
            const file = files.find(f => f && f.id && f.id == fileId);
            if (!file) {
                console.error('File not found for copy operation. FileID:', fileId);
                debugLog('Available files:', files.map(f => ({id: f?.id, filename: f?.filename})));
                updateStatus(`Fehler: Datei nicht gefunden (ID: ${fileId})`);
                return;
            }
            
            debugLog('Found file for copy:', file.filename, 'ID:', file.id);
            
            const text = language === 'en' ? (file.enText || '') : (file.deText || '');
            const langLabel = language === 'en' ? 'EN' : 'DE';
            
            if (!text) {
                updateStatus(`${langLabel} Text ist leer für ${file.filename}`);
                return;
            }
            
            try {
                const ok = await safeCopy(text);
                if (ok) updateStatus(`${langLabel} Text kopiert: ${file.filename}`);
                debugLog('Copy successful:', langLabel, 'from', file.filename);
                
                // Visual feedback - briefly highlight the copy button
                const button = ev?.target;
                if (button) {
                    const originalBg = button.style.background;
                    const originalText = button.textContent;
                    button.style.background = '#4caf50';
                    button.textContent = '✓';
                    
                    setTimeout(() => {
                        button.style.background = originalBg;
                        button.textContent = originalText;
                    }, 1000);
                }
                
            } catch (err) {
                console.error('Copy failed:', err);
                updateStatus(`${langLabel} Kopieren fehlgeschlagen: ${file.filename}`);
                
                // Error feedback
                const button = ev?.target;
                if (button) {
                    const originalBg = button.style.background;
                    const originalText = button.textContent;
                    button.style.background = '#f44336';
                    button.textContent = '✗';
                    
                    setTimeout(() => {
                        button.style.background = originalBg;
                        button.textContent = originalText;
                    }, 1000);
                }
            }
        }

        // Kopiert den emotionalen Text einer Zeile in die Zwischenablage
        async function copyEmotionalText(fileId) {
            const row = document.querySelector(`tr[data-id='${fileId}']`);
            const area = row?.querySelector('textarea.emotional-text');
            if (!area || !area.value) {
                updateStatus('Emotionaler Text ist leer');
                return;
            }
            const file = files.find(f => f.id === fileId);
            let dur = null;
            if (file && file.filename && file.folder) {
                const enSrc = `sounds/EN/${getFullPath(file)}`;
                dur = await getAudioDurationFn(enSrc);
            }
            const durStr = dur != null ? dur.toFixed(2).replace('.', ',') + 'sec' : '?sec';
            const addExtremeSpeed = document.getElementById('copyAddExtremeSpeed')?.checked;
            let normalized = normalizeEmotionalText(area.value);
            if (addExtremeSpeed) {
                normalized = addExtremeSpeedInstruction(normalized);
            }
            const text = `[${durStr}] ${normalized}`;
            if (await safeCopy(text)) {
                updateStatus(`Emotionaler Text kopiert: ${fileId}`);
            }
        }

        // Generiert den Emotional-Text für eine Zeile
        async function generateEmotionalText(rowId, { precomputedLines = null, positionLookup = null } = {}) {
            const row = document.querySelector(`tr[data-id='${rowId}']`);
            const area = row?.querySelector('textarea.emotional-text');
            const btn  = row?.querySelector('button.generate-emotions-btn');
            if (!row || !area || !btn) return;
            // Bisherigen Inhalt immer verwerfen
            if (!openaiApiKey) { updateStatus('GPT-Key fehlt'); return; }
            btn.disabled = true;
            btn.classList.add('loading');
            area.value = '...';
            const file = files.find(f => f.id === rowId);
            if (!file) { btn.disabled = false; btn.classList.remove('loading'); return; }
            const skipImmediateSave = precomputedLines != null || positionLookup != null;
            try {
                // Meta-Informationen für den Prompt
                const meta = {
                    game: 'Half-Life: Alyx',
                    project: currentProject?.name || '',
                    chapter: getLevelChapter(currentProject?.levelName || ''),
                    level: currentProject?.levelName || '',
                    scene: currentProject?.name || ''
                };
                // Vorberechnete Daten nutzen, falls vorhanden, um bei Sammelläufen unnötige Arbeit zu sparen
                const lines = precomputedLines || files.map((f, idx) => ({
                    position: idx + 1,
                    speaker: f.folder || '',
                    text_en: f.enText || '',
                    text_de: f.deText || ''
                }));
                let targetPosition = null;
                if (positionLookup && positionLookup.has(file.id)) {
                    targetPosition = positionLookup.get(file.id);
                }
                if (targetPosition == null) {
                    const fallbackIndex = files.indexOf(file);
                    targetPosition = fallbackIndex >= 0 ? fallbackIndex + 1 : 1;
                }
                const res = await generateEmotionText({ meta, lines, targetPosition, key: openaiApiKey, model: openaiModel });
                area.value = res.text || '';
                file.emoReason = res.reason || '';
                file.emoError = false;
                updateText(file.id, 'emo', area.value, true, skipImmediateSave ? { skipImmediateSave: true } : undefined);
                updateEmoReasonDisplay(file.id);
                updateStatus(`Emotionen generiert: ${file.filename}`);
            } catch (e) {
                console.error('Emotionen fehlgeschlagen', e);
                area.value = 'Fehler bei der Generierung';
                file.emoReason = '';
                file.emoError = true;
                updateText(file.id, 'emo', area.value, true, skipImmediateSave ? { skipImmediateSave: true } : undefined);
            }
            btn.disabled = false;
            btn.classList.remove('loading');
        }

        // Passt den Emotional-Text an die EN-Länge an
        async function adjustEmotionalText(rowId) {
            const row = document.querySelector(`tr[data-id='${rowId}']`);
            const area = row?.querySelector('textarea.emotional-text');
            const btn  = row?.querySelector('button.adjust-emotions-btn');
            if (!row || !area || !btn) return;
            if (!openaiApiKey) { updateStatus('GPT-Key fehlt'); return; }
            btn.disabled = true;
            area.value = '...';
            const file = files.find(f => f.id === rowId);
            if (!file) { btn.disabled = false; return; }
            try {
                const enSrc = `sounds/EN/${getFullPath(file)}`;
                const dur = await getAudioDurationFn(enSrc);
                const meta = {
                    game: 'Half-Life: Alyx',
                    project: currentProject?.name || '',
                    chapter: getLevelChapter(currentProject?.levelName || ''),
                    level: currentProject?.levelName || '',
                    scene: currentProject?.name || ''
                };
                const lines = files.map((f, idx) => ({
                    position: idx + 1,
                    speaker: f.folder || '',
                    text_en: f.enText || '',
                    text_de: f.deText || ''
                }));
                const targetPosition = files.indexOf(file) + 1;
                const res = await adjustEmotionText({ meta, lines, targetPosition, lengthSeconds: dur || 0, key: openaiApiKey, model: openaiModel });
                area.value = res.text || '';
                file.emoReason = res.reason || '';
                file.emoError = false;
                updateText(file.id, 'emo', area.value, true);
                updateEmoReasonDisplay(file.id);
                updateStatus(`Text angepasst: ${file.filename}`);
            } catch (e) {
                console.error('Anpassen fehlgeschlagen', e);
                area.value = 'Fehler bei der Anpassung';
                file.emoReason = '';
                file.emoError = true;
                updateText(file.id, 'emo', area.value, true);
            }
            btn.disabled = false;
        }

        // Analysiert Übersetzung und Emotional-Text und zeigt Verbesserungsvorschläge im Dialog
        async function improveEmotionalText(rowId) {
            const row = document.querySelector(`tr[data-id='${rowId}']`);
            const area = row?.querySelector('textarea.emotional-text');
            const btn  = row?.querySelector('button.improve-emotions-btn');
            if (!row || !area || !btn) return;
            if (!openaiApiKey) { updateStatus('GPT-Key fehlt'); return; }
            btn.disabled = true;
            btn.classList.add('loading');
            const file = files.find(f => f.id === rowId);
            if (!file) { btn.disabled = false; btn.classList.remove('loading'); return; }
            try {
                const meta = {
                    game: 'Half-Life: Alyx',
                    project: currentProject?.name || '',
                    chapter: getLevelChapter(currentProject?.levelName || ''),
                    level: currentProject?.levelName || '',
                    scene: currentProject?.name || ''
                };
                const lines = files.map((f, idx) => ({
                    position: idx + 1,
                    speaker: f.folder || '',
                    text_en: f.enText || '',
                    text_de: f.deText || '',
                    emotional_de: f.emotionalText || ''
                }));
                const targetPosition = files.indexOf(file) + 1;
                const suggestions = await improveEmotionText({ meta, lines, targetPosition, currentText: area.value || '', currentTranslation: file.deText || '', key: openaiApiKey, model: openaiModel });
                const choice = await showImprovementDialog(area.value || '', suggestions || []);
                if (choice) {
                    area.value = choice.text || '';
                    file.emoReason = choice.reason || '';
                    file.emoError = false;
                    updateText(file.id, 'emo', area.value, true);
                    updateEmoReasonDisplay(file.id);
                    updateStatus(`Text verbessert: ${file.filename}`);
                } else {
                    updateStatus('Verbesserung abgebrochen');
                }
            } catch (e) {
                console.error('Verbesserung fehlgeschlagen', e);
                updateStatus('Verbesserung fehlgeschlagen');
            }
            btn.disabled = false;
            btn.classList.remove('loading');
        }

        // Zeigt einen Dialog mit Verbesserungsvorschlägen an
        function showImprovementDialog(oldText, suggestions) {
            return new Promise(resolve => {
                const overlay = document.createElement('div');
                overlay.className = 'dialog-overlay';
                const optionsHtml = suggestions.map((s, i) => `
                    <li class="improve-option">
                        <textarea readonly>${escapeHtml(s.text || '')}</textarea>
                        <p class="improve-reason">${escapeHtml(s.reason || '')}</p>
                        <button data-idx="${i}">Übernehmen</button>
                    </li>`).join('');
                overlay.innerHTML = `<div class="dialog improve-dialog" style="max-width:600px">
                    <h3>Verbesserungsvorschläge</h3>
                    <p><strong>Aktueller Emotional-Text:</strong></p>
                    <textarea readonly class="current-emo">${escapeHtml(oldText)}</textarea>
                    <ol class="improve-list">${optionsHtml}</ol>
                    <div class="dialog-actions">
                        <button id="improveCancel">Abbrechen</button>
                    </div>
                </div>`;
                document.body.appendChild(overlay);
                overlay.querySelector('#improveCancel').onclick = () => { overlay.remove(); resolve(null); };
                overlay.querySelectorAll('button[data-idx]').forEach(b => {
                    b.onclick = () => {
                        const idx = parseInt(b.dataset.idx, 10);
                        const s = suggestions[idx];
                        overlay.remove();
                        resolve(s);
                    };
                });
            });
        }

        // Generiert die Emotional-Texte für alle Zeilen im Projekt
        async function generateEmotionsForAll() {
            const btn = document.getElementById('generateEmotionsButton');
            if (!btn || !openaiApiKey) { updateStatus('GPT-Key fehlt'); return; }
            // IDs aller Dateien sammeln – vorhandener Text wird überschrieben
            const ids = files.map(f => f.id);
            if (ids.length === 0) return;
            btn.disabled = true;
            btn.textContent = 'Generiere...';
            let done = 0;
            const max = 3;
            const queue = [...ids];
            // Vorberechnete Zeilenliste und Positions-Lookup, damit jede Worker-Runde ohne erneutes Mapping auskommt
            const precomputedLines = files.map((f, idx) => ({
                position: idx + 1,
                speaker: f.folder || '',
                text_en: f.enText || '',
                text_de: f.deText || ''
            }));
            const positionLookup = new Map();
            files.forEach((f, idx) => positionLookup.set(f.id, idx + 1));

            async function worker() {
                while (queue.length) {
                    const id = queue.shift();
                    await generateEmotionalText(id, { precomputedLines, positionLookup });
                    done++;
                    btn.textContent = `Generiere... (${done}/${ids.length})`;
                }
            }
            const workers = [];
            for (let i = 0; i < Math.min(max, queue.length); i++) workers.push(worker());
            await Promise.all(workers);
            if (typeof saveCurrentProject === 'function') {
                // Sammeländerungen nach allen Emotionstexten einmalig sichern
                saveCurrentProject();
            }
            btn.textContent = 'Emotionen generieren';
            btn.disabled = false;
            updateStatus(`Fertig (${done}/${ids.length})`);
        }

        // Generiert alle leeren oder fehlerhaften Emotional-Texte erneut
        async function regenerateMissingEmos() {
            const box = document.getElementById('emoProgress');
            if (!box || !openaiApiKey) { updateStatus('GPT-Key fehlt'); return; }
            const ids = files
                .filter(f => !f.emotionalText || !f.emotionalText.trim() || f.emoError)
                .map(f => f.id);
            if (ids.length === 0) return;
            box.textContent = '🟣 ...';
            let done = 0;
            const max = 3;
            const queue = [...ids];
            async function worker() {
                while (queue.length) {
                    const id = queue.shift();
                    await generateEmotionalText(id);
                    done++;
                    box.textContent = `🟣 ${done}/${ids.length}`;
                }
            }
            const workers = [];
            for (let i = 0; i < Math.min(max, queue.length); i++) workers.push(worker());
            await Promise.all(workers);
            box.textContent = '🟣 fertig';
            updateStatus(`Emotional-Texte aktualisiert (${done})`);
        }

        // Sendet alle Emotional-Texte in der Projektreihenfolge an ElevenLabs
        async function sendEmoTextsToApi() {
            const btn = document.getElementById('sendTextV2Button');
            if (!btn || !elevenLabsApiKey) { updateStatus('API-Key fehlt'); return; }
            btn.disabled = true;
            btn.textContent = 'Sende...';
            const seen = new Set();
            let count = 0;
            for (const file of files) {
                const text = (file.emotionalText || '').trim();
                const voiceId = folderCustomizations[file.folder]?.voiceId;
                if (!text || !voiceId || seen.has(text)) continue;
                try {
                    await fetch(`${API}/text-to-speech/${voiceId}`, {
                        method: 'POST',
                        headers: { 'xi-api-key': elevenLabsApiKey, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' })
                    });
                    count++;
                    seen.add(text);
                } catch (e) {
                    console.error('Fehler bei', text, e);
                }
            }
            btn.textContent = 'An ElevenLabs schicken';
            btn.disabled = false;
            updateStatus(`Daten gesendet (${count})`);
        }

        // Context Menu
        function handleContextMenu(e) {
            hideContextMenu();
            hideAutoTransMenu();
            const autoDiv = e.target.closest('.auto-trans');
            if (autoDiv) {
                e.preventDefault();
                const fileId = parseInt(autoDiv.dataset.fileId, 10);
                contextMenuFile = files.find(f => f && f.id === fileId);
                if (!contextMenuFile) return;
                const autoMenu = document.getElementById('autoTransMenu');
                autoMenu.style.display = 'block';
                autoMenu.style.left = e.pageX + 'px';
                autoMenu.style.top = e.pageY + 'px';
                const rect = autoMenu.getBoundingClientRect();
                if (rect.right > window.innerWidth) {
                    autoMenu.style.left = (e.pageX - rect.width) + 'px';
                }
                if (rect.bottom > window.innerHeight) {
                    autoMenu.style.top = (e.pageY - rect.height) + 'px';
                }
                return;
            }

            const row = e.target.closest('tr[data-id]');
            if (!row) return;

            e.preventDefault();

            const fileIdStr = row.dataset.id;
            const fileId = parseFloat(fileIdStr);

            debugLog('Context menu - Row data-id:', fileIdStr, 'Parsed as:', fileId);

            // Datei sicher ermitteln
            contextMenuFile = files.find(f => f && f.id && f.id == fileId);

            if (!contextMenuFile) {
                console.error('Context menu file not found for ID:', fileId);
                debugLog('Available files:', files.map(f => ({id: f?.id, filename: f?.filename})));
                return;
            }

            debugLog('Context menu opened for file:', contextMenuFile.filename, 'ID:', contextMenuFile.id);

            const contextMenu = document.getElementById('contextMenu');
            contextMenu.style.display = 'block';
            contextMenu.style.left = e.pageX + 'px';
            contextMenu.style.top = e.pageY + 'px';

            // Menü innerhalb des Sichtbereichs halten
            const rect = contextMenu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                contextMenu.style.left = (e.pageX - rect.width) + 'px';
            }
            if (rect.bottom > window.innerHeight) {
                contextMenu.style.top = (e.pageY - rect.height) + 'px';
            }
        }

        function hideContextMenu() {
            document.getElementById('contextMenu').style.display = 'none';
            contextMenuFile = null;
        }

        function hideAutoTransMenu() {
            document.getElementById('autoTransMenu').style.display = 'none';
            contextMenuFile = null;
        }

       function openVersionMenu(e, fileId) {
            // Standardverhalten verhindern und Aufpropagieren stoppen,
            // damit das globale Klick-Event das Menü nicht sofort schließt
            e.preventDefault();
            e.stopPropagation();
            versionMenuFile = files.find(f => f.id === fileId);
            if (!versionMenuFile) return;
            const menu = document.getElementById('versionMenu');
            menu.style.display = 'block';
            menu.style.left = e.pageX + 'px';
            menu.style.top = e.pageY + 'px';
        }

        function hideVersionMenu() {
            document.getElementById('versionMenu').style.display = 'none';
            versionMenuFile = null;
        }

        // Setzt die Versionsnummer der gewählten Datei
        // Bei "Benutzerdefiniert..." erscheint ein Dialog mit drei Schaltflächen
        async function selectVersion(v) {
            if (!versionMenuFile) return;
            const file = versionMenuFile; // gemerkte Auswahl
            hideVersionMenu();

            let num = v;
            if (v === 'custom') {
                // Dialog mit eigener Versionsnummer und Auswahl des Anwendungsbereichs
                const res = await showVersionDialog('Versionsnummer eingeben', file.version || 1);
                if (!res) return;
                num = parseInt(res.value, 10);
                if (isNaN(num) || num <= 0) return;

                if (res.applyAll) {
                    // Version für alle Dateien im selben Ordner setzen
                    files.forEach(f => {
                        if (f.folder === file.folder) {
                            f.version = num;
                        }
                    });
                } else {
                    file.version = num;
                }
            } else {
                // Schnellwahl 1–10 nur auf aktuelle Datei anwenden
                file.version = num;
            }

            markDirty();

            renderFileTable();
            saveProjects();
        }


        async function contextMenuAction(action) {
            if (!contextMenuFile) {
                console.error('No context menu file available for action:', action);
                updateStatus('Fehler: Keine Datei für Aktion verfügbar');
                return;
            }
            
            debugLog('Context menu action:', action, 'for file:', contextMenuFile.filename);
            hideContextMenu();
            
            try {
                switch(action) {
                    case 'play':
                        playAudio(contextMenuFile.id);
                        break;
                    case 'copyEN':
                        if (!contextMenuFile.enText) {
                            updateStatus(`EN Text ist leer für ${contextMenuFile.filename}`);
                            return;
                        }
                        if (await safeCopy(contextMenuFile.enText)) {
                            updateStatus(`EN Text kopiert: ${contextMenuFile.filename}`);
                        }
                        break;
                    case 'copyDE':
                        if (!contextMenuFile.deText) {
                            updateStatus(`DE Text ist leer für ${contextMenuFile.filename}`);
                            return;
                        }
                        if (await safeCopy(contextMenuFile.deText)) {
                            updateStatus(`DE Text kopiert: ${contextMenuFile.filename}`);
                        }
                        break;
                    case 'pasteEN':
                        const enText = await navigator.clipboard.readText();
                        if (!enText) {
                            updateStatus('Zwischenablage ist leer');
                            return;
                        }
                        updateText(contextMenuFile.id, 'en', enText);
                        renderFileTable();
                        updateStatus(`Text in EN eingefügt: ${contextMenuFile.filename}`);
                        break;
                    case 'pasteDE':
                        const deText = await navigator.clipboard.readText();
                        if (!deText) {
                            updateStatus('Zwischenablage ist leer');
                            return;
                        }
                        updateText(contextMenuFile.id, 'de', deText);
                        renderFileTable();
                        updateStatus(`Text in DE eingefügt: ${contextMenuFile.filename}`);
                        break;
                    case 'uploadDE':
                        aktuellerUploadPfad = getFullPath(contextMenuFile);
                        document.getElementById('deUploadInput').click();
                        break;
                    case 'history':
                        showHistoryDialog(contextMenuFile);
                        break;
                    case 'openFolder':
                        showFolderBrowser();
                        // Wait a bit then show the specific folder
                        setTimeout(() => {
                            showFolderFiles(contextMenuFile.folder);
                        }, 100);
                        break;
                    case 'delete':
                        if (confirm(`Datei "${contextMenuFile.filename}" wirklich löschen?`)) {
                            deleteFile(contextMenuFile.id);
                        }
                        break;
                    default:
                        console.warn('Unknown context menu action:', action);
                }
            } catch (err) {
                console.error('Context menu action failed:', action, err);
                updateStatus(`Aktion fehlgeschlagen: ${action}`);
            }
        }

        // Aktionen des Übersetzungs-Kontextmenüs
        function autoTransMenuAction(action) {
            if (!contextMenuFile) return;
            hideAutoTransMenu();
            if (action === 'line') {
                runTranslationQueue([contextMenuFile], currentProject?.id);
            } else if (action === 'all') {
                const all = files.filter(f => f.enText);
                runTranslationQueue(all, currentProject?.id);
            }
        }

        // Kontextmenü für Projekte
        function showProjectMenu(e, projectId) {
            // eigenes Kontextmenü anzeigen
            e.preventDefault();
            e.stopPropagation();
            projectContextId = projectId;
            const menu = document.getElementById('projectContextMenu');
            menu.style.display = 'block';
            menu.style.left = e.pageX + 'px';
            menu.style.top = e.pageY + 'px';
        }

        function hideProjectMenu() {
            // Kontextmenü ausblenden
            document.getElementById('projectContextMenu').style.display = 'none';
            projectContextId = null;
        }

        // Analysiert ein Projekt und bietet eine Reparatur an
        function analyzeProject(projectId) {
            const prj = projects.find(p => p.id === projectId);
            if (!prj) {
                alert('Projekt nicht gefunden.');
                return;
            }

            const fehler = [];
            const namenSet = new Set();
            let sortiert = true;

            prj.files.forEach((f, idx) => {
                if (!f.filename) {
                    fehler.push(`Datei ${idx + 1} besitzt keinen Dateinamen.`);
                    return;
                }
                if (namenSet.has(f.filename)) {
                    fehler.push(`Datei ${f.filename} ist doppelt vorhanden.`);
                }
                namenSet.add(f.filename);
                if (idx > 0 && prj.files[idx - 1].filename && prj.files[idx - 1].filename.localeCompare(f.filename) > 0) {
                    sortiert = false;
                }
            });

            if (prj.files.length === 0) {
                fehler.push('Projekt enthält keine Dateien.');
            }

            if (fehler.length === 0 && sortiert) {
                alert('Analyse abgeschlossen:\nKeine Probleme gefunden.');
                return;
            }

            if (!sortiert) fehler.push('Dateien sind nicht alphabetisch sortiert.');
            const bericht = 'Analysebericht:\n- ' + fehler.join('\n- ');

            if (confirm(bericht + '\n\nProbleme automatisch reparieren?')) {
                const einzigartige = [];
                const gesehen = new Set();
                prj.files.forEach(f => {
                    if (!f.filename || gesehen.has(f.filename)) return;
                    gesehen.add(f.filename);
                    einzigartige.push(f);
                });
                einzigartige.sort((a, b) => (a.filename || '').localeCompare(b.filename || ''));
                prj.files = einzigartige;
                saveProjects();
                renderProjects();
                alert('Projekt wurde repariert.');
            } else {
                alert('Keine Änderungen vorgenommen.');
            }
        }

        function projectMenuAction(action) {
            // gewählte Aktion ausführen
            if (!projectContextId) return;
            const id = projectContextId; // ID merken, bevor sie zurückgesetzt wird
            hideProjectMenu();
            if (action === 'edit') {
                showProjectCustomization(id);
            } else if (action === 'delete') {
                deleteProject(id, { stopPropagation() {} });
            } else if (action === 'analyze') {
                analyzeProject(id);
            }
        }

        // Funktionen im globalen Scope verfügbar machen
        window.contextMenuAction  = contextMenuAction;
        window.autoTransMenuAction = autoTransMenuAction;
        window.showProjectMenu   = showProjectMenu;
        window.hideProjectMenu   = hideProjectMenu;
        window.projectMenuAction = projectMenuAction;

        function showLevelMenu(e, levelName) {
            e.preventDefault();
            e.stopPropagation();
            levelContextName = levelName;
            const menu = document.getElementById('levelContextMenu');
            menu.style.display = 'block';
            menu.style.left = e.pageX + 'px';
            menu.style.top = e.pageY + 'px';
        }

        function hideLevelMenu() {
            document.getElementById('levelContextMenu').style.display = 'none';
            levelContextName = null;
        }

function levelMenuAction(action) {
            if (!levelContextName) return;
            const lvl = levelContextName;
            hideLevelMenu();
            if (action === 'edit') {
                showLevelCustomization(lvl);
            } else if (action === 'quickProject') {
                quickAddProject(lvl);
            } else if (action === 'exportDebug') {
                // Debug-Bericht nur für dieses Level speichern
                exportLevelDebug(lvl);
            } else if (action === 'delete') {
                deleteLevel(lvl);
            }
        }

        window.showLevelMenu  = showLevelMenu;
        window.hideLevelMenu  = hideLevelMenu;
        window.levelMenuAction = levelMenuAction;

        function showChapterMenu(e, chapterName) {
            e.preventDefault();
            e.stopPropagation();
            chapterContextName = chapterName;
            const menu = document.getElementById('chapterContextMenu');
            menu.style.display = 'block';
            menu.style.left = e.pageX + 'px';
            menu.style.top = e.pageY + 'px';
        }

        function hideChapterMenu() {
            document.getElementById('chapterContextMenu').style.display = 'none';
            chapterContextName = null;
        }

function chapterMenuAction(action) {
            if (!chapterContextName) return;
            const ch = chapterContextName;
            hideChapterMenu();
            if (action === 'edit') {
                showChapterCustomization(ch);
            } else if (action === 'delete') {
                deleteChapter(ch);
            } else if (action === 'quickLevel') {
                quickAddLevel(ch);
            }
        }

        window.showChapterMenu  = showChapterMenu;
        window.hideChapterMenu  = hideChapterMenu;
        window.chapterMenuAction = chapterMenuAction;

        // Table Sorting
        function sortTable(column, evt) {
            const target = evt.target;
            // Update sort buttons
            document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
            target.classList.add('active');
            
            // Determine sort direction
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'asc';
            }
            
            // Store original display order before sorting
            if (displayOrder.length === 0) {
                displayOrder = files.map((file, index) => ({ file, originalIndex: index }));
            }
            
            // Sort files for display only
            let sortedFiles = [...files];
            
            switch(column) {
                case 'position':
                    // Reset to original order
                    sortedFiles = displayOrder.map(item => item.file);
                    break;
                case 'filename':
                    sortedFiles.sort((a, b) => {
                        const result = a.filename.localeCompare(b.filename);
                        return currentSort.direction === 'asc' ? result : -result;
                    });
                    break;
                case 'folder':
                    sortedFiles.sort((a, b) => {
                        const result = a.folder.localeCompare(b.folder);
                        return currentSort.direction === 'asc' ? result : -result;
                    });
                    break;
                case 'completion':
                    sortedFiles.sort((a, b) => {
                        const aCompleted = a.completed ? 1 : 0;
                        const bCompleted = b.completed ? 1 : 0;
                        const result = bCompleted - aCompleted;
                        return currentSort.direction === 'asc' ? -result : result;
                    });
                    break;
            }
            
            // Update table header indicators
            document.querySelectorAll('th').forEach(th => {
                th.classList.remove('sort-asc', 'sort-desc');
            });
            
            if (column !== 'position') {
                const header = target.closest('th') ||
                             document.querySelector(`th[onclick*="${column}"]`);
                if (header) {
                    header.classList.add(currentSort.direction === 'asc' ? 'sort-asc' : 'sort-desc');
                }
            }
            
            // Render with sorted order (but keep original files array unchanged)
            renderFileTableWithOrder(sortedFiles);
        }

// =========================== RENDER FILE TABLE WITH ORDER START ===========================
async function renderFileTableWithOrder(sortedFiles) {
    const tbody = document.getElementById('fileTableBody');
    const table = document.getElementById('fileTable');
    const emptyState = document.getElementById('emptyState');
    
    if (sortedFiles.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    table.style.display = 'table';
    emptyState.style.display = 'none';
    
    const rows = await Promise.all(sortedFiles.map(async (file, displayIndex) => {
        const relPath = getFullPath(file);
        const dePath = getDeFilePath(file);
        const hasDeAudio = !!dePath;
        const hasHistory = await checkHistoryAvailable(file);
        // Symbole und Farben für Längenvergleich vorbereiten
        let lengthIndicatorOrig = '';
        let lengthClassOrig = '';
        let lengthIndicatorEdit = '';
        let lengthClassEdit = '';
        if (hasDeAudio) {
            // Pfade zu EN, DE (bearbeitet) und DE-Backup
            const enUrl = audioFileCache[relPath] || `sounds/EN/${relPath}`;
            const deUrl = deAudioCache[dePath] || `sounds/DE/${dePath}`;
            const deBackupUrl = `sounds/DE-Backup/${dePath}`;
            const enDur = await getAudioDuration(enUrl);
            const editDur = await getAudioDuration(deUrl);
            const origDur = await getAudioDuration(deBackupUrl);
            // Vergleich für ursprüngliche DE-Datei
            if (enDur != null && origDur != null) {
                if (origDur < enDur) {
                    lengthIndicatorOrig = '⬇️';
                    lengthClassOrig = 'good'; // kürzer = positiv
                } else if (origDur > enDur) {
                    lengthIndicatorOrig = '‼️';
                    lengthClassOrig = 'bad'; // länger = negativ
                } else {
                    lengthIndicatorOrig = '↔️';
                    lengthClassOrig = 'neutral';
                }
            }
            // Vergleich für bearbeitete DE-Datei
            if (enDur != null && editDur != null) {
                if (editDur < enDur) {
                    lengthIndicatorEdit = '⬇️';
                    lengthClassEdit = 'good'; // kürzer = positiv
                } else if (editDur > enDur) {
                    lengthIndicatorEdit = '‼️';
                    lengthClassEdit = 'bad'; // länger = negativ
                } else {
                    lengthIndicatorEdit = '↔️';
                    lengthClassEdit = 'neutral';
                }
            }
        }
        // Find original index for display
        const originalIndex = files.findIndex(f => f.id === file.id);
        
        const folderParts = file.folder.split('/');
        const lastFolder = folderParts[folderParts.length - 1] || folderParts[folderParts.length - 2] || 'unknown';
        
        // Get custom folder settings
        const customization = folderCustomizations[file.folder] || {};
        let folderIcon = customization.icon;
        let folderColor = customization.color;
        
        // Get default icon and color if no custom ones set
        if (!folderIcon) {
            if (lastFolder.toLowerCase().includes('gman')) folderIcon = '👤';
            else if (lastFolder.toLowerCase().includes('alyx')) folderIcon = '👩';
            else if (lastFolder.toLowerCase().includes('russell')) folderIcon = '👨‍🔬';
            else if (lastFolder.toLowerCase().includes('eli')) folderIcon = '👨‍🦳';
            else if (lastFolder.toLowerCase().includes('vortigaunt')) folderIcon = '👽';
            else if (lastFolder.toLowerCase().includes('combine')) folderIcon = '🤖';
            else if (lastFolder.toLowerCase().includes('jeff')) folderIcon = '🧟';
            else if (lastFolder.toLowerCase().includes('zombie')) folderIcon = '🧟‍♂️';
            else folderIcon = '📁';
        }
        
        if (!folderColor) {
            // Default colors based on folder name
            if (lastFolder.toLowerCase().includes('gman')) folderColor = '#4a148c';
            else if (lastFolder.toLowerCase().includes('alyx')) folderColor = '#1a237e';
            else if (lastFolder.toLowerCase().includes('russell')) folderColor = '#00695c';
            else if (lastFolder.toLowerCase().includes('eli')) folderColor = '#e65100';
            else if (lastFolder.toLowerCase().includes('vortigaunt')) folderColor = '#263238';
            else if (lastFolder.toLowerCase().includes('combine')) folderColor = '#b71c1c';
            else if (lastFolder.toLowerCase().includes('jeff')) folderColor = '#2e7d32';
            else if (lastFolder.toLowerCase().includes('zombie')) folderColor = '#424242';
            else folderColor = '#333';
        }

        // Speicherort für diese Datei ermitteln
        const storageState = await window.visualizeFileStorage(relPath);
        // 🆕 = nur neues System, 📦 = nur LocalStorage, ⚖️ = beide, ❔ = keines gefunden
        let storageIcon = '❔';
        if (storageState.indexedDB && !storageState.local) {
            storageIcon = '🆕';
        } else if (storageState.local && !storageState.indexedDB) {
            storageIcon = '📦';
        } else if (storageState.local && storageState.indexedDB) {
            storageIcon = '⚖️';
        }

return `
    <!-- Neue kompakte Zeile mit zusammengefassten Spalten -->
    <tr data-id="${file.id}" ${isFileCompleted(file) ? 'class="completed"' : ''}>
        <td class="drag-handle" draggable="true">↕</td>
        <td class="row-number" data-file-id="${file.id}" onclick="changeRowNumber(${file.id}, ${originalIndex + 1})" title="Klick um Position zu ändern">${originalIndex + 1}</td>
        <td class="filename-cell clickable" onclick="checkFilename(${file.id}, event)">${file.filename}</td>
        <td class="folder-cell">
            <span class="folder-badge clickable"
                  style="background: ${folderColor}; color: white;"
                  title="Ordner: ${file.folder} - Klick für Datei-Austausch"
                  onclick="showFileExchangeOptions(${file.id})">
                ${folderIcon} ${lastFolder}
            </span>
            <input type="text" class="folder-note" placeholder="Notiz" value="${escapeHtml(file.folderNote || '')}"
                   oninput="setFolderNote(${file.id}, this.value)">
            <div class="note-dup-info"></div>
        </td>
        <td class="storage-cell" title="Speicherort">${storageIcon}</td>
        <td class="version-score-cell">
            ${hasDeAudio ? `<span class="version-badge" style="background:${getVersionColor(file.version ?? 1)}" onclick="openVersionMenu(event, ${file.id})">${file.version ?? 1}</span>` : ''}
            ${(() => {
                const cls = scoreClass(file.score);
                const color = getContrastingTextColor(SCORE_COLORS[cls]);
                const sug = escapeHtml(file.suggestion || '');
                const com = escapeHtml(file.comment || '');
                const scoreText = file.score === undefined || file.score === null ? '0' : file.score;
                return `<span class="score-cell ${cls}" title="${com}" style="color:${color}" data-suggestion="${sug}" data-comment="${com}">${scoreText}%</span>`;
            })()}
        </td>
        <td>
        <div style="display:flex;flex-direction:column;gap:6px;">
            <div style="position: relative; display: flex; align-items: flex-start; gap: 5px;">
                <textarea class="text-input"
                     onchange="updateText(${file.id}, 'en', this.value)"
                     oninput="autoResizeInput(this)">${escapeHtml(file.enText)}</textarea>
                <div class="btn-column">
                    <button class="copy-btn" onclick="copyTextToClipboard(${file.id}, 'en', event)" title="EN Text kopieren">📋</button>
                    <button class="play-btn" onclick="playAudio(${file.id})">▶</button>
                </div>
            </div>
            <div>
            <div class="comment-box" data-file-id="${file.id}">${escapeHtml(file.comment || '')}</div>
            <div class="suggestion-box ${scoreClass(file.score)}" style="color:${getContrastingTextColor(SCORE_COLORS[scoreClass(file.score)])}" data-file-id="${file.id}">${escapeHtml(file.suggestion || '')}</div>
            <div style="position: relative; display: flex; align-items: flex-start; gap: 5px;">
                <textarea class="text-input"
                     onchange="updateText(${file.id}, 'de', this.value)"
                     oninput="autoResizeInput(this)">${escapeHtml(file.deText)}</textarea>
                <div class="btn-column">
                    <button class="copy-btn" onclick="copyTextToClipboard(${file.id}, 'de', event)" title="DE Text kopieren">📋</button>
                    ${hasDeAudio ? `<button class="de-play-btn" onclick="playDeAudio(${file.id})">▶</button>` : ''}
                </div>
            </div>
            <div class="auto-trans" data-file-id="${file.id}">${escapeHtml(file.autoTranslation || '')}</div>
            <div style="position: relative; display: flex; align-items: flex-start; gap: 5px;">
                <textarea class="emotional-text" placeholder="Mit Emotionen getaggter deutscher Text…" onchange="updateText(${file.id}, 'emo', this.value)" oninput="autoResizeInput(this)">${escapeHtml(file.emotionalText || '')}</textarea>
                <div class="btn-column">
                    <button class="generate-emotions-btn" onclick="generateEmotionalText(${file.id})">Emotional-Text (DE) generieren</button>
                    <button class="adjust-emotions-btn" onclick="adjustEmotionalText(${file.id})">Anpassen-Kürzen</button>
                    <button class="improve-emotions-btn" onclick="improveEmotionalText(${file.id})">Verbesserungsvorschläge</button>
                    <button class="copy-emotional-text" onclick="copyEmotionalText(${file.id})" title="In Zwischenablage kopieren">📋</button>
                </div>
            </div>
            <div class="emo-reason-box" data-file-id="${file.id}">${escapeHtml(file.emoReason || '')}</div>
            </div>
        </div>
        </td>
        <!-- Untertitel-Suche Knopf -->
        <td><div class="btn-column">
            <button class="subtitle-search-btn" onclick="openSubtitleSearch(${file.id})" title="Ähnlichen Untertitel suchen">🔍</button>
            ${textContainsWord(file.deText) ? `<button class="word-indicator" onclick="openWordList()" title="Wörterbuch öffnen">📖</button>` : ''}
        </div></td>
        <td class="path-cell" style="font-size: 11px; color: #666; word-break: break-all;">
            <div class="btn-column">
                <span class="path-btn ${audioFileCache[relPath] ? 'exists' : 'missing'}" title="Pfad der EN-Datei">EN</span>
                <span class="path-btn ${dePath ? 'exists' : 'missing'}" title="Pfad der DE-Datei">DE</span>
            </div>
            <span class="path-detail">EN: sounds/EN/${relPath}<br>DE: ${dePath ? `sounds/DE/${dePath}` : 'fehlend'}</span>
        </td>
        <td>
            <span class="length-diff ${lengthClassOrig}" title="Original">${lengthIndicatorOrig}</span>
            <span class="length-diff ${lengthClassEdit}" title="Bearbeitet">${lengthIndicatorEdit}</span>
        </td>
        <td>
            <!-- Vertikal gruppierte Aktionsknöpfe -->
            <div class="action-toolbar">
                <div class="action-row action-block">
                    <button class="icon-btn upload-btn" onclick="initiateDeUpload(${file.id})" title="DE-Audio hochladen">⬆️</button>
                    ${hasHistory ? `<button class="icon-btn history-btn" onclick="openHistory(${file.id})" title="Historie anzeigen">🕒</button>` : ''}
                </div>
                <div class="action-row action-block">
                    <div class="dubbing-cell">
                        <button class="icon-btn dubbing-btn" onclick="initiateDubbing(${file.id})" title="Dubbing starten">🔈</button>
                        ${file.emotionalText && file.emotionalText.trim() ? `<button class="icon-btn dubbing-btn emo" onclick="initiateEmoDubbing(${file.id})" title="Emotionales Dubbing starten">🟣</button>` : ''}
                        <span class="dub-status ${!file.dubbingId ? 'none' : (file.dubReady ? 'done' : 'pending')}" title="${!file.dubbingId ? 'kein Dubbing' : (file.dubReady ? 'fertig' : 'Studio generiert noch')}" ${(!file.dubbingId || file.dubReady) ? '' : `onclick=\"dubStatusClicked(${file.id})\"`}>●</span>
                        ${file.dubbingId ? `<button class="icon-btn download-de-btn" data-file-id="${file.id}" title="Dubbing herunterladen (ID: ${file.dubbingId})" onclick="openDubbingPage(${file.id})">⬇️</button>` : ''}
                        ${file.emotionalText && file.emotionalText.trim() ? `<span class="emo-dub-status ${!file.emoDubbingId ? 'none' : (file.emoDubReady ? 'done' : 'pending')}" title="${!file.emoDubbingId ? 'kein Dubbing' : (file.emoDubReady ? 'fertig' : 'Studio generiert noch')}" ${(!file.emoDubbingId || file.emoDubReady) ? '' : `onclick=\"dubStatusClicked(${file.id})\"`}>●</span>` : ''}
                        ${file.emoDubbingId ? `<button class="icon-btn download-emo-btn" data-file-id="${file.id}" title="Emo-Dubbing herunterladen (ID: ${file.emoDubbingId})" onclick="openDubbingPage(${file.id}, 'emo')">⬇️</button>` : ''}
                    </div>
                </div>
                <div class="action-row action-block">
                    <button class="icon-btn edit-audio-btn" onclick="openDeEdit(${file.id})" title="DE-Audio bearbeiten">✂️</button>
                    <div class="edit-column">
                        ${file.trimStartMs !== 0 || file.trimEndMs !== 0 ? '<span class="edit-status-icon" title="Audio gekürzt">✂️</span>' : ''}
                        ${file.volumeMatched ? '<span class="edit-status-icon" title="Lautstärke angepasst">🔊</span>' : ''}
                        ${file.radioEffect ? '<span class="edit-status-icon" title="Funkgerät-Effekt">📻</span>' : ''}
                        ${(file.hallEffect || file.neighborHall) ? '<span class="edit-status-icon" title="Hall-Effekt">🏛️</span>' : ''}
                        ${file.emiEffect ? '<span class="edit-status-icon" title="EM-Störgeräusch">⚡</span>' : ''}
                        ${file.neighborEffect ? '<span class="edit-status-icon" title="Nebenraum-Effekt">🚪</span>' : ''}
                        ${file.tableMicEffect ? '<span class="edit-status-icon" title="Telefon-auf-Tisch-Effekt">📱</span>' : ''}
                    </div>
                    ${file.emotionalText && file.emotionalText.trim() ? `<button class="icon-btn emo-done-btn" onclick="toggleEmoCompletion(${file.id})" title="Zeile fertig vertont">✅</button>` : ''}
                </div>
                <div class="action-row delete-row action-block">
                    <button class="icon-btn delete-row-btn" onclick="deleteFile(${file.id})" title="Zeile löschen">🗑️</button>
                </div>
            </div>
        </td>
    </tr>
`;
    }));
    tbody.innerHTML = rows.join('');

    // Tooltip- und Klicklogik auslagern
    // Bindet Tooltip und Klick auf die Score-Zellen und stellt die CSS-Klassen sicher
    attachScoreHandlers(tbody, files);

    addDragAndDropHandlers();
    addPathCellContextMenus();
    updateCounts();
    updateDubButtons();
    updateDuplicateNotes();
    // Nur scrollen, wenn keine neue Auswahl aussteht
    if (pendingSelectId === null) {
        scrollToNumber(currentRowNumber);
    }

    // Falls eine neue Datei hinzugekommen ist, diese Zeile auswählen und dann scrollen
    if (pendingSelectId !== null) {
        const neueZeile = tbody.querySelector(`tr[data-id="${pendingSelectId}"]`);
        if (neueZeile) {
            selectRow(neueZeile);
            // Nach dem Selektieren zur neuen Zeile springen
            scrollToNumber(currentRowNumber);
        }
        pendingSelectId = null;
    }

    // Nach dem Rendern Textfelder und Übersetzungsanzeige anpassen
    setTimeout(() => {
        resizeTextFields();
        sortedFiles.forEach(f => {
            updateTranslationDisplay(f.id);
            updateCommentDisplay(f.id);
            updateSuggestionDisplay(f.id);
            updateEmoReasonDisplay(f.id);
        });
        // GPT-Vorschlag per Klick übernehmen
        document.querySelectorAll('.suggestion-box').forEach(div => {
            const id = Number(div.dataset.fileId);
            const file = files.find(f => f.id === id);
            if (!file) {
                // Dateizuordnung fehlt → Element entfernen und Nutzer informieren
                const row = div.closest('tr');
                if (row) row.remove();
                const msg = `❌ Keine Datei für Vorschlag mit ID ${id} gefunden. Der Eintrag wurde entfernt.`;
                // Fragt optional nach einem Debug-Bericht
                if (confirm(`${msg}\n\nSoll ein Debug-Bericht gespeichert werden?`)) {
                    exportDebugReport();
                }
                return;
            }
            div.textContent = file.suggestion || '';
            div.onclick = () => {
                // Klick übernimmt den GPT-Vorschlag in den DE-Text
                file.deText = file.suggestion;
                markDirty();
                const container = div.nextElementSibling;
                const textarea = container?.querySelector('textarea.text-input');
                if (textarea) {
                    textarea.value = file.deText;
                    textarea.classList.add('blink-blue');
                    setTimeout(() => textarea.classList.remove('blink-blue'), 600);
                }
            };
        });
    }, 50);
}
// =========================== RENDER FILE TABLE WITH ORDER END ===========================

// =========================== FILE EXCHANGE FUNCTIONALITY START ===========================

let fileExchangeData = {
    currentFile: null,
    similarEntries: [],
    selectedEntry: null
};

// =========================== SHOW FILE EXCHANGE OPTIONS START ===========================
async function showFileExchangeOptions(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) {
        console.error('Datei nicht gefunden:', fileId);
        return;
    }
    
    // Prüfe ob EN-Text vorhanden ist
    if (!file.enText || file.enText.trim().length === 0) {
        alert('❌ Datei-Austausch nicht möglich\n\nDiese Datei hat keinen EN-Text zum Vergleichen.\nBitte fügen Sie zuerst einen englischen Text hinzu.');
        return;
    }
    
    debugLog(`[FILE EXCHANGE] Suche ähnliche Einträge für: ${file.filename}`);
    debugLog(`[FILE EXCHANGE] EN-Text: ${file.enText.substring(0, 50)}...`);
    
    // Text-Utilities bei Bedarf nachladen
    if (typeof calculateTextSimilarity !== 'function') {
        try {
            const mod = await import('./fileUtils.mjs');
            calculateTextSimilarity = mod.calculateTextSimilarity;
            levenshteinDistance = mod.levenshteinDistance;
            moduleStatus.fileUtils = { loaded: true, source: 'Ausgelagert' };
        } catch (err) {
            // Fallback auf globale Funktion, falls das Modul nicht geladen werden konnte
            if (typeof window !== 'undefined' && typeof window.calculateTextSimilarity === 'function') {
                calculateTextSimilarity = window.calculateTextSimilarity;
                levenshteinDistance = window.levenshteinDistance;
            } else {
                console.error('Text-Utilities konnten nicht geladen werden', err);
                alert('❌ Text-Utilities konnten nicht geladen werden.');
                return;
            }
        }
    }

    // Suche ähnliche Einträge in der Datenbank
    const similarEntries = searchSimilarEntriesInDatabase(file);
    
    if (similarEntries.length === 0) {
        alert('❌ Keine ähnlichen Einträge gefunden\n\nEs wurden keine Dateien in der Datenbank gefunden, die ähnliche EN-Texte haben.\n\nTipp: Importieren Sie zuerst mehr Daten oder scannen Sie weitere Ordner.');
        return;
    }
    
    debugLog(`[FILE EXCHANGE] Gefunden: ${similarEntries.length} ähnliche Einträge`);
    
    // Zeige Dialog mit Optionen
    displayFileExchangeDialog(file, similarEntries);
}
// =========================== SHOW FILE EXCHANGE OPTIONS END ===========================

// =========================== SEARCH SIMILAR ENTRIES START ===========================
function searchSimilarEntriesInDatabase(currentFile) {
    const currentEnText = currentFile.enText.trim().toLowerCase();
    const similarEntries = [];
    const currentFileKey = `${currentFile.folder}/${currentFile.filename}`;
    
    // Durchsuche alle Einträge in der textDatabase
    Object.entries(textDatabase).forEach(([fileKey, texts]) => {
        // Überspringe die aktuelle Datei selbst
        if (fileKey === currentFileKey) return;
        
        // Überspringe Einträge ohne EN-Text
        if (!texts.en || texts.en.trim().length === 0) return;
        
        const dbEnText = texts.en.trim().toLowerCase();
        
        // Berechne Ähnlichkeit
        const similarity = calculateTextSimilarity(currentEnText, dbEnText);
        
        // Nur Einträge mit mindestens 30% Ähnlichkeit berücksichtigen
        if (similarity >= 0.3) {
            // Extrahiere Dateiname und Ordner aus fileKey
            const pathParts = fileKey.split('/');
            const filename = pathParts.pop();
            const folder = pathParts.join('/');
            
            similarEntries.push({
                fileKey: fileKey,
                filename: filename,
                folder: folder,
                enText: texts.en,
                deText: texts.de || '',
                similarity: similarity,
                similarityPercent: Math.round(similarity * 100)
            });
        }
    });
    
    // Sortiere nach Ähnlichkeit (höchste zuerst)
    similarEntries.sort((a, b) => b.similarity - a.similarity);
    
    // Begrenze auf maximal 20 Einträge
    return similarEntries.slice(0, 20);
}
// =========================== SEARCH SIMILAR ENTRIES END ===========================

// =========================== SUBTITLE SEARCH START ===========================
// Entfernt Untertitel-Tags wie "<clr:255,190,255>" oder "<HEADSET>"
function stripColorCodes(text) {
    return text
        .replace(/<(?:sb|cr|br)>/gi, ' ')
        .replace(/<[^>]+>/gi, '')
        .replace(/\s+/g, ' ')
        .replace(/([.!?])([A-ZÄÖÜ])/g, '$1 $2')
        .trim();
}

async function openSubtitleSearch(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file || !file.enText) return;

    // Lade das Modul bei Bedarf dynamisch nach, wenn die Funktion noch fehlt
    if (typeof calculateTextSimilarity !== 'function') {
        try {
            const mod = await import('./fileUtils.mjs');
            calculateTextSimilarity = mod.calculateTextSimilarity;
            levenshteinDistance = mod.levenshteinDistance;
        } catch (err) {
            // Fallback auf die globale Funktion, falls das Modul fehlschlägt
            if (typeof window !== 'undefined' && typeof window.calculateTextSimilarity === 'function') {
                calculateTextSimilarity = window.calculateTextSimilarity;
                levenshteinDistance = window.levenshteinDistance;
            } else {
                console.error('Text-Utilities konnten nicht geladen werden', err);
                alert('❌ Text-Utilities konnten nicht geladen werden.');
                return;
            }
        }
    }

    // Lade den Parser bei Bedarf dynamisch nach, wenn die Funktion noch fehlt
    if (typeof loadClosecaptions !== 'function') {
        try {
            // Parser bei Bedarf dynamisch laden, auch wenn kein Export vorhanden ist
            const mod = await import('../../closecaptionParser.js');
            loadClosecaptions = mod.loadClosecaptions || window.loadClosecaptions;
            moduleStatus.closecaptionParser = { loaded: true, source: 'Ausgelagert' };
        } catch (e) {
            console.error('closecaptionParser konnte nicht geladen werden', e);
            alert('❌ Untertitel konnten nicht geladen werden.');
            return;
        }
    }

    if (!subtitleData) {
        const base = isElectron ? window.electronAPI.join('..', 'closecaption') : '../closecaption';
        subtitleData = await loadClosecaptions(base);
        if (!subtitleData) {
            alert('❌ Untertitel konnten nicht geladen werden.');
            return;
        }
    }

    // Farbcodes entfernen und Text normalisieren
    const current = stripColorCodes(file.enText).trim().toLowerCase();
    const hits = [];
    subtitleData.forEach(entry => {
        const enClean = stripColorCodes(entry.enText).trim();
        const deClean = stripColorCodes(entry.deText).trim();
        const similarity = calculateTextSimilarity(current, enClean.toLowerCase());
        if (similarity >= 0.3) hits.push({ ...entry, enText: enClean, deText: deClean, similarity });
    });

    hits.sort((a, b) => b.similarity - a.similarity);
    showSubtitleResults(fileId, hits, stripColorCodes(file.enText));
}

function showSubtitleResults(fileId, results, searchText) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay hidden';

    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    dialog.style.maxWidth = '700px';

    dialog.innerHTML = `
        <h3>🔍 Untertitel-Suche</h3>
        <div style="margin:5px 0 10px;font-style:italic;color:#ccc;">${escapeHtml(searchText)}</div>
        <p style="margin-bottom:15px;color:#999;">Treffer auswählen, um den DE-Text zu übernehmen</p>
        <div style="max-height:300px;overflow-y:auto;">
            ${results.map((r, i) => `
                <div class="subtitle-result" onclick="chooseSubtitleResult(${i})" style="padding:10px;margin:5px 0;border:1px solid #444;border-radius:6px;cursor:pointer;">
                    <div style="font-weight:bold;color:#ff6b1a;">${Math.round(r.similarity * 100)}%</div>
                    <div style="font-style:italic;margin:4px 0;">${escapeHtml(r.enText)}</div>
                    <div>${escapeHtml(r.deText)}</div>
                </div>`).join('')}
        </div>
        <div class="dialog-buttons">
            <button class="btn btn-secondary" onclick="closeSubtitleDialog()">Schließen</button>
        </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    overlay.classList.remove('hidden');

    window.chooseSubtitleResult = (index) => {
        const hit = results[index];
        const f = files.find(f => f.id === fileId);
        if (!f) return;
        f.deText = hit.deText;
        markDirty();
        renderFileTable();
        closeSubtitleDialog();
    };

    window.closeSubtitleDialog = () => {
        document.body.removeChild(overlay);
    };

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) window.closeSubtitleDialog();
    });
}
// =========================== SUBTITLE SEARCH END =============================

// Startet die Untertitel-Suche für alle Dateien ohne deutschen Text
async function runGlobalSubtitleSearch() {
    // Sammle alle Dateien ohne DE-Text
    const targets = files.filter(f => !f.deText || !f.deText.trim());
    if (targets.length === 0) {
        alert('✅ Alle Dateien besitzen bereits einen deutschen Text.');
        return;
    }

    // Text-Utilities bei Bedarf laden
    if (typeof calculateTextSimilarity !== 'function') {
        try {
            const mod = await import('./fileUtils.mjs');
            calculateTextSimilarity = mod.calculateTextSimilarity;
            levenshteinDistance = mod.levenshteinDistance;
        } catch (err) {
            if (typeof window !== 'undefined' && typeof window.calculateTextSimilarity === 'function') {
                calculateTextSimilarity = window.calculateTextSimilarity;
                levenshteinDistance = window.levenshteinDistance;
            } else {
                console.error('Text-Utilities konnten nicht geladen werden', err);
                alert('❌ Text-Utilities konnten nicht geladen werden.');
                return;
            }
        }
    }

    // Untertitel bei Bedarf laden
    if (typeof loadClosecaptions !== 'function') {
        try {
            const mod = await import('../../closecaptionParser.js');
            loadClosecaptions = mod.loadClosecaptions || window.loadClosecaptions;
        } catch (e) {
            console.error('closecaptionParser konnte nicht geladen werden', e);
            alert('❌ Untertitel konnten nicht geladen werden.');
            return;
        }
    }

    if (!subtitleData) {
        const base = isElectron ? window.electronAPI.join('..', 'closecaption') : '../closecaption';
        subtitleData = await loadClosecaptions(base);
        if (!subtitleData) {
            alert('❌ Untertitel konnten nicht geladen werden.');
            return;
        }
    }

    // Fortschrittsanzeige vorbereiten
    const progress = document.getElementById('subtitleSearchProgress');
    const status   = document.getElementById('subtitleSearchStatus');
    const fill     = document.getElementById('subtitleSearchFill');
    progress.classList.add('active');

    let applied = 0;
    for (let i = 0; i < targets.length; i++) {
        const file = targets[i];
        status.textContent = `Suche ${i + 1}/${targets.length}...`;
        const current = stripColorCodes(file.enText).trim().toLowerCase();
        const matches = [];
        subtitleData.forEach(entry => {
            const enClean = stripColorCodes(entry.enText).trim();
            const similarity = calculateTextSimilarity(current, enClean.toLowerCase());
            if (similarity === 1) {
                matches.push({ ...entry, deText: stripColorCodes(entry.deText).trim() });
            }
        });

        if (matches.length === 1) {
            updateText(file.id, 'de', matches[0].deText, true);
            applied++;
        } else if (matches.length > 1) {
            const useOne = confirm(`Mehrere perfekte Treffer für "${file.filename}" gefunden. Ersten übernehmen?`);
            if (useOne) {
                updateText(file.id, 'de', matches[0].deText, true);
                applied++;
            }
        }
        fill.style.width = `${Math.round(((i + 1) / targets.length) * 100)}%`;
        await new Promise(r => setTimeout(r, 0));
    }

    progress.classList.remove('active');
    fill.style.width = '0%';
    if (applied > 0) {
        renderFileTable();
        saveCurrentProject();
    }
    alert(`🔍 Untertitelsuche abgeschlossen. ${applied} Texte übernommen.`);
}

// =========================== TEXT-ÄHNLICHKEIT (siehe fileUtils.js) =====================

// =========================== DISPLAY FILE EXCHANGE DIALOG START ===========================
function displayFileExchangeDialog(currentFile, similarEntries) {
    fileExchangeData.currentFile = currentFile;
    fileExchangeData.similarEntries = similarEntries;
    fileExchangeData.selectedEntry = null;
    
    // Erstelle Dialog-HTML
    const dialogHTML = `
        <div class="file-exchange-dialog hidden" id="fileExchangeDialog">
            <div class="file-exchange-content">
                <h3>🔄 Datei-Austausch: ${currentFile.filename}</h3>
                
                <div class="current-file-info">
                    <h4>📄 Aktuelle Datei</h4>
                    <div><strong>Dateiname:</strong> ${currentFile.filename}</div>
                    <div><strong>Ordner:</strong> ${currentFile.folder}</div>
                    <div class="entry-text en"><strong>EN:</strong> ${currentFile.enText}</div>
                    <div class="entry-text de"><strong>DE:</strong> ${currentFile.deText || '(leer)'}</div>
                </div>
                
                <h4>🔍 Ähnliche Einträge in der Datenbank (${similarEntries.length} gefunden)</h4>
                <p style="color: #999; margin-bottom: 15px;">
                    Klicken Sie auf einen Eintrag, um die Datei auszutauschen. 
                    Der EN-Text wird aus der Datenbank übernommen, der DE-Text bleibt erhalten.
                </p>
                
                <div class="similar-entries-list">
                    ${similarEntries.map((entry, index) => `
                        <div class="similar-entry-item" onclick="selectExchangeEntry(${index})">
                            <div class="similarity-score ${entry.similarityPercent >= 80 ? 'high' : entry.similarityPercent >= 50 ? 'medium' : 'low'}">
                                ${entry.similarityPercent}%
                            </div>
                            <div class="entry-filename">${entry.filename}</div>
                            <div class="entry-folder">📁 ${entry.folder}</div>
                            <div class="entry-text en">
                                <strong>EN:</strong> ${entry.enText}
                            </div>
                            <div class="entry-text de">
                                <strong>DE:</strong> ${entry.deText || '(leer)'}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="exchange-preview" id="exchangePreview">
                    <h4>🔄 Vorschau der Änderungen</h4>
                    <div class="exchange-changes">
                        <div class="change-item old">
                            <strong>Alt (wird ersetzt):</strong>
                            <div id="oldPreview"></div>
                        </div>
                        <div class="change-item new">
                            <strong>Neu (aus Datenbank):</strong>
                            <div id="newPreview"></div>
                        </div>
                    </div>
                </div>
                
                <div class="dialog-buttons">
                    <button class="btn btn-secondary" onclick="closeFileExchangeDialog()">Abbrechen</button>
                    <button class="btn btn-success" id="executeExchangeBtn" onclick="executeFileExchange()" disabled>
                        Austausch durchführen
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Füge Dialog zum DOM hinzu
    document.body.insertAdjacentHTML('beforeend', dialogHTML);

    // Zeige Dialog
    document.getElementById('fileExchangeDialog').classList.remove('hidden');
    
    updateStatus(`Datei-Austausch geöffnet: ${similarEntries.length} ähnliche Einträge gefunden`);
}
// =========================== DISPLAY FILE EXCHANGE DIALOG END ===========================

// =========================== SELECT EXCHANGE ENTRY START ===========================
function selectExchangeEntry(index) {
    const entries = document.querySelectorAll('.similar-entry-item');
    
    // Entferne alte Auswahl
    entries.forEach(entry => entry.classList.remove('selected'));
    
    // Markiere neue Auswahl
    entries[index].classList.add('selected');
    
    // Speichere ausgewählten Eintrag
    fileExchangeData.selectedEntry = fileExchangeData.similarEntries[index];
    
    // Zeige Vorschau
    showExchangePreview();
    
    // Aktiviere Austausch-Button
    document.getElementById('executeExchangeBtn').disabled = false;
    
    debugLog(`[FILE EXCHANGE] Ausgewählt: ${fileExchangeData.selectedEntry.filename} (${fileExchangeData.selectedEntry.similarityPercent}% Ähnlichkeit)`);
}
// =========================== SELECT EXCHANGE ENTRY END ===========================

// =========================== SHOW EXCHANGE PREVIEW START ===========================
function showExchangePreview() {
    const preview = document.getElementById('exchangePreview');
    const oldPreview = document.getElementById('oldPreview');
    const newPreview = document.getElementById('newPreview');
    
    if (!fileExchangeData.selectedEntry) return;
    
    const current = fileExchangeData.currentFile;
    const selected = fileExchangeData.selectedEntry;
    
    oldPreview.innerHTML = `
        <div><strong>Dateiname:</strong> ${current.filename}</div>
        <div><strong>Ordner:</strong> ${current.folder}</div>
        <div><strong>EN:</strong> ${current.enText}</div>
        <div><strong>DE:</strong> ${current.deText || '(leer)'}</div>
    `;
    
    newPreview.innerHTML = `
        <div><strong>Dateiname:</strong> ${selected.filename}</div>
        <div><strong>Ordner:</strong> ${selected.folder}</div>
        <div><strong>EN:</strong> ${selected.enText}</div>
        <div><strong>DE:</strong> ${current.deText || '(bleibt erhalten)'}</div>
    `;
    
    preview.style.display = 'block';
}
// =========================== SHOW EXCHANGE PREVIEW END ===========================

// =========================== EXECUTE FILE EXCHANGE START ===========================
function executeFileExchange() {
    if (!fileExchangeData.currentFile || !fileExchangeData.selectedEntry) {
        alert('❌ Fehler: Keine Auswahl getroffen');
        return;
    }
    
    const current = fileExchangeData.currentFile;
    const selected = fileExchangeData.selectedEntry;
    
    // Bestätigung
    const confirmMessage = `🔄 Datei-Austausch bestätigen\n\n` +
        `Aktuelle Datei: ${current.filename}\n` +
        `Ordner: ${current.folder}\n\n` +
        `Wird ersetzt durch:\n` +
        `Neue Datei: ${selected.filename}\n` +
        `Ordner: ${selected.folder}\n` +
        `Ähnlichkeit: ${selected.similarityPercent}%\n\n` +
        `Änderungen:\n` +
        `• EN-Text: Wird aus Datenbank übernommen\n` +
        `• DE-Text: Bleibt erhalten (${current.deText ? 'vorhanden' : 'leer'})\n` +
        `• Dateiname & Ordner: Werden geändert\n\n` +
        `Fortfahren?`;
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    // Führe Austausch durch
    debugLog(`[FILE EXCHANGE] Tausche aus: ${current.filename} → ${selected.filename}`);
    
    // 1. Aktualisiere die Datei im aktuellen Projekt
    current.filename = selected.filename;
    current.folder = selected.folder;
    current.enText = selected.enText;
    // DE-Text bleibt erhalten: current.deText = current.deText;
    
    // 2. Markiere als dirty für Speicherung
    markDirty();
    // 3. Aktualisiere textDatabase mit dem erhaltenen DE-Text
    const newFileKey = `${selected.folder}/${selected.filename}`;
    if (!textDatabase[newFileKey]) {
        textDatabase[newFileKey] = {};
    }
    textDatabase[newFileKey].en = selected.enText;
    if (current.deText) {
        textDatabase[newFileKey].de = current.deText;
    }
    
    // 4. Speichere Änderungen
    saveTextDatabase();
    saveCurrentProject();
    
    // 5. Aktualisiere UI
    renderFileTable();
    renderProjects();
    updateProgressStats();
    
    // 6. Schließe Dialog
    closeFileExchangeDialog();
    
    // 7. Erfolgs-Nachricht
    const successMessage = `✅ Datei-Austausch erfolgreich!\n\n` +
        `Alte Datei: ${current.filename}\n` +
        `Neue Datei: ${selected.filename}\n` +
        `Ordner: ${selected.folder}\n` +
        `Ähnlichkeit: ${selected.similarityPercent}%\n\n` +
        `✓ EN-Text aus Datenbank übernommen\n` +
        `✓ DE-Text beibehalten\n` +
        `✓ Projekt aktualisiert`;
    
    updateStatus(`Datei-Austausch erfolgreich: ${selected.filename} (${selected.similarityPercent}% Ähnlichkeit)`);
    
    setTimeout(() => {
        alert(successMessage);
    }, 500);
    
    debugLog(`[FILE EXCHANGE] Erfolgreich: ${current.filename} in ${current.folder}`);
}
// =========================== EXECUTE FILE EXCHANGE END ===========================

// =========================== CLOSE FILE EXCHANGE DIALOG START ===========================
function closeFileExchangeDialog() {
    const dialog = document.getElementById('fileExchangeDialog');
    if (dialog) {
        dialog.remove();
    }
    
    // Reset data
    fileExchangeData = {
        currentFile: null,
        similarEntries: [],
        selectedEntry: null
    };
    
    updateStatus('Datei-Austausch abgebrochen');
}
// =========================== CLOSE FILE EXCHANGE DIALOG END ===========================

// =========================== FILE EXCHANGE FUNCTIONALITY END ===========================

// Debug: Zeige aufgelösten Pfad für Datei
function getDebugPathInfo(file) {
    if (!filePathDatabase[file.filename]) {
        return '❌ Nicht in DB';
    }
    
    const dbPaths = filePathDatabase[file.filename];
    
    // Suche passende Pfade
    const exactMatches = dbPaths.filter(pathInfo => pathInfo.folder === file.folder);
    const normalizedMatches = dbPaths.filter(pathInfo => {
        const normalizedFileFolder = normalizeFolderPath(file.folder);
        const normalizedDbFolder = normalizeFolderPath(pathInfo.folder);
        return normalizedFileFolder === normalizedDbFolder;
    });
    
    if (exactMatches.length > 0) {
        const bestPath = exactMatches[0];
        const isAudioAvailable = !!audioFileCache[bestPath.fullPath];
        const status = isAudioAvailable ? '✅' : '❌';
        return `${status} EXAKT<span class="path-detail"><br><small>${bestPath.fullPath}</small></span>`;
    }
    
    if (normalizedMatches.length > 0) {
        const bestPath = normalizedMatches[0];
        const isAudioAvailable = !!audioFileCache[bestPath.fullPath];
        const status = isAudioAvailable ? '✅' : '⚠️';
        return `${status} NORMALISIERT<span class="path-detail"><br><small>Projekt: ${file.folder}<br>DB: ${bestPath.folder}</small></span>`;
    }
    
    // Keine Matches - zeige was verfügbar ist
    const availableFolders = dbPaths.map(p => p.folder).join('<br>');
    return `❌ KEINE MATCHES<span class="path-detail"><br><small>Projekt: ${file.folder}<br>DB hat:<br>${availableFolders}</small></span>`;
}

// Repariere Ordnernamen in allen Projekten basierend auf Database
function repairProjectFolders() {
    if (!confirm('Dies aktualisiert alle Ordnernamen in den Projekten basierend auf der Database.\nFortfahren?')) {
        return;
    }
    
    let totalUpdated = 0;
    let totalProjects = 0;
    const updateLog = [];
    
    debugLog('=== Repariere Projekt-Ordnernamen ===');
    
    projects.forEach(project => {
        if (!project.files || project.files.length === 0) return;
        
        totalProjects++;
        let projectUpdated = 0;
        
        project.files.forEach(file => {
            if (!filePathDatabase[file.filename]) {
                debugLog(`❌ ${file.filename} nicht in Database gefunden`);
                return;
            }
            
            const dbPaths = filePathDatabase[file.filename];
            
            // Suche beste Übereinstimmung
            let bestMatch = null;
            
            // 1. Exakte Übereinstimmung
            const exactMatch = dbPaths.find(p => p.folder === file.folder);
            if (exactMatch) {
                bestMatch = exactMatch;
            } else {
                // 2. Normalisierte Übereinstimmung
                const normalizedFileFolder = normalizeFolderPath(file.folder);
                const normalizedMatch = dbPaths.find(p => {
                    const normalizedDbFolder = normalizeFolderPath(p.folder);
                    return normalizedFileFolder === normalizedDbFolder;
                });
                
                if (normalizedMatch) {
                    bestMatch = normalizedMatch;
                } else {
                    // 3. Ähnlichkeits-Matching (falls Ordnername teilweise übereinstimmt)
                    const similarMatch = dbPaths.find(p => {
                        const fileFolder = file.folder.toLowerCase();
                        const dbFolder = p.folder.toLowerCase();
                        return fileFolder.includes(dbFolder.split('/').pop()) || 
                               dbFolder.includes(fileFolder);
                    });
                    
                    if (similarMatch) {
                        bestMatch = similarMatch;
                    } else {
                        // 4. Fallback: Nimm ersten verfügbaren Pfad
                        bestMatch = dbPaths[0];
                    }
                }
            }
            
            // Aktualisiere Ordnernamen wenn nötig
            if (bestMatch && bestMatch.folder !== file.folder) {
                const oldFolder = file.folder;
                file.folder = bestMatch.folder;
                projectUpdated++;
                totalUpdated++;
                
                updateLog.push(`${project.name}: ${file.filename} | ${oldFolder} → ${bestMatch.folder}`);
                debugLog(`✅ ${project.name}: ${file.filename} | ${oldFolder} → ${bestMatch.folder}`);
            }
        });
        
        if (projectUpdated > 0) {
            debugLog(`📁 Projekt "${project.name}": ${projectUpdated} Ordner aktualisiert`);
        }
    });
    
    if (totalUpdated > 0) {
        // Speichere alle aktualisierten Projekte
        saveProjects();
        debugLog(`🎯 Gesamt: ${totalUpdated} Ordnernamen in ${totalProjects} Projekten aktualisiert`);
        
        // Aktualisiere das aktuelle Projekt
        if (currentProject) {
            const updatedProject = projects.find(p => p.id === currentProject.id);
            if (updatedProject) {
                files = updatedProject.files || [];
                renderFileTable();
                updateProgressStats();
                updateFileAccessStatus();
            }
        }
        
        updateStatus(`📁 Ordner-Reparatur: ${totalUpdated} Ordnernamen aktualisiert`);
        
        // Zeige Zusammenfassung
        const logPreview = updateLog.slice(0, 10).join('\n');
        const moreText = updateLog.length > 10 ? `\n... und ${updateLog.length - 10} weitere` : '';
        
        alert(`✅ Ordner-Reparatur erfolgreich!\n\n` +
              `📊 Statistik:\n` +
              `• ${totalUpdated} Ordnernamen aktualisiert\n` +
              `• ${totalProjects} Projekte verarbeitet\n\n` +
              `🔧 Beispiele:\n${logPreview}${moreText}\n\n` +
              `🎯 Audio sollte jetzt in allen Projekten funktionieren!`);
    } else {
        alert('✅ Alle Ordnernamen sind bereits korrekt!\n\nKeine Aktualisierungen nötig.');
    }
    
    debugLog('=== Ordner-Reparatur abgeschlossen ===');
}




// =========================== GETFULLPATH START ===========================
// Liefert den vollständigen relativen Pfad einer Datei anhand der Datenbank
function getFullPath(file) {
    // Zuerst nach exaktem Dateinamen suchen
    if (filePathDatabase[file.filename]) {
        const exact = filePathDatabase[file.filename].find(p => p.folder === file.folder);
        if (exact) {
            return exact.fullPath;
        }
        const first = filePathDatabase[file.filename][0];
        if (first) {
            return first.fullPath;
        }
    }

    // Fallback: andere Endungen mit gleichem Basisnamen pruefen
    const basisName = file.filename.replace(/\.(mp3|wav|ogg)$/i, '');
    const endungen = ['.mp3', '.wav', '.ogg'];
    for (const endung of endungen) {
        const kandidat = basisName + endung;
        if (kandidat !== file.filename && filePathDatabase[kandidat]) {
            const exact = filePathDatabase[kandidat].find(p => p.folder === file.folder);
            if (exact) {
                return exact.fullPath;
            }
            const first = filePathDatabase[kandidat][0];
            if (first) {
                return first.fullPath;
            }
        }
    }

    // Kein Treffer -> Standardpfad zurueckgeben
    return `${file.folder}/${file.filename}`;
}
// =========================== GETFULLPATH END ===========================

// =========================== GETDEFILEPATH START ===========================
// Liefert den relativen Pfad der vorhandenen DE-Datei oder null
function getDeFilePath(file) {
    const basisRel = getFullPath(file).replace(/\.(mp3|wav|ogg)$/i, '');
    const endungen = ['.mp3', '.wav', '.ogg'];
    for (const endung of endungen) {
        const kandidat = basisRel + endung;
        if (deAudioCache[kandidat]) {
            return kandidat;
        }
        const realKey = findDeAudioCacheKeyInsensitive(kandidat);
        if (realKey) return realKey;
    }
    return null;
}
// =========================== GETDEFILEPATH END ===========================

// Prüft, ob eine Datei EN- und DE-Text sowie ein DE-Audio besitzt
function isFileCompleted(file) {
    const hasEn = file.enText && file.enText.trim().length > 0;
    const hasDe = file.deText && file.deText.trim().length > 0;
    const hasAudio = !!getDeFilePath(file);
    return hasEn && hasDe && hasAudio;
}

// =========================== HISTORY CACHE START ===========================
// Prüft, ob für eine Datei History-Versionen existieren
async function checkHistoryAvailable(file) {
    const relPath = getFullPath(file);
    if (historyPresenceCache[relPath] !== undefined) return historyPresenceCache[relPath];
    if (!window.electronAPI || !window.electronAPI.listDeHistory) {
        historyPresenceCache[relPath] = false;
        return false;
    }
    const list = await window.electronAPI.listDeHistory(relPath);
    const has = Array.isArray(list) && list.length > 0;
    historyPresenceCache[relPath] = has;
    return has;
}

// Aktualisiert den Cache nach Änderungen an einer Datei
async function updateHistoryCache(relPath) {
    if (!window.electronAPI || !window.electronAPI.listDeHistory) return;
    const list = await window.electronAPI.listDeHistory(relPath);
    historyPresenceCache[relPath] = Array.isArray(list) && list.length > 0;
}

function openHistory(fileId) {
    const file = files.find(f => f.id === fileId);
    if (file) showHistoryDialog(file);
}
// =========================== HISTORY CACHE END =============================

// =========================== NORMALIZEFOLDERPATH START ===========================
// Consistent folder normalization for duplicate detection
function normalizeFolderPath(folderPath) {
    if (!folderPath) return 'unknown';
    
    debugLog(`[NORMALIZE] Input: ${folderPath}`);
    
    // Convert to lowercase for comparison
    let normalized = folderPath.toLowerCase();
    
    // WICHTIG: Entferne ALLE möglichen Präfixe die zu Problemen führen können
    // Diese Liste muss alle möglichen Scan-Ebenen abdecken
    const prefixesToRemove = [
        /^.*\/sounds\/vo\//,     // z.B. "Projekte/Neu/sounds/vo/" -> ""
        /^sounds\/vo\//,         // "sounds/vo/" -> ""
        /^.*\/vo\//,            // z.B. "Projekte/Neu/vo/" -> ""
        /^vo\//,                // "vo/" -> "" (bleibt aber erhalten wenn nichts danach kommt)
        /^.*\/sounds\//,        // z.B. "path/to/sounds/" -> ""
        /^sounds\//             // "sounds/" -> ""
    ];
    
    // Speichere Original für Fallback
    const originalNormalized = normalized;
    
    // Versuche Präfixe zu entfernen
    for (const regex of prefixesToRemove) {
        const before = normalized;
        normalized = normalized.replace(regex, '');
        if (before !== normalized) {
            debugLog(`[NORMALIZE] Removed prefix: ${before} -> ${normalized}`);
            break; // Nur ersten Match anwenden
        }
    }
    
    // Wenn nach Präfix-Entfernung nichts übrig ist, nutze letzten Teil des Original-Pfads
    if (normalized === '' || normalized === '/') {
        const parts = originalNormalized.split('/');
        normalized = parts[parts.length - 1] || parts[parts.length - 2] || 'unknown';
        debugLog(`[NORMALIZE] Empty after prefix removal, using last part: ${normalized}`);
    }
    
    // Entferne führende/trailing slashes
    normalized = normalized.replace(/^\/+|\/+$/g, '');
    
    // Spezialfall: Wenn der normalisierte Pfad nur ein Charakter-Name ist (z.B. "alyx"),
    // füge "vo/" prefix hinzu für Konsistenz
    const characterNames = [
        'alyx', 'gman', 'russell', 'eli', 'vortigaunt', 'combine', 
        'combineleader', 'jeff', 'zombie', 'larry', 'suppressor', 
        'grunt', 'officer', 'charger', 'contractor', 'drone', 
        'olga', 'overwatch', 'citizen', 'scientist'
    ];
    
    if (characterNames.includes(normalized)) {
        normalized = `vo/${normalized}`;
        debugLog(`[NORMALIZE] Added vo/ prefix to character: ${normalized}`);
    }
    
    // Finale Normalisierung: Stelle sicher dass bekannte Charaktere immer als "vo/character" erscheinen
    for (const character of characterNames) {
        if (normalized.endsWith(`/${character}`) || normalized === character) {
            normalized = `vo/${character}`;
            debugLog(`[NORMALIZE] Final normalization to: ${normalized}`);
            break;
        }
    }
    
    debugLog(`[NORMALIZE] Output: ${normalized}`);
    return normalized;
}
// =========================== NORMALIZEFOLDERPATH END ===========================
// =========================== FINDAUDIOINFILEPATHCACHE START ===========================
// Hilfsfunktion: Sucht Audiodatei im Cache mit flexiblem Abgleich
function findAudioInFilePathCache(filename, folder) {
    const wantedPath = `sounds/EN/${folder}/${filename}`;
    debugLog(`[FINDAUDIO] Gesuchter Pfad: ${wantedPath}`);
    debugLog(`[FINDAUDIO] Searching for: ${filename} in folder: ${folder}`);
    
    // 1. Versuche direkte Übereinstimmungen in filePathDatabase
    if (filePathDatabase[filename]) {
        const paths = filePathDatabase[filename];
        debugLog(`[FINDAUDIO] Found ${paths.length} paths in database`);
        
        // Sortiere Pfade nach Priorität mit Ordner-Präferenz
        const sortedPaths = paths.sort((a, b) => {
            // HÖCHSTE PRIORITÄT: Exakte Ordner-Übereinstimmung
            if (a.folder === folder && b.folder !== folder) return -1;
            if (a.folder !== folder && b.folder === folder) return 1;
            
            // ZWEITE PRIORITÄT: Normalisierte Ordner-Übereinstimmung
            const normalizedFolder = normalizeFolderPath(folder);
            const normalizedA = normalizeFolderPath(a.folder);
            const normalizedB = normalizeFolderPath(b.folder);
            
            if (normalizedA === normalizedFolder && normalizedB !== normalizedFolder) return -1;
            if (normalizedA !== normalizedFolder && normalizedB === normalizedFolder) return 1;
            
            // DRITTE PRIORITÄT: Ordner-Ähnlichkeit (enthält gleiche Endung)
            const folderEndA = a.folder.split('/').pop();
            const folderEndB = b.folder.split('/').pop();
            const requestedEnd = folder.split('/').pop();
            
            if (folderEndA === requestedEnd && folderEndB !== requestedEnd) return -1;
            if (folderEndA !== requestedEnd && folderEndB === requestedEnd) return 1;
            
            // VIERTE PRIORITÄT: Kürzere Pfade bevorzugen
            return a.folder.length - b.folder.length;
        });
        
        // Prüfe alle Pfade in sortierter Reihenfolge
        for (const pathInfo of sortedPaths) {
            if (audioFileCache[pathInfo.fullPath]) {
                debugLog(`[FINDAUDIO] Found audio in cache: ${pathInfo.fullPath} (folder: ${pathInfo.folder})`);
                
                // WARNUNG: Wenn nicht exakte Ordner-Übereinstimmung
                if (pathInfo.folder !== folder) {
                    console.warn(`[FINDAUDIO] Using different folder: requested "${folder}", using "${pathInfo.folder}"`);
                    debugLog(`[FINDAUDIO] Using different folder: requested "${folder}", using "${pathInfo.folder}"`);
                }
                
                return {
                    audioFile: audioFileCache[pathInfo.fullPath],
                    resolvedPath: pathInfo.fullPath,
                    resolvedFolder: pathInfo.folder,
                    isExactMatch: pathInfo.folder === folder
                };
            }
        }
    }
    
    // 2. Fallback: Durchsuche audioFileCache direkt mit flexiblem Matching
    debugLog(`[FINDAUDIO] No direct match, searching cache with flexible matching...`);
    
    const normalizedFolder = normalizeFolderPath(folder);
    const possiblePaths = [];
    
    for (const [cachePath, audioFile] of Object.entries(audioFileCache)) {
        const pathLower = cachePath.toLowerCase();
        
        // Prüfe ob Dateiname im Pfad enthalten ist
        if (pathLower.includes(filename.toLowerCase())) {
            // Extrahiere Ordner aus Cache-Pfad
            const pathParts = cachePath.split('/');
            const fileIndex = pathParts.findIndex(part => 
                part.toLowerCase() === filename.toLowerCase()
            );
            
            if (fileIndex > 0) {
                const cacheFolder = pathParts.slice(0, fileIndex).join('/');
                const normalizedCacheFolder = normalizeFolderPath(cacheFolder);
                
                debugLog(`[FINDAUDIO] Cache path: ${cachePath}`);
                debugLog(`[FINDAUDIO] Cache folder: ${cacheFolder} -> ${normalizedCacheFolder}`);
                debugLog(`[FINDAUDIO] Looking for: ${folder} -> ${normalizedFolder}`);
                
                // Bewerte Übereinstimmung
                let score = 0;
                let isExactMatch = false;
                
                if (cacheFolder === folder) {
                    score = 100; // Exakte Übereinstimmung
                    isExactMatch = true;
                } else if (normalizedCacheFolder === normalizedFolder) {
                    score = 80; // Normalisierte Übereinstimmung
                } else if (cacheFolder.endsWith(folder.split('/').pop())) {
                    score = 60; // Endung stimmt überein
                } else if (folder.endsWith(cacheFolder.split('/').pop())) {
                    score = 40; // Enthält Zielpfad
                } else {
                    score = 20; // Schwache Übereinstimmung
                }
                
                possiblePaths.push({
                    path: cachePath,
                    audioFile: audioFile,
                    folder: cacheFolder,
                    score: score,
                    isExactMatch: isExactMatch,
                    folderLength: cacheFolder.length
                });
            }
        }
    }
    
    // Sortiere mögliche Pfade nach Score, dann nach Genauigkeit
    possiblePaths.sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        if (a.isExactMatch !== b.isExactMatch) return a.isExactMatch ? -1 : 1;
        return a.folderLength - b.folderLength;
    });
    
    if (possiblePaths.length > 0) {
        const best = possiblePaths[0];
        debugLog(`[FINDAUDIO] Found via flexible matching: ${best.path} (score: ${best.score})`);
        
        if (!best.isExactMatch) {
            console.warn(`[FINDAUDIO] Using approximate match: requested "${folder}", using "${best.folder}"`);
            debugLog(`[FINDAUDIO] Using approximate match: requested "${folder}", using "${best.folder}"`);
        }
        
        return {
            audioFile: best.audioFile,
            resolvedPath: best.path,
            resolvedFolder: best.folder,
            isExactMatch: best.isExactMatch
        };
    }
    
    debugLog(`[FINDAUDIO] Gesuchter Pfad: ${wantedPath}`);
    debugLog(`[FINDAUDIO] No audio found for ${filename} in ${folder}`);
    return null;
}
// =========================== FINDAUDIOINFILEPATHCACHE END ===========================

    // Tabellenanzeige
    async function renderFileTable() {
        if (displayOrder.length !== files.length) {
            displayOrder = files.map((file, index) => ({ file, originalIndex: index }));
        }

        let sortedFiles = [...files];
        switch (currentSort.column) {
            case 'position':
                sortedFiles = displayOrder.map(item => item.file);
                break;
            case 'filename':
                sortedFiles.sort((a, b) => {
                    const result = a.filename.localeCompare(b.filename);
                    return currentSort.direction === 'asc' ? result : -result;
                });
                break;
            case 'folder':
                sortedFiles.sort((a, b) => {
                    const result = a.folder.localeCompare(b.folder);
                    return currentSort.direction === 'asc' ? result : -result;
                });
                break;
            case 'completion':
                sortedFiles.sort((a, b) => {
                    const aCompleted = a.completed ? 1 : 0;
                    const bCompleted = b.completed ? 1 : 0;
                    const result = bCompleted - aCompleted;
                    return currentSort.direction === 'asc' ? -result : result;
                });
                break;
        }

        await renderFileTableWithOrder(sortedFiles);
    }

function addDragAndDropHandlers() {
    const tbody = document.getElementById('fileTableBody');
    tbody.querySelectorAll('.drag-handle').forEach(handle => {
        const row = handle.closest('tr');
        
        handle.addEventListener('dragstart', (e) => {
            draggedElement = row;
            row.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', row.innerHTML);
        });
        
        handle.addEventListener('dragend', (e) => {
            row.classList.remove('dragging');
            document.querySelectorAll('.drag-over').forEach(el => {
                el.classList.remove('drag-over');
            });
        });
        
        // Drop-Ziel für Datei-Upload und Drag-Reihenfolge
        row.addEventListener('dragenter', handleFileDragEnter);
        row.addEventListener('dragleave', handleFileDragLeave);
        row.addEventListener('dragover', handleRowDragOver);
        row.addEventListener('drop', handleRowDrop);

        // Zusätzlich alle Zellen als Drop-Bereich registrieren, damit die
        // komplette Zeile reagiert
        row.querySelectorAll('td').forEach(cell => {
            cell.addEventListener('dragenter', handleFileDragEnter);
            cell.addEventListener('dragleave', handleFileDragLeave);
            cell.addEventListener('dragover', handleRowDragOver);
            cell.addEventListener('drop', handleRowDrop);
        });
    });
}

// Registriert Rechtsklick-Handler für Pfad-Zellen, um Details anzuzeigen
let pathCellDocumentClickHandler = null;

function addPathCellContextMenus() {
    document.querySelectorAll('.path-cell').forEach(cell => {
        if (cell.dataset.pathMenuBound === '1') {
            return;
        }
        cell.dataset.pathMenuBound = '1';
        cell.addEventListener('contextmenu', e => {
            // Kontextmenü anzeigen ohne mehrfachen Listener-Aufbau
            e.preventDefault();
            cell.classList.toggle('show-path');
        });
    });
    if (!pathCellDocumentClickHandler) {
        // Nur einen globalen Klick-Handler registrieren, um Speicherlecks zu vermeiden
        pathCellDocumentClickHandler = e => {
            if (!e.target.closest('.path-cell')) {
                document.querySelectorAll('.path-cell.show-path').forEach(c => c.classList.remove('show-path'));
            }
        };
        document.addEventListener('click', pathCellDocumentClickHandler);
    }
}

// Prüft bei allen Download-Buttons den Status und aktiviert sie ggf.
async function updateDubButtons() {
    const buttons = document.querySelectorAll('.download-de-btn, .download-emo-btn');
    if (buttons.length === 0) {
        return;
    }
    for (const btn of buttons) {
        const id = parseInt(btn.dataset.fileId, 10);
        const file = files.find(f => f.id === id);
        if (!file) continue;
        const useEmo = btn.classList.contains('download-emo-btn');
        const dubId = useEmo ? file.emoDubbingId : file.dubbingId;
        if (dubId) {
            const prop = useEmo ? 'emoDubReady' : 'dubReady';
            if (typeof file[prop] === 'undefined' || file[prop] === null) {
                try {
                    file[prop] = await isDubReady(dubId);
                } catch (err) {
                    console.error('isDubReady fehlgeschlagen', err);
                    file[prop] = false;
                }
            }
            if (file[prop]) btn.disabled = false;
        }
    }
}

// Ruft für alle Dateien einmal den Dubbing-Status ab
async function updateDubStatusForFiles() {
    const promises = files.map(async f => {
        if (f.dubbingId) {
            try {
                f.dubReady = await isDubReady(f.dubbingId);
            } catch (err) {
                console.error('isDubReady fehlgeschlagen', err);
                f.dubReady = false;
            }
        } else {
            f.dubReady = null;
        }
        if (f.emoDubbingId) {
            try {
                f.emoDubReady = await isDubReady(f.emoDubbingId);
            } catch (err) {
                console.error('isDubReady fehlgeschlagen', err);
                f.emoDubReady = false;
            }
        } else {
            f.emoDubReady = null;
        }
        updateDubStatusIcon(f);
    });
    await Promise.all(promises);
    updateDubButtons();
}

// Prüft nur Dateien mit gelbem Icon erneut
async function updatePendingDubStatuses() {
    // Nur Jobs abfragen, die nicht auf manuellen Import warten
    const pending = files.filter(f => (f.dubbingId && f.dubReady === false) || (f.emoDubbingId && f.emoDubReady === false));
    for (const f of pending) {
        try {
            if (f.dubbingId && f.dubReady === false) {
                f.dubReady = await isDubReady(f.dubbingId);
            }
            if (f.emoDubbingId && f.emoDubReady === false) {
                f.emoDubReady = await isDubReady(f.emoDubbingId);
            }
        } catch {}
        updateDubStatusIcon(f);
    }
    if (pending.length) updateDubButtons();
}

// Setzt das Icon je nach Status
function updateDubStatusIcon(file) {
    const normal = document.querySelector(`tr[data-id="${file.id}"] .dub-status`);
    const emo = document.querySelector(`tr[data-id="${file.id}"] .emo-dub-status`);

    const apply = (el, id, ready) => {
        if (!el) return;
        let cls, title;
        if (!id) {
            cls = 'none';
            title = 'kein Dubbing';
        } else if (ready) {
            cls = 'done';
            title = 'fertig';
        } else {
            cls = 'pending';
            title = 'Studio generiert noch';
        }
        el.className = el.className.replace(/\bnone|done|pending\b/g, '').trim() + ' ' + cls;
        el.title = title;
    };

    apply(normal, file.dubbingId, file.dubReady);
    apply(emo, file.emoDubbingId, file.emoDubReady);
}

        // Text editing
function updateText(fileId, lang, value, skipUndo, options = {}) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    if (!skipUndo) {
        // Vorherigen Zustand sichern und Redo-Stack leeren
        undoStack.push({ fileId: file.id, enText: file.enText, deText: file.deText });
        redoStack = [];
    }

    if (lang === 'en') {
        file.enText = value;
        updateAutoTranslation(file, true);
    } else if (lang === 'de') {
        file.deText = value;
    } else if (lang === 'emo') {
        file.emotionalText = value;
    }
    
    // Update global database
    const fileKey = `${file.folder}/${file.filename}`;
    if (!textDatabase[fileKey]) {
        textDatabase[fileKey] = {};
    }
    if (lang === 'emo') {
        textDatabase[fileKey].emo = value;
    } else {
        textDatabase[fileKey][lang] = value;
    }
    
    markDirty();
    const { skipImmediateSave = false } = options || {};
    // Geänderte Texte sofort sichern, sofern nicht bewusst unterdrückt (z. B. Sammelläufe)
    if (!skipImmediateSave && typeof saveCurrentProject === 'function') {
        saveCurrentProject();
    }

    updateProgressStats();
    renderProjects(); // HINZUFÜGEN für live Update
}

function updateAutoTranslation(file, force = false, projectId = currentTranslateProjectId || currentProject?.id) {
    return new Promise((resolve, reject) => {
        if (!window.electronAPI || !window.electronAPI.translateText) { resolve(); return; }
        if (!file.enText) { resolve(); return; }
        if (!force && file.autoSource === file.enText && file.autoTranslation) { resolve(); return; }

        const div = document.querySelector(`.auto-trans[data-file-id="${file.id}"]`);
        if (div) div.innerHTML = '<span class="loading-spinner"></span>';

        const id = ++translateCounter;
        // Projekt-ID mitsichern, damit wir das Ergebnis auch nach einem Projektwechsel korrekt zuordnen koennen
        pendingTranslations.set(id, { file, resolve, reject, projectId });
        window.electronAPI.translateText(id, file.enText);
    });
}

function updateTranslationDisplay(fileId) {
    const div = document.querySelector(`.auto-trans[data-file-id="${fileId}"]`);
    const file = files.find(f => f.id === fileId);
    if (div && file) {
        div.textContent = file.autoTranslation || '';
    }
}

// Zeigt den GPT-Vorschlag oberhalb des DE-Textes an
// Aktualisiert die farbige Vorschlagsbox
function updateSuggestionDisplay(fileId) {
    const box = document.querySelector(`.suggestion-box[data-file-id="${fileId}"]`);
    const file = files.find(f => f.id === fileId);
    if (box && file) {
        box.textContent = file.suggestion || '';
        const cls = scoreClass(file.score);
        box.className = `suggestion-box ${cls}`;
        box.style.color = getContrastingTextColor(SCORE_COLORS[cls] || '#666');
        box.style.display = file.suggestion ? 'block' : 'none';
    }
}

// Zeigt den GPT-Kommentar oberhalb des Vorschlags an
function updateCommentDisplay(fileId) {
    const box = document.querySelector(`.comment-box[data-file-id="${fileId}"]`);
    const file = files.find(f => f.id === fileId);
    if (box && file) {
        box.textContent = file.comment || '';
        box.style.display = file.comment ? 'block' : 'none';
    }
}

// Zeigt die Begründung unter dem Emotional-Text an
function updateEmoReasonDisplay(fileId) {
    const box = document.querySelector(`.emo-reason-box[data-file-id="${fileId}"]`);
    const file = files.find(f => f.id === fileId);
    if (box && file) {
        box.textContent = file.emoReason || '';
        box.style.display = file.emoReason ? 'block' : 'none';
    }
}

function mergeTranslationQueue(target, additions) {
    if (!target || !additions) return;
    const existingIds = new Set(target.map(item => item?.id));
    additions.forEach(item => {
        if (!item || !item.id || existingIds.has(item.id)) return;
        target.push(item);
        existingIds.add(item.id);
    });
}

function updateTranslationQueueDisplay() {
    const progress = document.getElementById('translateProgress');
    const status   = document.getElementById('translateStatus');
    const fill     = document.getElementById('translateFill');
    if (!progress || !status || !fill) return;

    if (!currentProject) {
        progress.classList.remove('active');
        fill.style.width = '0%';
        status.textContent = '';
        return;
    }

    if (translateRunning) {
        const activeProject = projects.find(p => p.id === currentTranslateProjectId);
        if (currentTranslateProjectId === currentProject.id && activeTranslateQueue) {
            const total = activeTranslateQueue.length;
            const done  = Math.min(activeTranslateIndex, total);
            const percent = total > 0 ? Math.round((done / total) * 100) : 0;
            progress.classList.add('active');
            fill.style.width = percent + '%';
            if (done < total) {
                status.textContent = `Übersetze ${done + 1}/${total}...`;
            } else {
                status.textContent = 'Automatische Übersetzung abgeschlossen.';
            }
        } else {
            progress.classList.add('active');
            fill.style.width = '0%';
            const waitingIndex = translateQueue.findIndex(entry => entry.projectId === currentProject.id);
            if (waitingIndex >= 0) {
                status.textContent = waitingIndex === 0
                    ? 'Übersetzung startet, sobald das aktuelle Projekt fertig ist.'
                    : `Übersetzung wartet (Position ${waitingIndex + 1}).`;
            } else {
                status.textContent = activeProject
                    ? `Übersetzung läuft im Hintergrund für „${activeProject.name}“.`
                    : 'Übersetzung läuft im Hintergrund.';
            }
        }
    } else {
        const waitingIndex = translateQueue.findIndex(entry => entry.projectId === currentProject.id);
        if (waitingIndex >= 0) {
            progress.classList.add('active');
            fill.style.width = '0%';
            status.textContent = waitingIndex === 0
                ? 'Übersetzung startet in Kürze...'
                : `Übersetzung wartet (Position ${waitingIndex + 1}).`;
        } else {
            progress.classList.remove('active');
            fill.style.width = '0%';
            status.textContent = '';
        }
    }
}

async function processActiveTranslationQueue() {
    const abbruchAktiv = () => {
        // Hilfsfunktion: Sobald ein Abbruchsignal gesetzt ist, sauber aussteigen und das Flag zurücksetzen
        if (!translateCancelled) return false;
        translateCancelled = false;
        return true;
    };

    if (abbruchAktiv()) {
        return;
    }

    if (!activeTranslateQueue || activeTranslateQueue.length === 0) {
        if (abbruchAktiv()) {
            return;
        }
        saveProjects();
        return;
    }

    const projectId = currentTranslateProjectId;
    const progress  = document.getElementById('translateProgress');
    const status    = document.getElementById('translateStatus');
    const fill      = document.getElementById('translateFill');
    const isCurrent = currentProject && currentProject.id === projectId;

    if (isCurrent && progress) {
        progress.classList.add('active');
    }

    for (let i = 0; activeTranslateQueue && i < activeTranslateQueue.length; i++) {
        if (abbruchAktiv()) {
            return;
        }
        const file = activeTranslateQueue[i];
        if (!file) continue;
        const total = activeTranslateQueue.length;
        activeTranslateIndex = i;
        if (isCurrent && progress && status && fill) {
            status.textContent = `Übersetze ${i + 1}/${total}...`;
            fill.style.width = `${Math.round((i / total) * 100)}%`;
        } else {
            updateTranslationQueueDisplay();
        }
        await updateAutoTranslation(file, true, projectId);
        if (abbruchAktiv()) {
            return;
        }
        if (isCurrent && progress && status && fill) {
            const total = activeTranslateQueue.length;
            fill.style.width = `${Math.round(((i + 1) / total) * 100)}%`;
        } else {
            updateTranslationQueueDisplay();
        }
    }

    if (!activeTranslateQueue) {
        abbruchAktiv();
        return;
    }

    if (abbruchAktiv()) {
        return;
    }

    activeTranslateIndex = activeTranslateQueue.length;
    if (isCurrent && progress && status && fill) {
        progress.classList.remove('active');
        fill.style.width = '0%';
        status.textContent = 'Automatische Übersetzung abgeschlossen.';
    }

    saveProjects();
}

function processNextTranslationQueue() {
    if (translateRunning) return;

    const next = translateQueue.shift();
    if (!next) {
        updateTranslationQueueDisplay();
        return;
    }

    translateCancelled = false;
    activeTranslateQueue = next.files;
    activeTranslateIndex = 0;
    currentTranslateProjectId = next.projectId;
    translateRunning = true;
    updateTranslationQueueDisplay();

    processActiveTranslationQueue()
        .catch(err => {
            console.error('Fehler in der Übersetzungswarteschlange:', err);
            if (typeof showToast === 'function') {
                showToast('Fehler in der Übersetzungswarteschlange: ' + err.message, 'error');
            }
        })
        .finally(() => {
            translateRunning = false;
            activeTranslateQueue = null;
            activeTranslateIndex = 0;
            currentTranslateProjectId = null;
            updateTranslationQueueDisplay();
            if (translateQueue.length > 0) {
                processNextTranslationQueue();
            }
        });
}

function runTranslationQueue(queue, projectId = currentProject?.id) {
    if (!queue || queue.length === 0 || !projectId) {
        updateTranslationQueueDisplay();
        return;
    }

    const sanitized = queue.filter(item => item && item.id !== undefined && item.id !== null);
    if (sanitized.length === 0) {
        updateTranslationQueueDisplay();
        return;
    }

    if (translateRunning && currentTranslateProjectId === projectId && activeTranslateQueue) {
        mergeTranslationQueue(activeTranslateQueue, sanitized);
        updateTranslationQueueDisplay();
        return;
    }

    const existing = translateQueue.find(entry => entry.projectId === projectId);
    if (existing) {
        mergeTranslationQueue(existing.files, sanitized);
    } else {
        translateQueue.push({ projectId, files: [...sanitized] });
    }

    updateTranslationQueueDisplay();
    processNextTranslationQueue();
}

// Stellt den letzten Textzustand wieder her
function undoEdit() {
    const last = undoStack.pop();
    if (!last) return;
    const file = files.find(f => f.id === last.fileId);
    if (!file) return;

    // Aktuellen Zustand für Redo merken
    redoStack.push({ fileId: file.id, enText: file.enText, deText: file.deText });

    updateText(file.id, 'en', last.enText, true);
    updateText(file.id, 'de', last.deText, true);

    const row = document.querySelector(`tr[data-id="${file.id}"]`);
    if (row) {
        const inputs = row.querySelectorAll('.text-input');
        if (inputs[0]) { inputs[0].value = last.enText; autoResizeInput(inputs[0]); }
        if (inputs[1]) { inputs[1].value = last.deText; autoResizeInput(inputs[1]); }
    }
}

// Setzt den zuletzt rückgängig gemachten Text erneut
function redoEdit() {
    const last = redoStack.pop();
    if (!last) return;
    const file = files.find(f => f.id === last.fileId);
    if (!file) return;

    // Aktuellen Zustand in den Undo-Stack legen
    undoStack.push({ fileId: file.id, enText: file.enText, deText: file.deText });

    updateText(file.id, 'en', last.enText, true);
    updateText(file.id, 'de', last.deText, true);

    const row = document.querySelector(`tr[data-id="${file.id}"]`);
    if (row) {
        const inputs = row.querySelectorAll('.text-input');
        if (inputs[0]) { inputs[0].value = last.enText; autoResizeInput(inputs[0]); }
        if (inputs[1]) { inputs[1].value = last.deText; autoResizeInput(inputs[1]); }
    }
}

// Markiert die emotionale DE-Version als fertig
function toggleEmoCompletion(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    file.emoCompleted = !file.emoCompleted;
    markDirty();
    renderFileTable();
    saveCurrentProject();
}

        // Progress statistics
        function updateProgressStats() {
            const totalFiles = files.length;
            const completedFiles = files.filter(isFileCompleted).length;
            const completionPercent = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0;
            
            // Get folder statistics
            const folderStats = {};
            files.forEach(file => {
                if (!folderStats[file.folder]) {
                    folderStats[file.folder] = { total: 0, completed: 0 };
                }
                folderStats[file.folder].total++;
                if (isFileCompleted(file)) {
                    folderStats[file.folder].completed++;
                }
            });
            
            const totalProgress = document.getElementById('totalProgress');
            const folderProgress = document.getElementById('folderProgress');
            
            totalProgress.textContent = `${completionPercent}% vollständig (${completedFiles}/${totalFiles})`;
            totalProgress.className = 'progress-stat';
            if (completionPercent >= 80) {
                totalProgress.classList.add('good');
            } else if (completionPercent >= 40) {
                totalProgress.classList.add('warning');
            }
            
            const folderCount = Object.keys(folderStats).length;
            const completedFolders = Object.values(folderStats).filter(stat => 
                stat.total > 0 && (stat.completed / stat.total) >= 0.8
            ).length;
            
            folderProgress.textContent = `${completedFolders}/${folderCount} Ordner ≥80%`;
            folderProgress.className = 'progress-stat';
            if (folderCount > 0 && (completedFolders / folderCount) >= 0.6) {
                folderProgress.classList.add('good');
            } else if (folderCount > 0 && (completedFolders / folderCount) >= 0.3) {
                folderProgress.classList.add('warning');
            }

            const emoBox = document.getElementById('emoProgress');
            if (emoBox) {
                const errorCount = files.filter(f => f.emoError || /^Fehler/i.test(f.emotionalText || '')).length;
                const filledCount = files.filter(f => (f.emotionalText || '').trim().length > 0 && !(f.emoError || /^Fehler/i.test(f.emotionalText || ''))).length;
                const emptyCount = totalFiles - filledCount - errorCount;
                emoBox.textContent = `🟣 ${filledCount} | ${emptyCount} | ${errorCount}`;
                emoBox.className = 'progress-stat clickable';
            }
            
            // Update folder progress tooltip
            const folderDetails = Object.entries(folderStats)
                .map(([folder, stats]) => {
                    const percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                    const folderName = folder.split('/').pop();
                    return `${folderName}: ${percent}% (${stats.completed}/${stats.total})`;
                })
                .join('\n');
            
            folderProgress.title = `Ordner-Fortschritt:\n${folderDetails}`;

            updateGlobalProjectProgress();
        }

        // Automatisches Anpassen der Höhe von Texteingaben (nur vertikal)
        function autoResizeInput(input) {
            if (!input) return;

            // Höhe zur Ermittlung korrekt zurücksetzen
            input.style.height = 'auto';

            // Benötigte Höhe berechnen
            const minHeight = 36; // Mindesthöhe in Pixel
            const fudge = 2;      // kleiner Puffer gegen abgeschnittene Zeilen
            const newHeight = Math.max(minHeight, input.scrollHeight + fudge);

            // Neue Höhe setzen
            input.style.height = newHeight + 'px';

            // Partnerfeld in der gleichen Zeile angleichen
            syncRowHeights(input);
        }

        // Sync heights of EN and DE inputs in the same row
        function syncRowHeights(changedInput) {
            const row = changedInput.closest('tr');
            if (!row) return;
            
            // Nach Einfügen der Score-Spalte liegen EN und DE auf 9 und 10
            const enInput = row.querySelector('td:nth-child(9) .text-input');
            const deInput = row.querySelector('td:nth-child(10) .text-input');
            
            if (!enInput || !deInput) return;
            
            // Get the maximum height needed
            enInput.style.height = 'auto';
            deInput.style.height = 'auto';
            
            const fudge = 2; // Puffer gegen abgeschnittene Zeilen
            const enHeight = Math.max(36, enInput.scrollHeight + fudge);
            const deHeight = Math.max(36, deInput.scrollHeight + fudge);
            const maxHeight = Math.max(enHeight, deHeight);
            
            // Set both inputs to the same height
            enInput.style.height = maxHeight + 'px';
            deInput.style.height = maxHeight + 'px';
        }

        // Auto-resize all text inputs in table
function autoResizeAllInputs() {
            // Process all rows to sync heights
            document.querySelectorAll('#fileTableBody tr').forEach(row => {
                const enInput = row.querySelector('td:nth-child(9) .text-input');
                const deInput = row.querySelector('td:nth-child(10) .text-input');
                
                if (enInput && deInput) {
                    // Reset heights
                    enInput.style.height = 'auto';
                    deInput.style.height = 'auto';
                    
                    // Calculate max height needed
                    const fudge = 2; // Puffer gegen abgeschnittene Zeilen
                    const enHeight = Math.max(36, enInput.scrollHeight + fudge);
                    const deHeight = Math.max(36, deInput.scrollHeight + fudge);
                    const maxHeight = Math.max(enHeight, deHeight);
                    
                    // Set both to same height
                    enInput.style.height = maxHeight + 'px';
                    deInput.style.height = maxHeight + 'px';
                }
            });
        }
		
        // Textfelder nach dem Laden und nach fertigem Font anpassen
        function resizeTextFields() {
            setTimeout(() => {
                autoResizeAllInputs();
                if (document.fonts && document.fonts.ready) {
                    document.fonts.ready.then(() => autoResizeAllInputs());
                }
            }, 100);
        }

function deleteFile(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    files = files.filter(f => f.id !== fileId);
    
    // Update display order
    displayOrder = displayOrder.filter(item => item.file.id !== fileId);
    
    markDirty();
    
    renderFileTable();
    renderProjects(); // HINZUGEFÜGT für live Update
    updateStatus(`${file.filename} entfernt`);
    updateProgressStats();
}

        // Aufgerufen durch Klick auf die Zeilennummer, 
        // ermöglicht das direkte Ändern der Position
        async function changeRowNumber(fileId, currentPosition) {
            const file = files.find(f => f.id === fileId);
            if (!file) return;

            const maxPosition = files.length;
            const newPositionStr = await showInputDialog(
                `Position ändern für: ${file.filename}\n\n` +
                `Aktuelle Position: ${currentPosition}\n` +
                `Verfügbare Positionen: 1 bis ${maxPosition}\n\n` +
                `Neue Position eingeben:`,
                currentPosition.toString()
            );

            if (newPositionStr === null) return; // Abbruch
            
            const newPosition = parseInt(newPositionStr);
            
            // Validate input
            if (isNaN(newPosition) || newPosition < 1 || newPosition > maxPosition) {
                alert(`Ungültige Position!\n\nBitte eine Zahl zwischen 1 und ${maxPosition} eingeben.`);
                return;
            }
            
            if (newPosition === currentPosition) {
                return; // No change needed
            }
            
            // Remove file from current position
            const currentIndex = currentPosition - 1;
            const targetIndex = newPosition - 1;
            
            // Remove the file from the array
            const [movedFile] = files.splice(currentIndex, 1);
            
            // Insert at new position
            files.splice(targetIndex, 0, movedFile);
            
            // Reset display order to reflect new order
            displayOrder = files.map((file, index) => ({ file, originalIndex: index }));
            
            markDirty();
            
            renderFileTable();
            
            // Show success message
            if (newPosition < currentPosition) {
                updateStatus(`${file.filename} von Position ${currentPosition} nach ${newPosition} verschoben (nach oben)`);
            } else {
                updateStatus(`${file.filename} von Position ${currentPosition} nach ${newPosition} verschoben (nach unten)`);
            }
            
            // Highlight the moved row briefly
            setTimeout(() => {
                const newRow = document.querySelector(`tr[data-id="${fileId}"]`);
                if (newRow) {
                    newRow.style.background = '#ff6b1a';
                    newRow.style.transition = 'background 0.3s';
                    setTimeout(() => {
                        newRow.style.background = '';
                    }, 1000);
                }
            }, 100);
        }
        
// Aktualisiert die Notiz eines Datei-Eintrags
function setFolderNote(fileId, note) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    file.folderNote = note;
    markDirty();
    updateDuplicateNotes();
}

// Erzeugt aus einer Notiz einen stabilen Farbton
const noteColorCache = {};
function getNoteColorForNote(text) {
    const key = text.toLowerCase();
    if (noteColorCache[key]) return noteColorCache[key];
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
        hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    const color = `hsl(${hue},70%,45%)`;
    noteColorCache[key] = color;
    return color;
}

// Zeigt an, wie viele Einträge die gleiche Notiz besitzen
// und ob sie im gesamten Kapitel bereits existiert
function updateDuplicateNotes() {
    // Zählung für aktuelles Projekt
    const projectCounts = {};
    for (const f of files) {
        const note = (f.folderNote || '').trim();
        if (!note) continue;
        const key = note.toLowerCase();
        if (!projectCounts[key]) projectCounts[key] = { count: 0, color: getNoteColorForNote(note) };
        projectCounts[key].count++;
    }

    // Zählung für das komplette Kapitel
    let chapterCounts = {};
    if (currentProject) {
        const chapterName = getLevelChapter(currentProject.levelName);
        chapterCounts = computeChapterNoteCounts(chapterName);
    }

    document.querySelectorAll('tr[data-id] .folder-note').forEach(input => {
        const tr = input.closest('tr');
        const id = Number(tr.dataset.id);
        const file = files.find(f => f.id === id);
        const note = (file?.folderNote || '').trim();
        const key = note.toLowerCase();
        const info = input.nextElementSibling;
        if (!info) return;

        if (note) {
            let html = '';
            if (projectCounts[key] && projectCounts[key].count > 1) {
                html += `<span class="note-badge" style="background:${projectCounts[key].color}"></span>${projectCounts[key].count}`;
            }
            if (chapterCounts[key] && chapterCounts[key].count > (projectCounts[key]?.count || 0)) {
                html += `<span class="chapter-note-count" title="Vorkommen im Kapitel">📘${chapterCounts[key].count}</span>`;
            }
            info.innerHTML = html;
        } else {
            info.textContent = '';
        }
    });
}

// Ermittelt die Häufigkeit aller Notizen in allen Projekten
function computeGlobalNoteCounts() {
    const counts = {};
    for (const prj of projects) {
        if (!prj.files) continue;
        for (const f of prj.files) {
            const note = (f.folderNote || '').trim();
            if (!note) continue;
            const key = note.toLowerCase();
            if (!counts[key]) counts[key] = { note, count: 0, color: getNoteColorForNote(note) };
            counts[key].count++;
        }
    }
    return counts;
}

// Ermittelt die Häufigkeit aller Notizen innerhalb eines Kapitels
function computeChapterNoteCounts(chapterName) {
    const counts = {};
    if (!chapterName) return counts;
    for (const prj of projects) {
        if (!prj.files) continue;
        if (getLevelChapter(prj.levelName) !== chapterName) continue;
        for (const f of prj.files) {
            const note = (f.folderNote || '').trim();
            if (!note) continue;
            const key = note.toLowerCase();
            if (!counts[key]) counts[key] = { count: 0, color: getNoteColorForNote(note) };
            counts[key].count++;
        }
    }
    return counts;
}

// Zeigt ein Dialogfenster mit Notizstatistiken zum angeklickten Level
function showLevelStats(levelName) {
    const globalCounts = computeGlobalNoteCounts();
    const levelNotes = {};

    // Notizen des Levels sammeln
    projects.filter(p => p.levelName === levelName).forEach(p => {
        (p.files || []).forEach(f => {
            const note = (f.folderNote || '').trim();
            if (!note) return;
            const key = note.toLowerCase();
            if (!levelNotes[key]) levelNotes[key] = globalCounts[key];
        });
    });

    let content = '';
    const rows = Object.values(levelNotes);
    if (rows.length) {
        content += '<table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:13px;">';
        content += '<tr><th style="text-align:left;padding:6px;border-bottom:1px solid #333;">Notiz</th><th style="text-align:center;padding:6px;border-bottom:1px solid #333;">Anzahl</th></tr>';
        rows.forEach(r => {
            content += `<tr><td style="padding:6px;border-bottom:1px solid #333;"><span class="note-badge" style="background:${r.color}"></span>${escapeHtml(r.note)}</td><td style="padding:6px;text-align:center;border-bottom:1px solid #333;">${r.count}</td></tr>`;
        });
        content += '</table>';
    } else {
        content = '<p style="margin-top:10px;">Keine Notizen in diesem Level.</p>';
    }

    const ov = document.createElement('div');
    ov.className = 'dialog-overlay';
    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    dialog.style.maxWidth = '400px';
    dialog.innerHTML = `<h3>Level-Statistiken: ${escapeHtml(levelName)}</h3>${content}<div class="dialog-buttons"><button onclick="this.closest('.dialog-overlay').remove()">Schließen</button></div>`;
    ov.appendChild(dialog);
    ov.onclick = () => ov.remove();
    dialog.onclick = e => e.stopPropagation();
    document.body.appendChild(ov);
}

// =========================== CHECKFILENAME START ===========================
// Prüft beim Klick auf den Dateinamen, ob die Datei existiert und bietet
// alternative Endungen zur Auswahl an
async function checkFilename(fileId, event) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    // Bei gedrückter Strg-Taste nur den Dateinamen ohne Endung kopieren
    if (event && event.ctrlKey) {
        const nameOhneEndung = file.filename.replace(/\.[^/.]+$/, '');
        try {
            const ok = await safeCopy(nameOhneEndung);
            if (ok) updateStatus(`Dateiname kopiert: ${nameOhneEndung}`);
        } catch (err) {
            console.error('Kopieren fehlgeschlagen:', err);
            updateStatus('Kopieren nicht möglich');
        }
        return;
    }

    // Existiert die Datei mit identischer Endung im aktuellen Ordner?
    let found = false;
    if (filePathDatabase[file.filename]) {
        const match = filePathDatabase[file.filename].find(p => p.folder === file.folder);
        if (match) found = true;
    }

    if (found) {
        alert(`✅ Datei vorhanden: ${file.filename}`);
        return;
    }

    // Suche nach gleichem Namen mit anderer Endung
    const basis = file.filename.replace(/\.(mp3|wav|ogg)$/i, '');
    const endungen = ['.mp3', '.wav', '.ogg'];
    const kandidaten = [];
    for (const ext of endungen) {
        const name = basis + ext;
        if (name === file.filename) continue;
        if (!filePathDatabase[name]) continue;
        const p = filePathDatabase[name].find(pi => pi.folder === file.folder);
        if (p) kandidaten.push({ filename: name, pathInfo: p });
    }

    if (kandidaten.length === 0) {
        alert('❌ Datei nicht gefunden und keine passende Alternative vorhanden.');
        return;
    }

    let auswahl;
    if (kandidaten.length === 1) {
        if (!confirm(`Datei ${file.filename} fehlt.\n` +
                     `Gefundene Datei: ${kandidaten[0].filename}\n` +
                     `Eintrag auf diese Datei ändern?`)) {
            return;
        }
        auswahl = kandidaten[0];
    } else {
        const liste = kandidaten.map((k, i) => `${i + 1}: ${k.filename}`).join('\n');
        const eingabe = await showInputDialog(
            `Datei ${file.filename} fehlt.\n` +
            `Mehrere Alternativen gefunden:\n${liste}\n` +
            `Nummer eingeben:`
        );
        if (eingabe === null) return;
        const idx = parseInt(eingabe, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= kandidaten.length) return;
        auswahl = kandidaten[idx];
    }

    // Aktualisiere den Eintrag auf die gewählte Datei
    file.filename = auswahl.filename;
    file.fullPath = auswahl.pathInfo.fullPath;
    markDirty();
    renderFileTable();
    updateStatus(`Dateiname geändert: ${auswahl.filename}`);
}
// =========================== CHECKFILENAME END =============================

// =========================== PLAYAUDIO START ===========================
// Audio playback with dynamic path resolution from database
function playAudio(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    // Unter Electron spielen wir direkt aus dem sounds-Ordner ab
    
    debugLog(`[PLAYAUDIO] ====== Playing: ${file.filename} ======`);
    debugLog(`[PLAYAUDIO] File folder: ${file.folder}`);
    
    // Nutze die neue Hilfsfunktion
    const audioResult = findAudioInFilePathCache(file.filename, file.folder);
    
    if (!audioResult) {
        debugLog(`[PLAYAUDIO] Audio not found, triggering auto-scan...`);
        
        const scanResult = checkAndAutoScan([file], 'Audio-Wiedergabe');
        if (scanResult === true) {
            updateStatus('Audio-Wiedergabe: Warte auf Ordner-Scan...');
            return;
        } else if (scanResult === false) {
            return;
        }
        
        updateStatus(`Audio nicht verfügbar: ${file.filename}`);
        return;
    }
    
    debugLog(`[PLAYAUDIO] Audio found: ${audioResult.resolvedPath}`);
    
    // Audio abspielen
    const audio = document.getElementById('audioPlayer');
    const playBtn = document.querySelector(`tr[data-id="${fileId}"] .play-btn`);

    if (currentlyPlaying === fileId) {
        stopCurrentPlayback();
        return;
    }
    stopCurrentPlayback();
    
    // Wiedergabe je nach Umgebung
    let url = null;
    if (window.electronAPI && typeof audioResult.audioFile === 'string') {
        // Direkt vom Dateipfad abspielen
        audio.src = audioResult.audioFile;
    } else {
        const blob = new Blob([audioResult.audioFile], { type: audioResult.audioFile.type });
        url = URL.createObjectURL(blob);
        audio.src = url;
    }

    audio.play().then(() => {
        if (playBtn) {
            playBtn.classList.add('playing');
            playBtn.textContent = '⏸';
        }
        currentlyPlaying = fileId;
        
        audio.onended = () => {
            if (url) URL.revokeObjectURL(url);
            if (playBtn) {
                playBtn.classList.remove('playing');
                playBtn.textContent = '▶';
            }
            currentlyPlaying = null;
        };
    }).catch(err => {
        if (err && err.name === 'AbortError') {
            // Unterbrochene Wiedergabe ist kein echter Fehler
            return;
        }
        console.error('[PLAYAUDIO] Playback failed:', err);
        debugLog('[PLAYAUDIO] Playback failed:', err);
        updateStatus(`Fehler beim Abspielen: ${file.filename}`);
        if (url) URL.revokeObjectURL(url);
    });
}
// =========================== PLAYAUDIO END ===========================

// =========================== PLAYDEAUDIO START ======================
// Spiele die vorhandene DE-Datei ab
// Spielt die vorhandene DE-Datei ab und erlaubt einen optionalen Callback
// der nach dem Ende ausgeführt wird (z.B. für Projekt-Wiedergabe)
// Spielt die vorhandene DE-Datei ab und merkt optional den Erfolg
async function playDeAudio(fileId, onEnded = null, track = false) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    // In Electron greifen wir direkt über den Dateipfad zu

    let relPath = getDeFilePath(file) || getFullPath(file);

    if (!deAudioCache[relPath]) {
        if (window.electronAPI) {
            setDeAudioCacheEntry(relPath, `sounds/DE/${relPath}`);
        } else {
            try {
                let handle = deOrdnerHandle;
                const parts = file.folder.split('/');
                for (const part of parts) {
                    if (part) {
                        handle = await handle.getDirectoryHandle(part);
                    }
                }
                const basisName = file.filename.replace(/\.(mp3|wav|ogg)$/i, '');
                const endungen = ['.mp3', '.wav', '.ogg'];
                let datei = null;
                for (const endung of endungen) {
                    try {
                        const fh = await handle.getFileHandle(basisName + endung);
                        datei = await fh.getFile();
                        break;
                    } catch {}
                }
                if (datei) {
                    setDeAudioCacheEntry(relPath, datei);
                } else {
                    updateStatus('DE-Datei nicht gefunden');
                    return;
                }
            } catch (e) {
                updateStatus('DE-Datei nicht gefunden');
                return;
            }
        }
    }

    const audio = document.getElementById('audioPlayer');
    const playBtn = document.querySelector(`tr[data-id="${fileId}"] .de-play-btn`);

    if (currentlyPlaying === `de-${fileId}`) {
        stopCurrentPlayback();
        return;
    }
    stopCurrentPlayback();

    let url = null;
    if (window.electronAPI && typeof deAudioCache[relPath] === 'string') {
        // Cache-Buster anhängen, damit nach Bearbeitungen sofort die neue Datei gespielt wird
        audio.src = `${deAudioCache[relPath]}?v=${Date.now()}`;
    } else {
        url = URL.createObjectURL(deAudioCache[relPath]);
        audio.src = url;
    }
    audio.play().then(() => {
        if (playBtn) { playBtn.classList.add('playing'); playBtn.textContent = '⏸'; }
        currentlyPlaying = `de-${fileId}`;
        const previousEnded = audio.onended;
        audio.onended = () => {
            if (url) URL.revokeObjectURL(url);
            if (playBtn) { playBtn.classList.remove('playing'); playBtn.textContent = '▶'; }
            currentlyPlaying = null;
            if (track && playbackStatus[fileId]) {
                playbackStatus[fileId].success = true;
                updatePlaybackList();
            }
            if (onEnded) onEnded();
            if (previousEnded) previousEnded();
        };
    }).catch(err => {
        if (err && err.name === 'AbortError') {
            // Wird play() durch pause() unterbrochen, ignorieren wir den Fehler
            return;
        }
        console.error('DE-Playback fehlgeschlagen', err);
        updateStatus('Fehler beim Abspielen der DE-Datei');
        if (track && playbackStatus[fileId]) {
            playbackStatus[fileId].success = false;
            updatePlaybackList();
        }
        if (url) URL.revokeObjectURL(url);
    });

}
// =========================== PLAYDEAUDIO END ========================

// =========================== PROJEKT-WIEDERGABE START ========================
function updateProjectPlaybackButtons() {
    const playPauseBtn = document.getElementById('projectPlayPauseBtn');
    const listPlayBtn = document.getElementById('playbackPlayBtn');
    if (!playPauseBtn) return;
    if (projectPlayState === 'playing') {
        playPauseBtn.textContent = '⏸';
        if (listPlayBtn) listPlayBtn.textContent = '⏸';
    } else {
        playPauseBtn.textContent = '▶';
        if (listPlayBtn) listPlayBtn.textContent = '▶';
    }
}

function openPlaybackList() {
    updatePlaybackList();
    document.getElementById('playbackListDialog')?.classList.remove('hidden');
}

function closePlaybackList() {
    document.getElementById('playbackListDialog')?.classList.add('hidden');
}

// Gibt die aktuelle Positionsnummer einer Datei zurück
function getFilePosition(fileId) {
    return files.findIndex(f => f.id === fileId) + 1;
}

function updatePlaybackList() {
    const list = document.getElementById('playbackList');
    if (!list) return;
    // Zeige Positionsnummer, Dateiname und Pfade der gefundenen Audiodateien an
    list.innerHTML = playbackFiles.map((f, idx) => {
        const dePath = getDeFilePath(f);
        const fullPath = getFullPath(f);
        const pathInfo = `${escapeHtml(fullPath)} ➜ ${dePath ? escapeHtml(dePath) : 'kein DE-Audio'}`;
        const status = playbackStatus[f.id] || {};
        const existIcon = status.exists ? '✅' : '❌';
        let playIcon = '⏳';
        if (status.success === true) playIcon = '✅';
        else if (status.success === false) playIcon = '❌';
        const orderIcon = status.orderOk ? '✅' : '❌';
        return `<li class="${idx === projectPlayIndex ? 'current' : ''}"><span class="icon">${existIcon}</span><span class="icon">${playIcon}</span><span class="icon">${orderIcon}</span>${getFilePosition(f.id)}. ${escapeHtml(f.filename)}<br><small>${pathInfo}</small></li>`;
    }).join('');
    const protocol = document.getElementById('playbackProtocol');
    if (protocol) protocol.textContent = playbackProtocol;
    updateProjectPlaybackButtons();
}

// Fügt dem Protokoll eine Zeile hinzu und aktualisiert die Anzeige
function addPlaybackLog(text) {
    playbackProtocol += text + '\n';
    const pre = document.getElementById('playbackProtocol');
    if (pre) {
        pre.textContent = playbackProtocol;
        pre.scrollTop = pre.scrollHeight;
    }
}

function highlightProjectRow(fileId) {
    document.querySelectorAll('tr.current-project-row').forEach(r => r.classList.remove('current-project-row'));
    const row = document.querySelector(`tr[data-id="${fileId}"]`);
    if (row) row.classList.add('current-project-row');
}

function clearProjectRowHighlight() {
    document.querySelectorAll('tr.current-project-row').forEach(r => r.classList.remove('current-project-row'));
}

// Stellt sicher, dass die Wiedergabereihenfolge der aktuellen Dateireihenfolge entspricht
function ensurePlaybackOrder() {
    const mismatch = displayOrder.length !== files.length ||
        displayOrder.some((item, idx) => item.file.id !== files[idx].id);
    if (mismatch) {
        displayOrder = files.map((file, index) => ({ file, originalIndex: index }));
    }
}

// Gibt alle Dateien mit vorhandener DE-Version in Positionsreihenfolge zurück
function getProjectPlaybackList() {
    ensurePlaybackOrder();
    // Wenn eine Sortierung aktiv ist, enthält displayOrder die Originalreihenfolge
    if (displayOrder.length === files.length) {
        return [...displayOrder]
            .sort((a, b) => a.originalIndex - b.originalIndex)
            .map(item => item.file)
            .filter(f => getDeFilePath(f));
    }
    // Ohne Sortierung ist die Reihenfolge der files bereits korrekt
    return files.filter(f => getDeFilePath(f));
}

// Spielt die aktuelle Datei im Projekt ab
function playCurrentProjectFile() {
    if (projectPlayIndex >= playbackFiles.length) { stopProjectPlayback(); return; }
    const file = playbackFiles[projectPlayIndex];
    addPlaybackLog(`${projectPlayIndex + 1}. ${file.filename}`);
    // Wenn keine DE-Datei existiert, überspringen wir diese Datei
    if (!getDeFilePath(file)) {
        if (playbackStatus[file.id]) playbackStatus[file.id].success = null;
        projectPlayIndex++;
        if (projectPlayState === 'playing') {
            playCurrentProjectFile();
        }
        updatePlaybackList();
        return;
    }

    highlightProjectRow(file.id);
    updatePlaybackList();
    // Deutsche Version abspielen und danach ggf. naechste Datei starten
    playDeAudio(file.id, () => {
        clearProjectRowHighlight();
        projectPlayIndex++;
        if (projectPlayState === 'playing') {
            playCurrentProjectFile();
        }
        updatePlaybackList();
    }, true);
}

function startProjectPlayback() {
    playbackFiles = getProjectPlaybackList();
    playbackStatus = {};
    playbackFiles.forEach((f, idx) => {
        playbackStatus[f.id] = {
            exists: !!getDeFilePath(f),
            orderOk: getFilePosition(f.id) === idx + 1,
            success: null
        };
    });
    playbackProtocol = 'Erwartete Reihenfolge:\n' +
        playbackFiles.map((f, idx) => `${idx + 1}. ${f.filename}`).join('\n') +
        '\nAbspielreihenfolge:\n';
    projectPlayIndex = 0;
    projectPlayState = 'playing';
    updateProjectPlaybackButtons();
    openPlaybackList();
    playCurrentProjectFile();
}

function pauseProjectPlayback() {
    const audio = document.getElementById('audioPlayer');
    audio.pause();
    projectPlayState = 'paused';
    updateProjectPlaybackButtons();
    updatePlaybackList();
}

function resumeProjectPlayback() {
    const audio = document.getElementById('audioPlayer');
    audio.play();
    projectPlayState = 'playing';
    updateProjectPlaybackButtons();
    updatePlaybackList();
}

function stopProjectPlayback() {
    projectPlayState = 'stopped';
    projectPlayIndex = 0;
    playbackFiles = [];
    playbackStatus = {};
    addPlaybackLog('--- Ende ---');
    clearProjectRowHighlight();
    stopCurrentPlayback();
    updateProjectPlaybackButtons();
    updatePlaybackList();
}

function toggleProjectPlayback() {
    if (projectPlayState === 'playing') {
        pauseProjectPlayback();
    } else if (projectPlayState === 'paused') {
        resumeProjectPlayback();
    } else {
        startProjectPlayback();
    }
}
// =========================== PROJEKT-WIEDERGABE END ==========================

// Bereinigung: Entferne fullPath aus allen Projekten
function updateAllFilePaths() {
    if (!confirm('Dies bereinigt alle Projekte und entfernt veraltete Pfade.\nDie Pfade werden dynamisch aus der Datenbank geladen.\n\nFortfahren?')) {
        return;
    }
    
    let totalUpdated = 0;
    let totalProjects = 0;
    
    debugLog('=== Projekt-Bereinigung: Entferne fullPath ===');
    
    projects.forEach(project => {
        if (!project.files || project.files.length === 0) return;
        
        totalProjects++;
        let projectUpdated = 0;
        
        project.files.forEach(file => {
            if (file.fullPath) {
                debugLog(`Bereinige ${project.name}: ${file.filename} - entferne fullPath`);
                delete file.fullPath;
                projectUpdated++;
                totalUpdated++;
            }
        });
        
        if (projectUpdated > 0) {
            debugLog(`📁 Projekt "${project.name}": ${projectUpdated} Dateien bereinigt`);
        }
    });

    // Dateiendungen anpassen, falls MP3/WAV gewechselt wurde
    let extUpdates = 0;
    if (repairFileExtensions) {
        extUpdates = repairFileExtensions(projects, filePathDatabase, textDatabase);
        if (extUpdates > 0) debugLog('Dateiendungen aktualisiert:', extUpdates);
    }

    if (totalUpdated > 0 || extUpdates > 0) {
        // Speichere alle bereinigten Projekte
        saveProjects();
        debugLog(`🎯 Gesamt: ${totalUpdated} Dateien in ${totalProjects} Projekten bereinigt`);
        
        // Aktualisiere das aktuelle Projekt
        if (currentProject) {
            const updatedProject = projects.find(p => p.id === currentProject.id);
            if (updatedProject) {
                files = updatedProject.files || [];
                renderFileTable();
                updateProgressStats();
            }
        }
        
        updateStatus(`📁 Projekt-Bereinigung: ${totalUpdated} fullPath Einträge entfernt, ${extUpdates} Dateiendungen angepasst`);

        alert(`✅ Projekt-Bereinigung erfolgreich!\n\n` +
              `📊 Statistik:\n` +
              `• ${totalUpdated} veraltete Pfade entfernt\n` +
              `• ${extUpdates} Dateiendungen angepasst\n` +
              `• ${totalProjects} Projekte bereinigt\n` +
              `• Pfade werden jetzt dynamisch geladen\n\n` +
              `🎯 Alle Audio-Funktionen sollten wieder funktionieren!`);
    } else {
        alert('✅ Alle Projekte sind bereits bereinigt!\n\nKeine veralteten Pfade oder falschen Dateiendungen gefunden.');
    }
    
    debugLog('=== Projekt-Bereinigung abgeschlossen ===');
}

// Automatische Aktualisierung aller Projekte nach einem Ordner-Scan
function updateAllProjectsAfterScan() {
    let totalUpdated   = 0; // Geänderte Pfade
    let totalCompleted = 0; // Neu als fertig markierte Dateien
    let totalProjects  = 0;
    
    debugLog('=== Automatische Projekt-Aktualisierung nach Scan ===');
    
    projects.forEach(project => {
        if (!project.files || project.files.length === 0) return;
        
        totalProjects++;
        let projectUpdated = 0;
        
        project.files.forEach(file => {
            // NEUE LOGIK: Prüfe immer auf bessere/normalisierte Pfade
            const currentPathExists = audioFileCache[file.fullPath];
            let shouldUpdate = false;
            let bestPath = null;
            
            if (filePathDatabase[file.filename]) {
                // Suche nach dem korrekten Pfad in der Datenbank
                const matchingPaths = filePathDatabase[file.filename].filter(pathInfo => {
                    // Exakte Ordner-Übereinstimmung
                    if (pathInfo.folder === file.folder) {
                        return true;
                    }
                    
                    // Normalisierte Ordner-Übereinstimmung
                    const normalizedFileFolder = normalizeFolderPath(file.folder);
                    const normalizedDbFolder = normalizeFolderPath(pathInfo.folder);
                    return normalizedFileFolder === normalizedDbFolder;
                });
                
                if (matchingPaths.length > 0) {
                    // Finde den besten Pfad (kürzester normalisierter Pfad hat Vorrang)
                    bestPath = matchingPaths.reduce((best, current) => {
                        // Erst prüfen, ob einer der beiden Pfade bereits im Cache vorhanden ist.
                        // Ist nur ein Pfad vorhanden, wird dieser bevorzugt.
                        const bestCached    = !!audioFileCache[best.fullPath];
                        const currentCached = !!audioFileCache[current.fullPath];
                        if (bestCached !== currentCached) {
                            return currentCached ? current : best;
                        }

                        const bestNormalized = normalizeFolderPath(best.folder);
                        const currentNormalized = normalizeFolderPath(current.folder);

                        // Bevorzuge kürzere, normalisierte Pfade (vo/alyx statt sounds/vo/alyx)
                        if (currentNormalized.length < bestNormalized.length) {
                            return current;
                        } else if (currentNormalized.length === bestNormalized.length) {
                            // Bei gleicher Länge, bevorzuge Pfade die mit "vo/" starten
                            if (currentNormalized.startsWith('vo/') && !bestNormalized.startsWith('vo/')) {
                                return current;
                            }
                        }
                        return best;
                    });
                    
                    // Aktualisiere wenn:
                    // 1. Aktueller Pfad existiert nicht ODER
                    // 2. Gefundener Pfad ist besser/normalisierter als der aktuelle
                    if (!currentPathExists || 
                        bestPath.folder !== file.folder || 
                        bestPath.fullPath !== file.fullPath) {
                        shouldUpdate = true;
                    }
                }
            }
            
            if (shouldUpdate && bestPath) {
                const oldFolder = file.folder;
                const oldPath = file.fullPath;
                
                // Aktualisiere den Dateipfad
                file.folder = bestPath.folder;
                file.fullPath = bestPath.fullPath;
                projectUpdated++;
                totalUpdated++;
                
                debugLog(`✅ ${project.name}: ${file.filename}`);
                debugLog(`   Ordner: ${oldFolder} -> ${bestPath.folder}`);
                debugLog(`   Pfad: ${oldPath} -> ${bestPath.fullPath}`);
            }

            // Wenn eine passende DE-Datei existiert, zählen
            const deRel = getFullPath(file);
            if (deAudioCache[deRel] && isFileCompleted(file)) {
                totalCompleted++;
            }
        });
        
        if (projectUpdated > 0) {
            debugLog(`📁 Projekt "${project.name}": ${projectUpdated} Dateien aktualisiert`);
        }
    });
    
    if (totalUpdated > 0 || totalCompleted > 0) {
        // Speichere alle aktualisierten Projekte
        saveProjects();
        debugLog(`🎯 Gesamt: ${totalUpdated} Dateien in ${totalProjects} Projekten aktualisiert, ${totalCompleted} abgeschlossen`);
        
        // Aktualisiere das aktuelle Projekt falls betroffen
        if (currentProject) {
            const updatedProject = projects.find(p => p.id === currentProject.id);
            if (updatedProject) {
                files = updatedProject.files || [];
                renderFileTable();
                updateProgressStats();
            }
        }
        
        setTimeout(() => {
            updateStatus(`📁 Projekt-Sync: ${totalUpdated} Pfade, ${totalCompleted} abgeschlossen`);
        }, 1000);
    } else {
        debugLog('✅ Alle Projekt-Pfade sind bereits aktuell');
    }
    
    debugLog('=== Projekt-Aktualisierung abgeschlossen ===');
}


// =========================== GETGLOBALCOMPLETIONSTATUS START ===========================
function getGlobalCompletionStatus() {
    const completionMap         = new Map(); // fileKey -> true
    const projectCompletionMap  = new Map(); // fileKey -> [Projekt-Namen]

    projects.forEach(project => {
        (project.files || []).forEach(f => {
            const fileKey = `${f.folder}/${f.filename}`;

            if (ignoredFiles[fileKey]) return;   // Ignorierte komplett überspringen

            completionMap.set(fileKey, true);

            if (!projectCompletionMap.has(fileKey)) {
                projectCompletionMap.set(fileKey, []);
            }
            projectCompletionMap.get(fileKey).push(project.name);
        });
    });

    return { completionMap, projectCompletionMap };
}
// =========================== GETGLOBALCOMPLETIONSTATUS END ===========================


// =========================== CALCFOLDERCOMPLETIONSTATS START ===========================
function calculateFolderCompletionStats() {
    const { completionMap } = getGlobalCompletionStatus();
    const folderStats = new Map();

    // WICHTIG: Wir müssen jeden Ordner einzeln behandeln
    Object.entries(filePathDatabase).forEach(([filename, paths]) => {
        // Jeder Pfad ist ein separater Eintrag!
        paths.forEach(pathInfo => {
            const folder  = pathInfo.folder;
            const fileKey = `${folder}/${filename}`;

            if (ignoredFiles[fileKey]) return;   // hier rausfiltern

            if (!folderStats.has(folder)) {
                folderStats.set(folder, { 
                    total: 0, 
                    completed: 0, 
                    files: [],
                    folderName: folder // Speichere den vollen Ordnernamen
                });
            }

            const stats = folderStats.get(folder);
            stats.total++;

            const done = completionMap.has(fileKey);
            stats.files.push({ 
                filename, 
                fileKey, 
                completed: done,
                folder: folder // Speichere auch hier den Ordner
            });

            if (done) stats.completed++;
        });
    });

    folderStats.forEach((stats, folder) => {
        stats.percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
        stats.isComplete = stats.percentage === 100;
    });

    return folderStats;
}
// =========================== CALCFOLDERCOMPLETIONSTATS END ===========================


/* =========================== FOLDER REPORT START =========================== */
function copyFolderReport() {
    // Statistiken pro Ordner ermitteln
    const folderStats = calculateFolderCompletionStats();

    let totalFiles = 0;
    let totalCompleted = 0;
    const lines = [];

    // Ordner alphabetisch sortieren und Zeilen aufbauen
    Array.from(folderStats.values())
        .sort((a, b) => a.folderName.localeCompare(b.folderName))
        .forEach(stats => {
            totalFiles += stats.total;
            totalCompleted += stats.completed;
            const open = stats.total - stats.completed;
            lines.push(`${stats.folderName}: ${stats.total} Dateien, ${stats.completed} übersetzt, ${open} offen, ${stats.percentage}%`);
        });

    const openTotal = totalFiles - totalCompleted;
    const percent = totalFiles > 0 ? Math.round((totalCompleted / totalFiles) * 100) : 0;

    const reportText = [
        `Gesamt: ${totalFiles} Dateien, ${totalCompleted} übersetzt, ${openTotal} offen, ${percent}%`,
        '',
        ...lines
    ].join('\n');

    // Text in die Zwischenablage kopieren
    navigator.clipboard.writeText(reportText)
        .then(() => updateStatus('📋 Bericht kopiert'))
        .catch(err => {
            console.error('Clipboard-Fehler', err);
            alert('Bericht konnte nicht kopiert werden.');
        });
}
/* =========================== FOLDER REPORT END =========================== */


        // Auto-scan system for missing permissions
        // Versucht fehlende Dateiberechtigungen ohne Rueckfragen automatisch zu beheben
        function checkAndAutoScan(requiredFiles = [], functionName = 'Funktion') {
            // Desktop-Version nutzt feste Ordnerpfade - kein automatischer Scan noetig
            if (window.electronAPI) {
                return null;
            }

            let missingFiles = [];

            // Pruefen, welche Dateien nicht im Cache liegen
            if (requiredFiles.length > 0) {
                missingFiles = requiredFiles.filter(file => !audioFileCache[file.fullPath]);
            } else {
                missingFiles = files.filter(f => f.selected && !audioFileCache[f.fullPath]);
            }

            if (missingFiles.length > 0) {
                debugLog(`Auto-Scan ausgeloest von ${functionName}: ${missingFiles.length} Dateien ohne Berechtigung`);

                if (!projektOrdnerHandle) {
                    // Kein Ordner gewaehlt → Benutzer fragen
                    const choose = confirm(
                        `📁 ${functionName}\n\n` +
                        'Die Audio-Dateien sind nicht zugänglich.\n' +
                        'Möchten Sie den Projektordner auswählen?'
                    );

                    if (choose) {
                        updateStatus('Projektordner wird geöffnet...');
                        waehleProjektOrdner();
                        return true; // Scan gestartet
                    }

                    return false; // Nutzer hat abgelehnt
                }

                // Ordner wurde bereits gewaehlt → automatisch scannen
                updateStatus(`${functionName}: Starte automatischen Ordner-Scan...`);
                setTimeout(() => {
                    scanEnOrdner(); // EN-Ordner erneut scannen
                }, 500);
                return true;
            }

            return null; // Kein Scan notwendig
        }

        // Enhanced file access check with auto-scan
        function checkFileAccessWithAutoScan(functionName = 'Funktion') {
            const stats = checkFileAccess();
            
            if (stats.selectedFiles === 0) {
                alert(`ℹ️ ${functionName}\n\nKeine Dateien ausgewählt.\n\nBitte wählen Sie erst Dateien aus.`);
                return false;
            }
            
            if (stats.inaccessibleFiles > 0) {
                return checkAndAutoScan(files.filter(f => f.selected), functionName) === null;
            }
            
            return true; // All good
        }

        function closeFolderBrowser() {
            document.getElementById('folderBrowserDialog').classList.add('hidden');
        }



// =========================== SHOWFOLDERGRID WITH DELETE START ===========================
function showFolderGrid() {
    const folderGrid = document.getElementById('folderGrid');
    const folderFilesView = document.getElementById('folderFilesView');
    const folderBackBtn = document.getElementById('folderBackBtn');
    const title = document.getElementById('folderBrowserTitle');
    const description = document.getElementById('folderBrowserDescription');
    
    // Show grid, hide files view
    folderGrid.style.display = 'grid';
    folderFilesView.style.display = 'none';
    folderBackBtn.style.display = 'none';
    
    title.textContent = '📁 Ordner durchsuchen';
    
    // Calculate global completion stats
    const folderStats = calculateFolderCompletionStats();
    const totalFolders = folderStats.size;
    const completedFolders = Array.from(folderStats.values()).filter(s => s.isComplete).length;
    const totalFiles = Array.from(folderStats.values()).reduce((sum, s) => sum + s.total, 0);
    const completedFiles = Array.from(folderStats.values()).reduce((sum, s) => sum + s.completed, 0);
    const overallPercentage = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0;
    
    const { en: globalEN, de: globalDE, both: globalBoth, total: globalTotal } = calculateGlobalTextStats();
    
    // Update description with stats and cleanup button
    description.innerHTML = `
        <div class="folder-stats">
            <h4>📊 Globale Übersetzungsstatistiken</h4>
            <div class="folder-stats-grid">
                <div class="folder-stat-item">
                    <div class="folder-stat-number ${overallPercentage === 100 ? 'complete' : overallPercentage > 0 ? 'partial' : 'none'}">
                        ${overallPercentage}%
                    </div>
                    <div class="folder-stat-label">Gesamt-Fortschritt</div>
                </div>
                <div class="folder-stat-item">
                    <div class="folder-stat-number ${completedFiles > 0 ? 'complete' : 'none'}">
                        ${completedFiles}/${totalFiles}
                    </div>
                    <div class="folder-stat-label">Dateien übersetzt</div>
                </div>
                <div class="folder-stat-item">
                    <div class="folder-stat-number ${completedFolders > 0 ? 'complete' : 'none'}">
                        ${completedFolders}/${totalFolders}
                    </div>
                    <div class="folder-stat-label">Ordner komplett</div>
                </div>
                <div class="folder-stat-item">
                    <div class="folder-stat-number ${globalBoth === globalTotal && globalTotal > 0 ? 'complete' : globalBoth > 0 ? 'partial' : 'none'}" id="globalTextStatsValue">
                        ${globalEN} / ${globalDE} / ${globalBoth} / ${globalTotal}
                    </div>
                    <div class="folder-stat-label">EN / DE / BEIDE / ∑</div>
                </div>
            </div>
        </div>
        <div style="display: flex; gap: 10px; margin: 15px 0; align-items: center;">
            <p style="color: #999; flex: 1;">Durchsuchen Sie alle verfügbaren Ordner. Grüne Ordner sind vollständig übersetzt.</p>
            <button class="btn btn-secondary" onclick="cleanupIncorrectFolderNames()" title="Bereinigt falsche Ordnernamen in der Datenbank">
                🧹 Ordnernamen bereinigen
            </button>
            <button class="btn btn-secondary" onclick="showMissingFoldersDialog()" title="Listet nicht mehr existierende Ordner auf">
                ❓ Fehlende Ordner
            </button>
        </div>
    `;
    
    // Get UNIQUE folders from filePathDatabase
    const uniqueFolders = new Map();
    
    Object.entries(filePathDatabase).forEach(([filename, paths]) => {
        paths.forEach(pathInfo => {
            const folder = pathInfo.folder;
            
            if (!uniqueFolders.has(folder)) {
                uniqueFolders.set(folder, {
                    name: folder,
                    files: []
                });
            }
            
            uniqueFolders.get(folder).files.push({
                filename: filename,
                fullPath: pathInfo.fullPath,
                folder: folder
            });
        });
    });
    
    // FALLBACK: If filePathDatabase is empty, use current project files and textDatabase
    if (uniqueFolders.size === 0) {
        debugLog('filePathDatabase leer, verwende Fallback mit aktuellen Projektdateien und textDatabase');
        
        // Check current project files
        files.forEach(file => {
            if (!uniqueFolders.has(file.folder)) {
                uniqueFolders.set(file.folder, {
                    name: file.folder,
                    files: []
                });
            }
            uniqueFolders.get(file.folder).files.push({
                filename: file.filename,
                fullPath: file.fullPath,
                folder: file.folder
            });
        });
        
        // Also check textDatabase for additional files
        Object.entries(textDatabase).forEach(([fileKey, texts]) => {
            const parts = fileKey.split('/');
            const filename = parts.pop();
            const folder = parts.join('/');
            
            if (folder && filename) {
                if (!uniqueFolders.has(folder)) {
                    uniqueFolders.set(folder, {
                        name: folder,
                        files: []
                    });
                }
                
                // Only add if not already present
                const folderData = uniqueFolders.get(folder);
                if (!folderData.files.find(f => f.filename === filename)) {
                    folderData.files.push({
                        filename: filename,
                        fullPath: `${folder}/${filename}`,
                        folder: folder
                    });
                }
            }
        });
    }
    
    // Check if we still have no folders and trigger auto-scan
    if (uniqueFolders.size === 0) {
        // Auto-scan for empty folder browser
        debugLog('Ordner-Browser leer, starte automatischen Scan...');
        setTimeout(() => {
            closeFolderBrowser();
            updateStatus('Ordner-Browser: Starte automatischen Ordner-Scan...');
            // Projektordner wählen und scannen
            waehleProjektOrdner();
        }, 1000);
        
        folderGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #999;">
                <div style="font-size: 48px; margin-bottom: 20px;">🔄</div>
                <h3 style="color: #ff6b1a; margin-bottom: 10px;">Automatischer Ordner-Scan</h3>
                <p style="margin-bottom: 20px;">
                    Keine Ordner gefunden. Starte automatischen Scan...<br>
                    Bitte wählen Sie einen Ordner mit Audio-Dateien aus.
                </p>
                <div style="animation: pulse-auto-scan 2s infinite;">📁 Ordner-Dialog wird geöffnet...</div>
            </div>
        `;
        return;
    }
    
    // Convert Map to Array and sort
    const sortedFolders = Array.from(uniqueFolders.values()).sort((a, b) => a.name.localeCompare(b.name));
    
    // Render folder cards with completion stats and delete button
    folderGrid.innerHTML = sortedFolders.map(folder => {
        const lastFolderName = folder.name.split('/').pop() || folder.name;
        const folderClass = lastFolderName.toLowerCase().replace(/[^a-z]/g, '');
        
        // Get completion stats for this folder
        const stats = folderStats.get(folder.name) || { total: folder.files.length, completed: 0, percentage: 0, isComplete: false };
        
        // Get custom icon and color or default
        const customization = folderCustomizations[folder.name] || {};
        let folderIcon = customization.icon;
        let folderColor = customization.color || '#333';
        
        // Get default folder icon if no custom one set
        if (!folderIcon) {
            if (lastFolderName.toLowerCase().includes('gman')) folderIcon = '👤';
            else if (lastFolderName.toLowerCase().includes('alyx')) folderIcon = '👩';
            else if (lastFolderName.toLowerCase().includes('russell')) folderIcon = '👨‍🔬';
            else if (lastFolderName.toLowerCase().includes('eli')) folderIcon = '👨‍🦳';
            else if (lastFolderName.toLowerCase().includes('vortigaunt')) folderIcon = '👽';
            else if (lastFolderName.toLowerCase().includes('combine')) folderIcon = '🤖';
            else if (lastFolderName.toLowerCase().includes('jeff')) folderIcon = '🧟';
            else if (lastFolderName.toLowerCase().includes('zombie')) folderIcon = '🧟‍♂️';
            else if (lastFolderName.toLowerCase().includes('charger')) folderIcon = '⚡';
            else if (lastFolderName.toLowerCase().includes('officer')) folderIcon = '👮';
            else folderIcon = '📁';
        }
        
        // Determine completion status styling
        let completionClass = '';
        let completionColor = '';
        if (stats.isComplete) {
            completionClass = 'completed';
            completionColor = '#4caf50';
        } else if (stats.percentage > 0) {
            completionColor = '#ff9800';
        } else {
            completionColor = '#666';
        }
        
        return `
            <div class="folder-card ${completionClass}" style="background: ${folderColor}; position: relative;">
                <!-- Anpassungs-Button oben links -->
                <button class="folder-customize-btn"
                        onclick="event.stopPropagation(); showFolderCustomization('${folder.name}')"
                        title="Ordner anpassen"
                        style="position: absolute; top: 8px; left: 8px;">
                    ⚙️
                </button>
                <!-- Lösch-Button oben rechts -->
                <button class="folder-delete-btn"
                        onclick="event.stopPropagation(); deleteFolderFromDatabase('${folder.name}')"
                        title="Ordner aus Datenbank löschen"
                        style="position: absolute; top: 8px; right: 8px; background: rgba(244,67,54,0.8); border: none; color: white; width: 24px; height: 24px; border-radius: 12px; cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;"
                        onmouseover="this.style.background='#f44336'"
                        onmouseout="this.style.background='rgba(244,67,54,0.8)'">×</button>
                
                <!-- Ordner-Inhalt (klickbar) -->
                <div onclick="showFolderFiles('${folder.name}')" style="cursor: pointer; padding: 15px;">
                    <div class="folder-card-icon">${folderIcon}</div>
                    <div class="folder-card-name">${lastFolderName}</div>
                    <div class="folder-card-count">${stats.total} Dateien</div>
                    <!-- Neue Zeile: zeigt übersetzte und offene Dateien an -->
                    <div class="folder-card-details">${stats.completed} übersetzt · ${stats.total - stats.completed} offen</div>
                    <div class="folder-card-completion ${stats.isComplete ? 'complete' : stats.percentage > 0 ? 'partial' : 'none'}" style="color: ${completionColor};">
                        ${stats.percentage}% übersetzt
                        ${stats.isComplete ? ' ✅' : stats.percentage > 0 ? ' 🔄' : ' ⏳'}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add debug info for development
    debugLog(`Ordner-Browser: ${sortedFolders.length} Ordner gefunden`);
    debugLog('Completion Stats:', Object.fromEntries(folderStats));
    debugLog('Gefundene Ordner:', sortedFolders.map(f => f.name));
    debugLog(`[GLOBAL STATS] EN: ${globalEN}, DE: ${globalDE}, Both: ${globalBoth}, Total: ${globalTotal}`);
}
// =========================== SHOWFOLDERGRID WITH DELETE END ===========================

// =========================== CLEANUPINCORRECTFOLDERNAMES START ===========================
function cleanupIncorrectFolderNames() {
    if (!confirm('Dies bereinigt die Datenbank von Einträgen mit falschen Ordnernamen.\n\nNur Dateien, die wirklich in dem angegebenen Ordner liegen, bleiben erhalten.\n\nFortfahren?')) {
        return;
    }
    
    let totalChecked = 0;
    let totalCorrected = 0;
    let totalRemoved = 0;
    
    debugLog('=== Bereinigung falscher Ordnernamen ===');
    
    // Sammle alle gescannten Pfade für Vergleich
    const realPaths = new Set();
    Object.values(audioFileCache).forEach(fileObj => {
        if (fileObj && fileObj.webkitRelativePath) {
            realPaths.add(fileObj.webkitRelativePath);
        }
    });
    
    debugLog(`Gefundene echte Pfade: ${realPaths.size}`);
    
    // Prüfe jeden Datenbank-Eintrag
    Object.entries(filePathDatabase).forEach(([filename, paths]) => {
        const correctPaths = [];
        
        paths.forEach(pathInfo => {
            totalChecked++;
            
            // Prüfe ob der angegebene Pfad wirklich existiert
            const realPathExists = realPaths.has(pathInfo.fullPath);
            
            if (realPathExists) {
                // Pfad ist korrekt - behalten
                correctPaths.push(pathInfo);
                debugLog(`✅ Korrekt: ${filename} in ${pathInfo.folder}`);
            } else {
                // Pfad existiert nicht - versuche korrekten Pfad zu finden
                let foundCorrectPath = false;
                
                for (const realPath of realPaths) {
                    if (realPath.endsWith('/' + filename)) {
                        // Finde den korrekten Ordner für diese Datei
                        const parts = realPath.split('/');
                        const correctFolder = extractRelevantFolder(parts.slice(0, -1));
                        
                        // Prüfe ob wir schon einen Eintrag für diesen Ordner haben
                        const alreadyHasCorrectFolder = correctPaths.some(p => p.folder === correctFolder);
                        
                        if (!alreadyHasCorrectFolder) {
                            // Finde das entsprechende File-Objekt
                            const correctFileObj = Object.values(audioFileCache).find(
                                fileObj => fileObj.webkitRelativePath === realPath
                            );
                            
                            if (correctFileObj) {
                                correctPaths.push({
                                    folder: correctFolder,
                                    fullPath: realPath,
                                    fileObject: correctFileObj
                                });
                                
                                debugLog(`🔧 Korrigiert: ${filename} von "${pathInfo.folder}" zu "${correctFolder}"`);
                                totalCorrected++;
                                foundCorrectPath = true;
                                break;
                            }
                        }
                    }
                }
                
                if (!foundCorrectPath) {
                    debugLog(`❌ Entfernt: ${filename} in "${pathInfo.folder}" (Pfad existiert nicht: ${pathInfo.fullPath})`);
                    totalRemoved++;
                    
                    // Entferne aus Audio-Cache falls vorhanden
                    if (audioFileCache[pathInfo.fullPath]) {
                        delete audioFileCache[pathInfo.fullPath];
                    }
                }
            }
        });
        
        // Aktualisiere Datenbank mit korrigierten Pfaden
        if (correctPaths.length > 0) {
            filePathDatabase[filename] = correctPaths;
        } else {
            // Keine korrekten Pfade gefunden - entferne Datei komplett
            delete filePathDatabase[filename];
            debugLog(`🗑️ Datei komplett entfernt: ${filename} (keine gültigen Pfade)`);
        }
    });
    
    // Speichere bereinigte Datenbank
    saveFilePathDatabase();
    
    // Aktualisiere Projekte
    updateAllProjectsAfterScan();
    if (repairFileExtensions) {
        const count = repairFileExtensions(projects, filePathDatabase, textDatabase);
        if (count > 0) debugLog('Dateiendungen aktualisiert:', count);
    }
    
    const results = `✅ Ordnernamen-Bereinigung abgeschlossen!\n\n` +
        `📊 Statistik:\n` +
        `• ${totalChecked} Einträge geprüft\n` +
        `• ${totalCorrected} Ordnernamen korrigiert\n` +
        `• ${totalRemoved} falsche Einträge entfernt\n` +
        `• ${Object.keys(filePathDatabase).length} Dateien verbleiben\n\n` +
        `🎯 Alle Einträge haben jetzt korrekte Ordnernamen!`;
    
    updateStatus(`Ordnernamen bereinigt: ${totalCorrected} korrigiert, ${totalRemoved} entfernt`);
    
    // Aktualisiere aktuelle Ansicht falls Ordner-Browser offen
    const folderBrowserOpen = !document.getElementById('folderBrowserDialog').classList.contains('hidden');
    if (folderBrowserOpen) {
        showFolderGrid();
    }
    
    alert(results);
    debugLog('=== Bereinigung abgeschlossen ===');
}
// =========================== CLEANUPINCORRECTFOLDERNAMES END ===========================

// =========================== SHOWFOLDERDEBUG START ===========================
// Zeigt alle bekannten Ordner aus der Datenbank an und markiert nicht gefundene
// Ordner. Fehlende Ordner lassen sich direkt löschen.
function showFolderDebug() {
    const wrapper = document.getElementById('debugConsoleWrapper');
    wrapper.style.display = 'block'; // Debug-Konsole einblenden
    wrapper.open = true; // Bereich aufklappen

    const listDiv = document.getElementById('folderDebug');
    if (!listDiv) return;
    listDiv.innerHTML = '';

    // Sammle eindeutige Ordnernamen aus der Datenbank
    const folders = new Set();
    Object.values(filePathDatabase).forEach(paths => {
        paths.forEach(p => folders.add(p.folder));
    });

    if (folders.size === 0) {
        listDiv.textContent = 'Keine Ordner in der Datenbank.';
        return;
    }

    const ul = document.createElement('ul');
    ul.style.listStyle = 'none';
    ul.style.padding = '0';

    folders.forEach(folder => {
        const li = document.createElement('li');
        li.style.marginBottom = '4px';

        const exists = Object.keys(audioFileCache).some(p => p.startsWith(folder + '/'));
        const status = document.createElement('span');
        status.textContent = exists ? '✅' : '❌';
        li.appendChild(status);
        li.append(' ' + folder);

        if (!exists) {
            const btn = document.createElement('button');
            btn.textContent = 'Löschen';
            btn.className = 'btn btn-danger';
            btn.style.marginLeft = '10px';
            btn.onclick = () => deleteFolderFromDatabase(folder);
            li.appendChild(btn);
        }

        ul.appendChild(li);
    });

    listDiv.appendChild(ul);
}
// =========================== SHOWFOLDERDEBUG END =============================

// =========================== SHOWMISSINGFOLDERSDIALOG START =================
// Öffnet ein Dialogfenster mit allen Ordnern, die keine vorhandenen Dateien mehr besitzen
function showMissingFoldersDialog() {
    const dialog  = document.getElementById('missingFoldersDialog');
    const listDiv = document.getElementById('missingFoldersList');
    const dbDiv   = document.getElementById('databaseFoldersList');
    listDiv.innerHTML = '';
    dbDiv.innerHTML   = '';

    const folderMap = {};
    Object.values(filePathDatabase).forEach(paths => {
        paths.forEach(p => {
            if (!folderMap[p.folder]) folderMap[p.folder] = [];
            folderMap[p.folder].push(p.fullPath);
        });
    });

    // Alle Ordner aus der Datenbank sortiert sammeln
    const allFolders = Object.entries(folderMap)
        .sort((a, b) => a[0].localeCompare(b[0]));

    const missing = Object.entries(folderMap)
        .filter(([folder, paths]) => !paths.some(full => audioFileCache[full]))
        .map(([folder]) => folder)
        .sort();

    if (missing.length === 0) {
        listDiv.textContent = 'Alle Ordner existieren noch.';
        document.getElementById('deleteAllMissingBtn').onclick = null;
    } else {
        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.padding = '0';

        missing.forEach(folder => {
            const li = document.createElement('li');
            li.style.marginBottom = '6px';
            li.textContent = folder;

            const btn = document.createElement('button');
            btn.textContent = 'Löschen';
            btn.className = 'btn btn-danger';
            btn.style.marginLeft = '10px';
            btn.onclick = () => { deleteFolderFromDatabase(folder); li.remove(); };
            li.appendChild(btn);

            ul.appendChild(li);
        });

        listDiv.appendChild(ul);

        document.getElementById('deleteAllMissingBtn').onclick = () => {
            missing.forEach(folder => deleteFolderFromDatabase(folder));
            showMissingFoldersDialog();
        };
    }

    // Zweite Liste mit allen Ordnern und erstem Pfad anzeigen
    if (allFolders.length === 0) {
        dbDiv.textContent = 'Keine Ordner in der Datenbank.';
    } else {
        const dbUl = document.createElement('ul');
        dbUl.style.listStyle = 'none';
        dbUl.style.padding = '0';

        allFolders.forEach(([folder, paths]) => {
            const li = document.createElement('li');
            li.style.marginBottom = '6px';
            li.textContent = `${folder} – ${paths[0]}`;
            dbUl.appendChild(li);
        });

        dbDiv.appendChild(dbUl);
    }

    dialog.classList.remove('hidden');
}

function closeMissingFoldersDialog() {
    document.getElementById('missingFoldersDialog').classList.add('hidden');
}
// =========================== CLEANUPORPHANCUSTOMIZATIONS START =============
// Entfernt gespeicherte Ordner-Anpassungen, die keinen Datenbankeintrag mehr besitzen
function cleanupOrphanCustomizations() {
    const knownFolders = new Set();
    Object.values(filePathDatabase).forEach(paths => {
        paths.forEach(p => knownFolders.add(p.folder));
    });
    let removed = 0;
    Object.keys(folderCustomizations).forEach(folder => {
        if (!knownFolders.has(folder)) {
            delete folderCustomizations[folder];
            removed++;
        }
    });
    if (removed > 0) {
        saveFolderCustomizations();
        debugLog(`[CLEANUP] ${removed} verwaiste Ordner-Anpassungen entfernt`);
    }
}
// =========================== CLEANUPORPHANCUSTOMIZATIONS END ===============

// =========================== SEGMENT DIALOG START ==========================
// Hilfsfunktionen zur Audio-Segmentierung direkt hier eingebunden
// Erkennt Pausen im AudioBuffer und liefert die Segmente zurueck
function detectSegmentsInBuffer(buffer, silenceMs = 300, threshold = 0.01, onProgress) {
    const data = buffer.getChannelData(0);
    const sr = buffer.sampleRate;
    const windowSize = Math.round(sr * 0.03); // 30 ms
    const silenceSamples = Math.round(sr * silenceMs / 1000);
    let segments = [];
    let start = 0;
    let silent = 0;
    let inSound = false;
    const total = data.length;
    for (let i = 0; i < total; i += windowSize) {
        let sum = 0;
        for (let j = 0; j < windowSize && i + j < data.length; j++) {
            sum += Math.abs(data[i + j]);
        }
        const amp = sum / windowSize;
        const ms = i / sr * 1000;
        if (amp < threshold) {
            silent += windowSize;
            if (inSound && silent >= silenceSamples) {
                const end = (i - silent) / sr * 1000;
                if (end > start) segments.push({ start, end });
                inSound = false;
            }
        } else {
            if (!inSound) {
                start = ms;
                inSound = true;
            }
            silent = 0;
        }
        if (onProgress && i % (sr * 0.5) === 0) {
            onProgress(i / total);
        }
    }
    if (inSound) {
        const end = data.length / sr * 1000;
        segments.push({ start, end });
    }
    if (onProgress) onProgress(1);
    return { buffer, segments };
}

// Variante, die direkt eine Datei laedt
async function detectSegments(file, silenceMs = 300, threshold = 0.01, onProgress) {
    const buffer = await loadAudioBuffer(file);
    return detectSegmentsInBuffer(buffer, silenceMs, threshold, onProgress);
}

// Zeichnet die Segmente farbig in die Wellenform
function drawSegments(canvas, buffer, segments) {
    drawWaveform(canvas, buffer);
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const durationMs = buffer.length / buffer.sampleRate * 1000;
    segments.forEach((s, i) => {
        const startX = (s.start / durationMs) * width;
        const endX = (s.end / durationMs) * width;
        if (ignoredSegments.has(i + 1)) {
            ctx.fillStyle = 'rgba(80,80,80,0.4)';
        } else {
            ctx.fillStyle = i % 2 ? 'rgba(0,0,255,0.3)' : 'rgba(255,0,255,0.3)';
        }
        ctx.fillRect(startX, 0, endX - startX, height);
    });
}

// Schneidet einen Bereich aus einem Buffer heraus
function sliceBuffer(buffer, startMs, endMs) {
    const sr = buffer.sampleRate;
    const start = Math.max(0, Math.floor(startMs * sr / 1000));
    const end = Math.min(buffer.length, Math.floor(endMs * sr / 1000));
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const newBuf = ctx.createBuffer(buffer.numberOfChannels, end - start, sr);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        const data = buffer.getChannelData(ch).subarray(start, end);
        newBuf.copyToChannel(data, ch);
    }
    // AudioContext wieder schließen, um Browser-Limit zu vermeiden
    ctx.close();
    return newBuf;
}

// Fuegt mehrere Segmente hintereinander zu einem neuen Buffer zusammen
// Fuegt mehrere Segmente hintereinander zu einem neuen Buffer zusammen
function mergeSegments(buffer, segments) {
    if (!segments || segments.length === 0) return null;
    const sr = buffer.sampleRate;

    // Segmentgrenzen auf die Pufferlaenge begrenzen und tatsaechliche Laengen berechnen
    const infos = segments.map(seg => {
        const start = Math.max(0, Math.floor(seg.start * sr / 1000));
        const end = Math.min(buffer.length, Math.floor(seg.end * sr / 1000));
        return { start, end, length: Math.max(0, end - start) };
    }).filter(s => s.length > 0);

    const total = infos.reduce((sum, s) => sum + s.length, 0);
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const newBuf = ctx.createBuffer(buffer.numberOfChannels, total, sr);
    let offset = 0;

    infos.forEach(seg => {
        for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
            const data = buffer.getChannelData(ch).subarray(seg.start, seg.end);
            newBuf.getChannelData(ch).set(data, offset);
        }
        offset += seg.length;
    });
    // AudioContext wieder schliessen, um Ressourcen freizugeben
    ctx.close();
    return newBuf;
}

// Entfernt mehrere Bereiche aus einem Buffer
// Hilfsfunktion: Bereiche sortieren und auf Grenzen prüfen
function normalizeRanges(ranges, duration) {
    return ranges
        .map(r => ({ start: Math.max(0, r.start), end: Math.min(duration, r.end) }))
        .filter(r => r.end > r.start)
        .sort((a, b) => a.start - b.start);
}

// Entfernt mehrere Bereiche aus einem Buffer
// Schneidet Bereiche aus dem Buffer und lässt etwas Rand stehen,
// damit Übergänge nicht zu hart klingen
const PAUSE_EDGE_MS = 2; // kleine Sicherheit an jeder Seite
function removeRangesFromBuffer(buffer, ranges) {
    if (!ranges || ranges.length === 0) return buffer;
    const duration = buffer.length / buffer.sampleRate * 1000;
    const padded = ranges.map(r => ({
        start: r.start + PAUSE_EDGE_MS,
        end: r.end - PAUSE_EDGE_MS
    }));
    const valid = normalizeRanges(padded, duration);
    if (valid.length === 0) return buffer;
    const segments = [];
    let pos = 0;
    for (const r of valid) {
        if (r.start > pos) segments.push({ start: pos, end: r.start });
        pos = Math.max(pos, r.end);
    }
    if (pos < duration) segments.push({ start: pos, end: duration });
    return mergeSegments(buffer, segments) || buffer;
}

// Fügt stille Bereiche in einen Buffer ein
function insertSilenceIntoBuffer(buffer, ranges) {
    if (!ranges || ranges.length === 0) return buffer;
    const sr = buffer.sampleRate;
    const valid = ranges
        .map(r => ({ start: Math.max(0, r.start), end: Math.max(0, r.end) }))
        .filter(r => r.end > r.start)
        .sort((a, b) => a.start - b.start);
    if (valid.length === 0) return buffer;

    const totalSamples = valid.reduce((sum, r) => sum + Math.round((r.end - r.start) * sr / 1000), 0) + buffer.length;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const out = ctx.createBuffer(buffer.numberOfChannels, totalSamples, sr);

    let inPos = 0; // Position im Original
    let outPos = 0; // Position im Ergebnis
    valid.forEach(r => {
        const startSamples = Math.round(r.start * sr / 1000);
        const silenceSamples = Math.round((r.end - r.start) * sr / 1000);
        const copyLen = Math.min(startSamples, buffer.length) - inPos;
        for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
            const data = buffer.getChannelData(ch).subarray(inPos, inPos + copyLen);
            out.getChannelData(ch).set(data, outPos);
        }
        inPos += copyLen;
        outPos += copyLen + silenceSamples; // Stille ist bereits mit Nullen gefüllt
    });
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        const data = buffer.getChannelData(ch).subarray(inPos);
        out.getChannelData(ch).set(data, outPos);
    }
    ctx.close();
    return out;
}

// Fügt einen Buffer an einer bestimmten Position in einen anderen ein
function insertBufferIntoBuffer(target, insert, posMs) {
    const sr = target.sampleRate;
    const pos = Math.round(Math.max(0, posMs) * sr / 1000);
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const out = ctx.createBuffer(target.numberOfChannels, target.length + insert.length, sr);
    for (let ch = 0; ch < target.numberOfChannels; ch++) {
        const outData = out.getChannelData(ch);
        const tData = target.getChannelData(ch);
        outData.set(tData.subarray(0, pos), 0);
        outData.set(insert.getChannelData(ch), pos);
        outData.set(tData.subarray(pos), pos + insert.length);
    }
    ctx.close();
    return out;
}

// Rechnet Originalposition auf Abspielposition um (nach Entfernen der Bereiche)
function originalToPlayback(ms, ranges, duration) {
    const valid = normalizeRanges(ranges, duration);
    let offset = 0;
    for (const r of valid) {
        if (ms <= r.start) break;
        const part = Math.min(ms, r.end) - r.start;
        if (part > 0) offset += part;
    }
    return ms - offset;
}

// Rechnet Abspielposition wieder auf Originalzeit um
function playbackToOriginal(ms, ranges, duration) {
    const valid = normalizeRanges(ranges, duration);
    let offset = 0;
    for (const r of valid) {
        if (ms + offset < r.start) break;
        offset += r.end - r.start;
    }
    return ms + offset;
}

// Rechnet Originalzeit auf Wiedergabezeit um, wenn Stille eingefügt wurde
function originalToPlaybackSilence(ms, ranges) {
    const valid = (ranges || [])
        .map(r => ({ start: Math.max(0, r.start), end: Math.max(r.start, r.end) }))
        .filter(r => r.end > r.start)
        .sort((a, b) => a.start - b.start);
    let offset = 0;
    for (const r of valid) {
        if (ms < r.start + offset) break;
        offset += r.end - r.start;
    }
    return ms + offset;
}

// Rechnet Wiedergabezeit zurück auf Originalzeit bei eingefügter Stille
function playbackToOriginalSilence(ms, ranges) {
    const valid = (ranges || [])
        .map(r => ({ start: Math.max(0, r.start), end: Math.max(r.start, r.end) }))
        .filter(r => r.end > r.start)
        .sort((a, b) => a.start - b.start);
    let offset = 0;
    for (const r of valid) {
        if (ms < r.start + offset) break;
        offset += r.end - r.start;
    }
    return ms - offset;
}

// Ermittelt Pausen ueber einer Mindestlaenge und gibt passende Ignorierbereiche zurueck
function detectPausesInBuffer(buffer, minPauseMs = 400) {
    const { segments } = detectSegmentsInBuffer(buffer, minPauseMs, 0.01);
    const ranges = [];
    for (let i = 1; i < segments.length; i++) {
        const gap = segments[i].start - segments[i - 1].end;
        if (gap >= minPauseMs) {
            ranges.push({ start: segments[i - 1].end, end: segments[i].start });
        }
    }
    return ranges;
}

// =========================== DETECTSILENCETRIM START ======================
// Erkennt Stille am Anfang und Ende eines AudioBuffers und
// liefert die passenden Millisekundenwerte zurück
function detectSilenceTrim(buffer, threshold = 0.01, windowMs = 10) {
    const data = buffer.getChannelData(0);
    const sr = buffer.sampleRate;
    const step = Math.max(1, Math.round(sr * windowMs / 1000));
    let start = 0;
    while (start < data.length) {
        let sum = 0;
        for (let i = start; i < Math.min(start + step, data.length); i++) {
            sum += Math.abs(data[i]);
        }
        if (sum / step > threshold) break;
        start += step;
    }
    let end = data.length;
    while (end > start) {
        let sum = 0;
        for (let i = Math.max(end - step, 0); i < end; i++) {
            sum += Math.abs(data[i]);
        }
        if (sum / step > threshold) break;
        end -= step;
    }
    return {
        start: Math.round(start / sr * 1000),
        end: Math.round((data.length - end) / sr * 1000)
    };
}
// =========================== DETECTSILENCETRIM END ========================

async function applyRadioEffect() {
    if (!isRadioEffect && window.electronAPI && window.electronAPI.saveDeHistoryBuffer) {
        const relPath = getFullPath(currentEditFile);
        const blob = bufferToWav(savedOriginalBuffer);
        const buf = await blob.arrayBuffer();
        await window.electronAPI.saveDeHistoryBuffer(relPath, new Uint8Array(buf));
        await updateHistoryCache(relPath);
    }
    isRadioEffect = true;
    await recomputeEditBuffer();
    updateEffectButtons();
}
// =========================== APPLYRADIOEFFECT END ==========================

// =========================== APPLYHALLEFFECT START ==========================
// Aktiviert den Hall-Effekt und legt bei Erstnutzung eine History an
async function applyHallEffect() {
    if (!isHallEffect && window.electronAPI && window.electronAPI.saveDeHistoryBuffer) {
        const relPath = getFullPath(currentEditFile);
        const blob = bufferToWav(savedOriginalBuffer);
        const buf = await blob.arrayBuffer();
        await window.electronAPI.saveDeHistoryBuffer(relPath, new Uint8Array(buf));
        await updateHistoryCache(relPath);
    }
    isHallEffect = true;
    await recomputeEditBuffer();
}
// Schaltet den Hall-Effekt abhängig vom Kontrollkästchen ein oder aus
function toggleHallEffect(active) {
    if (active) {
        applyHallEffect();
    } else {
        isHallEffect = false;
        recomputeEditBuffer();
    }
    updateEffectButtons();
}
// =========================== APPLYHALLEFFECT END ============================

// =========================== APPLYNEIGHBOREFFECT START ======================
// Aktiviert den Nebenraum-Effekt und legt bei Erstnutzung eine History an
async function applyNeighborEffect() {
    if (!isNeighborEffect && window.electronAPI && window.electronAPI.saveDeHistoryBuffer) {
        const relPath = getFullPath(currentEditFile);
        const blob = bufferToWav(savedOriginalBuffer);
        const buf = await blob.arrayBuffer();
        await window.electronAPI.saveDeHistoryBuffer(relPath, new Uint8Array(buf));
        await updateHistoryCache(relPath);
    }
    isNeighborEffect = true;
    await recomputeEditBuffer();
    updateEffectButtons();
}
// =========================== APPLYNEIGHBOREFFECT END ========================

// Schaltet den Nebenraum-Effekt abhängig vom Kontrollkästchen ein oder aus
function toggleNeighborEffect(active) {
    if (active) {
        applyNeighborEffect();
    } else {
        isNeighborEffect = false;
        recomputeEditBuffer();
        updateEffectButtons();
    }
}

// Schaltet den optionalen Hall für den Nebenraum-Effekt oder als alleinstehenden Raumklang
function toggleNeighborHall(active) {
    neighborHall = active;
    storage.setItem('hla_neighborHall', active ? '1' : '0');
    recomputeEditBuffer();
    updateEffectButtons();
}

// Aktiviert den Telefon-auf-Tisch-Effekt und legt bei Erstnutzung eine History an
async function applyTableMicEffect() {
    if (!isTableMicEffect && window.electronAPI && window.electronAPI.saveDeHistoryBuffer) {
        const relPath = getFullPath(currentEditFile);
        const blob = bufferToWav(savedOriginalBuffer);
        const buf = await blob.arrayBuffer();
        await window.electronAPI.saveDeHistoryBuffer(relPath, new Uint8Array(buf));
        await updateHistoryCache(relPath);
    }
    isTableMicEffect = true;
    await recomputeEditBuffer();
    updateEffectButtons();
}

// Schaltet den Telefon-auf-Tisch-Effekt abhängig vom Kontrollkästchen ein oder aus
function toggleTableMicEffect(active) {
    if (active) {
        applyTableMicEffect();
    } else {
        isTableMicEffect = false;
        recomputeEditBuffer();
        updateEffectButtons();
    }
}

// Schaltet die Sprachdämpfung bei EM-Störungen
function toggleEmiVoiceDamp(active) {
    emiVoiceDamp = active;
    storage.setItem('hla_emiVoiceDamp', active ? '1' : '0');
    if (isEmiEffect) recomputeEditBuffer();
    updateEffectButtons();
}

// =========================== APPLYEMIEFFECT START ===========================
// Aktiviert elektromagnetische Störgeräusche und legt bei Erstnutzung eine History an
async function applyEmiEffect() {
    if (!isEmiEffect && window.electronAPI && window.electronAPI.saveDeHistoryBuffer) {
        const relPath = getFullPath(currentEditFile);
        const blob = bufferToWav(savedOriginalBuffer);
        const buf = await blob.arrayBuffer();
        await window.electronAPI.saveDeHistoryBuffer(relPath, new Uint8Array(buf));
        await updateHistoryCache(relPath);
    }
    isEmiEffect = true;
    await recomputeEditBuffer();
    updateEffectButtons();
}
// =========================== APPLYEMIEFFECT END =============================
// =========================== EMIPRESET-FUNKTIONEN START ====================
// Aktualisiert die Auswahlbox für EM-Störgeräusch-Presets
function updateEmiPresetList() {
    const sel = document.getElementById('emiPresetSelect');
    if (!sel) return;
    sel.innerHTML = '';
    for (const name of Object.keys(emiPresets)) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        sel.appendChild(opt);
    }
    if (lastEmiPreset && emiPresets[lastEmiPreset]) {
        sel.value = lastEmiPreset;
    }
}
// Speichert die aktuellen EM-Störgeräusch-Werte als Preset
function saveEmiPreset(name) {
    if (!name) return;
    emiPresets[name] = {
        level: emiNoiseLevel,
        ramp: emiRampPosition,
        mode: emiRampMode,
        dropoutProb: emiDropoutProb,
        dropoutDur: emiDropoutDur,
        crackleProb: emiCrackleProb,
        crackleAmp: emiCrackleAmp,
        spikeProb: emiSpikeProb,
        spikeAmp: emiSpikeAmp,
        voiceDamp: emiVoiceDamp
    };
    storage.setItem('hla_emiPresets', JSON.stringify(emiPresets));
    lastEmiPreset = name;
    storage.setItem('hla_lastEmiPreset', name);
    updateEmiPresetList();
}
// Lädt ein Preset und setzt alle EM-Störgeräusch-Werte
function loadEmiPreset(name) {
    const p = emiPresets[name];
    if (!p) return;
    emiNoiseLevel = p.level;
    emiRampPosition = p.ramp;
    emiRampMode = p.mode;
    emiDropoutProb = p.dropoutProb;
    emiDropoutDur = p.dropoutDur;
    emiCrackleProb = p.crackleProb;
    emiCrackleAmp = p.crackleAmp;
    emiSpikeProb = p.spikeProb;
    emiSpikeAmp = p.spikeAmp;
    emiVoiceDamp = !!p.voiceDamp;
    storage.setItem('hla_emiNoiseLevel', emiNoiseLevel);
    storage.setItem('hla_emiRamp', emiRampPosition);
    storage.setItem('hla_emiMode', emiRampMode);
    storage.setItem('hla_emiDropoutProb', emiDropoutProb);
    storage.setItem('hla_emiDropoutDur', emiDropoutDur);
    storage.setItem('hla_emiCrackleProb', emiCrackleProb);
    storage.setItem('hla_emiCrackleAmp', emiCrackleAmp);
    storage.setItem('hla_emiSpikeProb', emiSpikeProb);
    storage.setItem('hla_emiSpikeAmp', emiSpikeAmp);
    storage.setItem('hla_emiVoiceDamp', emiVoiceDamp ? '1' : '0');
    lastEmiPreset = name;
    storage.setItem('hla_lastEmiPreset', name);
    refreshEmiControls();
}
// Entfernt ein Preset dauerhaft
function deleteEmiPreset(name) {
    if (!emiPresets[name]) return;
    delete emiPresets[name];
    storage.setItem('hla_emiPresets', JSON.stringify(emiPresets));
    if (lastEmiPreset === name) {
        lastEmiPreset = Object.keys(emiPresets)[0] || '';
        storage.setItem('hla_lastEmiPreset', lastEmiPreset);
    }
    updateEmiPresetList();
}
// Aktualisiert alle Regler entsprechend der aktuellen EM-Werte
function refreshEmiControls() {
    const eLevel = document.getElementById('emiLevel');
    const eDisp = document.getElementById('emiLevelDisplay');
    if (eLevel && eDisp) {
        eLevel.value = emiNoiseLevel;
        eDisp.textContent = Math.round(emiNoiseLevel * 100) + '%';
    }
    const eRamp = document.getElementById('emiRamp');
    const eRampDisp = document.getElementById('emiRampDisplay');
    if (eRamp && eRampDisp) {
        eRamp.value = emiRampPosition;
        eRampDisp.textContent = Math.round(emiRampPosition * 100) + '%';
    }
    const eMode = document.getElementById('emiMode');
    if (eMode) eMode.value = emiRampMode;
    const eDropProb = document.getElementById('emiDropoutProb');
    const eDropProbDisp = document.getElementById('emiDropoutProbDisplay');
    if (eDropProb && eDropProbDisp) {
        eDropProb.value = emiDropoutProb;
        eDropProbDisp.textContent = (emiDropoutProb * 100).toFixed(2) + '%';
    }
    const eDropDur = document.getElementById('emiDropoutDur');
    const eDropDurDisp = document.getElementById('emiDropoutDurDisplay');
    if (eDropDur && eDropDurDisp) {
        eDropDur.value = emiDropoutDur;
        eDropDurDisp.textContent = Math.round(emiDropoutDur * 1000) + ' ms';
    }
    const eCrackProb = document.getElementById('emiCrackleProb');
    const eCrackProbDisp = document.getElementById('emiCrackleProbDisplay');
    if (eCrackProb && eCrackProbDisp) {
        eCrackProb.value = emiCrackleProb;
        eCrackProbDisp.textContent = (emiCrackleProb * 100).toFixed(2) + '%';
    }
    const eCrackAmp = document.getElementById('emiCrackleAmp');
    const eCrackAmpDisp = document.getElementById('emiCrackleAmpDisplay');
    if (eCrackAmp && eCrackAmpDisp) {
        eCrackAmp.value = emiCrackleAmp;
        eCrackAmpDisp.textContent = Math.round(emiCrackleAmp * 100) + '%';
    }
    const eSpikeProb = document.getElementById('emiSpikeProb');
    const eSpikeProbDisp = document.getElementById('emiSpikeProbDisplay');
    if (eSpikeProb && eSpikeProbDisp) {
        eSpikeProb.value = emiSpikeProb;
        eSpikeProbDisp.textContent = (emiSpikeProb * 100).toFixed(2) + '%';
    }
    const eSpikeAmp = document.getElementById('emiSpikeAmp');
    const eSpikeAmpDisp = document.getElementById('emiSpikeAmpDisplay');
    if (eSpikeAmp && eSpikeAmpDisp) {
        eSpikeAmp.value = emiSpikeAmp;
        eSpikeAmpDisp.textContent = Math.round(emiSpikeAmp * 100) + '%';
    }
    const eVoice = document.getElementById('emiVoiceDampToggle');
    if (eVoice) eVoice.checked = emiVoiceDamp;
}
// =========================== EMIPRESET-FUNKTIONEN END ======================
// =========================== APPLYVOLUMEMATCH END =========================

// =========================== RESETRADIOSETTINGS START =====================
// Setzt alle Funk-Effektwerte auf Standard zurück
function resetRadioSettings() {
    // Globale Standardwerte setzen
    radioEffectStrength = 0.85;
    radioHighpass = 300;
    radioLowpass = 3200;
    radioSaturation = 0.2;
    radioNoise = -26;
    radioCrackle = 0.1;

    // Werte im LocalStorage aktualisieren
    storage.setItem('hla_radioEffectStrength', radioEffectStrength);
    storage.setItem('hla_radioHighpass', radioHighpass);
    storage.setItem('hla_radioLowpass', radioLowpass);
    storage.setItem('hla_radioSaturation', radioSaturation);
    storage.setItem('hla_radioNoise', radioNoise);
    storage.setItem('hla_radioCrackle', radioCrackle);

    // Regler im Dialog zurücksetzen
    const rStrength = document.getElementById('radioStrength');
    const rStrengthDisp = document.getElementById('radioStrengthDisplay');
    if (rStrength && rStrengthDisp) {
        rStrength.value = radioEffectStrength;
        rStrengthDisp.textContent = Math.round(radioEffectStrength * 100) + '%';
    }
    const rHigh = document.getElementById('radioHighpass');
    if (rHigh) rHigh.value = radioHighpass;
    const rLow = document.getElementById('radioLowpass');
    if (rLow) rLow.value = radioLowpass;
    const rSat = document.getElementById('radioSaturation');
    const rSatDisp = document.getElementById('radioSaturationDisplay');
    if (rSat && rSatDisp) {
        rSat.value = radioSaturation;
        rSatDisp.textContent = Math.round(radioSaturation * 100) + '%';
    }
    const rNoise = document.getElementById('radioNoise');
    if (rNoise) rNoise.value = radioNoise;
    const rCrackle = document.getElementById('radioCrackle');
    const rCrackleDisp = document.getElementById('radioCrackleDisplay');
    if (rCrackle && rCrackleDisp) {
        rCrackle.value = radioCrackle;
        rCrackleDisp.textContent = Math.round(radioCrackle * 100) + '%';
    }

    // Effekte neu berechnen, falls aktiv
    if (isRadioEffect) recomputeEditBuffer();
}
// Aktualisiert die Slider auf die aktuellen Funk-Effektwerte
function refreshRadioControls() {
    const rStrength = document.getElementById('radioStrength');
    const rStrengthDisp = document.getElementById('radioStrengthDisplay');
    if (rStrength && rStrengthDisp) {
        rStrength.value = radioEffectStrength;
        rStrengthDisp.textContent = Math.round(radioEffectStrength * 100) + '%';
    }
    const rHigh = document.getElementById('radioHighpass');
    if (rHigh) rHigh.value = radioHighpass;
    const rLow = document.getElementById('radioLowpass');
    if (rLow) rLow.value = radioLowpass;
    const rSat = document.getElementById('radioSaturation');
    const rSatDisp = document.getElementById('radioSaturationDisplay');
    if (rSat && rSatDisp) {
        rSat.value = radioSaturation;
        rSatDisp.textContent = Math.round(radioSaturation * 100) + '%';
    }
    const rNoise = document.getElementById('radioNoise');
    if (rNoise) rNoise.value = radioNoise;
    const rCrackle = document.getElementById('radioCrackle');
    const rCrackleDisp = document.getElementById('radioCrackleDisplay');
    if (rCrackle && rCrackleDisp) {
        rCrackle.value = radioCrackle;
        rCrackleDisp.textContent = Math.round(radioCrackle * 100) + '%';
    }
}
// Aktualisiert die Auswahlbox fuer Presets
function updateRadioPresetList() {
    const sel = document.getElementById('radioPresetSelect');
    if (!sel) return;
    sel.innerHTML = '';
    for (const name of Object.keys(radioPresets)) {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        sel.appendChild(opt);
    }
    if (lastRadioPreset && radioPresets[lastRadioPreset]) {
        sel.value = lastRadioPreset;
    }
}
// Speichert die aktuellen Werte als Preset
function saveRadioPreset(name) {
    if (!name) return;
    radioPresets[name] = {
        strength: radioEffectStrength,
        high: radioHighpass,
        low: radioLowpass,
        sat: radioSaturation,
        noise: radioNoise,
        crack: radioCrackle
    };
    storage.setItem('hla_radioPresets', JSON.stringify(radioPresets));
    lastRadioPreset = name;
    storage.setItem('hla_lastRadioPreset', name);
    updateRadioPresetList();
}
// Laedt ein Preset und setzt alle Werte
function loadRadioPreset(name) {
    const p = radioPresets[name];
    if (!p) return;
    radioEffectStrength = p.strength;
    radioHighpass = p.high;
    radioLowpass = p.low;
    radioSaturation = p.sat;
    radioNoise = p.noise;
    radioCrackle = p.crack;
    storage.setItem('hla_radioEffectStrength', radioEffectStrength);
    storage.setItem('hla_radioHighpass', radioHighpass);
    storage.setItem('hla_radioLowpass', radioLowpass);
    storage.setItem('hla_radioSaturation', radioSaturation);
    storage.setItem('hla_radioNoise', radioNoise);
    storage.setItem('hla_radioCrackle', radioCrackle);
    lastRadioPreset = name;
    storage.setItem('hla_lastRadioPreset', name);
    refreshRadioControls();
}
// Entfernt ein Preset dauerhaft
function deleteRadioPreset(name) {
    if (!radioPresets[name]) return;
    delete radioPresets[name];
    storage.setItem('hla_radioPresets', JSON.stringify(radioPresets));
    if (lastRadioPreset === name) {
        lastRadioPreset = Object.keys(radioPresets)[0] || '';
        storage.setItem('hla_lastRadioPreset', lastRadioPreset);
    }
    updateRadioPresetList();
}
// =========================== RESETRADIOSETTINGS END =======================

// =========================== RESETHALLSETTINGS START =====================
// Setzt alle Hall-Parameter auf Standardwerte
function resetHallSettings() {
    // Globale Vorgaben
    hallRoom   = 0.5;
    hallAmount = 0.5;
    hallDelay  = 80;

    // Speicherung im LocalStorage
    storage.setItem('hla_hallRoom', hallRoom);
    storage.setItem('hla_hallAmount', hallAmount);
    storage.setItem('hla_hallDelay', hallDelay);

    // Regler im Dialog zurücksetzen
    const hRoom = document.getElementById('hallRoom');
    if (hRoom) hRoom.value = hallRoom;
    const hAmount = document.getElementById('hallAmount');
    const hAmountDisp = document.getElementById('hallAmountDisplay');
    if (hAmount && hAmountDisp) {
        hAmount.value = hallAmount;
        hAmountDisp.textContent = Math.round(hallAmount * 100) + '%';
    }
    const hDelay = document.getElementById('hallDelay');
    if (hDelay) hDelay.value = hallDelay;

    // Effekt neu berechnen, falls aktiv
    if (isHallEffect) recomputeEditBuffer();
}
// =========================== RESETHALLSETTINGS END =======================

// =========================== RESETEMISETTINGS START =====================
function resetEmiSettings() {
    // Standardwert für Störgeräusche setzen
    emiNoiseLevel = 0.5;
    storage.setItem('hla_emiNoiseLevel', emiNoiseLevel);
    // Startposition zurück auf sofort
    emiRampPosition = 0;
    storage.setItem('hla_emiRamp', emiRampPosition);
    // Verlauf zurück auf konstant
    emiRampMode = 'constant';
    storage.setItem('hla_emiMode', emiRampMode);

    const eLevel = document.getElementById('emiLevel');
    const eDisp  = document.getElementById('emiLevelDisplay');
    if (eLevel && eDisp) {
        eLevel.value = emiNoiseLevel;
        eDisp.textContent = Math.round(emiNoiseLevel * 100) + '%';
    }
    const eRamp = document.getElementById('emiRamp');
    const eRampDisp = document.getElementById('emiRampDisplay');
    if (eRamp && eRampDisp) {
        eRamp.value = emiRampPosition;
        eRampDisp.textContent = Math.round(emiRampPosition * 100) + '%';
    }
    const eMode = document.getElementById('emiMode');
    if (eMode) eMode.value = emiRampMode;

    // Aussetzer-Werte zurücksetzen
    emiDropoutProb = 0.0005;
    storage.setItem('hla_emiDropoutProb', emiDropoutProb);
    emiDropoutDur = 0.02;
    storage.setItem('hla_emiDropoutDur', emiDropoutDur);

    // Knackser- und Ausreißer-Werte zurücksetzen
    emiCrackleProb = 0.005;
    storage.setItem('hla_emiCrackleProb', emiCrackleProb);
    emiCrackleAmp = 0.3;
    storage.setItem('hla_emiCrackleAmp', emiCrackleAmp);
    emiSpikeProb = 0.001;
    storage.setItem('hla_emiSpikeProb', emiSpikeProb);
    emiSpikeAmp = 1.0;
    storage.setItem('hla_emiSpikeAmp', emiSpikeAmp);
    emiVoiceDamp = false;
    storage.setItem('hla_emiVoiceDamp', '0');

    const eDropProb = document.getElementById('emiDropoutProb');
    const eDropProbDisp = document.getElementById('emiDropoutProbDisplay');
    if (eDropProb && eDropProbDisp) {
        eDropProb.value = emiDropoutProb;
        eDropProbDisp.textContent = (emiDropoutProb * 100).toFixed(2) + '%';
    }
    const eDropDur = document.getElementById('emiDropoutDur');
    const eDropDurDisp = document.getElementById('emiDropoutDurDisplay');
    if (eDropDur && eDropDurDisp) {
        eDropDur.value = emiDropoutDur;
        eDropDurDisp.textContent = Math.round(emiDropoutDur * 1000) + ' ms';
    }

    const eCrackProb = document.getElementById('emiCrackleProb');
    const eCrackProbDisp = document.getElementById('emiCrackleProbDisplay');
    if (eCrackProb && eCrackProbDisp) {
        eCrackProb.value = emiCrackleProb;
        eCrackProbDisp.textContent = (emiCrackleProb * 100).toFixed(2) + '%';
    }
    const eCrackAmp = document.getElementById('emiCrackleAmp');
    const eCrackAmpDisp = document.getElementById('emiCrackleAmpDisplay');
    if (eCrackAmp && eCrackAmpDisp) {
        eCrackAmp.value = emiCrackleAmp;
        eCrackAmpDisp.textContent = Math.round(emiCrackleAmp * 100) + '%';
    }
    const eSpikeProb = document.getElementById('emiSpikeProb');
    const eSpikeProbDisp = document.getElementById('emiSpikeProbDisplay');
    if (eSpikeProb && eSpikeProbDisp) {
        eSpikeProb.value = emiSpikeProb;
        eSpikeProbDisp.textContent = (emiSpikeProb * 100).toFixed(2) + '%';
    }
    const eSpikeAmp = document.getElementById('emiSpikeAmp');
    const eSpikeAmpDisp = document.getElementById('emiSpikeAmpDisplay');
    if (eSpikeAmp && eSpikeAmpDisp) {
        eSpikeAmp.value = emiSpikeAmp;
        eSpikeAmpDisp.textContent = Math.round(emiSpikeAmp * 100) + '%';
    }
    const eVoice = document.getElementById('emiVoiceDampToggle');
    if (eVoice) eVoice.checked = emiVoiceDamp;

    // Effekt neu berechnen, falls aktiv
    if (isEmiEffect) recomputeEditBuffer();
    updateEffectButtons();
}
// =========================== RESETEMISETTINGS END =======================

// =========================== UPDATEDEEDITWAVEFORMS START ==================
function updateDeEditWaveforms(progressOrig = null, progressDe = null) {
    // Cursor aktualisieren, falls neue Positionen mitgegeben werden
    if (progressOrig !== null) {
        editOrigCursor = progressOrig;
    }
    if (progressDe !== null) {
        editDeCursor = editStartTrim + progressDe;
    }

    const showOrig = progressOrig !== null ? progressOrig : editOrigCursor;
    const showDe   = progressDe !== null ? progressDe + editStartTrim : editDeCursor;

    if (editEnBuffer) {
        const opts = { progress: showOrig };
        if (enSelectStart !== enSelectEnd) {
            const start = Math.min(enSelectStart, enSelectEnd);
            const end = Math.max(enSelectStart, enSelectEnd);
            opts.selection = { start, end };
        }
        drawWaveform(document.getElementById('waveOriginal'), editEnBuffer, opts);
    }
    if (originalEditBuffer) {
        const selStart = editStartTrim;
        const selEnd   = editDurationMs - editEndTrim;
        const opts = { progress: showDe, ignore: editIgnoreRanges, silence: editSilenceRanges };
        if (deSelectionActive && selStart < selEnd) {
            opts.selection = { start: selStart, end: selEnd };
        }
        drawWaveform(document.getElementById('waveEdited'), originalEditBuffer, opts);
    }
    const enLabel = document.getElementById('waveLabelOriginal');
    if (enLabel) {
        if (editEnBuffer) {
            const seconds = editEnBuffer.length / editEnBuffer.sampleRate;
            enLabel.textContent = `EN (Original) - ${seconds.toFixed(2)}s`;
        } else {
            enLabel.textContent = 'EN (Original)';
        }
    }
    const deLabel = document.getElementById('waveLabelEdited');
    if (deLabel) {
        if (originalEditBuffer) {
            const seconds = originalEditBuffer.length / originalEditBuffer.sampleRate;
            deLabel.textContent = `DE (bearbeiten) - ${seconds.toFixed(2)}s`;
        } else {
            deLabel.textContent = 'DE (bearbeiten)';
        }
    }
    const sInput = document.getElementById('editStart');
    const eInput = document.getElementById('editEnd');
    setTrimInputValueSafe(sInput, deSelectionActive ? editStartTrim : 0);
    setTrimInputValueSafe(eInput, deSelectionActive ? (editDurationMs - editEndTrim) : 0);
    updateWaveRulers();
    updateLengthInfo();
    updateMasterTimeline();
}
// Aktualisiert die Liste der Ignorier-Bereiche
function refreshIgnoreList() {
    const container = document.getElementById('ignoreList');
    if (!container) return;
    container.innerHTML = '';
    editIgnoreRanges.forEach((r, idx) => {
        const row = document.createElement('div');
        row.className = 'ignore-row';
        row.innerHTML =
            `<input type="number" value="${Math.round(r.start)}" step="100" class="ignore-start">` +
            `<input type="number" value="${Math.round(r.end)}" step="100" class="ignore-end">` +
            `<button class="btn btn-secondary">🗑️</button>`;
        row.querySelector('.ignore-start').oninput = e => {
            r.start = parseInt(e.target.value) || 0;
            updateDeEditWaveforms();
        };
        row.querySelector('.ignore-end').oninput = e => {
            r.end = parseInt(e.target.value) || 0;
            updateDeEditWaveforms();
        };
        row.querySelector('button').onclick = () => {
            editIgnoreRanges.splice(idx, 1);
            refreshIgnoreList();
            updateDeEditWaveforms();
        };
        container.appendChild(row);
    });
}

// Aktualisiert die Liste der Stille-Bereiche
function refreshSilenceList() {
    const container = document.getElementById('silenceList');
    if (!container) return;
    container.innerHTML = '';
    editSilenceRanges.forEach((r, idx) => {
        const row = document.createElement('div');
        row.className = 'ignore-row';
        row.innerHTML =
            `<input type="number" value="${Math.round(r.start)}" step="100" class="ignore-start">` +
            `<input type="number" value="${Math.round(r.end)}" step="100" class="ignore-end">` +
            `<button class="btn btn-secondary">🗑️</button>`;
        row.querySelector('.ignore-start').oninput = e => {
            r.start = parseInt(e.target.value) || 0;
            updateDeEditWaveforms();
        };
        row.querySelector('.ignore-end').oninput = e => {
            r.end = parseInt(e.target.value) || 0;
            updateDeEditWaveforms();
        };
        row.querySelector('button').onclick = () => {
            editSilenceRanges.splice(idx, 1);
            refreshSilenceList();
            updateDeEditWaveforms();
        };
        container.appendChild(row);
    });
}

// Verschiebt alle Ignorier-Bereiche symmetrisch
function adjustIgnoreRanges(deltaMs) {
    for (const r of editIgnoreRanges) {
        r.start = Math.max(0, r.start - deltaMs);
        r.end   = Math.min(editDurationMs, r.end + deltaMs);
        if (r.start >= r.end) {
            const m = (r.start + r.end) / 2;
            r.start = Math.max(0, m - 1);
            r.end   = Math.min(editDurationMs, m + 1);
        }
    }
    refreshIgnoreList();
    updateDeEditWaveforms();
}

// Verschiebt alle Stille-Bereiche symmetrisch
function adjustSilenceRanges(deltaMs) {
    for (const r of editSilenceRanges) {
        r.start = Math.max(0, r.start - deltaMs);
        r.end   = Math.min(editDurationMs, r.end + deltaMs);
        if (r.start >= r.end) {
            const m = (r.start + r.end) / 2;
            r.start = Math.max(0, m - 1);
            r.end   = Math.min(editDurationMs, m + 1);
        }
    }
    refreshSilenceList();
    updateDeEditWaveforms();
}

// Berechnet die finale Länge nach Schnitt, Ignorier- und Stillebereichen
function calcFinalLength() {
    let basisLaengeMs;
    if (savedOriginalBuffer && savedOriginalBuffer.sampleRate) {
        basisLaengeMs = savedOriginalBuffer.length / savedOriginalBuffer.sampleRate * 1000;
    } else {
        basisLaengeMs = editDurationMs + editStartTrim + editEndTrim;
    }
    let len = basisLaengeMs - editStartTrim - editEndTrim;
    for (const r of editIgnoreRanges) {
        len -= Math.max(0, r.end - r.start);
    }
    for (const r of editSilenceRanges) {
        len += Math.max(0, r.end - r.start);
    }
    return len;
}

// Erkennt automatisch Pausen und aktualisiert die Vorschau
async function autoAdjustLength() {
    const chk = document.getElementById('autoIgnoreChk');
    const thr = document.getElementById('autoIgnoreMs');
    if (chk && chk.checked) {
        autoIgnoreMs = parseInt(thr.value) || 400;
        editIgnoreRanges = detectPausesInBuffer(savedOriginalBuffer, autoIgnoreMs);
        refreshIgnoreList();
    }
    await recomputeEditBuffer();
    updateDeEditWaveforms();
    if (typeof showToast === 'function') {
        showToast('Bereich angewendet', 'success');
    }
}

// =========================== APPLYVOLUMEMATCH START =======================
// Führt den Lautstärkeabgleich einmalig aus und merkt den Status
async function applyVolumeMatch() {
    if (!volumeMatchedBuffer && savedOriginalBuffer && editEnBuffer) {
        volumeMatchedBuffer = matchVolume(savedOriginalBuffer, editEnBuffer);
    }
    if (volumeMatchedBuffer) {
        if (!isVolumeMatched && window.electronAPI && window.electronAPI.saveDeHistoryBuffer) {
            const relPath = getFullPath(currentEditFile);
            const blob = bufferToWav(savedOriginalBuffer);
            const buf = await blob.arrayBuffer();
            await window.electronAPI.saveDeHistoryBuffer(relPath, new Uint8Array(buf));
            await updateHistoryCache(relPath);
        }
        isVolumeMatched = true;
        await recomputeEditBuffer();
        updateEffectButtons();
    }
}

// =========================== RECOMPUTEEDITBUFFER START =====================
// Wendet aktuelle Effekte auf das Original an und aktualisiert die Vorschau
async function recomputeEditBuffer() {
    if (!savedOriginalBuffer) return;
    let buf = savedOriginalBuffer;
    if (isVolumeMatched) {
        if (!volumeMatchedBuffer) {
            volumeMatchedBuffer = matchVolume(savedOriginalBuffer, editEnBuffer);
        }
        buf = volumeMatchedBuffer;
    }
    if (isRadioEffect) {
        buf = await applyRadioFilter(buf);
    }
    if (isHallEffect) {
        buf = await applyReverbEffect(buf);
    }
    if (isNeighborEffect) {
        buf = await applyNeighborRoomEffect(buf, { hall: neighborHall });
    } else if (neighborHall) {
        buf = await applyReverbEffect(buf, { room: 0.2, wet: 0.3, delay: 40 });
    }
    if (isTableMicEffect) {
        buf = await applyTableMicFilter(buf, tableMicRoomPresets[tableMicRoomType]);
    }
    if (isEmiEffect) {
        buf = await applyInterferenceEffect(buf);
    }

    let trimmed = trimAndPadBuffer(buf, editStartTrim, editEndTrim);
    const adj = editIgnoreRanges.map(r => ({ start: r.start - editStartTrim, end: r.end - editStartTrim }));
    trimmed = removeRangesFromBuffer(trimmed, adj);
    const pads = editSilenceRanges.map(r => ({ start: r.start - editStartTrim, end: r.end - editStartTrim }));
    trimmed = insertSilenceIntoBuffer(trimmed, pads);

    originalEditBuffer = trimmed;
    editDurationMs = originalEditBuffer.length / originalEditBuffer.sampleRate * 1000;
    normalizeDeTrim();
    updateDeEditWaveforms();
}
// =========================== RECOMPUTEEDITBUFFER END =======================

// Aktualisiert Anzeige und Farbe je nach Abweichung zur EN-Laenge
function updateLengthInfo() {
    if (!editEnBuffer) return;
    const enMs = editEnBuffer.length / editEnBuffer.sampleRate * 1000;
    const deMs = calcFinalLength();
    const diff = deMs - enMs;
    const perc = enMs > 0 ? Math.abs(diff) / enMs * 100 : 0;
    const deInfo = document.getElementById('lengthInfoDe');
    const enInfo = document.getElementById('lengthInfoEn');
    const diffInfo = document.getElementById('lengthInfoDiff');
    const lbl = document.getElementById('waveLabelEdited');
    if (deInfo) deInfo.textContent = `${(deMs/1000).toFixed(2)}s`;
    if (enInfo) enInfo.textContent = `${(enMs/1000).toFixed(2)}s`;
    if (diffInfo) {
        diffInfo.textContent = `${diff > 0 ? '+' : ''}${Math.round(diff)} ms`;
        diffInfo.style.color = perc > 10 ? 'red' : (perc > 5 ? '#ff8800' : '');
    }
    if (lbl) {
        lbl.title = (diff > 0 ? '+' : '') + Math.round(diff) + 'ms';
        lbl.style.color = perc > 10 ? 'red' : (perc > 5 ? '#ff8800' : '');
    }
}
// Prüft EN-Auswahl und schaltet den Kopier-Button
function validateEnSelection() {
    const sField = document.getElementById('enSegStart');
    const eField = document.getElementById('enSegEnd');
    const btn    = document.getElementById('copyEnBtn');
    const dur    = editEnBuffer ? editEnBuffer.length / editEnBuffer.sampleRate * 1000 : 0;
    const start  = parseInt(sField?.value);
    const end    = parseInt(eField?.value);
    const valid  = !isNaN(start) && !isNaN(end) && start < end && start >= 0 && end <= dur;
    if (btn) btn.disabled = !valid;
    if (sField) sField.classList.toggle('input-invalid', !valid);
      if (eField) eField.classList.toggle('input-invalid', !valid);
      return valid;
}
// Prüft DE-Auswahl und schaltet den Anwenden-Button
function validateDeSelection() {
    const sField = document.getElementById('editStart');
    const eField = document.getElementById('editEnd');
    const btn    = document.getElementById('autoAdjustBtn');
    const start  = parseInt(sField?.value);
    const end    = parseInt(eField?.value);
    const dur    = editDurationMs;
    const valid  = !isNaN(start) && !isNaN(end) && start < end && start >= 0 && end <= dur;
    if (btn) btn.disabled = !valid;
    if (sField) sField.classList.toggle('input-invalid', !valid);
      if (eField) eField.classList.toggle('input-invalid', !valid);
      deSelectionActive = valid;
      return valid;
}
// =========================== UPDATEDEEDITWAVEFORMS END ====================

// =========================== STOPEDITPLAYBACK START =======================
function stopEditPlayback() {
    logDeDebug('stopEditPlayback', 'Wiedergabe gestoppt');
    const audio = document.getElementById('audioPlayer');
    audio.pause();
    audio.currentTime = 0;
    if (editProgressTimer) clearInterval(editProgressTimer);
    editProgressTimer = null;
    editPlaying = null;
    editPaused = false;
    editOrigCursor = 0;
    editDeCursor = 0;
    if (editBlobUrl) { URL.revokeObjectURL(editBlobUrl); editBlobUrl = null; }
    document.getElementById('playOrigPreview').classList.remove('playing');
    document.getElementById('playOrigPreview').textContent = '▶';
    document.getElementById('playDePreview').classList.remove('playing');
    document.getElementById('playDePreview').textContent = '▶';
    updateDeEditWaveforms();
}
// =========================== STOPEDITPLAYBACK END =========================

// =========================== PLAYORIGINALPREVIEW START ====================
function playOriginalPreview() {
    if (!editEnBuffer) return;
    const status = editPlaying === 'orig' ? (editPaused ? 'Fortsetzung' : 'Pause') : 'Start';
    logDeDebug('playOriginalPreview', `${status} angefordert`);
    const btn = document.getElementById('playOrigPreview');
    const audio = document.getElementById('audioPlayer');
    if (editPlaying === 'orig') {
        if (editPaused) {
            audio.play().then(() => {
                btn.classList.add('playing');
                btn.textContent = '⏸';
                editPaused = false;
                editProgressTimer = setInterval(() => {
                    updateDeEditWaveforms(audio.currentTime * 1000, null);
                }, 50);
            });
        } else {
            audio.pause();
            if (editProgressTimer) clearInterval(editProgressTimer);
            editProgressTimer = null;
            editPaused = true;
            // Aktuelle Position merken
            editOrigCursor = audio.currentTime * 1000;
            btn.classList.remove('playing');
            btn.textContent = '▶';
            updateDeEditWaveforms();
        }
        return;
    }
    stopEditPlayback();
    const blob = bufferToWav(editEnBuffer);
    editBlobUrl = URL.createObjectURL(blob);
    audio.src = editBlobUrl;
    audio.currentTime = editOrigCursor / 1000;
    audio.load();
    audio.play().then(() => {
        btn.classList.add('playing');
        btn.textContent = '⏸';
        editPlaying = 'orig';
        editPaused = false;
        editProgressTimer = setInterval(() => {
            updateDeEditWaveforms(audio.currentTime * 1000, null);
        }, 50);
        audio.onended = () => { URL.revokeObjectURL(editBlobUrl); editBlobUrl = null; stopEditPlayback(); };
    }).catch(err => {
        // Wiedergabe schlug fehl – Nutzer informieren
        console.error('Fehler bei Original-Vorschau', err);
        logDeDebug('playOriginalPreview', 'Fehler bei der Wiedergabe', err?.message || String(err));
        if (typeof updateStatus === 'function') {
            updateStatus('Fehler beim Abspielen der Originaldatei');
        }
    });
}
// =========================== PLAYORIGINALPREVIEW END ======================

// =========================== PLAYDEPREVIEW START ==========================
function playDePreview() {
    if (!originalEditBuffer) return;
    const status = editPlaying === 'de' ? (editPaused ? 'Fortsetzung' : 'Pause') : 'Start';
    logDeDebug('playDePreview', `${status} angefordert`);
    const btn = document.getElementById('playDePreview');
    const audio = document.getElementById('audioPlayer');
    if (editPlaying === 'de') {
        const trimmed = trimAndPadBuffer(originalEditBuffer, editStartTrim, editEndTrim);
        const dur = trimmed.length / trimmed.sampleRate * 1000;
        const adj = editIgnoreRanges.map(r => ({ start: r.start - editStartTrim, end: r.end - editStartTrim }));
        if (editPaused) {
            audio.play().then(() => {
                btn.classList.add('playing');
                btn.textContent = '⏸';
                editPaused = false;
                editProgressTimer = setInterval(() => {
                    const pos = playbackToOriginal(audio.currentTime * 1000, adj, dur);
                    updateDeEditWaveforms(null, pos);
                }, 50);
            });
        } else {
            audio.pause();
            if (editProgressTimer) clearInterval(editProgressTimer);
            editProgressTimer = null;
            editPaused = true;
            const pos = playbackToOriginal(audio.currentTime * 1000, adj, dur);
            editDeCursor = editStartTrim + pos;
            btn.classList.remove('playing');
            btn.textContent = '▶';
            updateDeEditWaveforms();
        }
        return;
    }
    stopEditPlayback();
    const trimmed = trimAndPadBuffer(originalEditBuffer, editStartTrim, editEndTrim);
    const dur = trimmed.length / trimmed.sampleRate * 1000;
    const adj = editIgnoreRanges.map(r => ({ start: r.start - editStartTrim, end: r.end - editStartTrim }));
    const finalBuf = removeRangesFromBuffer(trimmed, adj);
    const blob = bufferToWav(finalBuf);
    editBlobUrl = URL.createObjectURL(blob);
    audio.src = editBlobUrl;
    const start = originalToPlayback(Math.max(editDeCursor - editStartTrim, 0), adj, dur) / 1000;
    audio.currentTime = start;
    audio.load();
    audio.play().then(() => {
        btn.classList.add('playing');
        btn.textContent = '⏸';
        editPlaying = 'de';
        editPaused = false;
        editProgressTimer = setInterval(() => {
            const pos = playbackToOriginal(audio.currentTime * 1000, adj, dur);
            updateDeEditWaveforms(null, pos);
        }, 50);
        audio.onended = () => { URL.revokeObjectURL(editBlobUrl); editBlobUrl = null; stopEditPlayback(); };
    }).catch(err => {
        // Wiedergabe schlug fehl – Nutzer informieren
        console.error('Fehler bei DE-Vorschau', err);
        logDeDebug('playDePreview', 'Fehler bei der Wiedergabe', err?.message || String(err));
        if (typeof updateStatus === 'function') {
            updateStatus('Fehler beim Abspielen der DE-Datei');
        }
    });
}
// =========================== PLAYDEPREVIEW END ============================

// =========================== CLOSEDEEDIT START =============================
function closeDeEdit() {
    document.getElementById('deEditDialog').classList.add('hidden');
    toggleDeDebugPanel(false, { silent: true });
    stopEditPlayback();
    currentEditFile = null;
    originalEditBuffer = null;
    savedOriginalBuffer = null;
    volumeMatchedBuffer = null;
    isVolumeMatched = false;
    radioEffectBuffer = null;
    isRadioEffect = false;
    hallEffectBuffer = null;
    isHallEffect = false;
    emiEffectBuffer = null;
    isEmiEffect = false;
    neighborEffectBuffer = null;
    isNeighborEffect = false;
    tableMicEffectBuffer = null;
    isTableMicEffect = false;
    editEnBuffer = null;
    rawEnBuffer = null;
    editIgnoreRanges = [];
    ignoreTempStart = null;
    ignoreDragging = null;
    // Auswahl und Einfügeposition für EN-Abschnitte zurücksetzen
    enSelectStart = 0;
    enSelectEnd = 0;
    enSelecting = false;
    editDeCursor = 0;
    const sField = document.getElementById('enSegStart');
    const eField = document.getElementById('enSegEnd');
    const pField = document.getElementById('enInsertPos');
    if (sField) sField.value = '';
    if (eField) eField.value = '';
    if (pField) pField.value = 'cursor';
    window.onmousemove = null;
    window.onmouseup = null;
    if (deEditEscHandler) {
        window.removeEventListener('keydown', deEditEscHandler);
        deEditEscHandler = null;
    }
    const origScroll = document.getElementById('waveOriginalScroll');
    const deScroll = document.getElementById('waveEditedScroll');
    if (origScroll) origScroll.onscroll = null;
    if (deScroll) deScroll.onscroll = null;
    resetCanvasZoom(document.getElementById('waveOriginal'));
    resetCanvasZoom(document.getElementById('waveEdited'));
    deSelectionActive = false;
    updateEffectButtons();
}
// =========================== CLOSEDEEDIT END ===============================

// =========================== RESETDEEDIT START =============================
// Stellt die letzte gespeicherte Version der DE-Datei aus dem Backup wieder her
async function resetDeEdit() {
    if (!currentEditFile) return;
    logDeDebug('resetDeEdit', 'Starte Wiederherstellung');
    // Liste nicht gespeicherter Schritte für Bestätigungsdialog sammeln
    const steps = [];
    if (currentEditFile.trimStartMs || currentEditFile.trimEndMs) steps.push('Trimmen');
    if (currentEditFile.ignoreRanges && currentEditFile.ignoreRanges.length) steps.push('Ignorierbereiche');
    if (currentEditFile.silenceRanges && currentEditFile.silenceRanges.length) steps.push('Stille-Bereiche');
    if (currentEditFile.volumeMatched) steps.push('Lautstärke angleichen');
    if (currentEditFile.radioEffect) steps.push('Funkgerät-Effekt');
    if (currentEditFile.hallEffect || currentEditFile.neighborHall) steps.push('Hall-Effekt');
    if (currentEditFile.emiEffect) steps.push('EM-Störgeräusch');
    if (currentEditFile.neighborEffect) steps.push('Nebenraum-Effekt');
    if (currentEditFile.tableMicEffect) steps.push('Telefon-auf-Tisch-Effekt');
    const msg = steps.length ? `Folgende Schritte gehen verloren:\n• ${steps.join('\n• ')}` : 'Keine ungespeicherten Schritte.';
    if (!confirm(`DE-Audio zurücksetzen?\n${msg}`)) return;
    const relPath = getFullPath(currentEditFile);
    try {
        if (window.electronAPI && window.electronAPI.restoreDeFile) {
            await window.electronAPI.restoreDeFile(relPath);
            await window.electronAPI.deleteDeBackupFile(relPath);
            setDeAudioCacheEntry(relPath, `sounds/DE/${relPath}`);
            originalEditBuffer = await loadAudioBuffer(deAudioCache[relPath]);
        } else if (deOrdnerHandle) {
            const teile = relPath.split('/');
            const name = teile.pop();
            let ordner = deOrdnerHandle;
            for (const t of teile) {
                ordner = await ordner.getDirectoryHandle(t, { create: true });
            }
            const backupRoot = await deOrdnerHandle.getDirectoryHandle('..', {});
            const backupDir = await backupRoot.getDirectoryHandle('DE-Backup', {});
            let quell = backupDir;
            for (const t of teile) {
                quell = await quell.getDirectoryHandle(t);
            }
            const backupFile = await quell.getFileHandle(name);
            const fileData = await backupFile.getFile();
            const dest = await ordner.getFileHandle(name, { create: true });
            const w = await dest.createWritable();
            await w.write(fileData);
            await w.close();
            await quell.removeEntry(name);
            setDeAudioCacheEntry(relPath, fileData);
            originalEditBuffer = await loadAudioBuffer(fileData);
        }
        editStartTrim = 0;
        editEndTrim = 0;
        currentEditFile.trimStartMs = 0;
        currentEditFile.trimEndMs = 0;
        editIgnoreRanges = [];
        manualIgnoreRanges = [];
        currentEditFile.ignoreRanges = [];
        editSilenceRanges = [];
        manualSilenceRanges = [];
        currentEditFile.silenceRanges = [];
        currentEditFile.volumeMatched = false;
        currentEditFile.radioEffect = false;
        currentEditFile.hallEffect = false;
        currentEditFile.emiEffect = false;
        currentEditFile.neighborEffect = false;
        currentEditFile.neighborHall = false;
        currentEditFile.tableMicEffect = false;
        volumeMatchedBuffer = null;
        isVolumeMatched = false;
        radioEffectBuffer = null;
        isRadioEffect = false;
        hallEffectBuffer = null;
        isHallEffect = false;
        emiEffectBuffer = null;
        isEmiEffect = false;
        neighborEffectBuffer = null;
        isNeighborEffect = false;
        neighborHall = false;
        tableMicEffectBuffer = null;
        isTableMicEffect = false;
        tableMicRoomType = 'wohnzimmer';
        currentEditFile.tableMicRoom = 'wohnzimmer';
        const tRoom = document.getElementById('tableMicRoom');
        if (tRoom) tRoom.value = tableMicRoomType;
        updateEffectButtons();
        // Projekt als geändert markieren, damit Rücksetzungen gespeichert werden
        markDirty();
        editDurationMs = originalEditBuffer.length / originalEditBuffer.sampleRate * 1000;
        normalizeDeTrim();
        updateDeEditWaveforms();
        refreshIgnoreList();
        updateStatus('DE-Audio zurückgesetzt');
        // Tabelle neu zeichnen, damit der Play-Button die aktuelle Datei nutzt
        renderFileTable();
        // Bearbeitungsfenster schließen
        closeDeEdit();
    } catch (err) {
        console.error('Fehler beim Zurücksetzen', err);
        updateStatus('Fehler beim Zurücksetzen');
    }
}
// =========================== RESETDEEDIT END ===============================

// =========================== APPLYDEEDIT START =============================
// Speichert die bearbeitete DE-Datei und legt ein Backup an
// Baut nach einem Speichern beide Wellenformen komplett neu auf, damit sie einem frisch geöffneten Dialog entsprechen
async function rebuildEnBufferAfterSave() {
    if (!currentEditFile) {
        return null;
    }

    // Hilfsfunktion, um einen Cache-Buster für String-Quellen zu ergänzen
    const withCacheBuster = src => src.includes('?') ? `${src}&v=${Date.now()}` : `${src}?v=${Date.now()}`;

    const relPath = getFullPath(currentEditFile);
    const cleanPath = relPath.replace(/^([\\/]*sounds[\\/])?de[\\/]/i, '');
    const enSrc = `sounds/EN/${cleanPath}`;

    let deSource = deAudioCache[cleanPath] || deAudioCache[relPath] || `sounds/DE/${cleanPath}`;
    let deBuffer;
    try {
        const src = typeof deSource === 'string' ? withCacheBuster(deSource) : deSource;
        deBuffer = await loadAudioBuffer(src);
    } catch (err) {
        console.warn('Aktualisiertes DE-Audio konnte nicht geladen werden, verwende Backup', err);
        const fallback = withCacheBuster(`sounds/DE-Backup/${cleanPath}`);
        deBuffer = await loadAudioBuffer(fallback);
    }

    const enBuffer = await loadAudioBuffer(withCacheBuster(enSrc));

    // Beide Puffer komplett neu setzen, damit sich die Ansicht wie nach einem erneuten Öffnen verhält
    savedOriginalBuffer = deBuffer;
    originalEditBuffer = deBuffer;
    editEnBuffer = enBuffer;
    rawEnBuffer = enBuffer;

    editOrigCursor = 0;
    editDeCursor = 0;
    editPaused = false;
    editPlaying = null;

    editStartTrim = 0;
    editEndTrim = 0;
    deSelectionActive = true;
    enSelectStart = 0;
    enSelectEnd = 0;

    currentDeSeconds = deBuffer.length / deBuffer.sampleRate;
    currentEnSeconds = enBuffer.length / enBuffer.sampleRate;
    editDurationMs = deBuffer.length / deBuffer.sampleRate * 1000;
    normalizeDeTrim();
    maxWaveSeconds = Math.max(currentDeSeconds, currentEnSeconds, 0.001);
    logDeDebug('resetDeEdit', 'Wiederherstellung abgeschlossen', 'Datei neu geladen');

    const startField = document.getElementById('enSegStart');
    const endField = document.getElementById('enSegEnd');
    if (startField) startField.value = '';
    if (endField) endField.value = '';

    const origCanvas = document.getElementById('waveOriginal');
    const deCanvas = document.getElementById('waveEdited');
    if (origCanvas) resetCanvasZoom(origCanvas);
    if (deCanvas) resetCanvasZoom(deCanvas);

    updateWaveCanvasDimensions();
    updateDeEditWaveforms(0, 0);
    updateMasterTimeline();

    return { deBuffer, enBuffer };
}

async function applyDeEdit(param = {}) {
    if (!currentEditFile || !originalEditBuffer) return;
    const closeAfterSave = typeof param === 'boolean' ? param : !!param.closeAfterSave;
    logDeDebug('applyDeEdit', closeAfterSave ? 'Speichern & schließen gestartet' : 'Speichern gestartet', `Trim: Start ${Math.round(editStartTrim)} ms • Ende ${Math.round(editEndTrim)} ms`);
    // Restlänge berechnen und ungültigen Schnitt verhindern
    const restlaenge = editDurationMs - editStartTrim - editEndTrim;
    if (restlaenge <= 0) {
        showToast('Ungültiger Schnittbereich – Datei wurde nicht gespeichert', 'error');
        return;
    }
    const relPath = getFullPath(currentEditFile); // Aktuellen Pfad ermitteln
    // Pfad bereinigen, falls "sounds/DE/" bereits enthalten ist
    const cleanPath = relPath.replace(/^([\\/]*sounds[\\/])?de[\\/]/i, '');
    let finalBuffer = null;
    try {
        const startTrimSnapshot = editStartTrim;
        const endTrimSnapshot = editEndTrim;
        const ignoreSnapshot = editIgnoreRanges.map(r => ({ start: r.start, end: r.end }));
        const silenceSnapshot = editSilenceRanges.map(r => ({ start: r.start, end: r.end }));
        // Aktuellen Status des Lautstärkeabgleichs nutzen
        if (window.electronAPI && window.electronAPI.backupDeFile) {
            // Sicherstellen, dass ein Backup existiert
            await window.electronAPI.backupDeFile(relPath);
            // Bereits geladene Originaldatei weiterverwenden
            originalEditBuffer = savedOriginalBuffer;
            volumeMatchedBuffer = null;
            let baseBuffer = isVolumeMatched ? matchVolume(savedOriginalBuffer, editEnBuffer) : savedOriginalBuffer;
            if (isRadioEffect) {
                baseBuffer = await applyRadioFilter(baseBuffer);
            }
            if (isHallEffect) {
                baseBuffer = await applyReverbEffect(baseBuffer);
            } else if (neighborHall) {
                baseBuffer = await applyReverbEffect(baseBuffer, { room: 0.2, wet: 0.3, delay: 40 });
            }
            // Nebenraum-Effekt anwenden, falls aktiv
            if (isNeighborEffect) {
                baseBuffer = await applyNeighborRoomEffect(baseBuffer, { hall: neighborHall });
            }
            if (isTableMicEffect) {
                baseBuffer = await applyTableMicFilter(baseBuffer, tableMicRoomPresets[tableMicRoomType]);
            }
            if (isEmiEffect) {
                baseBuffer = await applyInterferenceEffect(baseBuffer);
            }
            let newBuffer = trimAndPadBuffer(baseBuffer, editStartTrim, editEndTrim);
            const adj = editIgnoreRanges.map(r => ({ start: r.start - editStartTrim, end: r.end - editStartTrim }));
            newBuffer = removeRangesFromBuffer(newBuffer, adj);
            const pads = editSilenceRanges.map(r => ({ start: r.start - editStartTrim, end: r.end - editStartTrim }));
            newBuffer = insertSilenceIntoBuffer(newBuffer, pads);
            // Automatisch entfernte Pausen nicht speichern und Anzeige aktualisieren
            editIgnoreRanges = [];
            currentEditFile.ignoreRanges = [];
            refreshIgnoreList();
            updateDeEditWaveforms();
            drawWaveform(document.getElementById('waveEdited'), newBuffer, { start: 0, end: newBuffer.length / newBuffer.sampleRate * 1000 });
            const blob = bufferToWav(newBuffer);
            const buf = await blob.arrayBuffer();
            const url = URL.createObjectURL(blob);
            const choice = await handleDuplicateBeforeSave(relPath, buf, url);
            if (choice === 'old') {
                URL.revokeObjectURL(url);
                return;
            }
            const dups = await window.electronAPI.getDeDuplicates(relPath);
            for (const d of dups) {
                if (d.relPath !== relPath) {
                    await window.electronAPI.deleteDeFile(d.relPath);
                    deleteDeAudioCacheEntry(d.relPath);
                }
            }
            // Pfadbereinigung, da manche Pfade bereits "sounds/DE/" enthalten
            try {
                await window.electronAPI.saveDeFile(cleanPath, new Uint8Array(buf));
            } catch (err) {
                // Speichern fehlgeschlagen -> Toast anzeigen
                if (typeof showToast === 'function') {
                    showToast('Fehler beim Speichern der DE-Datei', 'error');
                }
                throw err;
            }
            // Bereinigter Pfad vermeidet doppelte Schlüssel im Cache
            setDeAudioCacheEntry(cleanPath, `sounds/DE/${relPath}`);
            await updateHistoryCache(cleanPath);
            URL.revokeObjectURL(url);
            finalBuffer = newBuffer;
        } else {
            // Backup in Browser-Version
            if (deOrdnerHandle) {
                try {
                    const teile = relPath.split('/');
                    const name = teile.pop();
                    let ordner = deOrdnerHandle;
                    for (const t of teile) {
                        ordner = await ordner.getDirectoryHandle(t, { create: true });
                    }
                    const backupRoot = await deOrdnerHandle.getDirectoryHandle('..', {});
                    const backupDir = await backupRoot.getDirectoryHandle('DE-Backup', { create: true });
                    let ziel = backupDir;
                    for (const t of teile) {
                        ziel = await ziel.getDirectoryHandle(t, { create: true });
                    }
                    const orgFile = await ordner.getFileHandle(name);
                    let existiert = true;
                    try { await ziel.getFileHandle(name); } catch { existiert = false; }
                    if (!existiert) {
                        const backupFile = await ziel.getFileHandle(name, { create: true });
                        const orgData = await orgFile.getFile();
                        const w = await backupFile.createWritable();
                        await w.write(orgData);
                        await w.close();
                    }
                } catch {}
            }
            originalEditBuffer = savedOriginalBuffer;
            let baseBuffer = isVolumeMatched ? matchVolume(savedOriginalBuffer, editEnBuffer) : savedOriginalBuffer;
            if (isRadioEffect) {
                baseBuffer = await applyRadioFilter(baseBuffer);
            }
            if (isHallEffect) {
                baseBuffer = await applyReverbEffect(baseBuffer);
            }
            // Nebenraum-Effekt anwenden, falls aktiv
            if (isNeighborEffect) {
                baseBuffer = await applyNeighborRoomEffect(baseBuffer, { hall: neighborHall });
            }
            if (isTableMicEffect) {
                baseBuffer = await applyTableMicFilter(baseBuffer, tableMicRoomPresets[tableMicRoomType]);
            }
            if (isEmiEffect) {
                baseBuffer = await applyInterferenceEffect(baseBuffer);
            }
            let newBuffer = trimAndPadBuffer(baseBuffer, editStartTrim, editEndTrim);
            const adj = editIgnoreRanges.map(r => ({ start: r.start - editStartTrim, end: r.end - editStartTrim }));
            newBuffer = removeRangesFromBuffer(newBuffer, adj);
            const pads2 = editSilenceRanges.map(r => ({ start: r.start - editStartTrim, end: r.end - editStartTrim }));
            newBuffer = insertSilenceIntoBuffer(newBuffer, pads2);
            // Automatisch entfernte Pausen nicht speichern und Anzeige aktualisieren
            editIgnoreRanges = [];
            currentEditFile.ignoreRanges = [];
            refreshIgnoreList();
            updateDeEditWaveforms();
            drawWaveform(document.getElementById('waveEdited'), newBuffer, { start: 0, end: newBuffer.length / newBuffer.sampleRate * 1000 });
            const blob = bufferToWav(newBuffer);
            await speichereUebersetzungsDatei(blob, relPath);
            // Bereinigter Pfad vermeidet doppelte Schlüssel im Cache
            setDeAudioCacheEntry(cleanPath, blob);
            await updateHistoryCache(cleanPath);
            finalBuffer = newBuffer;
        }
        const rebuildResult = await rebuildEnBufferAfterSave();
        currentEditFile.trimStartMs = editStartTrim;
        currentEditFile.trimEndMs = editEndTrim;
        currentEditFile.ignoreRanges = editIgnoreRanges;
        currentEditFile.silenceRanges = editSilenceRanges;
        currentEditFile.volumeMatched = isVolumeMatched;
        currentEditFile.radioEffect = isRadioEffect;
        const sel = document.getElementById('radioPresetSelect');
        currentEditFile.radioPreset = sel ? sel.value : '';
        currentEditFile.hallEffect = isHallEffect;
        currentEditFile.emiEffect = isEmiEffect;
        const emiSel = document.getElementById('emiPresetSelect');
        currentEditFile.emiPreset = emiSel ? emiSel.value : '';
        currentEditFile.neighborEffect = isNeighborEffect;
        // Optionaler Hall im Nebenraum-Effekt speichern
        currentEditFile.neighborHall = neighborHall;
        currentEditFile.tableMicEffect = isTableMicEffect;
        currentEditFile.tableMicRoom = tableMicRoomType;
        // Nach dem Speichern die Markierung auf den vollständigen Clip setzen und Felder normalisieren
        editStartTrim = 0;
        editEndTrim = 0;
        deSelectionActive = true;
        normalizeDeTrim();
        currentEditFile.trimStartMs = editStartTrim;
        currentEditFile.trimEndMs = editEndTrim;
        // Änderungen sichern
        markDirty();
        renderFileTable();
        // Zeitstempel setzen und Erfolg melden
        const now = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        const info = document.getElementById('deEditSaveInfo');
        if (info) {
            // Anzeige mit DE- und EN-Länge ergänzen, damit beide Werte nach dem Speichern sichtbar bleiben
            const teile = [`Zuletzt gespeichert: ${now}`];
            const deSekunden = finalBuffer ? (finalBuffer.length / finalBuffer.sampleRate) : null;
            const enSekunden = editEnBuffer ? (editEnBuffer.length / editEnBuffer.sampleRate) : null;
            if (Number.isFinite(deSekunden)) teile.push(`DE: ${deSekunden.toFixed(2)}s`);
            if (Number.isFinite(enSekunden)) teile.push(`EN: ${enSekunden.toFixed(2)}s`);
            info.textContent = teile.join(' • ');
        }
        if (typeof showToast === 'function') {
            showToast('DE-Audio gespeichert', 'success');
        }
        if (rebuildResult && rebuildResult.deBuffer) {
            finalBuffer = rebuildResult.deBuffer;
        }
        if (!finalBuffer) {
            throw new Error('Interner Fehler: finalBuffer wurde nicht gesetzt.');
        }
        // Nach erfolgreichem Speichern Puffer und Anzeige auf den neuen Zustand setzen
        volumeMatchedBuffer = null;
        refreshSilenceList();
        validateDeSelection();
        updateEffectButtons();
        updateStatus('DE-Audio bearbeitet und gespeichert');
        currentDeSeconds = finalBuffer.length / finalBuffer.sampleRate;
        editDurationMs = finalBuffer.length / finalBuffer.sampleRate * 1000;
        logDeDebug('applyDeEdit', closeAfterSave ? 'Speichern & schließen beendet' : 'Speichern beendet', 'Neue DE-Länge übernommen');
        // Sofort speichern, damit die Bearbeitung gesichert ist
        saveCurrentProject();
        // Dialog nur schließen, wenn dies ausdrücklich gewünscht ist
        if (closeAfterSave) {
            closeDeEdit();
        }
    } catch (err) {
        // 🟦 Fehlermeldung ausgeben und näher erläutern
        console.error('Fehler beim Speichern', err, err.message);
        logDeDebug('applyDeEdit', 'Fehler beim Speichern', err?.message || String(err));
        let hinweis = '';
        if (err.code === 'EACCES' || err.name === 'NotAllowedError') {
            hinweis = 'Kein Schreibzugriff auf den Ordner. Bitte Berechtigungen prüfen.';
        } else if (err.code === 'ENOENT') {
            hinweis = 'Dateipfad nicht gefunden. Wurde der Ordner verschoben?';
        }
        updateStatus('Fehler beim Speichern: ' + err.message);
        if (typeof showToast === 'function') {
            const msg = hinweis ? `Fehler beim Speichern des DE-Audios: ${hinweis}`
                                : 'Fehler beim Speichern des DE-Audios';
            showToast(msg, 'error');
        }
    }
}
// =========================== APPLYDEEDIT END ===============================


// =========================== RENAMEFOLDER START ==============================
async function renameFolder(oldName, newName, parentHandle) {
    const src = await parentHandle.getDirectoryHandle(oldName);
    const dest = await parentHandle.getDirectoryHandle(newName, { create: true });

    // Kopiere alle Inhalte rekursiv
    async function kopiere(srcHandle, destHandle, pfad = '') {
        for await (const [name, child] of srcHandle.entries()) {
            if (child.kind === 'file') {
                const file = await child.getFile();
                const fh = await destHandle.getFileHandle(name, { create: true });
                const w = await fh.createWritable();
                await w.write(file);
                await w.close();
            } else if (child.kind === 'directory') {
                const newDir = await destHandle.getDirectoryHandle(name, { create: true });
                await kopiere(child, newDir, pfad + name + '/');
            }
        }
    }

    await kopiere(src, dest);
    await parentHandle.removeEntry(oldName, { recursive: true });

    aktualisiereDBNachRename(oldName, newName);
}
// =========================== RENAMEFOLDER END ================================


// =========================== AKTUALISIEREDBNACHRENAME START ==================
function aktualisiereDBNachRename(altOrdner, neuOrdner) {
    for (const [filename, paths] of Object.entries(filePathDatabase)) {
        paths.forEach(p => {
            if (p.folder.startsWith(altOrdner)) {
                p.folder = p.folder.replace(altOrdner, neuOrdner);
                p.fullPath = p.fullPath.replace(altOrdner, neuOrdner);
            }
        });
    }

    const neuesTextDB = {};
    for (const [key, val] of Object.entries(textDatabase)) {
        if (key.startsWith(altOrdner + '/')) {
            const neuerKey = neuOrdner + key.slice(altOrdner.length);
            neuesTextDB[neuerKey] = val;
            delete textDatabase[key];
        }
    }
    Object.assign(textDatabase, neuesTextDB);

    saveFilePathDatabase();
    saveTextDatabase();
}
// =========================== AKTUALISIEREDBNACHRENAME END ====================



// =========================== IMPROVED IMPORT PROCESS START ===========================
async function startImportProcess() {
    const filenameColumn = parseInt(document.getElementById('filenameColumn').value);
    const englishColumn = parseInt(document.getElementById('englishColumn').value);
    const germanColumn = document.getElementById('germanColumn').value ? parseInt(document.getElementById('germanColumn').value) : -1;
    
    if (isNaN(filenameColumn)) {
        alert('Bitte wählen Sie die Spalte für die Dateinamen aus!');
        return;
    }
    
    if (isNaN(englishColumn)) {
        alert('Bitte wählen Sie die Spalte für den englischen Text aus!');
        return;
    }
    
    if (filenameColumn === englishColumn) {
        alert('Dateinamen und englischer Text können nicht in derselben Spalte sein!');
        return;
    }
    
    if (germanColumn >= 0 && (germanColumn === filenameColumn || germanColumn === englishColumn)) {
        alert('Deutsche Text-Spalte muss unterschiedlich zu den anderen Spalten sein!');
        return;
    }
    
    let imported = 0;
    let updated = 0;
    let notFound = [];
    let multipleFound = [];
    let databaseMatches = 0;
    let skippedDueToAmbiguity = 0;
    
    // Sammle alle Dateien mit mehreren Ordnern für Batch-Auswahl
    const ambiguousFiles = [];
    
    // PHASE 1: Analysiere alle Dateien und sammle mehrdeutige
    parsedImportData.forEach((row, index) => {
        const filename = row[filenameColumn];
        const englishText = row[englishColumn] || '';
        const germanText = germanColumn >= 0 ? (row[germanColumn] || '') : '';
        
        if (!filename || !englishText) {
            return;
        }
        
        // Clean filename
        let cleanFilename = filename.replace(/\.(mp3|wav|ogg)$/i, '');
        
        // Suche nach Datei in Datenbank
        let foundPaths = [];
        
        // Try exact match first
        const extensions = ['.mp3', '.wav', '.ogg'];
        for (const ext of extensions) {
            const fullFilename = cleanFilename + ext;
            if (filePathDatabase[fullFilename]) {
                foundPaths = filePathDatabase[fullFilename].map(pathInfo => ({
                    filename: fullFilename,
                    folder: pathInfo.folder,
                    fullPath: pathInfo.fullPath,
                    pathInfo: pathInfo
                }));
                break;
            }
        }
        
        // Try fuzzy search if not found
        if (foundPaths.length === 0) {
            for (const [dbFilename, paths] of Object.entries(filePathDatabase)) {
                const dbCleanName = dbFilename.replace(/\.(mp3|wav|ogg)$/i, '');
                if (dbCleanName.includes(cleanFilename) || cleanFilename.includes(dbCleanName)) {
                    foundPaths = paths.map(pathInfo => ({
                        filename: dbFilename,
                        folder: pathInfo.folder,
                        fullPath: pathInfo.fullPath,
                        pathInfo: pathInfo
                    }));
                    break;
                }
            }
        }
        
        if (foundPaths.length === 0) {
            notFound.push(filename);
        } else if (foundPaths.length === 1) {
            // Eindeutig → direkt verarbeiten
            const match = foundPaths[0];
            updateTextDatabase(match.filename, match.pathInfo, englishText, germanText);
            imported++;
            databaseMatches++;
        } else {
            // Mehrdeutig → zur späteren Auswahl sammeln
            ambiguousFiles.push({
                originalFilename: filename,
                englishText: englishText,
                germanText: germanText,
                foundPaths: foundPaths,
                rowIndex: index
            });
        }
    });
    
    // PHASE 2: Benutzer-Auswahl für mehrdeutige Dateien
    if (ambiguousFiles.length > 0) {
        const selections = await showFolderSelectionDialog(ambiguousFiles);
        
        if (selections === null) {
            // Benutzer hat abgebrochen
            alert('Import abgebrochen.');
            return;
        }
        
        // Verarbeite Benutzer-Auswahlen
        selections.forEach((selection, index) => {
            if (selection.selectedIndex >= 0) {
                const ambiguous = ambiguousFiles[index];
                const selectedPath = ambiguous.foundPaths[selection.selectedIndex];
                
                updateTextDatabase(selectedPath.filename, selectedPath.pathInfo, ambiguous.englishText, ambiguous.germanText);
                imported++;
                databaseMatches++;
                multipleFound.push({
                    original: ambiguous.originalFilename,
                    selected: selectedPath.folder
                });
            } else {
                skippedDueToAmbiguity++;
                notFound.push(ambiguousFiles[index].originalFilename);
            }
        });
    }
    
    // PHASE 3: Update current project files
    files.forEach(file => {
        const fileKey = `${file.folder}/${file.filename}`;
        if (textDatabase[fileKey]) {
            let wasUpdated = false;
            if (textDatabase[fileKey].en && textDatabase[fileKey].en !== file.enText) {
                file.enText = textDatabase[fileKey].en;
                wasUpdated = true;
            }
            if (textDatabase[fileKey].de && textDatabase[fileKey].de !== file.deText) {
                file.deText = textDatabase[fileKey].de;
                wasUpdated = true;
            }
            if (wasUpdated) {
                updated++;
            }
        }
    });
    
    if (imported > 0 || updated > 0) {
        markDirty();
        saveTextDatabase();
        if (updated > 0) {
            renderFileTable();
            updateProgressStats();
        }
        
        let message = `${imported} Texte in die Datenbank importiert`;
        if (updated > 0) {
            message += `\n${updated} Dateien im aktuellen Projekt aktualisiert`;
        }
        
        updateStatus(message);
        closeImportDialog();
        
        // Erweiterte Erfolgs-Nachricht
        let summaryMessage = `✅ Import erfolgreich abgeschlossen!\n\n` +
            `📊 Statistik:\n` +
            `• ${imported} Texte importiert (${databaseMatches} DB-Matches)\n` +
            `• ${updated} Projekt-Dateien aktualisiert\n` +
            `• ${parsedImportData.length} Zeilen verarbeitet\n` +
            `• ${notFound.length} nicht gefunden\n`;
            
        if (multipleFound.length > 0) {
            summaryMessage += `• ${multipleFound.length} mehrdeutige Dateien aufgelöst\n`;
        }
        if (skippedDueToAmbiguity > 0) {
            summaryMessage += `• ${skippedDueToAmbiguity} mehrdeutige Dateien übersprungen\n`;
        }
        
        summaryMessage += `\n🎯 Spalten-Zuordnung:\n` +
            `• Dateinamen: Spalte ${filenameColumn + 1}\n` +
            `• Englisch: Spalte ${englishColumn + 1}\n` +
            `• Deutsch: ${germanColumn >= 0 ? `Spalte ${germanColumn + 1}` : 'Nicht verwendet'}`;
        
        if (multipleFound.length > 0) {
            summaryMessage += `\n\n🎯 Ordner-Auswahlen:\n` +
                multipleFound.slice(0, 5).map(mf => `• ${mf.original} → ${mf.selected}`).join('\n') +
                (multipleFound.length > 5 ? `\n... und ${multipleFound.length - 5} weitere` : '');
        }
        
        setTimeout(() => {
            alert(summaryMessage + (notFound.length > 0 && notFound.length <= 10 ? `\n\n❌ Nicht gefunden:\n${notFound.join('\n')}` : 
                  notFound.length > 10 ? `\n\n❌ ${notFound.length} Dateien nicht gefunden (erste 5):\n${notFound.slice(0, 5).join('\n')}\n...` : ''));
        }, 100);
    } else {
        alert('❌ Keine Dateien konnten importiert werden!\n\n' +
              'Mögliche Gründe:\n' +
              '1. Dateien wurden nicht in der Datenbank gefunden\n' +
              '2. Falsche Spalten-Zuordnung\n' +
              '3. Leere oder ungültige Daten\n' +
              '4. Alle mehrdeutigen Dateien wurden übersprungen\n\n' +
              `📊 Versucht: ${parsedImportData.length} Zeilen\n` +
              `❌ Nicht gefunden: ${notFound.length}\n` +
              `❓ Mehrdeutig übersprungen: ${skippedDueToAmbiguity}\n\n` +
              'Tipp: Scannen Sie zuerst den Ordner mit den Audio-Dateien.');
    }
}

// =========================== FOLDER SELECTION DIALOG START ===========================
function showFolderSelectionDialog(ambiguousFiles) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay hidden';
        
        const dialog = document.createElement('div');
        dialog.className = 'dialog';
        dialog.style.maxWidth = '800px';
        dialog.style.maxHeight = '80vh';
        dialog.style.overflow = 'auto';
        
        const selections = new Array(ambiguousFiles.length).fill(null).map(() => ({ selectedIndex: -1 }));
        
        dialog.innerHTML = `
            <h3>📁 Ordner-Auswahl für mehrdeutige Dateien</h3>
            <p style="margin-bottom: 20px; color: #999;">
                Die folgenden Dateien wurden in mehreren Ordnern gefunden. 
                Bitte wählen Sie den passenden Ordner für jede Datei aus:
            </p>
            
            <!-- NEUE OPTION: Auswahl übertragen -->
            <div style="background: #2a2a2a; padding: 15px; margin: 0 0 20px 0; border-radius: 6px; border: 2px solid #ff6b1a;">
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                    <input type="checkbox" id="applyToAll" style="width: 18px; height: 18px;">
                    <strong style="color: #ff6b1a;">🔄 Erste Auswahl auf alle folgenden Dateien übertragen</strong>
                </label>
                <p style="margin: 8px 0 0 28px; font-size: 12px; color: #999;">
                    Wenn aktiviert, wird die erste Ordner-Auswahl automatisch für alle weiteren Dateien verwendet.
                </p>
            </div>
            
            <div id="folderSelectionList" style="max-height: 400px; overflow-y: auto;">
                ${ambiguousFiles.map((item, index) => `
                    <div id="fileItem_${index}" style="background: #1a1a1a; border: 1px solid #444; border-radius: 6px; padding: 15px; margin: 10px 0;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="color: #ff6b1a; font-weight: bold; margin-bottom: 10px;">
                                📄 ${item.originalFilename}
                            </div>
                            <div id="autoApplied_${index}" style="display: none; background: #4caf50; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                                ✅ Auto-übertragen
                            </div>
                        </div>
                        <div style="color: #999; font-size: 12px; margin-bottom: 15px;">
                            EN: ${item.englishText.length > 60 ? item.englishText.substring(0, 60) + '...' : item.englishText}
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong>Gefunden in ${item.foundPaths.length} Ordnern:</strong>
                        </div>
                        ${item.foundPaths.map((path, pathIndex) => {
                            const folderName = path.folder.split('/').pop() || path.folder;
                            const hasAudio = !!audioFileCache[path.fullPath];
                            const dbEn = path.dbEnText || '';
                            const dbDe = path.dbDeText || '';
                            return `
                                <label id="folderOption_${index}_${pathIndex}" style="display: block; padding: 8px; margin: 5px 0; background: #2a2a2a; border-radius: 4px; cursor: pointer; border: 1px solid #333;"
                                       onclick="selectFolder(${index}, ${pathIndex})">
                                    <input type="radio" name="folder_${index}" value="${pathIndex}" style="margin-right: 10px;">
                                    <span style="color: #4caf50;">${hasAudio ? '🎵' : '❓'}</span>
                                    <strong>${folderName}</strong>
                                    <br>
                                    <small style="color: #666; margin-left: 25px;">${path.folder}</small>
                                    ${dbEn ? `<br><small style="color: #999; margin-left: 25px;">DB EN: ${dbEn.length > 60 ? dbEn.substring(0,60) + '...' : dbEn}</small>` : ''}
                                    ${dbDe ? `<br><small style="color: #999; margin-left: 25px;">DB DE: ${dbDe.length > 60 ? dbDe.substring(0,60) + '...' : dbDe}</small>` : ''}
                                    ${!hasAudio ? '<br><small style="color: #f44336; margin-left: 25px;">⚠️ Audio nicht im Cache</small>' : ''}
                                </label>
                            `;
                        }).join('')}
                        <label id="skipOption_${index}" style="display: block; padding: 8px; margin: 5px 0; background: #333; border-radius: 4px; cursor: pointer; border: 1px solid #666;" 
                               onclick="selectFolder(${index}, -1)">
                            <input type="radio" name="folder_${index}" value="-1" style="margin-right: 10px;">
                            <span style="color: #f44336;">❌ Überspringen</span>
                        </label>
                    </div>
                `).join('')}
            </div>
            <div style="background: #2a2a2a; padding: 15px; margin: 20px 0; border-radius: 6px;">
                <strong>🎯 Auswahlhilfen:</strong><br>
                • 🎵 = Audio-Datei ist verfügbar<br>
                • ❓ = Audio-Datei nicht im Cache<br>
                • 🔄 = Auswahl wurde automatisch übertragen<br>
                • Wählen Sie den Ordner, der zum Kontext des Textes passt<br>
                • "Überspringen" ignoriert diese Datei beim Import
            </div>
            <div class="dialog-buttons">
                <button class="btn btn-secondary" onclick="cancelFolderSelection()">Alle überspringen</button>
                <button class="btn btn-success" onclick="confirmFolderSelection()">Auswahl bestätigen</button>
            </div>
        `;
        
        let firstSelectionMade = false;
        let firstSelectedPath = null;
        
        // Global functions for the dialog
        window.selectFolder = (fileIndex, pathIndex) => {
            selections[fileIndex].selectedIndex = pathIndex;
            debugLog(`Selected folder ${pathIndex} for file ${fileIndex}`);
            
            // Visuelles Feedback
            const fileItem = document.getElementById(`fileItem_${fileIndex}`);
            if (fileItem) {
                // Entferne alte Auswahl-Highlights
                fileItem.querySelectorAll('label').forEach(label => {
                    label.style.borderColor = label.id.includes('skipOption') ? '#666' : '#333';
                    label.style.background = label.id.includes('skipOption') ? '#333' : '#2a2a2a';
                });
                
                // Highlight ausgewählte Option
                if (pathIndex >= 0) {
                    const selectedLabel = document.getElementById(`folderOption_${fileIndex}_${pathIndex}`);
                    if (selectedLabel) {
                        selectedLabel.style.borderColor = '#4caf50';
                        selectedLabel.style.background = '#1a3a1a';
                    }
                } else {
                    const skipLabel = document.getElementById(`skipOption_${fileIndex}`);
                    if (skipLabel) {
                        skipLabel.style.borderColor = '#f44336';
                        skipLabel.style.background = '#3a1a1a';
                    }
                }
            }
            
            // Prüfe ob "Auf alle übertragen" aktiviert ist
            const applyToAll = document.getElementById('applyToAll');
            if (applyToAll && applyToAll.checked && !firstSelectionMade && fileIndex === 0) {
                firstSelectionMade = true;
                firstSelectedPath = pathIndex;
                
                // Übertrage die Auswahl auf alle anderen Dateien
                for (let i = 1; i < ambiguousFiles.length; i++) {
                    // Finde den passenden Ordner in den anderen Dateien
                    let matchingPathIndex = -1;
                    
                    if (pathIndex >= 0) {
                        const selectedFolder = ambiguousFiles[0].foundPaths[pathIndex].folder;
                        
                        // Suche nach dem gleichen Ordner in der aktuellen Datei
                        matchingPathIndex = ambiguousFiles[i].foundPaths.findIndex(
                            path => path.folder === selectedFolder
                        );
                        
                        // Wenn nicht gefunden, versuche Teilübereinstimmung
                        if (matchingPathIndex === -1) {
                            const selectedFolderParts = selectedFolder.split('/');
                            const selectedLastPart = selectedFolderParts[selectedFolderParts.length - 1];
                            
                            matchingPathIndex = ambiguousFiles[i].foundPaths.findIndex(
                                path => path.folder.endsWith(selectedLastPart)
                            );
                        }
                    }
                    
                    // Setze die Auswahl
                    selections[i].selectedIndex = matchingPathIndex >= 0 ? matchingPathIndex : pathIndex;
                    
                    // Visuelles Feedback
                    const autoIndicator = document.getElementById(`autoApplied_${i}`);
                    if (autoIndicator) {
                        autoIndicator.style.display = 'block';
                    }
                    
                    // Setze Radio-Button
                    const radioToCheck = document.querySelector(`input[name="folder_${i}"][value="${selections[i].selectedIndex}"]`);
                    if (radioToCheck) {
                        radioToCheck.checked = true;
                    }
                    
                    // Highlight die automatisch ausgewählte Option
                    const itemDiv = document.getElementById(`fileItem_${i}`);
                    if (itemDiv) {
                        itemDiv.style.borderColor = '#4caf50';
                        itemDiv.style.borderWidth = '2px';
                        
                        if (selections[i].selectedIndex >= 0) {
                            const autoSelectedLabel = document.getElementById(`folderOption_${i}_${selections[i].selectedIndex}`);
                            if (autoSelectedLabel) {
                                autoSelectedLabel.style.borderColor = '#4caf50';
                                autoSelectedLabel.style.background = '#1a3a1a';
                            }
                        } else {
                            const skipLabel = document.getElementById(`skipOption_${i}`);
                            if (skipLabel) {
                                skipLabel.style.borderColor = '#f44336';
                                skipLabel.style.background = '#3a1a1a';
                            }
                        }
                    }
                }
                
                // Zeige Erfolgsmeldung
                const message = pathIndex >= 0 ? 
                    `✅ Ordner "${ambiguousFiles[0].foundPaths[pathIndex].folder}" wurde auf alle ${ambiguousFiles.length - 1} weiteren Dateien übertragen.` :
                    `❌ "Überspringen" wurde auf alle ${ambiguousFiles.length - 1} weiteren Dateien übertragen.`;
                
                const msgDiv = document.createElement('div');
                msgDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #4caf50; color: white; padding: 15px 20px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.3); z-index: 3000;';
                msgDiv.textContent = message;
                document.body.appendChild(msgDiv);
                
                setTimeout(() => {
                    msgDiv.remove();
                }, 3000);
            }
        };
        
        window.cancelFolderSelection = () => {
            document.body.removeChild(overlay);
            resolve(null);
        };
        
        window.confirmFolderSelection = () => {
            // Zähle Auswahlen
            const selectedCount = selections.filter(s => s.selectedIndex >= 0).length;
            const skippedCount = selections.filter(s => s.selectedIndex === -1).length;
            const unselectedCount = selections.filter(s => s.selectedIndex < -1).length;
            
            if (unselectedCount > 0) {
                if (!confirm(`${unselectedCount} Dateien haben keine Auswahl.\nDiese werden übersprungen.\n\nFortfahren?`)) {
                    return;
                }
                // Setze unausgewählte auf "überspringen"
                selections.forEach(s => {
                    if (s.selectedIndex < -1) s.selectedIndex = -1;
                });
            }
            
            document.body.removeChild(overlay);
            resolve(selections);
        };
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        // Overlay sichtbar machen
        overlay.classList.remove('hidden');
        
        // Cleanup functions when dialog closes
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                window.cancelFolderSelection();
            }
        });
    });
}
// =========================== FOLDER SELECTION DIALOG END ===========================

function updateTextDatabase(filename, pathInfo, englishText, germanText) {
    const fileKey = `${pathInfo.folder}/${filename}`;
    if (!textDatabase[fileKey]) {
        textDatabase[fileKey] = {};
    }
    
    if (englishText) {
        textDatabase[fileKey].en = englishText;
    }
    if (germanText) {
        textDatabase[fileKey].de = germanText;
    }
    
    debugLog(`[IMPORT] Updated text for ${fileKey}: EN=${!!englishText}, DE=${!!germanText}`);
}

async function importClosecaptions() {
    const base = isElectron ? window.electronAPI.join('..', 'closecaption') : '../closecaption';
    const subtitles = await loadClosecaptions(base);
    if (!subtitles) {
        alert('❌ Untertitel-Dateien konnten nicht gelesen werden.');
        return;
    }

    const ambiguous = [];
    let imported = 0;

    for (const { id, enText, deText } of subtitles) {
        if (!deText) continue;
        const matches = Object.keys(textDatabase).filter(key => textDatabase[key].en && textDatabase[key].en.trim() === enText.trim());
        if (matches.length === 1) {
            const fileKey = matches[0];
            const parts = fileKey.split('/');
            const filename = parts.pop();
            const folder = parts.join('/');
            const infos = filePathDatabase[filename] || [];
            const info = infos.find(p => p.folder === folder) || { folder, fullPath: '' };
            updateTextDatabase(filename, info, enText, deText);
            imported++;
        } else if (matches.length > 1) {
            // Sammle alle möglichen Datenbank-Einträge inklusive vorhandener Texte
            const foundPaths = matches.map(k => {
                const p = k.split('/');
                const fn = p.pop();
                const fo = p.join('/');
                const infs = filePathDatabase[fn] || [];
                const pi = infs.find(pi => pi.folder === fo) || { folder: fo, fullPath: '' };
                const dbEntry = textDatabase[`${fo}/${fn}`] || {};
                return {
                    filename: fn,
                    folder: fo,
                    fullPath: pi.fullPath,
                    pathInfo: pi,
                    dbEnText: dbEntry.en || '',
                    dbDeText: dbEntry.de || ''
                };
            });
            ambiguous.push({ originalFilename: id, englishText: enText, germanText: deText, foundPaths, rowIndex: 0 });
        }
    }

    if (ambiguous.length > 0) {
        const selections = await showFolderSelectionDialog(ambiguous);
        if (selections !== null) {
            selections.forEach((sel, idx) => {
                if (sel.selectedIndex >= 0) {
                    const amb = ambiguous[idx];
                    const chosen = amb.foundPaths[sel.selectedIndex];
                    updateTextDatabase(chosen.filename, chosen.pathInfo, amb.englishText, amb.germanText);
                    imported++;
                }
            });
        }
    }

    if (imported > 0) {
        markDirty();
        saveTextDatabase();
        renderFileTable();
        updateProgressStats();
        alert(`✅ ${imported} Untertitel importiert`);
    } else {
        alert('❌ Keine passenden Einträge gefunden.');
    }

    closeCcImportDialog();
}

// =========================== IMPROVED IMPORT PROCESS END =====================

// =========================== IMPROVED SEARCH FUNCTION START ===========================
async function addFromSearch(result) {
    // Prüfe ob Datei bereits im Projekt ist
    const existingFile = files.find(f => f.filename === result.filename && f.folder === result.folder);
    if (existingFile) {
        updateStatus('Datei bereits im Projekt');
        return;
    }
    
    // Prüfe ob es mehrere Ordner für diese Datei gibt
    if (filePathDatabase[result.filename] && filePathDatabase[result.filename].length > 1) {
        debugLog(`[SEARCH] Multiple folders found for ${result.filename}, showing selection dialog`);
        
        const paths = filePathDatabase[result.filename];
        const selection = await showSingleFileSelectionDialog(result.filename, paths, result);

        if (selection === null) {
            updateStatus('Hinzufügen abgebrochen');
            return;
        }

        // Prüfe, ob alle Pfade hinzugefügt werden sollen
        if (selection.addAll) {
            // Basis‑EN‑Text des geklickten Ergebnisses ermitteln
            const baseEn = (result.text && result.text.en ? result.text.en.trim() : '').trim();

            // Jeder gefundene Pfad wird einzeln überprüft und nur bei identischem EN‑Text hinzugefügt
            paths.forEach(p => {
                const fileKey   = `${p.folder}/${result.filename}`;
                const pathEntry = textDatabase[fileKey] || {};
                const pathEn    = (pathEntry.en || '').trim();
                const already   = files.find(f => f.filename === result.filename && f.folder === p.folder);

                // Nur hinzufügen, wenn Text gleich ist und Datei noch nicht vorhanden
                if (!already && baseEn && pathEn && pathEn === baseEn) {
                    addFileToProject(result.filename, p.folder);
                }
            });
        } else {
            // Verwende ausgewählten Pfad
            const selectedPath = paths[selection.selectedIndex];
            addFileToProject(result.filename, selectedPath.folder);
        }
    } else {
        // Nur ein Pfad oder bereits spezifischer Pfad aus Suchergebnis
        addFileToProject(result.filename, result.folder);
    }
}


// =========================== showSingleFileSelectionDialog START ===========================
function showSingleFileSelectionDialog(filename, paths, originalResult) {
    return new Promise((resolve) => {
        // Wenn nur ein Pfad vorhanden, direkt verwenden
        if (paths.length === 1) {
            resolve({ selectedIndex: 0 });
            return;
        }
        
        const overlay = document.createElement('div');
        overlay.className = 'dialog-overlay hidden';
        
        const dialog = document.createElement('div');
        dialog.className = 'dialog';
        dialog.style.maxWidth = '600px';
        
        let selectedIndex = -1;
        
        // Versuche intelligente Vorauswahl basierend auf dem Suchergebnis
        if (originalResult && originalResult.folder) {
            const exactMatch = paths.findIndex(p => p.folder === originalResult.folder);
            if (exactMatch >= 0) {
                selectedIndex = exactMatch;
            }
        }
        
        dialog.innerHTML = `
            <h3>📁 Ordner auswählen</h3>
            <p style="margin-bottom: 20px; color: #999;">
                Die Datei <strong>${filename}</strong> wurde in mehreren Ordnern gefunden.<br>
                Bitte wählen Sie den passenden Ordner aus:
            </p>
            <div style="max-height: 300px; overflow-y: auto;">
                ${paths.map((pathInfo, index) => {
                    const folderName = pathInfo.folder.split('/').pop() || pathInfo.folder;
                    const hasAudio = !!audioFileCache[pathInfo.fullPath];
                    const isPreselected = index === selectedIndex;
                    return `
                        <label style="
                            display: flex; 
                            align-items: center; 
                            justify-content: space-between; 
                            padding: 12px; 
                            margin: 8px 0; 
                            background: ${isPreselected ? '#ff6b1a' : '#2a2a2a'}; 
                            border-radius: 6px; 
                            cursor: pointer; 
                            border: 2px solid ${isPreselected ? '#ff6b1a' : '#333'};
                        " onclick="selectSingleFolder(${index})">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <input 
                                    type="radio" 
                                    name="singleFolder" 
                                    value="${index}" 
                                    ${isPreselected ? 'checked' : ''} 
                                    style="margin-right: 10px;"
                                >
                                <span style="font-size: 16px; color: ${hasAudio ? '#4caf50' : '#f44336'};">
                                    ${hasAudio ? '🎵' : '❓'}
                                </span>
                                <div>
                                    <strong style="color: ${isPreselected ? '#fff' : '#ff6b1a'};">
                                        ${folderName}
                                    </strong><br>
                                    <small style="color: ${isPreselected ? '#fff' : '#666'};">
                                        ${pathInfo.folder}
                                    </small>
                                    ${!hasAudio ? `<br><small style="color: #f44336;">⚠️ Audio nicht verfügbar</small>` : ''}
                                </div>
                            </div>
                            <div>
                                <button 
                                    class="play-btn" 
                                    ${hasAudio ? '' : 'disabled'} 
                                    onclick="event.stopPropagation(); playPreview('${pathInfo.fullPath}')"
                                    title="${hasAudio ? 'Audio abspielen' : 'Audio nicht verfügbar'}"
                                >▶</button>
                            </div>
                        </label>
                    `;
                }).join('')}
            </div>
            <div style="
                background: #1a1a1a; 
                padding: 12px; 
                margin: 15px 0; 
                border-radius: 6px; 
                font-size: 13px; 
                color: #999;
            ">
                💡 <strong>Auswahlhilfe:</strong><br>
                • 🎵 = Audio-Datei ist verfügbar<br>
                • ❓ = Audio-Datei nicht im Cache<br>
                • Wählen Sie den Ordner, der zu Ihrem Projekt passt
            </div>
            <div class="dialog-buttons">
                <button class="btn btn-secondary" onclick="cancelSingleSelection()">Abbrechen</button>
                <button class="btn btn-blue" onclick="confirmAddAll()">Alle hinzufügen</button>
                <button class="btn btn-success" onclick="confirmSingleSelection()" ${selectedIndex >= 0 ? '' : 'disabled'}>
                    Hinzufügen
                </button>
            </div>
        `;
        
        // Globale Funktionen für den Dialog
        window.selectSingleFolder = (index) => {
            selectedIndex = index;
            // Visuelle Auswahl aktualisieren
            dialog.querySelectorAll('label').forEach((label, i) => {
                const isSel = (i === index);
                label.style.background = isSel ? '#ff6b1a' : '#2a2a2a';
                label.style.borderColor = isSel ? '#ff6b1a' : '#333';
                
                const strong = label.querySelector('strong');
                const smalls = label.querySelectorAll('small');
                if (strong) strong.style.color = isSel ? '#fff' : '#ff6b1a';
                smalls.forEach(s => {
                    if (!s.textContent.includes('Audio nicht verfügbar')) {
                        s.style.color = isSel ? '#fff' : '#666';
                    }
                });
                
                const radio = label.querySelector('input[type="radio"]');
                if (radio) radio.checked = isSel;
            });
            
            // Confirm-Button aktivieren
            const confirmBtn = dialog.querySelector('.btn-success');
            if (confirmBtn) confirmBtn.disabled = false;
        };
        
        window.cancelSingleSelection = () => {
            document.body.removeChild(overlay);
            resolve(null);
        };
        
        window.confirmSingleSelection = () => {
            if (selectedIndex >= 0) {
                document.body.removeChild(overlay);
                resolve({ selectedIndex: selectedIndex });
            }
        };

        // Fügt alle gefundenen Dateien hinzu
        window.confirmAddAll = () => {
            document.body.removeChild(overlay);
            resolve({ addAll: true });
        };
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        // Overlay sichtbar machen
        overlay.classList.remove('hidden');

        // Klick außerhalb abfangen und abbrechen
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                window.cancelSingleSelection();
            }
        });
    });
}
// =========================== showSingleFileSelectionDialog END ===========================

// =========================== playPreview START ===========================
function playPreview(fullPath) {
    debugLog(`[PREVIEW] Versuche ${fullPath} abzuspielen`);
    const audioPlayer = document.getElementById('audioPlayer');
    stopCurrentPlayback();
    const fileObj = audioFileCache[fullPath];
    if (fileObj) {
        try {
            // Erzeuge eine temporäre URL aus dem File-Objekt und setze sie auf den Audio-Player
            const url = URL.createObjectURL(fileObj);
            audioPlayer.src = url;
            audioPlayer.play().catch(err => {
                debugLog('[PREVIEW] Abspielen fehlgeschlagen:', err.message);
                alert('Abspielen fehlgeschlagen: ' + err.message);
            });
        } catch (e) {
            debugLog('[PREVIEW] Fehler beim Erzeugen der Audio-URL:', e.message);
            alert('Fehler beim Erzeugen der Audio-URL: ' + e.message);
        }
    } else {
        debugLog(`[PREVIEW] Nicht im Cache: ${fullPath}`);
        alert('⚠️ Audio-Datei nicht im Cache verfügbar');
    }
}
// =========================== playPreview END ===========================



// Hilfsfunktion zum Hinzufügen einer Datei zum Projekt
// fullPath wird nicht mehr als Parameter übergeben
function addFileToProject(filename, folder) {
    const fileKey = `${folder}/${filename}`;
    const newFile = {
        id: Date.now() + Math.random(),
        filename: filename,
        folder: folder,
        // fullPath wird NICHT mehr gespeichert - wird dynamisch geladen
        folderNote: '',
        enText: textDatabase[fileKey]?.en || '',
        deText: textDatabase[fileKey]?.de || '',
        emotionalText: textDatabase[fileKey]?.emo || '',
        emoReason: '',
        autoTranslation: '',
        autoSource: '',
        // Bewertungsergebnisse von GPT
        score: null,
        comment: '',
        suggestion: '',
        selected: true,
        trimStartMs: 0,
        trimEndMs: 0,
        volumeMatched: false,
        radioEffect: false,
        hallEffect: false,
        emiEffect: false,
        neighborEffect: false,
        neighborHall: false,
        version: 1
    };

    files.push(newFile);
    pendingSelectId = newFile.id; // hinzugefügte Datei merken

    // Update display order for new file
    displayOrder.push({ file: newFile, originalIndex: files.length - 1 });
    
    markDirty();
    
    renderFileTable();
    renderProjects(); // Live Update
    updateProgressStats();
    
    const folderName = folder.split('/').pop() || folder;
    updateStatus(`${filename} aus Ordner "${folderName}" zum Projekt hinzugefügt`);
    
    // Close search results
    document.getElementById('searchInput').value = '';
    document.getElementById('searchResults').style.display = 'none';
}
// =========================== IMPROVED SEARCH FUNCTION END ===========================

// =========================== IGNOREDFILES VAR START ===========================
let ignoredFiles = {};               // fileKey -> true
let ignoredFilesLoaded = Promise.resolve(); // Merker für asynchrones Laden

function loadIgnoredFiles() {
    // Laden immer über Promise abwickeln, damit auch asynchrone Speicher funktionieren
    ignoredFilesLoaded = (async () => {
        try {
            let electronData = null;
            if (window.electronAPI && window.electronAPI.loadIgnoredFiles) {
                try {
                    electronData = await window.electronAPI.loadIgnoredFiles();
                } catch (err) {
                    console.warn('Electron konnte die Ignorierliste nicht liefern:', err);
                }
            }

            if (electronData && typeof electronData === 'object' && !Array.isArray(electronData)) {
                ignoredFiles = electronData;
                try {
                    await storage.setItem('ignoredFiles', JSON.stringify(ignoredFiles));
                } catch (syncErr) {
                    console.warn('Lokaler Abgleich der Ignorierliste fehlgeschlagen:', syncErr);
                }
            } else {
                const raw = await storage.getItem('ignoredFiles');
                ignoredFiles = raw ? JSON.parse(raw) : {};
            }
        } catch (e) {
            console.warn('Ignorierte Dateien konnten nicht geladen werden:', e);
            ignoredFiles = {};
        }
    })();

    ignoredFilesLoaded.then(() => {
        // Nach erfolgreichem Laden Statistiken aktualisieren
        if (typeof refreshGlobalStatsAndGrids === 'function') {
            refreshGlobalStatsAndGrids();
        }
    });

    return ignoredFilesLoaded;
}

async function saveIgnoredFiles() {
    // Sicherstellen, dass Schreiben unabhängig vom Backend funktioniert
    try {
        await storage.setItem('ignoredFiles', JSON.stringify(ignoredFiles));
    } catch (e) {
        console.error('Ignorierte Dateien konnten nicht gespeichert werden:', e);
    }

    if (window.electronAPI && window.electronAPI.saveIgnoredFiles) {
        try {
            await window.electronAPI.saveIgnoredFiles(ignoredFiles);
        } catch (err) {
            console.error('Electron konnte die Ignorierliste nicht speichern:', err);
        }
    }
}

// Beim Start laden
loadIgnoredFiles();
// =========================== IGNOREDFILES VAR END ===========================

// =========================== TOGGLESKIPFILE START ===========================
async function toggleSkipFile(folder, filename) {
    // Zuerst warten, bis der aktuelle Ignorier-Stand geladen ist
    await ignoredFilesLoaded;

    const fileKey = `${folder}/${filename}`;

    if (ignoredFiles[fileKey]) {
        delete ignoredFiles[fileKey];
        debugLog(`[IGNORED] Aufgehoben: ${fileKey}`);
    } else {
        ignoredFiles[fileKey] = true;
        debugLog(`[IGNORED] Markiert: ${fileKey}`);
    }

    await saveIgnoredFiles();

    // UI & Statistiken sofort aktualisieren
    await showFolderFiles(folder);    // aktuelle Ansicht neu rendern
    refreshGlobalStatsAndGrids();     // eigene Hilfs-Funktion, s. ganz unten
}
// =========================== TOGGLESKIPFILE END ===========================




		
		
		

        // Project Drag and Drop
        let draggedProject = null;

        function handleProjectDragStart(e) {
            draggedProject = e.target;
            e.target.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', e.target.outerHTML);
        }

        function handleProjectDragOver(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.dataTransfer.dropEffect = 'move';
            return false;
        }

        function handleProjectDragEnter(e) {
            if (e.target !== draggedProject) {
                e.target.classList.add('drag-over');
            }
        }

        function handleProjectDragLeave(e) {
            e.target.classList.remove('drag-over');
        }

        function handleProjectDrop(e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            
            e.target.classList.remove('drag-over');
            
            if (draggedProject !== e.target) {
                const draggedId = parseInt(draggedProject.dataset.projectId);
                const targetId = parseInt(e.target.dataset.projectId);
                
                const draggedIndex = projects.findIndex(p => p.id === draggedId);
                const targetIndex = projects.findIndex(p => p.id === targetId);
                
                if (draggedIndex !== -1 && targetIndex !== -1) {
                    // Remove dragged project from array
                    const draggedProjectObj = projects.splice(draggedIndex, 1)[0];
                    
                    // Insert at new position
                    projects.splice(targetIndex, 0, draggedProjectObj);
                    
                    // Save and re-render
                    saveProjects();
                    renderProjects();
                    
                    // Maintain active project selection
                    document.querySelectorAll('.project-item').forEach(item => {
                        item.classList.toggle('active', item.dataset.projectId == currentProject?.id);
                    });
                    
                    updateStatus('Projekt-Reihenfolge geändert');
                }
            }
            
            return false;
        }

        function handleProjectDragEnd(e) {
            e.target.classList.remove('dragging');
            document.querySelectorAll('.project-item').forEach(item => {
                item.classList.remove('drag-over');
            });
            draggedProject = null;
        }

/* =========================== SHOW PROJECT CUSTOMIZATION START =========================== */
function showProjectCustomization(id, ev, tempProject) {
    ev?.stopPropagation();
    let prj = tempProject || projects.find(p => p.id === id);
    if (!prj) return;
    const isNew = !!tempProject;

    // Levelnamen nach ihrer gespeicherten Nummer sortieren
    const knownLevels   = [...new Set(projects.map(p => p.levelName).filter(Boolean))]
        .sort((a, b) => getLevelOrder(a) - getLevelOrder(b));
    // Kapitel nach ihrer Nummer sortieren
    const knownChapters = [...new Set(Object.values(levelChapters).filter(Boolean))]
        .sort((a, b) => getChapterOrder(a) - getChapterOrder(b));
    const currentChapter = getLevelChapter(prj.levelName);

    const ov = document.createElement('div');
    ov.className = 'customize-popup-overlay';
    ov.onclick   = () => document.body.removeChild(ov);

    const pop = document.createElement('div');
    pop.className = 'folder-customize-popup';
    pop.onclick   = e => e.stopPropagation();

    pop.innerHTML = `
      <h4>⚙️ Projekt-Einstellungen</h4>

      <div class="customize-field">
        <label>Projektname:</label>
        <input id="cName" value="${prj.name}">
      </div>

      <div class="customize-field">
        <label>Level-Name:</label>
        <select id="cLevel">
          <option value="">– neu –</option>
          ${knownLevels.map(l => {
              const ord = getLevelOrder(l);
              return `<option ${l===prj.levelName?'selected':''} value="${l}">${ord}.${l}</option>`;
          }).join('')}
        </select>
        <input id="cLevelNew"
               placeholder="Neuen Level-Namen"
               style="margin-top:8px;display:${prj.levelName?'none':'block'};">
        <input type="number" id="cLevelOrder" min="1" max="9999"
               placeholder="Level-Nummer"
               style="margin-top:8px;display:${prj.levelName?'none':'block'};">
      </div>

      <div class="customize-field">
        <label>Kapitel:</label>
        <select id="cChapter">
          <option value="">– neu –</option>
          ${knownChapters.map(c => `<option ${c===currentChapter?'selected':''} value="${c}">${getChapterOrder(c)}.${c}</option>`).join('')}
        </select>
        <input id="cChapterNew" placeholder="Neues Kapitel" style="margin-top:8px;display:${currentChapter && currentChapter !== '–' ? 'none' : 'block'};">
        <input type="number" id="cChapterOrder" min="1" max="9999" placeholder="Kapitel-Nr" style="margin-top:8px;display:${currentChapter && currentChapter !== '–' ? 'none' : 'block'};">
      </div>

      <div class="customize-field">
        <label>Teil-Nummer:</label>
        <input type="number" id="cPart" min="1" max="9999" value="${prj.levelPart}">
      </div>

      <div class="customize-field">
        <label>Farbe (Level-weit):</label>
        <input type="color" id="cColor" value="${getLevelColor(prj.levelName)}">
      </div>

      <div class="customize-buttons">
        <button class="btn btn-secondary" id="cCancel">Abbrechen</button>
        <button class="btn btn-success"   id="cSave">Speichern</button>
      </div>
    `;

    ov.appendChild(pop);
    document.body.appendChild(ov);

    // ⬇️ Eingabeelemente nach dem Einfügen referenzieren
    const sel    = pop.querySelector('#cLevel');
    const inp    = pop.querySelector('#cLevelNew');
    const ordInp = pop.querySelector('#cLevelOrder');
    const chSel  = pop.querySelector('#cChapter');
    const chInp  = pop.querySelector('#cChapterNew');
    const chOrd  = pop.querySelector('#cChapterOrder');

    // Fokus direkt aufs richtige Feld setzen
    if (!sel.value) {
        inp.style.display = 'block';
        ordInp.style.display = 'block';
        inp.focus();
    } else {
        pop.querySelector('#cName').focus();
    }

    if (chSel && !chSel.value && chInp) {
        chInp.style.display = 'block';
        chOrd.style.display = 'block';
    }

    /* Eingabedynamik */
    sel.onchange = () => {
        const show = !sel.value;
        inp.style.display = show ? 'block' : 'none';
        ordInp.style.display = show ? 'block' : 'none';
        if (show) {
            inp.focus();
        } else {
            // Beim Wechsel auf einen bestehenden Level dessen Farbe übernehmen
            pop.querySelector('#cColor').value = getLevelColor(sel.value);
        }
        if (chSel) {
            const ch = getLevelChapter(sel.value);
            chSel.value = ch === '–' ? '' : ch;
            const sh = !chSel.value;
            if (chInp) chInp.style.display = sh ? 'block' : 'none';
            if (chOrd) chOrd.style.display = sh ? 'block' : 'none';
        }
    };

    if (chSel) {
        chSel.onchange = () => {
            const showCh = !chSel.value;
            if (chInp) chInp.style.display = showCh ? 'block' : 'none';
            if (chOrd) chOrd.style.display = showCh ? 'block' : 'none';
            if (showCh && chInp) chInp.focus();
        };
    }

    pop.querySelector('#cCancel').onclick = () => document.body.removeChild(ov);

    pop.querySelector('#cSave').onclick = () => {
        prj.name = pop.querySelector('#cName').value.trim();
        const selectedLevel = sel.value;
        const newLevel = inp.value.trim();
        const orderVal = parseInt(ordInp.value);
        const selectedChapter = chSel ? chSel.value : '';
        const newChapter     = chInp ? chInp.value.trim() : '';
        const chOrderVal     = parseInt(chOrd?.value);

        // Eingaben prüfen
        if (!selectedLevel && !newLevel) {
            alert('Bitte einen Levelnamen auswählen oder einen neuen vergeben und eine Nummer angeben.');
            return;
        }
        if (!selectedLevel && newLevel && !ordInp.value) {
            alert('Bitte auch eine Level-Nummer angeben.');
            return;
        }
        if (!prj.name) {
            alert('Bitte einen Projektnamen eingeben.');
            return;
        }
        if (!selectedChapter && newChapter && !chOrd?.value) {
            alert('Bitte auch eine Kapitel-Nummer angeben.');
            return;
        }

        prj.levelName = selectedLevel || newLevel;
        prj.levelPart = Math.max(1, parseInt(pop.querySelector('#cPart').value) || 1);

        /* Level-Farbe global anwenden */
        const newColor = pop.querySelector('#cColor').value;
        setLevelColor(prj.levelName, newColor);

        // Level-Reihenfolge setzen, falls neuer Level angelegt wird
        if (!selectedLevel) {
            const order = Math.max(1, orderVal || 1);
            setLevelOrder(prj.levelName, order);
        }

        const chapterName = selectedChapter || newChapter || getLevelChapter(prj.levelName);
        setLevelChapter(prj.levelName, chapterName);
        if (!selectedChapter && newChapter) {
            const ord = Math.max(1, chOrderVal || 1);
            setChapterOrder(chapterName, ord);
        }

        saveLevelChapters();
        saveChapterOrders();

        // Neues Projekt erst jetzt speichern
        if (isNew) {
            projects.push(prj);
        }

        saveProjects();
        renderProjects();
        selectProject(prj.id);
        updateProjectMetaBar();
        document.body.removeChild(ov);
    };
}
/* =========================== SHOW PROJECT CUSTOMIZATION END =========================== */
/* =========================== SHOW LEVEL CUSTOMIZATION START ======================== */
function showLevelCustomization(levelName, ev) {
    ev?.stopPropagation();
    const order = getLevelOrder(levelName) || 1;
    const color = getLevelColor(levelName);
    const icon  = getLevelIcon(levelName);
    const currentChapter = getLevelChapter(levelName);
    // Kapitel sortiert nach ihrer Nummer anzeigen
    const knownChapters = [...new Set(Object.values(levelChapters).filter(Boolean))]
        .sort((a, b) => getChapterOrder(a) - getChapterOrder(b));

    const ov = document.createElement('div');
    ov.className = 'customize-popup-overlay';
    ov.onclick   = () => document.body.removeChild(ov);

    const pop = document.createElement('div');
    pop.className = 'folder-customize-popup';
    pop.onclick   = e => e.stopPropagation();

    pop.innerHTML = `
      <h4>⚙️ Level-Einstellungen</h4>

      <div class="customize-field">
        <label>Level-Name:</label>
        <input id="lvlName" value="${levelName}">
      </div>

      <div class="customize-field">
        <label>Reihenfolge:</label>
        <input type="number" id="lvlOrder" min="1" max="9999" value="${order}">
      </div>

      <div class="customize-field">
        <label>Farbe:</label>
        <input type="color" id="lvlColor" value="${color}">
        <div id="lvlHistory" class="color-history"></div>
      </div>

      <div class="customize-field">
        <label>Icon:</label>
        <input id="lvlIcon" value="${icon}" maxlength="2">
        <select id="lvlIconSelect">
          <option value="">-- Icon wählen --</option>
          <option value="👤">👤</option>
          <option value="👩">👩</option>
          <option value="🤖">🤖</option>
          <option value="🧟">🧟</option>
          <option value="📁">📁</option>
        </select>
      </div>

      <div class="customize-field">
        <label>Kapitel:</label>
        <select id="lvlChapter">
          <option value="">– neu –</option>
          ${knownChapters.map(c => `<option ${c===currentChapter?'selected':''} value="${c}">${getChapterOrder(c)}.${c}</option>`).join('')}
        </select>
        <input id="lvlChapterNew" placeholder="Neues Kapitel" style="margin-top:8px;display:${currentChapter?'none':'block'};">
        <input type="number" id="lvlChapterOrder" min="1" max="9999" placeholder="Kapitel-Nr" style="margin-top:8px;display:${currentChapter?'none':'block'};">
      </div>

      <div class="customize-buttons">
        <button class="btn btn-secondary" id="lvlCancel">Abbrechen</button>
        <button class="btn btn-success"   id="lvlSave">Speichern</button>
      </div>
    `;

    ov.appendChild(pop);
    document.body.appendChild(ov);

    const iconInput = pop.querySelector('#lvlIcon');
    const iconSelect = pop.querySelector('#lvlIconSelect');
    const chapterSel  = pop.querySelector('#lvlChapter');
    const chapterInp  = pop.querySelector('#lvlChapterNew');
    const chapterOrd  = pop.querySelector('#lvlChapterOrder');
    if(iconSelect){
        iconSelect.onchange = () => {
            if(iconSelect.value) iconInput.value = iconSelect.value;
        };
    }
    const colorInput = pop.querySelector('#lvlColor');
    const histDiv = pop.querySelector('#lvlHistory');
    if(histDiv && colorInput){
        levelColorHistory.forEach(col => {
            const btn = document.createElement('button');
            btn.className = 'color-swatch';
            btn.style.background = col;
            btn.onclick = () => { colorInput.value = col; };
            histDiv.appendChild(btn);
        });
    }

    if(chapterSel){
        chapterSel.onchange = () => {
            const show = !chapterSel.value;
            if(chapterInp) chapterInp.style.display = show ? 'block' : 'none';
            if(chapterOrd) chapterOrd.style.display = show ? 'block' : 'none';
            if(show && chapterInp) chapterInp.focus();
        };
    }

    pop.querySelector('#lvlCancel').onclick = () => document.body.removeChild(ov);

    pop.querySelector('#lvlSave').onclick = () => {
        const oldOrder = getLevelOrder(levelName);
        const newName  = pop.querySelector('#lvlName').value.trim() || levelName;
        const newOrder = Math.max(1, parseInt(pop.querySelector('#lvlOrder').value) || oldOrder);
        const newColor = pop.querySelector('#lvlColor').value;
        const newIcon  = pop.querySelector('#lvlIcon').value || '📁';
        const selCh    = chapterSel ? chapterSel.value : '';
        const newCh    = chapterInp ? chapterInp.value.trim() : '';
        const chOrder  = parseInt(chapterOrd?.value);

        if(!selCh && newCh && !chapterOrd.value){
            alert('Bitte auch eine Kapitel-Nummer angeben.');
            return;
        }

        // Anzeigenamen der Projekte, falls noch identisch mit dem Levelnamen, ebenfalls aktualisieren
        const oldDisplayName = `${oldOrder}.${levelName}`;
        const newDisplayName = `${newOrder}.${newName}`;

        projects.forEach(p => {
            if (p.levelName === levelName) {
                // Nur anpassen, wenn der Projektname dem alten Levelnamen entspricht
                if (p.name === levelName || p.name === oldDisplayName || p.name === `${oldOrder} ${levelName}`) {
                    p.name = newDisplayName;
                }
                p.levelName = newName;
                p.color = newColor;
            }
        });

        if (levelName !== newName && levelChapters[levelName]) {
            delete levelChapters[levelName];
        }

        if (levelColors[levelName] && levelName !== newName) delete levelColors[levelName];
        if (levelOrders[levelName] && levelName !== newName) delete levelOrders[levelName];
        if (levelIcons[levelName]  && levelName !== newName) delete levelIcons[levelName];

        levelColors[newName] = newColor;
        updateLevelColorHistory(newColor);
        levelIcons[newName]  = newIcon;
        // Reihenfolge immer speichern
        setLevelOrder(newName, newOrder);

        const chapterName = selCh || newCh || getLevelChapter(levelName);
        setLevelChapter(newName, chapterName);
        if (!selCh && newCh) {
            const ord = Math.max(1, chOrder || 1);
            setChapterOrder(chapterName, ord);
        }

        if (expandedLevel === levelName) expandedLevel = newName;

        saveProjects();
        saveLevelColors();
        saveLevelOrders();
        saveLevelIcons();
        saveLevelChapters();
        saveChapterOrders();
        renderProjects();

        document.body.removeChild(ov);
    };
}
/* =========================== SHOW LEVEL CUSTOMIZATION END ========================== */

/* =========================== SHOW CHAPTER CUSTOMIZATION START ====================== */
function showChapterCustomization(chapterName, ev) {
    ev?.stopPropagation();
    const order = getChapterOrder(chapterName) || 1;
    const color = getChapterColor(chapterName);

    const ov = document.createElement('div');
    ov.className = 'customize-popup-overlay';
    ov.onclick   = () => document.body.removeChild(ov);

    const pop = document.createElement('div');
    pop.className = 'folder-customize-popup';
    pop.onclick   = e => e.stopPropagation();

    pop.innerHTML = `
      <h4>⚙️ Kapitel-Einstellungen</h4>

      <div class="customize-field">
        <label>Name:</label>
        <input id="chName" value="${chapterName}">
      </div>

      <div class="customize-field">
        <label>Reihenfolge:</label>
        <input type="number" id="chOrder" min="1" max="9999" value="${order}">
      </div>

      <div class="customize-field">
        <label>Farbe:</label>
        <input type="color" id="chColor" value="${color}">
        <div id="chHistory" class="color-history"></div>
      </div>

      <div class="customize-buttons">
        <button class="btn btn-danger" id="chDelete">Löschen</button>
        <button class="btn btn-secondary" id="chCancel">Abbrechen</button>
        <button class="btn btn-success"   id="chSave">Speichern</button>
      </div>
    `;

    ov.appendChild(pop);
    document.body.appendChild(ov);

    const colorInput = pop.querySelector('#chColor');
    const histDiv = pop.querySelector('#chHistory');
    if(histDiv && colorInput){
        levelColorHistory.forEach(col => {
            const btn = document.createElement('button');
            btn.className = 'color-swatch';
            btn.style.background = col;
            btn.onclick = () => { colorInput.value = col; };
            histDiv.appendChild(btn);
        });
    }

    pop.querySelector('#chCancel').onclick = () => document.body.removeChild(ov);

    pop.querySelector('#chDelete').onclick = () => {
        if (!confirm('Kapitel wirklich löschen?')) return;
        Object.keys(levelChapters).forEach(lvl => {
            if (levelChapters[lvl] === chapterName) delete levelChapters[lvl];
        });
        delete chapterOrders[chapterName];
        delete chapterColors[chapterName];
        if (expandedChapter === chapterName) expandedChapter = null;
        saveLevelChapters();
        saveChapterOrders();
        saveChapterColors();
        renderProjects();
        document.body.removeChild(ov);
    };

    pop.querySelector('#chSave').onclick = () => {
        const newName  = pop.querySelector('#chName').value.trim() || chapterName;
        const newOrder = Math.max(1, parseInt(pop.querySelector('#chOrder').value) || order);
        const newColor = pop.querySelector('#chColor').value;

        if (newName !== chapterName) {
            Object.keys(levelChapters).forEach(lvl => {
                if (levelChapters[lvl] === chapterName) {
                    levelChapters[lvl] = newName;
                }
            });
            if (chapterOrders[chapterName]) {
                chapterOrders[newName] = chapterOrders[chapterName];
                delete chapterOrders[chapterName];
            }
            if (chapterColors[chapterName]) {
                chapterColors[newName] = chapterColors[chapterName];
                delete chapterColors[chapterName];
            }
            if (expandedChapter === chapterName) expandedChapter = newName;
        }

        setChapterOrder(newName, newOrder);
        setChapterColor(newName, newColor);

        saveLevelChapters();
        saveChapterOrders();
        saveChapterColors();
        renderProjects();
        document.body.removeChild(ov);
    };
}
/* =========================== SHOW CHAPTER CUSTOMIZATION END ======================== */

function deleteLevel(levelName) {
    if (!confirm("Level wirklich löschen? Alle zugehörigen Projekte werden entfernt.")) return;
    projects = projects.filter(p => p.levelName !== levelName);
    if (levelColors[levelName]) delete levelColors[levelName];
    if (levelOrders[levelName]) delete levelOrders[levelName];
    if (levelIcons[levelName])  delete levelIcons[levelName];
    if (levelChapters[levelName]) delete levelChapters[levelName];
    if (expandedLevel === levelName) expandedLevel = null;
    saveProjects();
    saveLevelColors();
    saveLevelOrders();
    saveLevelIcons();
    saveLevelChapters();
    renderProjects();
}

function deleteChapter(chapterName) {
    if (!confirm("Kapitel wirklich löschen?")) return;
    Object.keys(levelChapters).forEach(lvl => {
        if (levelChapters[lvl] === chapterName) delete levelChapters[lvl];
    });
    delete chapterOrders[chapterName];
    delete chapterColors[chapterName];
    if (expandedChapter === chapterName) expandedChapter = null;
    saveLevelChapters();
    saveChapterOrders();
    saveChapterColors();
    renderProjects();
}

/* =========================== QUICK ADD LEVEL START =========================== */
function quickAddLevel(chapterName) {
    // Nächste freie Nummer für ein "Neu"-Level finden
    const levelNames = Object.keys(levelOrders);
    let maxNum = 0;
    levelNames.forEach(n => {
        const m = n.match(/^Neu (\d+)$/);
        if (m) {
            const num = parseInt(m[1]);
            if (num > maxNum) maxNum = num;
        }
    });

    const orderValues = Object.values(levelOrders);
    const nextOrder = orderValues.length ? Math.max(...orderValues) + 1 : 1;
    const name = `Neu ${maxNum + 1}`;

    levelOrders[name] = nextOrder;
    levelChapters[name] = chapterName;
    levelColors[name] = '#444444';
    levelIcons[name] = '📁';

    saveLevelOrders();
    saveLevelChapters();
    saveLevelColors();
    saveLevelIcons();
    renderProjects();
}
/* =========================== QUICK ADD LEVEL END =========================== */



        function updateProjectCustomizationPreview() {
            const colorInput = document.getElementById('customProjectColor');
            const colorPreview = document.getElementById('projectColorPreview');

            if (colorInput && colorPreview) {
                colorPreview.style.background = colorInput.value;
            }
        }
		
		

        function applyProjectPreset(projectId) {
            const presetSelect = document.getElementById('projectPresetSelect');
            const colorInput = document.getElementById('customProjectColor');
            
            const presets = {
                'game': { icon: '🎮', color: '#ff6b1a' },
                'work': { icon: '💼', color: '#1976d2' },
                'personal': { icon: '👤', color: '#388e3c' },
                'translation': { icon: '🌐', color: '#7b1fa2' },
                'audio': { icon: '🎵', color: '#d32f2f' },
                'archive': { icon: '📦', color: '#616161' },
                'test': { icon: '🧪', color: '#f57c00' },
                'backup': { icon: '💾', color: '#2e7d32' },
                'folder': { icon: '🗂️', color: '#333333' }
            };
            
            const preset = presets[presetSelect.value];
            if (preset) {
                colorInput.value = preset.color;
                updateProjectCustomizationPreview();
            }
        }

        function saveProjectCustomization(projectId) {
            const colorInput = document.getElementById('customProjectColor');

            const project = projects.find(p => p.id === projectId);
            if (project) {
                project.color = colorInput.value || '#333333';
                
                saveProjects();
                renderProjects();
                
                // Maintain active selection
                document.querySelectorAll('.project-item').forEach(item => {
                    item.classList.toggle('active', item.dataset.projectId == currentProject?.id);
                });
                
                closeProjectCustomization();
                updateStatus('Projekt-Anpassung gespeichert');
            }
        }

        function resetProjectCustomization(projectId) {
            if (confirm('Möchten Sie die Anpassungen für dieses Projekt wirklich zurücksetzen?')) {
                const project = projects.find(p => p.id === projectId);
                if (project) {
                    project.color = '#333333';
                    
                    saveProjects();
                    renderProjects();
                    
                    // Maintain active selection
                    document.querySelectorAll('.project-item').forEach(item => {
                        item.classList.toggle('active', item.dataset.projectId == currentProject?.id);
                    });
                    
                    closeProjectCustomization();
                    updateStatus('Projekt-Anpassung zurückgesetzt');
                }
            }
        }

        function closeProjectCustomization() {
            const overlay = document.querySelector('.customize-popup-overlay');
            const popup = document.querySelector('.folder-customize-popup');
            
            if (overlay) overlay.remove();
            if (popup) popup.remove();
        }

        function handleRowDragOver(e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            if (Array.from(e.dataTransfer.types).includes('Files')) {
                e.dataTransfer.dropEffect = 'copy';
                const row = e.currentTarget.closest('tr');
                if (row) handleFileDragEnter(e);
                return;
            }
            // Nur Reihenfolge ändern, wenn ein Element gezogen wird
            if (!draggedElement) return false;

            e.dataTransfer.dropEffect = 'move';

            const row = e.currentTarget.closest('tr');
            const container = row.parentNode;
            const afterElement = getDragAfterElement(container, e.clientY);
            if (afterElement == null) {
                container.appendChild(draggedElement);
            } else {
                container.insertBefore(draggedElement, afterElement);
            }
            
            return false;
        }

        function handleReorderDrop(e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            
            const draggedId = parseFloat(draggedElement.dataset.id);
            const draggedIndex = files.findIndex(f => f.id === draggedId);
            const draggedFile = files[draggedIndex];
            
            files.splice(draggedIndex, 1);
            
            const rows = Array.from(document.querySelectorAll('#fileTableBody tr'));
            const newIndex = rows.indexOf(draggedElement);
            
            files.splice(newIndex, 0, draggedFile);
            
            // Reset display order to reflect new order
            displayOrder = files.map((file, index) => ({ file, originalIndex: index }));
            
            markDirty();
            
            renderFileTable();
            
            return false;
        }

        // Datei-Upload per Drag & Drop
        function handleFileDragEnter(e) {
            if (!Array.from(e.dataTransfer.types).includes('Files')) return;
            e.preventDefault();
            const row = e.currentTarget.closest('tr');
            row.classList.add('upload-drop-target');
            let overlay = row.querySelector('.upload-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.className = 'upload-overlay';
                const id = parseFloat(row.dataset.id);
                const f = files.find(fl => fl.id === id);
                overlay.textContent = `Upload für ${f?.filename || ''}`;
                row.appendChild(overlay);
            }
        }

        function handleFileDragLeave(e) {
            if (!Array.from(e.dataTransfer.types).includes('Files')) return;
            const row = e.currentTarget.closest('tr');
            // Nur entfernen, wenn die Zeile tatsächlich verlassen wird
            if (!row.contains(e.relatedTarget)) {
                row.classList.remove('upload-drop-target');
                const overlay = row.querySelector('.upload-overlay');
                if (overlay) overlay.remove();
            }
        }

       async function handleRowDrop(e) {
           if (Array.from(e.dataTransfer.types).includes('Files')) {
                // Standardverhalten verhindern und Aufpropagieren stoppen,
                // damit der Upload nur einmal erfolgt
                e.preventDefault();
                e.stopPropagation();
                const row = e.currentTarget.closest('tr');
                const fileId = parseFloat(row.dataset.id);
                const fileObj = files.find(f => f.id === fileId);
                const dropped = e.dataTransfer.files[0];
                row.classList.remove('upload-drop-target');
                const overlay = row.querySelector('.upload-overlay');
                if (overlay) overlay.remove();
                if (dropped && fileObj) {
                    await uploadDeFile(dropped, getFullPath(fileObj));
                }
                return false;
            }

            handleReorderDrop(e);
        }

        async function uploadDeFile(datei, zielPfad) {
            if (!datei || !zielPfad) return;
            const f = files.find(fl => getFullPath(fl) === zielPfad);
            const vorhandene = f ? getDeFilePath(f) : null;
            if (window.electronAPI && window.electronAPI.saveDeFile) {
                const buffer = await datei.arrayBuffer();
                await window.electronAPI.saveDeFile(zielPfad, new Uint8Array(buffer));
                // Bereits vorhandenes Backup ersetzen, damit Zurücksetzen die neue Datei nutzt
                if (window.electronAPI.deleteDeBackupFile) {
                    await window.electronAPI.deleteDeBackupFile(zielPfad);
                }
                if (window.electronAPI.backupDeFile) {
                    await window.electronAPI.backupDeFile(zielPfad);
                }
                setDeAudioCacheEntry(zielPfad, `sounds/DE/${zielPfad}`);
                await updateHistoryCache(zielPfad);
            } else {
                await speichereUebersetzungsDatei(datei, zielPfad);
            }
            if (f) {
                // Versionsnummer automatisch erhöhen, falls bereits Datei vorhanden
                if (vorhandene) {
                    f.version = (f.version || 1) + 1;
                }
                // Bearbeitungs-Flags zurücksetzen, da es sich um eine neue Datei handelt
                f.trimStartMs = 0;
                f.trimEndMs = 0;
                f.volumeMatched = false;
                f.radioEffect = false;
                f.hallEffect = false;
                f.emiEffect = false;
                f.neighborEffect = false;
                f.neighborHall = false;
                // Fertig-Status ergibt sich nun automatisch
            }
            markDirty();
            renderFileTable();
            updateStatus('DE-Datei gespeichert');
        }

        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('tr:not(.dragging)')];
            
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }

        // Status updates
        function updateStatus(message) {
            const statusText = document.getElementById('statusText');
            if (message) {
                // Aktiven Speichermodus ermitteln
                let mode = window.localStorage.getItem('hla_storageMode') === 'indexedDB' ? 'Datei-Modus' : 'LocalStorage';
                if (mode === 'Datei-Modus') {
                    const caps = window.storage && window.storage.capabilities;
                    mode = (caps && caps.blobs !== 'opfs') ? 'Datei-Modus (Base64)' : 'Datei-Modus (OPFS)';
                }
                // Bei Speicherhinweisen den Modus ergänzen
                if (message.toLowerCase().includes('gespeichert')) {
                    message += ` (im ${mode})`;
                }
                statusText.textContent = message;
                setTimeout(() => {
                    statusText.textContent = isDirty ? 'Ungespeicherte Änderungen' : 'Bereit';
                }, 3000);
            } else {
                statusText.textContent = isDirty ? 'Ungespeicherte Änderungen' : 'Bereit';
            }
        }

        // Zeigt kurz eingeblendete Hinweise an
        function showToast(message, type = '') {
            const div = document.createElement('div');
            div.className = 'toast' + (type ? ' ' + type : '');
            div.textContent = message;
            document.getElementById('toastContainer').appendChild(div);
            setTimeout(() => div.remove(), 4000);
        }

        // Zeigt ein rotes Banner mit Wiederholen-Knopf
        function showErrorBanner(message, retryFn) {
            const banner = document.getElementById('errorBanner');
            const text = document.getElementById('errorBannerMessage');
            const btn = document.getElementById('errorBannerRetry');
            if (!banner || !text || !btn) return;
            text.textContent = message;
            btn.onclick = () => {
                banner.classList.add('hidden');
                if (retryFn) retryFn();
            };
            banner.classList.remove('hidden');
        }

        function hideErrorBanner() {
            const banner = document.getElementById('errorBanner');
            if (banner) banner.classList.add('hidden');
        }

        // Zeigt ein modales Dialogfenster mit HTML-Inhalt an
        function showModal(html) {
            const ov = document.createElement('div');
            ov.className = 'dialog-overlay hidden';
            ov.innerHTML = `<div class="dialog">${html}</div>`;
            ov.addEventListener('click', () => ov.remove());
            document.body.appendChild(ov);
            ov.classList.remove('hidden');
            return ov;
        }

        // Einfache Eingabeaufforderung als Ersatz für prompt()
        function showInputDialog(message, value = '') {
            return new Promise(resolve => {
                const ov = document.createElement('div');
                ov.className = 'dialog-overlay hidden';
                ov.innerHTML = `<div class="dialog">
                    <p>${escapeHtml(message)}</p>
                    <input id="dlgInput" type="text" value="${escapeHtml(value)}" style="width:100%;padding:8px;margin-top:10px;background:#1a1a1a;border:1px solid #444;border-radius:4px;color:#e0e0e0;">
                    <div class="dialog-buttons">
                        <button class="btn btn-secondary" id="dlgCancel">Abbrechen</button>
                        <button class="btn btn-success" id="dlgOk">OK</button>
                    </div>
                </div>`;

                const cleanup = result => {
                    document.body.removeChild(ov);
                    resolve(result);
                };
                ov.addEventListener('click', e => { if (e.target === ov) cleanup(null); });
                const dlg = ov.querySelector('.dialog');
                dlg.addEventListener('click', e => e.stopPropagation());
                dlg.querySelector('#dlgCancel').onclick = () => cleanup(null);
                dlg.querySelector('#dlgOk').onclick = () => cleanup(dlg.querySelector('#dlgInput').value.trim());
                document.body.appendChild(ov);
                ov.classList.remove('hidden');
                dlg.querySelector('#dlgInput').focus();
            });
        }



        // Spezieller Dialog für die Versionsnummer
        // Liefert ein Objekt mit der eingegebenen Zahl und einem Flag, ob alle
        // Dateien im selben Ordner angepasst werden sollen
        function showVersionDialog(message, value = '') {
            return new Promise(resolve => {
                const ov = document.createElement('div');
                ov.className = 'dialog-overlay hidden';
                ov.innerHTML = `<div class="dialog">
                    <p>${escapeHtml(message)}</p>
                    <input id="dlgVersion" type="text" value="${escapeHtml(value)}" style="width:100%;padding:8px;margin-top:10px;background:#1a1a1a;border:1px solid #444;border-radius:4px;color:#e0e0e0;">
                    <div class="dialog-buttons">
                        <button class="btn btn-secondary" id="dlgCancel">Abbrechen</button>
                        <button class="btn btn-success" id="dlgOk">\u00dcbernehmen</button>
                        <button class="btn btn-primary" id="dlgAll">F\u00fcr alle \u00fcbernehmen</button>
                    </div>
                </div>`;

                const cleanup = result => {
                    document.body.removeChild(ov);
                    resolve(result);
                };
                ov.addEventListener('click', e => { if (e.target === ov) cleanup(null); });
                const dlg = ov.querySelector('.dialog');
                dlg.addEventListener('click', e => e.stopPropagation());
                const inp = dlg.querySelector('#dlgVersion');
                dlg.querySelector('#dlgCancel').onclick = () => cleanup(null);
                dlg.querySelector('#dlgOk').onclick = () => cleanup({ value: inp.value.trim(), applyAll: false });
                dlg.querySelector('#dlgAll').onclick = () => cleanup({ value: inp.value.trim(), applyAll: true });
                document.body.appendChild(ov);
                ov.classList.remove('hidden');
                inp.focus();
            });
        }

        // Merkt das aktuelle Dubbing-Item für den Ordner-Watcher
        function setActiveDubItem(item) {
            files.forEach(f => delete f.waitingForManual);
            if (item) item.waitingForManual = true;
        }

        // Liefert die Zeile, die auf einen manuellen Import wartet
        function getActiveDubItem() {
            return files.find(f => f.waitingForManual);
        }

        // Markiert eine Datei als bereit und aktualisiert die Anzeige
        // Markiert eine Datei als bereit und aktualisiert die Anzeige
        // Das Präfix "sounds/DE/" wird nun Groß-/Kleinschreibungs-unabhängig entfernt
        function markDubAsReady(id, dest, lang = 'de') {
            const file = files.find(f => f.id === id);
            if (!file) return;
            const rel = dest.replace(/^sounds\/DE\//i, '');
            // Vorhandene Datei vor Überschreiben prüfen
            const vorhandene = getDeFilePath(file);
            setDeAudioCacheEntry(rel, dest);
            if (lang === 'emo') file.emoDubReady = true; else file.dubReady = true;
            if (vorhandene) {
                file.version = (file.version || 1) + 1;
            }
            file.waitingForManual = false;
            // Bearbeitungs-Status zurücksetzen, da jetzt eine neue Datei vorliegt
            file.trimStartMs = 0;
            file.trimEndMs = 0;
            file.volumeMatched = false;
            file.radioEffect = false;
            file.hallEffect = false;
            file.emiEffect = false;
            file.neighborEffect = false;
            file.neighborHall = false;
            renderFileTable();
            saveCurrentProject();
        }

        window.ui = { getActiveDubItem, markDubAsReady, notify: showToast, showModal, showInputDialog, setActiveDubItem, showErrorBanner, hideErrorBanner, toggleEmoCompletion, showZipImportDialog, handleZipImport };

        function updateCounts() {
            const fileCount = document.getElementById('fileCount');
            const selectedCount = document.getElementById('selectedCount');
            
            fileCount.textContent = `${files.length} Dateien`;
            selectedCount.textContent = `${files.filter(f => f.selected).length} ausgewählt`;
            
            updateFileAccessStatus();
        }

        // Anzeige des aktuellen Projektordnerpfads aktualisieren
        function updateProjectFolderPathDisplay() {
            const pathSpan = document.getElementById('projectFolderPath');
            if (pathSpan) {
                if (window.electronAPI) {
                    pathSpan.textContent = 'sounds';
                } else {
                    pathSpan.textContent = projektOrdnerHandle ? projektOrdnerHandle.name : 'Kein Projektordner';
                }
            }
        }

        // Utility functions
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        // Hilfsfunktion für RegExp-Erstellung
        function escapeRegExp(str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        // Prüft, ob ein Wort aus dem Wörterbuch im angegebenen Text vorkommt
        function textContainsWord(text) {
            const lower = (text || '').toLowerCase();
            return phoneticList.some(e => {
                const w = (e.word || '').trim().toLowerCase();
                if (!w) return false;
                const re = new RegExp('\\b' + escapeRegExp(w) + '\\b');
                return re.test(lower);
            });
        }

        // Sofortiges Speichern bei Änderungen in Texteingaben
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('text-input')) {
                // Eingabefeld automatisch in der Höhe anpassen
                autoResizeInput(e.target);

                // Änderungen ohne Verzögerung sichern
                saveCurrentProject();
            }
        });

        // Additional events for better text area handling
        document.addEventListener('keyup', (e) => {
            if (e.target.classList.contains('text-input')) {
                autoResizeInput(e.target);
            }
        });

        document.addEventListener('paste', (e) => {
            if (e.target.classList.contains('text-input')) {
                // Small delay to let paste complete
                setTimeout(() => {
                    autoResizeInput(e.target);
                }, 10);
            }
        });

        // Double-click to edit project name or change row numbers
        document.addEventListener('dblclick', (e) => {
            const projectItem = e.target.closest('.project-item');
            if (projectItem) {
                const projectId = parseInt(projectItem.dataset.projectId);
                const project = projects.find(p => p.id === projectId);
                if (project) {
                    // Projekt über Dialog anpassen statt prompt()
                    showProjectCustomization(projectId, e);
                }
            }
        });

        // Error handling
        window.addEventListener('error', (e) => {
            console.error('Fehler:', e);
            updateStatus('Ein Fehler ist aufgetreten');
        });

        // Window resize handling for text inputs
        window.addEventListener('resize', () => {
            resizeTextFields();
        });

        // Initialize app
        debugLog('%c🎮 Half-Life: Alyx Translation Tool geladen!', 'color: #ff6b1a; font-size: 16px; font-weight: bold;');
        debugLog(`Version ${APP_VERSION} - Streaming-Fix`);
        debugLog('✨ NEUE FEATURES:');
        debugLog('• 📊 Globale Übersetzungsstatistiken: Projekt-übergreifendes Completion-Tracking');
        debugLog('• 🟢 Ordner-Completion-Status: Grüne Rahmen für vollständig übersetzte Ordner');
        debugLog('• ✅ Datei-Markierungen: Einzelne Dateien zeigen Übersetzungsstatus');
        debugLog('• ✅ Level-Haken: Level-Reiter zeigen Vollständigkeit an');
        debugLog('• 📈 Fortschritts-Prozentsätze: Detaillierte Statistiken pro Ordner');
        debugLog('• 🎯 Smart-Sortierung: Übersetzte Dateien werden gruppiert angezeigt');
        debugLog('• 📋 Projekt-Integration: Zeigt in welchen Projekten Dateien übersetzt sind');
        debugLog('✅ ERWEITERTE FEATURES:');
        debugLog('• 🔍 Erweiterte Suche: Ähnlichkeitssuche mit Normalisierung (ignoriert Groß-/Kleinschreibung, Punkte, Kommas)');
        debugLog('• ⌨️ Keyboard-Navigation: Tab/Shift+Tab zwischen Textfeldern, Pfeiltasten für Zeilen, Leertaste für Audio');
        debugLog('• 🖱️ Context-Menu: Rechtsklick für Audio, Text kopieren/einfügen, Ordner öffnen, Löschen');
        debugLog('• 📋 Copy-Buttons: Direkte Kopierfunktion neben Textfeldern mit visuellem Feedback');
        debugLog('• 📊 Fortschritts-Tracking: Completion-Status pro Datei, Statistiken pro Ordner');
        debugLog('• 📋 Spalten-Sortierung: Nach Position, Name, Ordner, Completion - behält Export-Reihenfolge');
        debugLog('• 📥 Erweiterte Import-Funktion: Intelligente Spalten-Erkennung mit Datenbank-Vergleich');
        debugLog('✅ BESTEHENDE FEATURES:');
        debugLog('• 🗂️ Projektverwaltung mit Auto-Save, Icons und Farben');
        debugLog('• 🎨 Projekt & Ordner-Anpassung: Icons und Farben');
        debugLog('• 📝 Drag & Drop Sortierung für Projekte und Dateien');
        debugLog('• 🔢 Zeilennummer-Anpassung: Doppelklick auf # um Position zu ändern');
        debugLog('• 📁 Intelligenter Ordner-Scan: Erkennt Struktur auf allen Ebenen');
        debugLog('• 🧠 Smart Folder Detection: Findet Charaktere/Ordner automatisch');
        debugLog('• 🔄 Universelles Auto-Scan für ALLE Funktionen');
        debugLog('• ⚡ Intelligente Berechtigung-Erkennung mit sofortigem Scan');
        debugLog('• 📏 Auto-Height Textboxen - EN/DE gleich breit, Höhe synchronisiert');
        debugLog('• 📐 Responsive Spaltenbreite für alle Fenstergrößen');
        debugLog('• ▶ Audio-Wiedergabe mit Auto-Scan direkt im Browser');
        debugLog('• 💾 Backup/Restore mit Projekt-Migration');
        debugLog('• 🛠️ Debug-Tools für Datenquellen-Analyse');
        debugLog('• 🎯 Highlighting von Suchbegriffen');
        debugLog('🚀 REVOLUTIONÄR: Projekt-übergreifende Verfolgung des Übersetzungsfortschritts mit visuellen Indikatoren!');

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        initiateDubbing,
        initiateEmoDubbing,
        showEmoDubbingSettings,
        openDubbingPage,
        openLocalFile,
        startDubAutomation,
        updateDubStatusForFiles,
        markDubAsReady,
        cleanupDubCache,
        getProjectPlaybackList,
        ensurePlaybackOrder,
        applyDeEdit,
        speichereUebersetzungsDatei,
        // 🔄 Projektbereinigung & Dateiendungs-Reparatur
        updateAllFilePaths,
        bufferToWav,
        repairFileExtensions,
        updateAutoTranslation,
        cancelTranslationQueue,
        importClosecaptions,
        stripColorCodes,
        calculateTextSimilarity,
        copyFolderName,
        copyDownloadFolder,
        copyAllEmotionsToClipboard,
        adjustEmotionalText,
        improveEmotionalText,
        toggleEmoCompletion,
        __setFiles: f => { files = f; },
        __setDeAudioCache: c => { deAudioCache = c; },
        __setRenderFileTable: fn => { renderFileTable = fn; },
        __setSaveCurrentProject: fn => { saveCurrentProject = fn; },
        // Setter für Tests, um das aktive Projekt zu setzen
        __setCurrentProject: p => { currentProject = p; },
        __setDisplayOrder: arr => { displayOrder = arr; },
        __getDisplayOrder: () => displayOrder,
        __setProjects: p => { projects = p; },
        __setFilePathDatabase: db => { filePathDatabase = db; },
        __setTextDatabase: db => { textDatabase = db; },
        __setGetAudioDuration: fn => { getAudioDurationFn = fn; },
        markDirty,
        saveCurrentProject,
        autoApplySuggestion,
        insertGptResults,
        updateGptSummary,
        insertEnglishSegment,
        // Export der Segmentierungsfunktionen fuer Tests und externe Nutzung
        openSegmentDialog,
        closeSegmentDialog,
        analyzeSegmentFile,
        exportSegmentsToProject,
        toggleIgnoreSelectedSegments,
        mergeSegments,
        removeRangesFromBuffer,
        __setSegmentInfo: info => { segmentInfo = info; },
        __setSegmentAssignments: a => { segmentAssignments = a; },
        __getSegmentInfo: () => segmentInfo,
        __getSegmentAssignments: () => segmentAssignments,
        __setIgnoredSegments: arr => { ignoredSegments = new Set(arr); },
        __getIgnoredSegments: () => Array.from(ignoredSegments),
        // Preset-Funktionen fuer Tests
        saveRadioPreset,
        loadRadioPreset,
        deleteRadioPreset,
        __setRadioPresets: obj => { radioPresets = obj; },
        __getRadioPresets: () => radioPresets,
        saveEmiPreset,
        loadEmiPreset,
        deleteEmiPreset,
        __setEmiPresets: obj => { emiPresets = obj; },
        __getEmiPresets: () => emiPresets,
        startProjectPlayback,
        stopProjectPlayback,
        openPlaybackList,
        closePlaybackList,
        __getPlaybackProtocol: () => playbackProtocol,
        // Testzugriff auf die Berechnung der EM-Hüllkurve
        __computeEmiEnvelope: computeEmiEnvelope
    };
}

