// =========================== GLOBAL STATE START ===========================
let projects               = [];
let levelColors            = {}; // ⬅️ NEU: globale Level-Farben
let levelOrders            = {}; // ⬅️ NEU: Reihenfolge der Level
let levelIcons             = {}; // ⬅️ NEU: Icon je Level
let levelColorHistory     = JSON.parse(localStorage.getItem('hla_levelColorHistory') || '[]'); // ➡️ Merkt letzte 5 Farben
let currentProject         = null;
let files                  = [];
let textDatabase           = {};
let filePathDatabase       = {}; // Dateiname → Pfade
let audioFileCache         = {}; // Zwischenspeicher für Audio-Dateien
let deAudioCache           = {}; // Zwischenspeicher für DE-Audios
let historyPresenceCache   = {}; // Merkt vorhandene History-Dateien
let folderCustomizations   = {}; // Speichert Icons/Farben pro Ordner
let isDirty                = false;
let aktiveOrdnerDateien    = []; // Aktuelle Dateiliste im Ordner-Browser

// Verfügbarkeit der Electron-API einmalig prüfen
const isElectron = !!window.electronAPI;
if (!isElectron) {
    console.warn('🚫 Electron-API nicht verfügbar – Fallback auf Browser-Modus');
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
let editEnBuffer           = null; // AudioBuffer der NE-Datei
let editProgressTimer      = null; // Intervall für Fortschrittsanzeige
let editPlaying            = null; // "orig" oder "de" während Wiedergabe
let editPaused             = false; // merkt Pausenstatus
// Eigene Cursorpositionen für EN und DE
let editOrigCursor         = 0;    // Position der EN-Wiedergabe in ms
let editDeCursor           = 0;    // Position der DE-Wiedergabe in ms
let editBlobUrl            = null; // aktuelle Blob-URL

let draggedElement         = null;
let currentlyPlaying       = null;
let selectedRow            = null; // für Tastatur-Navigation
let contextMenuFile        = null; // Rechtsklick-Menü-Datei
let currentSort            = { column: 'position', direction: 'asc' };
let displayOrder           = []; // Original-Dateireihenfolge
let expandedLevel          = null; // aktuell geöffneter Level
let levelChapters         = {}; // Zuordnung Level → Kapitel
let chapterOrders         = {}; // Reihenfolge der Kapitel
let expandedChapter       = null; // aktuell geöffnetes Kapitel
let chapterColors         = {}; // Farbe pro Kapitel

// Status für Projekt-Wiedergabe
let projectPlayState       = 'stopped'; // 'playing', 'paused'
let projectPlayIndex       = 0;        // Aktuelle Datei im Projekt
let playbackFiles          = [];       // Gefilterte Liste fuer Projekt-Wiedergabe

// Automatische Backup-Einstellungen
let autoBackupInterval = parseInt(localStorage.getItem('hla_autoBackupInterval')) || 10; // Minuten
let autoBackupLimit    = parseInt(localStorage.getItem('hla_autoBackupLimit')) || 10;
let autoBackupTimer    = null;

// Warteschlange für automatische Übersetzungen
let translateQueue     = [];
let translateRunning   = false;

// API-Key für ElevenLabs und hinterlegte Stimmen pro Ordner
let elevenLabsApiKey   = localStorage.getItem('hla_elevenLabsApiKey') || '';
// Liste der verfügbaren Stimmen der API
let availableVoices    = [];
// Manuell hinzugefügte Stimmen
let customVoices       = JSON.parse(localStorage.getItem('hla_customVoices') || '[]');
// Gespeicherte Voice-Settings aus dem LocalStorage laden
let storedVoiceSettings = JSON.parse(localStorage.getItem('hla_voiceSettings') || 'null');

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
let csvLineEnding = localStorage.getItem('hla_lineEnding') || 'LF';
// Merkt die Datei, für die der Dubbing-Dialog geöffnet wurde
let currentDubbingFileId = null;
// Gewählter Modus für Dubbing: 'beta' oder 'manual'
let currentDubMode = 'beta';

// Letzte Einstellungen des Funk-Effekts
// Wet bestimmt das Mischverhältnis zwischen Original und Effekt
let radioEffectStrength = parseFloat(localStorage.getItem('hla_radioEffectStrength') || '0.85');
let radioHighpass      = parseFloat(localStorage.getItem('hla_radioHighpass') || '300');
let radioLowpass       = parseFloat(localStorage.getItem('hla_radioLowpass') || '3200');
let radioSaturation    = parseFloat(localStorage.getItem('hla_radioSaturation') || '0.2');
let radioNoise         = parseFloat(localStorage.getItem('hla_radioNoise') || '-26');
let radioCrackle       = parseFloat(localStorage.getItem('hla_radioCrackle') || '0.1');

// === Stacks für Undo/Redo ===
let undoStack          = [];
let redoStack          = [];

// Version wird zur Laufzeit ersetzt
// Aktuelle Programmversion
const APP_VERSION = '1.40.5';
// Basis-URL der API
const API = 'https://api.elevenlabs.io/v1';

// Gemeinsame Funktionen aus elevenlabs.js laden
let createDubbing, downloadDubbingAudio, renderLanguage, pollRender;
if (typeof module !== 'undefined' && module.exports) {
    ({ createDubbing, downloadDubbingAudio, renderLanguage, pollRender } = require('../../elevenlabs'));
} else {
    import('./elevenlabs.js').then(mod => {
        createDubbing = mod.createDubbing;
        downloadDubbingAudio = mod.downloadDubbingAudio;
    });
    import('./lib/elevenlabs.js').then(mod => {
        renderLanguage = mod.renderLanguage;
        pollRender = mod.pollRender;
    });
}

// =========================== GLOBAL STATE END ===========================

// Entfernt versehentlich falsch gespeicherte Einträge aus dem DE-Cache
function cleanupDubCache() {
    for (const key of Object.keys(deAudioCache)) {
        if (key.match(/^sounds\/DE\//i)) {
            const neu = key.replace(/^sounds\/DE\//i, '');
            if (!deAudioCache[neu]) {
                deAudioCache[neu] = deAudioCache[key];
            }
            delete deAudioCache[key];
        }
    }
}


// =========================== DEBUG LOG START ===========================
// Schreibt Meldungen in die Browser-Konsole und die Debug-Anzeige
function debugLog(...args) {
    console.log(...args);
    const div = document.getElementById('debugConsole');
    if (div) {
        div.textContent += args.join(' ') + '\n';
        div.scrollTop = div.scrollHeight;
    }
}

// =========================== ERROR-HANDLING START ===========================
// Leitet JavaScript-Fehler in die Debug-Konsole um
window.addEventListener('error', (event) => {
    debugLog('FEHLER:', event.message);
});
// Ergänzt console.error, damit Fehler im Debug-Bereich auftauchen
const origConsoleError = console.error;
console.error = function(...args) {
    origConsoleError.apply(console, args);
    debugLog('FEHLER:', ...args);
};
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
    document.getElementById('dubbingLogDialog').style.display = 'flex';
}

function closeDubbingLog() {
    document.getElementById('dubbingLogDialog').style.display = 'none';
}

function copyDubbingLog() {
    navigator.clipboard.writeText(dubbingLogMessages.join('\n'));
    updateStatus('Dubbing-Log kopiert');
}

function clearDubbingLog() {
    // Log-Einträge entfernen (keine Speicherung mehr)
    dubbingLogMessages = [];
    const logPre = document.getElementById('dubbingLog');
    if (logPre) logPre.textContent = '';
    updateStatus('Dubbing-Log gelöscht');
}
// =========================== DUBBING-LOG END ===========================
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
    updateProjectPlaybackButtons();
    // Beim Start alte, falsch gespeicherte Cache-Einträge entfernen
    cleanupDubCache();
    // DevTools-Knopf wird immer eingeblendet


    // Desktop-Version: automatisch EN- und DE-Ordner einlesen
    if (window.electronAPI) {
        window.electronAPI.scanFolders().then(data => {
            // EN-Dateien einlesen (nur Pfade)
            verarbeiteGescannteDateien(data.enFiles);
            // DE-Dateien als Pfade merken
            data.deFiles.forEach(file => {
                deAudioCache[file.fullPath] = `sounds/DE/${file.fullPath}`;
            });
            // Nach dem Einlesen Projekte und Zugriffsstatus aktualisieren
            updateAllProjectsAfterScan();
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
                deAudioCache[destRel] = dest;
                await updateHistoryCache(destRel);
                ziel.dubReady = true;
                ziel.waitingForManual = false;
                renderFileTable();
                saveCurrentProject();
                const name = dest.split('/').pop();
                showToast(`${name} importiert.`);
                updateStatus('DE-Datei gespeichert');
                updateDownloadWaitDialog(name);
            });
        }

        // Automatischer Import abgeschlossen
        if (window.electronAPI.onDubDone) {
            window.electronAPI.onDubDone(info => {
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
                showToast(`Dubbing fertig: ${info.dest.split('/').pop()}`);
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
    }

    // 🟩 NEU: Level-Farben laden
    const savedLevelColors = localStorage.getItem('hla_levelColors');
    if (savedLevelColors) {
        levelColors = JSON.parse(savedLevelColors);
    }

    const savedLevelOrders = localStorage.getItem('hla_levelOrders');
    if (savedLevelOrders) {
        levelOrders = JSON.parse(savedLevelOrders);
    }

    const savedLevelIcons = localStorage.getItem('hla_levelIcons');
    if (savedLevelIcons) {
        levelIcons = JSON.parse(savedLevelIcons);
    }

    const savedLevelChapters = localStorage.getItem('hla_levelChapters');
    if (savedLevelChapters) {
        levelChapters = JSON.parse(savedLevelChapters);
    }

    const savedChapterOrders = localStorage.getItem('hla_chapterOrders');
    if (savedChapterOrders) {
        chapterOrders = JSON.parse(savedChapterOrders);
    }

    const savedChapterColors = localStorage.getItem('hla_chapterColors');
    if (savedChapterColors) {
        chapterColors = JSON.parse(savedChapterColors);
    }

    // Wichtig: Kapitel-Daten müssen vor dem Laden der Projekte vorhanden sein,
    // sonst sortiert sich die Liste beim ersten Start falsch
    loadProjects();

    initializeEventListeners();

    // 📁 Ordner-Anpassungen laden
    const savedCustomizations = localStorage.getItem('hla_folderCustomizations');
    if (savedCustomizations) {
        folderCustomizations = JSON.parse(savedCustomizations);
    }

    // 📂 Datei-Pfad-Datenbank laden
    const savedPathDB = localStorage.getItem('hla_filePathDatabase');
    if (savedPathDB) {
        filePathDatabase = JSON.parse(savedPathDB);
    }
    // Verwaiste Ordner-Anpassungen bereinigen
    cleanupOrphanCustomizations();

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
        localStorage.setItem('hla_levelColors', JSON.stringify(levelColors));
    } catch (e) {
        console.error('[saveLevelColors] Speichern fehlgeschlagen:', e);
    }
}
// =========================== SAVELEVELCOLORS END ===========================

// =========================== SAVELEVELORDERS START ==========================
function saveLevelOrders() {
    try {
        localStorage.setItem('hla_levelOrders', JSON.stringify(levelOrders));
    } catch (e) {
        console.error('[saveLevelOrders] Speichern fehlgeschlagen:', e);
    }
}
// =========================== SAVELEVELORDERS END ============================

// =========================== SAVELEVELICONS START ===========================
function saveLevelIcons() {
    try {
        localStorage.setItem('hla_levelIcons', JSON.stringify(levelIcons));
    } catch (e) {
        console.error('[saveLevelIcons] Speichern fehlgeschlagen:', e);
    }
}
// =========================== SAVELEVELICONS END =============================

// =========================== SAVELEVELCHAPTERS START ========================
function saveLevelChapters() {
    try {
        localStorage.setItem('hla_levelChapters', JSON.stringify(levelChapters));
    } catch (e) {
        console.error('[saveLevelChapters] Speichern fehlgeschlagen:', e);
    }
}
// =========================== SAVELEVELCHAPTERS END ==========================

// =========================== SAVECHAPTERORDERS START ========================
function saveChapterOrders() {
    try {
        localStorage.setItem('hla_chapterOrders', JSON.stringify(chapterOrders));
    } catch (e) {
        console.error('[saveChapterOrders] Speichern fehlgeschlagen:', e);
    }
}
// =========================== SAVECHAPTERCOLORS START ========================
function saveChapterColors() {
    try {
        localStorage.setItem('hla_chapterColors', JSON.stringify(chapterColors));
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
        localStorage.setItem('hla_levelColorHistory', JSON.stringify(levelColorHistory));
    } catch (e) {
        console.error('[saveLevelColorHistory] Speichern fehlgeschlagen:', e);
    }
}
/* =========================== LEVEL-COLOR-HISTORY END ======================= */



// Berechne Projekt-Statistiken
function calculateProjectStats(project) {
    const files = project.files || [];
    const totalFiles = files.length;
    
    if (totalFiles === 0) {
        return {
            enPercent: 0,
            dePercent: 0,
            deAudioPercent: 0,
            completedPercent: 0,
            totalFiles: 0
        };
    }
    
    const filesWithEN = files.filter(f => f.enText && f.enText.trim().length > 0).length;
    const filesWithDE = files.filter(f => f.deText && f.deText.trim().length > 0).length;
    const filesCompleted = files.filter(isFileCompleted).length;
    const filesWithDeAudio = files.filter(f => getDeFilePath(f)).length;
    
    return {
        enPercent: Math.round((filesWithEN / totalFiles) * 100),
        dePercent: Math.round((filesWithDE / totalFiles) * 100),
        deAudioPercent: Math.round((filesWithDeAudio / totalFiles) * 100),
        completedPercent: Math.round((filesCompleted / totalFiles) * 100),
        totalFiles: totalFiles
    };
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
function loadProjects() {
    // 🟩 ERST: Level-Farben laden
    const savedLevelColors = localStorage.getItem('hla_levelColors');
    if (savedLevelColors) {
        levelColors = JSON.parse(savedLevelColors);
    }

    // 🟢 Ebenfalls Reihenfolge der Level laden
    const savedLevelOrders = localStorage.getItem('hla_levelOrders');
    if (savedLevelOrders) {
        levelOrders = JSON.parse(savedLevelOrders);
    }

    // 🆕 Level-Icons laden
    const savedLevelIcons = localStorage.getItem('hla_levelIcons');
    if (savedLevelIcons) {
        levelIcons = JSON.parse(savedLevelIcons);
    }

    // DANN: Projekte laden
    const savedProjects = localStorage.getItem('hla_projects');
    if (savedProjects) {
        projects = JSON.parse(savedProjects);

        let migrated = false;
        projects.forEach(p => {
            // Alte Icon-Felder entfernen, Projekte erben nun das Level-Icon
            if (p.hasOwnProperty('icon')) { delete p.icon; migrated = true; }
            if (!p.hasOwnProperty('color')) { p.color = '#333333'; migrated = true; }
            if (!p.hasOwnProperty('levelName')) { p.levelName = ''; migrated = true; }
            if (!p.hasOwnProperty('levelPart')) { p.levelPart = 1;  migrated = true; }
        });

        // 🔥 WICHTIG: Level-Farben auf Projekte anwenden (FIX)
        projects.forEach(p => {
            if (p.levelName && levelColors[p.levelName]) {
                p.color = levelColors[p.levelName];
                migrated = true;
            }
        });

        if (migrated) saveProjects();
    } else {
        projects = [{
            id: Date.now(),
            name: 'Hauptprojekt',
            levelName: '',
            levelPart: 1,
            files: [],
            color: '#ff6b1a'
        }];
        saveProjects();
    }

    // Text- & Pfaddatenbanken laden (unverändert)
    const savedDB  = localStorage.getItem('hla_textDatabase');
    if (savedDB)  textDatabase = JSON.parse(savedDB);
    const savedPDB = localStorage.getItem('hla_filePathDatabase');
    if (savedPDB) filePathDatabase = JSON.parse(savedPDB);

    renderProjects();
    updateGlobalProjectProgress();

    const lastActive = localStorage.getItem('hla_lastActiveProject');
    const first     = projects.find(p => p.id == lastActive) || projects[0];
    if (first) selectProject(first.id);
}
// =========================== LOAD PROJECTS END ===========================


        function saveProjects() {
            localStorage.setItem('hla_projects', JSON.stringify(projects));
            updateGlobalProjectProgress();
        }

        function saveTextDatabase() {
            localStorage.setItem('hla_textDatabase', JSON.stringify(textDatabase));
        }

        function saveFilePathDatabase() {
            localStorage.setItem('hla_filePathDatabase', JSON.stringify(filePathDatabase));
        }

        function saveFolderCustomizations() {
            localStorage.setItem('hla_folderCustomizations', JSON.stringify(folderCustomizations));
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
function renderProjects() {
    const list = document.getElementById('projectList');
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
        const chGroup = document.createElement('div');
        chGroup.className = 'chapter-group';
        if (expandedChapter && expandedChapter !== chp) chGroup.classList.add('collapsed');

        const chHeader = document.createElement('div');
        chHeader.className = 'chapter-header';
        chHeader.style.background = getChapterColor(chp);
        chHeader.innerHTML = `
            <span class="chapter-title">${getChapterOrder(chp)}.${chp}</span>
            <button class="chapter-edit-btn" data-chapter="${chp}" onclick="showChapterCustomization(this.dataset.chapter, event)">⚙️</button>
        `;
        chHeader.onclick = (e) => {
            if (e.target.classList.contains('chapter-edit-btn')) return;
            expandedChapter = expandedChapter === chp ? null : chp;
            renderProjects();
        };
        chGroup.appendChild(chHeader);

        let chapterDone = true; // Flag, ob alle Level und Projekte fertig sind

        const levelWrap = document.createElement('div');
        levelWrap.className = 'chapter-levels';

        Object.entries(levels)
            .sort((a, b) => getLevelOrder(a[0]) - getLevelOrder(b[0]))
            .forEach(([lvl, prjs]) => {
            const group = document.createElement('div');
            group.className = 'level-group';
            if (expandedLevel && expandedLevel !== lvl) group.classList.add('collapsed');

        const order  = getLevelOrder(lvl);
        const header = document.createElement('div');
        header.className = 'level-header';
        header.style.background = getLevelColor(lvl);

            let levelDone = true; // Flag, ob alle Projekte fertig sind

        const icon = getLevelIcon(lvl);
        header.innerHTML = `
            <div class="level-header-left">
                <span class="level-icon">${icon}</span>
                <span class="level-title">${order}.${lvl}</span>
            </div>
            <button class="level-edit-btn" data-level="${lvl}" onclick="showLevelCustomization(this.dataset.level, event)">⚙️</button>
        `;
        header.onclick = (e) => {
            if (e.target.classList.contains('level-edit-btn')) return;
            expandedLevel = expandedLevel === lvl ? null : lvl;
            renderProjects();
        };
        group.appendChild(header);

        const wrap = document.createElement('div');
        wrap.className = 'level-projects';

        prjs.sort((a,b) => a.levelPart - b.levelPart);
        prjs.forEach(p => {
            const stats = calculateProjectStats(p);
            const done  = stats.enPercent === 100 &&
                          stats.dePercent === 100 &&
                          stats.deAudioPercent === 100 &&
                          stats.completedPercent === 100;

            if (!done) levelDone = false; // Sobald ein Projekt nicht fertig ist

            const card = document.createElement('div');
            card.className = 'project-item';
            if (done) card.classList.add('completed');
            card.dataset.projectId = p.id;
            card.draggable = true;
            card.style.background = getLevelColor(p.levelName);

            const badge = `<span class="level-part-badge">${p.levelPart}</span>`;
            const iconWrapper = `
                <div class="project-icon-wrapper" style="display:flex;flex-direction:column;align-items:center;">
                    <span style="font-size:16px;">${getLevelIcon(p.levelName)}</span>
                    ${done ? '<span class="project-done-marker">✅</span>' : ''}
                </div>`;
            card.innerHTML = `
                ${badge}
                <div class="project-main" style="display:flex;gap:8px;align-items:flex-start;flex:1;min-width:0;">
                    ${iconWrapper}
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                            ${p.name}
                        </div>
                        <div class="project-stats">
                            <span title="EN-Text">EN: ${stats.enPercent}%</span>
                            <span title="DE-Text">DE: ${stats.dePercent}%</span>
                            <span title="DE-Audio">🔊 ${stats.deAudioPercent}%</span>
                            <span title="Fertig">✓ ${stats.completedPercent}%</span>
                        </div>
                        <div style="font-size:9px;color:rgba(255,255,255,0.6);">
                            ${stats.totalFiles} Dateien
                        </div>
                    </div>
                </div>
                <div class="project-buttons" style="display:flex;gap:5px;">
                    <button class="project-customize-btn" onclick="showProjectCustomization(${p.id}, event)">⚙️</button>
                    <button class="delete-btn" onclick="deleteProject(${p.id}, event)">×</button>
                </div>
            `;

            card.title =
                `${p.name}\n` +
                (p.levelName ? `Level: ${p.levelName}\n` : '') +
                `Teil:  ${p.levelPart}\n\n` +
                `• EN: ${stats.enPercent}%  • DE: ${stats.dePercent}%\n` +
                `• DE-Audio: ${stats.deAudioPercent}%  • Fertig: ${stats.completedPercent}%${done ? ' ✅' : ''}\n` +
                `• Dateien: ${stats.totalFiles}`;

            card.onclick = e => {
                if (!e.target.classList.contains('delete-btn') &&
                    !e.target.classList.contains('project-customize-btn')) {
                    selectProject(p.id);
                }
            };
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
            header.querySelector('.level-header-left').appendChild(mark);
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
        console.log('[GLOBAL STATS] Element nicht gefunden');
        return;
    }

    const { en, de, both, total } = calculateGlobalTextStats();
    
    console.log(`[GLOBAL STATS] EN: ${en}, DE: ${de}, Both: ${both}, Total: ${total}`);
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
    if (!box) return;

    const { percent, done, total } = calculateGlobalProjectProgress();

    box.textContent = `${percent}% gesamt (${done}/${total})`;
    box.className = 'progress-stat';
    if (percent >= 80)      box.classList.add('good');
    else if (percent >= 40) box.classList.add('warning');
}
/* =========================== GLOBAL PROJECT PROGRESS END ============================== */

// =========================== SHOWFOLDERBROWSER START ===========================
function showFolderBrowser() {
    document.getElementById('folderBrowserDialog').style.display = 'flex';
    
    // Debug info
    console.log('Ordner-Browser geöffnet');
    console.log('filePathDatabase Einträge:', Object.keys(filePathDatabase).length);
    console.log('Aktuelle Projektdateien:', files.length);
    console.log('textDatabase Einträge:', Object.keys(textDatabase).length);
    
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
        color: '#54428E'
    };

    // Dialog öffnen; erst nach Bestätigung wird es gespeichert
    showProjectCustomization(null, null, prj);
}
/* =========================== ADD PROJECT END =========================== */



        function deleteProject(id, event) {
            event.stopPropagation();
            if (projects.length <= 1) {
                alert('Das letzte Projekt kann nicht gelöscht werden!');
                return;
            }
            
            if (!confirm('Projekt wirklich löschen?')) return;
            
            projects = projects.filter(p => p.id !== id);
            saveProjects();
            renderProjects();
            
            if (currentProject && currentProject.id === id) {
                selectProject(projects[0].id);
            }
        }

// =========================== SELECT PROJECT START ===========================
function selectProject(id){
    stopProjectPlayback();
    saveCurrentProject();

    currentProject = projects.find(p => p.id === id);
    if(!currentProject) return;

    localStorage.setItem('hla_lastActiveProject',id);

    expandedLevel = currentProject.levelName;
    expandedChapter = getLevelChapter(currentProject.levelName);
    renderProjects();
    document.querySelectorAll('.project-item')
        .forEach(item=>item.classList.toggle('active',item.dataset.projectId==id));

    files = currentProject.files || [];

    // Migration: completed-Flag nachziehen
    let migrated=false;
    files.forEach(f=>{
        if(!f.hasOwnProperty('completed')){f.completed=false;migrated=true;}
        if(!f.hasOwnProperty('volumeMatched')){f.volumeMatched=false;migrated=true;}
        if(!f.hasOwnProperty('radioEffect')){f.radioEffect=false;migrated=true;}
        if(!f.hasOwnProperty('autoTranslation')){f.autoTranslation='';}
        if(!f.hasOwnProperty('autoSource')){f.autoSource='';}
    });
    if(migrated) isDirty=true;

    const needTrans = files.filter(f => f.enText && (!f.autoTranslation || f.autoSource !== f.enText));
    runTranslationQueue(needTrans);

    renderFileTable();
    updateDubStatusForFiles();
    updateStatus();
    updateFileAccessStatus();
    updateProgressStats();
    updateGlobalProjectProgress();
    updateProjectMetaBar();          //  <-- NEU!
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
		
		
// =========================== PROJECT META FUNCTIONS START ===========================
function updateProjectMetaBar(){
    const bar=document.getElementById('projectMetaBar');
    if(!currentProject){bar.style.display='none';return;}

    document.getElementById('metaProjectName').textContent=currentProject.name||'–';
    document.getElementById('metaLevelName').textContent  =currentProject.levelName||'–';
    document.getElementById('metaPartNumber').textContent =currentProject.levelPart ||1;
    bar.style.display='flex';
}

/* =========================== LEVEL STATS FUNCTIONS START =========================== */
function renderLevelStats() {
    const panel = document.getElementById('levelStatsContent');
    if (!panel) {
        console.log('[LEVEL STATS] Panel nicht gefunden');
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

    const rows = Object.entries(map);
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
    
    console.log('[LEVEL STATS] Statistiken aktualisiert:', rows.length, 'Level');
}
/* =========================== LEVEL STATS FUNCTIONS END =========================== */

/* =========================== HANDLE TEXT CHANGE START =========================== */
function handleTextChange(file, field, value) {
    file[field] = value;
    isDirty     = true;

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
    navigator.clipboard.writeText(currentProject.levelName)
        .then(()=>updateStatus('Level-Name kopiert'))
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
                enText: textDatabase[fileKey]?.en || '',
                deText: textDatabase[fileKey]?.de || '',
                autoTranslation: '',
                autoSource: '',
                selected: true,
                trimStartMs: 0,
                trimEndMs: 0,
                volumeMatched: false,
                radioEffect: false
            };
            
            files.push(newFile);
            updateAutoTranslation(newFile, true);
            added++;
        }
    });
    
    if (added > 0) {
        isDirty = true;
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
        function highlightText(text, query) {
            if (!text || !query) return text;
            // Mehrere Suchbegriffe unterstützen
            const words = query.split(/\s+/).filter(Boolean).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            const regex = new RegExp(`(${words.join('|')})`, 'gi');
            return text.replace(regex, '<span class="search-result-match">$1</span>');
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
                                ${r.filename}
                                ${r.similarity < 1.0 ? `<span class="search-result-similarity">${Math.round(r.similarity * 100)}% ähnlich</span>` : ''}
                            </div>
                            <div class="search-result-path">${r.folder} • ${r.matchType}</div>
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
                this.style.height = this.scrollHeight + 'px';
            });
            
            // Keyboard navigation
            document.addEventListener('keydown', handleKeyboardNavigation);
            
            // Context menu
            document.addEventListener('contextmenu', handleContextMenu);
            document.addEventListener('click', hideContextMenu);
        }

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
                        d.style.display = 'none';
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
                selectedRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }

        // Copy button functionality
        async function copyTextToClipboard(fileId, language) {
            console.log('Copy button clicked - FileID:', fileId, 'Language:', language);
            
            // Find file more safely
            const file = files.find(f => f && f.id && f.id == fileId);
            if (!file) {
                console.error('File not found for copy operation. FileID:', fileId);
                console.log('Available files:', files.map(f => ({id: f?.id, filename: f?.filename})));
                updateStatus(`Fehler: Datei nicht gefunden (ID: ${fileId})`);
                return;
            }
            
            console.log('Found file for copy:', file.filename, 'ID:', file.id);
            
            const text = language === 'en' ? (file.enText || '') : (file.deText || '');
            const langLabel = language === 'en' ? 'EN' : 'DE';
            
            if (!text) {
                updateStatus(`${langLabel} Text ist leer für ${file.filename}`);
                return;
            }
            
            try {
                await navigator.clipboard.writeText(text);
                updateStatus(`${langLabel} Text kopiert: ${file.filename}`);
                console.log('Copy successful:', langLabel, 'from', file.filename);
                
                // Visual feedback - briefly highlight the copy button
                const button = event.target;
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
                const button = event.target;
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

        // Context Menu
        function handleContextMenu(e) {
            const row = e.target.closest('tr[data-id]');
            if (!row) return;
            
            e.preventDefault();
            
            const fileIdStr = row.dataset.id;
            const fileId = parseFloat(fileIdStr);
            
            console.log('Context menu - Row data-id:', fileIdStr, 'Parsed as:', fileId);
            
            // Find file more safely
            contextMenuFile = files.find(f => f && f.id && f.id == fileId);
            
            if (!contextMenuFile) {
                console.error('Context menu file not found for ID:', fileId);
                console.log('Available files:', files.map(f => ({id: f?.id, filename: f?.filename})));
                return;
            }
            
            console.log('Context menu opened for file:', contextMenuFile.filename, 'ID:', contextMenuFile.id);
            
            const contextMenu = document.getElementById('contextMenu');
            contextMenu.style.display = 'block';
            contextMenu.style.left = e.pageX + 'px';
            contextMenu.style.top = e.pageY + 'px';
            
            // Ensure menu stays within viewport
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

        async function contextMenuAction(action) {
            if (!contextMenuFile) {
                console.error('No context menu file available for action:', action);
                updateStatus('Fehler: Keine Datei für Aktion verfügbar');
                return;
            }
            
            console.log('Context menu action:', action, 'for file:', contextMenuFile.filename);
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
                        await navigator.clipboard.writeText(contextMenuFile.enText);
                        updateStatus(`EN Text kopiert: ${contextMenuFile.filename}`);
                        break;
                    case 'copyDE':
                        if (!contextMenuFile.deText) {
                            updateStatus(`DE Text ist leer für ${contextMenuFile.filename}`);
                            return;
                        }
                        await navigator.clipboard.writeText(contextMenuFile.deText);
                        updateStatus(`DE Text kopiert: ${contextMenuFile.filename}`);
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
        
return `
    <tr data-id="${file.id}" ${isFileCompleted(file) ? 'class="completed"' : ''}>
        <td class="drag-handle" draggable="true">↕</td>
        <td class="row-number" data-file-id="${file.id}" ondblclick="changeRowNumber(${file.id}, ${originalIndex + 1})" title="Doppelklick um Position zu ändern">${originalIndex + 1}</td>
        <td>${file.filename}</td>
        <td>
            <span class="folder-badge clickable"
                  style="background: ${folderColor}; color: white;"
                  title="Ordner: ${file.folder} - Klick für Datei-Austausch"
                  onclick="showFileExchangeOptions(${file.id})">
                ${folderIcon} ${lastFolder}
            </span>
        </td>
        <td><div style="position: relative; display: flex; align-items: flex-start; gap: 5px;">
            <textarea class="text-input"
                 onchange="updateText(${file.id}, 'en', this.value)"
                 oninput="autoResizeInput(this)">${escapeHtml(file.enText)}</textarea>
            <div class="btn-column">
                <button class="copy-btn" onclick="copyTextToClipboard(${file.id}, 'en')" title="EN Text kopieren">📋</button>
                <button class="play-btn" onclick="playAudio(${file.id})">▶</button>
            </div>
        </div></td>
        <td><div style="position: relative; display: flex; align-items: flex-start; gap: 5px;">
            <textarea class="text-input"
                 onchange="updateText(${file.id}, 'de', this.value)"
                 oninput="autoResizeInput(this)">${escapeHtml(file.deText)}</textarea>
            <div class="btn-column">
                <button class="copy-btn" onclick="copyTextToClipboard(${file.id}, 'de')" title="DE Text kopieren">📋</button>
                ${hasDeAudio ? `<button class="de-play-btn" onclick="playDeAudio(${file.id})">▶</button>` : ''}
            </div>
        </div>
        <div class="auto-trans" data-file-id="${file.id}">${escapeHtml(file.autoTranslation || '')}</div></td>
        <td class="path-cell" style="font-size: 11px; color: #666; word-break: break-all;">
            <div class="btn-column">
                <span class="path-btn ${audioFileCache[relPath] ? 'exists' : 'missing'}" title="Pfad der EN-Datei">EN</span>
                <span class="path-btn ${dePath ? 'exists' : 'missing'}" title="Pfad der DE-Datei">DE</span>
            </div>
            <span class="path-detail">EN: sounds/EN/${relPath}<br>DE: ${dePath ? `sounds/DE/${dePath}` : 'fehlend'}</span>
        </td>
        <td><button class="upload-btn" onclick="initiateDeUpload(${file.id})">⬆️</button></td>
        <td><button class="dubbing-btn" onclick="initiateDubbing(${file.id})">🔈</button></td>
        <td><span class="dub-status ${!file.dubbingId ? 'none' : (file.dubReady ? 'done' : 'pending')}" title="${!file.dubbingId ? 'kein Dubbing' : (file.dubReady ? 'fertig' : 'Studio generiert noch')}" ${(!file.dubbingId || file.dubReady) ? '' : `onclick="dubStatusClicked(${file.id})"`}>●</span></td>
        <td class="download-cell">${file.dubbingId ? `<button class="download-de-btn" data-file-id="${file.id}" onclick="downloadDe(${file.id})" disabled>⬇️</button>` : ''}</td>
        <td>${hasHistory ? `<button class="history-btn" onclick="openHistory(${file.id})">🕒</button>` : ''}</td>
        <td><div style="display:flex;align-items:flex-start;gap:5px;">
            <button class="edit-audio-btn" onclick="openDeEdit(${file.id})">✂️</button>
            <div class="edit-column">
                ${file.trimStartMs !== 0 || file.trimEndMs !== 0 ? '<span class="edit-status-icon">✂️</span>' : ''}
                ${file.volumeMatched ? '<span class="edit-status-icon">🔊</span>' : ''}
                ${file.radioEffect ? '<span class="edit-status-icon">📻</span>' : ''}
            </div>
        </div></td>
        <td><button class="delete-row-btn" onclick="deleteFile(${file.id})">🗑️</button></td>
    </tr>
`;
    }));
    tbody.innerHTML = rows.join('');
    
    addDragAndDropHandlers();
    addPathCellContextMenus();
    updateCounts();
    updateDubButtons();

    // Auto-resize all text inputs after rendering
    setTimeout(() => {
        autoResizeAllInputs();
        sortedFiles.forEach(f => updateTranslationDisplay(f.id));
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
function showFileExchangeOptions(fileId) {
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
    
    console.log(`[FILE EXCHANGE] Suche ähnliche Einträge für: ${file.filename}`);
    console.log(`[FILE EXCHANGE] EN-Text: ${file.enText.substring(0, 50)}...`);
    
    // Suche ähnliche Einträge in der Datenbank
    const similarEntries = searchSimilarEntriesInDatabase(file);
    
    if (similarEntries.length === 0) {
        alert('❌ Keine ähnlichen Einträge gefunden\n\nEs wurden keine Dateien in der Datenbank gefunden, die ähnliche EN-Texte haben.\n\nTipp: Importieren Sie zuerst mehr Daten oder scannen Sie weitere Ordner.');
        return;
    }
    
    console.log(`[FILE EXCHANGE] Gefunden: ${similarEntries.length} ähnliche Einträge`);
    
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

// =========================== CALCULATE TEXT SIMILARITY START ===========================
function calculateTextSimilarity(text1, text2) {
    // Normalisiere beide Texte
    const normalize = (text) => {
        return text.toLowerCase()
                   .replace(/[^\w\s]/g, '') // Entferne Satzzeichen
                   .replace(/\s+/g, ' ')    // Mehrfache Leerzeichen zu einem
                   .trim();
    };
    
    const norm1 = normalize(text1);
    const norm2 = normalize(text2);
    
    // Exakte Übereinstimmung
    if (norm1 === norm2) return 1.0;
    
    // Enthaltensein-Test
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
        const shorter = norm1.length < norm2.length ? norm1 : norm2;
        const longer = norm1.length >= norm2.length ? norm1 : norm2;
        return shorter.length / longer.length;
    }
    
    // Wort-basierte Ähnlichkeit
    const words1 = norm1.split(/\s+/);
    const words2 = norm2.split(/\s+/);
    
    let commonWords = 0;
    const allWords = new Set([...words1, ...words2]);
    
    words1.forEach(word1 => {
        if (words2.some(word2 => 
            word1.includes(word2) || 
            word2.includes(word1) || 
            levenshteinDistance(word1, word2) <= Math.max(1, Math.min(word1.length, word2.length) * 0.3)
        )) {
            commonWords++;
        }
    });
    
    const maxWords = Math.max(words1.length, words2.length);
    const wordSimilarity = commonWords / maxWords;
    
    // Levenshtein-Distanz für Zeichen-Ähnlichkeit
    const maxLength = Math.max(norm1.length, norm2.length);
    const editDistance = levenshteinDistance(norm1, norm2);
    const charSimilarity = (maxLength - editDistance) / maxLength;
    
    // Kombiniere beide Metriken
    return Math.max(wordSimilarity, charSimilarity * 0.7);
}

// Hilfsfunktion: Levenshtein-Distanz
function levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,     // deletion
                matrix[j - 1][i] + 1,     // insertion
                matrix[j - 1][i - 1] + indicator // substitution
            );
        }
    }
    
    return matrix[str2.length][str1.length];
}
// =========================== CALCULATE TEXT SIMILARITY END ===========================

// =========================== DISPLAY FILE EXCHANGE DIALOG START ===========================
function displayFileExchangeDialog(currentFile, similarEntries) {
    fileExchangeData.currentFile = currentFile;
    fileExchangeData.similarEntries = similarEntries;
    fileExchangeData.selectedEntry = null;
    
    // Erstelle Dialog-HTML
    const dialogHTML = `
        <div class="file-exchange-dialog" id="fileExchangeDialog">
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
    document.getElementById('fileExchangeDialog').style.display = 'flex';
    
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
    
    console.log(`[FILE EXCHANGE] Ausgewählt: ${fileExchangeData.selectedEntry.filename} (${fileExchangeData.selectedEntry.similarityPercent}% Ähnlichkeit)`);
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
    console.log(`[FILE EXCHANGE] Tausche aus: ${current.filename} → ${selected.filename}`);
    
    // 1. Aktualisiere die Datei im aktuellen Projekt
    current.filename = selected.filename;
    current.folder = selected.folder;
    current.enText = selected.enText;
    // DE-Text bleibt erhalten: current.deText = current.deText;
    
    // 2. Markiere als dirty für Speicherung
    isDirty = true;
    
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
    
    console.log(`[FILE EXCHANGE] Erfolgreich: ${current.filename} in ${current.folder}`);
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
    
    console.log('=== Repariere Projekt-Ordnernamen ===');
    
    projects.forEach(project => {
        if (!project.files || project.files.length === 0) return;
        
        totalProjects++;
        let projectUpdated = 0;
        
        project.files.forEach(file => {
            if (!filePathDatabase[file.filename]) {
                console.log(`❌ ${file.filename} nicht in Database gefunden`);
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
                console.log(`✅ ${project.name}: ${file.filename} | ${oldFolder} → ${bestMatch.folder}`);
            }
        });
        
        if (projectUpdated > 0) {
            console.log(`📁 Projekt "${project.name}": ${projectUpdated} Ordner aktualisiert`);
        }
    });
    
    if (totalUpdated > 0) {
        // Speichere alle aktualisierten Projekte
        saveProjects();
        console.log(`🎯 Gesamt: ${totalUpdated} Ordnernamen in ${totalProjects} Projekten aktualisiert`);
        
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
    
    console.log('=== Ordner-Reparatur abgeschlossen ===');
}



// =========================== EXTRACTRELEVANTFOLDER START ===========================
function extractRelevantFolder(folderParts, fullPath) {
    // Gibt den relevanten Ordnerpfad einer Datei zurück.
    // Enthält der Pfad einen "vo"-Ordner, liefern wir alles ab diesem Punkt
    // (inklusive "vo") zurück, um die komplette Struktur zu bewahren.

    if (folderParts.length === 0) return 'root';

    const lowerParts = folderParts.map(p => p.toLowerCase());
    const voIndex    = lowerParts.lastIndexOf('vo');

    if (voIndex !== -1 && voIndex < folderParts.length) {
        // Beispiel: ["sounds","vo","combine","grunt1"] => "vo/combine/grunt1"
        return folderParts.slice(voIndex).join('/');
    }

    // Entferne führendes "sounds" falls vorhanden
    const startIndex = lowerParts[0] === 'sounds' ? 1 : 0;
    return folderParts.slice(startIndex).join('/');
}
// =========================== EXTRACTRELEVANTFOLDER END ===========================

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
    
    console.log(`[NORMALIZE] Input: ${folderPath}`);
    
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
            console.log(`[NORMALIZE] Removed prefix: ${before} -> ${normalized}`);
            break; // Nur ersten Match anwenden
        }
    }
    
    // Wenn nach Präfix-Entfernung nichts übrig ist, nutze letzten Teil des Original-Pfads
    if (normalized === '' || normalized === '/') {
        const parts = originalNormalized.split('/');
        normalized = parts[parts.length - 1] || parts[parts.length - 2] || 'unknown';
        console.log(`[NORMALIZE] Empty after prefix removal, using last part: ${normalized}`);
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
        console.log(`[NORMALIZE] Added vo/ prefix to character: ${normalized}`);
    }
    
    // Finale Normalisierung: Stelle sicher dass bekannte Charaktere immer als "vo/character" erscheinen
    for (const character of characterNames) {
        if (normalized.endsWith(`/${character}`) || normalized === character) {
            normalized = `vo/${character}`;
            console.log(`[NORMALIZE] Final normalization to: ${normalized}`);
            break;
        }
    }
    
    console.log(`[NORMALIZE] Output: ${normalized}`);
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
        // Reset display order when rendering normally
        displayOrder = files.map((file, index) => ({ file, originalIndex: index }));
        await renderFileTableWithOrder(files);
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
function addPathCellContextMenus() {
    document.querySelectorAll('.path-cell').forEach(cell => {
        cell.addEventListener('contextmenu', e => {
            e.preventDefault();
            cell.classList.toggle('show-path');
        });
    });
    document.addEventListener('click', e => {
        if (!e.target.closest('.path-cell')) {
            document.querySelectorAll('.path-cell.show-path').forEach(c => c.classList.remove('show-path'));
        }
    });
}

// Prüft bei allen Download-Buttons den Status und aktiviert sie ggf.
async function updateDubButtons() {
    const header = document.getElementById('dubDownloadHeader');
    const buttons = document.querySelectorAll('.download-de-btn');
    if (buttons.length === 0) {
        if (header) header.style.display = 'none';
        return;
    }
    if (header) header.style.display = 'table-cell';
    for (const btn of buttons) {
        const id = parseInt(btn.dataset.fileId, 10);
        const file = files.find(f => f.id === id);
        if (!file) continue;
        if (file.dubbingId) {
            if (typeof file.dubReady === 'undefined') {
                try {
                    file.dubReady = await isDubReady(file.dubbingId);
                } catch (err) {
                    console.error('isDubReady fehlgeschlagen', err);
                    file.dubReady = false;
                }
            }
            if (file.dubReady) btn.disabled = false;
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
        updateDubStatusIcon(f);
    });
    await Promise.all(promises);
    updateDubButtons();
}

// Prüft nur Dateien mit gelbem Icon erneut
async function updatePendingDubStatuses() {
    // Nur Jobs abfragen, die nicht auf manuellen Import warten
    const pending = files.filter(f => f.dubbingId && f.dubReady === false && !f.waitingForManual);
    for (const f of pending) {
        try {
            f.dubReady = await isDubReady(f.dubbingId);
        } catch {}
        updateDubStatusIcon(f);
    }
    if (pending.length) updateDubButtons();
}

// Setzt das Icon je nach Status
function updateDubStatusIcon(file) {
    const el = document.querySelector(`tr[data-id="${file.id}"] .dub-status`);
    if (!el) return;
    let cls, title;
    if (!file.dubbingId) {
        cls = 'none';
        title = 'kein Dubbing';
    } else if (file.dubReady) {
        cls = 'done';
        title = 'fertig';
    } else {
        cls = 'pending';
        title = 'Studio generiert noch';
    }
    el.className = 'dub-status ' + cls;
    el.title = title;
}

        // Text editing
function updateText(fileId, lang, value, skipUndo) {
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
    } else {
        file.deText = value;
    }
    
    // Update global database
    const fileKey = `${file.folder}/${file.filename}`;
    if (!textDatabase[fileKey]) {
        textDatabase[fileKey] = {};
    }
    textDatabase[fileKey][lang] = value;
    
    isDirty = true;
    updateProgressStats();
    renderProjects(); // HINZUFÜGEN für live Update
}

async function updateAutoTranslation(file, force = false) {
    if (!window.electronAPI || !window.electronAPI.translateText) return;
    if (!file.enText) return;
    if (!force && file.autoSource === file.enText && file.autoTranslation) return;
    try {
        const translated = await window.electronAPI.translateText(file.enText);
        file.autoTranslation = translated;
        file.autoSource = file.enText;
        isDirty = true;
        updateTranslationDisplay(file.id);
    } catch (e) {
        console.error('Automatische Übersetzung fehlgeschlagen', e);
    }
}

function updateTranslationDisplay(fileId) {
    const div = document.querySelector(`.auto-trans[data-file-id="${fileId}"]`);
    const file = files.find(f => f.id === fileId);
    if (div && file) {
        div.textContent = file.autoTranslation || '';
    }
}

async function runTranslationQueue(queue) {
    if (translateRunning || !queue || queue.length === 0) return;
    translateRunning = true;
    const progress = document.getElementById('translateProgress');
    const status   = document.getElementById('translateStatus');
    const fill     = document.getElementById('translateFill');
    progress.classList.add('active');
    for (let i = 0; i < queue.length; i++) {
        status.textContent = `Übersetze ${i + 1}/${queue.length}...`;
        await updateAutoTranslation(queue[i], true);
        fill.style.width = `${Math.round(((i + 1) / queue.length) * 100)}%`;
    }
    progress.classList.remove('active');
    fill.style.width = '0%';
    translateRunning = false;
    saveCurrentProject();
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

        // File completion status
function toggleFileCompletion(fileId) {
    const file = files.find(f => f.id === fileId);

    // Fertig-Status wird nun anhand der Daten ermittelt
    updateProgressStats();
    renderProjects();
    updateStatus('Fertig-Status wird automatisch berechnet');

    // Update folder browser if it's open
    const folderBrowserOpen = document.getElementById('folderBrowserDialog').style.display === 'flex';
    if (folderBrowserOpen) {
        // Check if we're in folder grid or file view
        const folderFilesView = document.getElementById('folderFilesView');
        if (folderFilesView.style.display === 'block' && file) {
            // We're in file view - refresh it
            showFolderFiles(file.folder);
        } else {
            // We're in grid view - refresh it
            showFolderGrid();
        }
    }
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

        // Auto-resize text inputs based on content (HEIGHT not width)
        function autoResizeInput(input) {
            if (!input) return;
            
            // Reset height to auto to get the correct scroll height
            input.style.height = 'auto';
            
            // Calculate needed height
            const minHeight = 36; // Minimum height in pixels
            const newHeight = Math.max(minHeight, input.scrollHeight);
            
            // Set the new height
            input.style.height = newHeight + 'px';
            
            // Sync height with partner input in the same row
            syncRowHeights(input);
        }

        // Sync heights of EN and DE inputs in the same row
        function syncRowHeights(changedInput) {
            const row = changedInput.closest('tr');
            if (!row) return;
            
            const enInput = row.querySelector('td:nth-child(7) .text-input');
            const deInput = row.querySelector('td:nth-child(8) .text-input');
            
            if (!enInput || !deInput) return;
            
            // Get the maximum height needed
            enInput.style.height = 'auto';
            deInput.style.height = 'auto';
            
            const enHeight = Math.max(36, enInput.scrollHeight);
            const deHeight = Math.max(36, deInput.scrollHeight);
            const maxHeight = Math.max(enHeight, deHeight);
            
            // Set both inputs to the same height
            enInput.style.height = maxHeight + 'px';
            deInput.style.height = maxHeight + 'px';
        }

        // Auto-resize all text inputs in table
        function autoResizeAllInputs() {
            // Process all rows to sync heights
            document.querySelectorAll('#fileTableBody tr').forEach(row => {
                const enInput = row.querySelector('td:nth-child(7) .text-input');
                const deInput = row.querySelector('td:nth-child(8) .text-input');
                
                if (enInput && deInput) {
                    // Reset heights
                    enInput.style.height = 'auto';
                    deInput.style.height = 'auto';
                    
                    // Calculate max height needed
                    const enHeight = Math.max(36, enInput.scrollHeight);
                    const deHeight = Math.max(36, deInput.scrollHeight);
                    const maxHeight = Math.max(enHeight, deHeight);
                    
                    // Set both to same height
                    enInput.style.height = maxHeight + 'px';
                    deInput.style.height = maxHeight + 'px';
                }
            });
        }
		
// Completion Toggle All - für den orangen Haken
function toggleCompletionAll() {
    const completionCheckboxes = document.querySelectorAll('.completion-checkbox');
    
    // Prüfe ob alle bereits markiert sind
    const allCompleted = Array.from(completionCheckboxes).every(cb => cb.checked);
    
    // Wenn alle markiert sind, alle abwählen, sonst alle auswählen
    const newState = !allCompleted;
    
    completionCheckboxes.forEach(checkbox => {
        if (checkbox.checked !== newState) {
            checkbox.checked = newState;
            
            // Trigger das change event für jede Checkbox
            const fileId = parseFloat(checkbox.closest('tr').dataset.id);
            const file = files.find(f => f.id === fileId);
            if (file) {
                const row = checkbox.closest('tr');
                if (row) {
                    if (newState && isFileCompleted(file)) {
                        row.classList.add('completed');
                    } else {
                        row.classList.remove('completed');
                    }
                }
            }
        }
    });
    
    isDirty = true;
    updateProgressStats();
    renderProjects(); // HINZUFÜGEN für live Update
    
    const count = Array.from(completionCheckboxes).filter(cb => cb.checked).length;
    updateStatus(`Status für ${count} Dateien aktualisiert`);
}

        // Selection
        function toggleFileSelection(fileId) {
            const file = files.find(f => f.id === fileId);
            if (file) {
                file.selected = !file.selected;
                isDirty = true;
                updateCounts();
            }
        }

        function toggleSelectAll() {
            const selectAll = document.getElementById('selectAll').checked;
            files.forEach(file => file.selected = selectAll);
            isDirty = true;
            renderFileTable();
        }

function deleteFile(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    
    files = files.filter(f => f.id !== fileId);
    
    // Update display order
    displayOrder = displayOrder.filter(item => item.file.id !== fileId);
    
    isDirty = true;
    renderFileTable();
    renderProjects(); // HINZUGEFÜGT für live Update
    updateStatus(`${file.filename} entfernt`);
    updateProgressStats();
}

        // Row number manipulation
        function changeRowNumber(fileId, currentPosition) {
            const file = files.find(f => f.id === fileId);
            if (!file) return;
            
            const maxPosition = files.length;
            const newPositionStr = prompt(
                `Position ändern für: ${file.filename}\n\n` +
                `Aktuelle Position: ${currentPosition}\n` +
                `Verfügbare Positionen: 1 bis ${maxPosition}\n\n` +
                `Neue Position eingeben:`,
                currentPosition.toString()
            );
            
            if (!newPositionStr) return; // User cancelled
            
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
            
            isDirty = true;
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
async function playDeAudio(fileId, onEnded = null) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    // In Electron greifen wir direkt über den Dateipfad zu

    let relPath = getDeFilePath(file) || getFullPath(file);

    if (!deAudioCache[relPath]) {
        if (window.electronAPI) {
            deAudioCache[relPath] = `sounds/DE/${relPath}`;
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
                    deAudioCache[relPath] = datei;
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
        if (url) URL.revokeObjectURL(url);
    });

}
// =========================== PLAYDEAUDIO END ========================

// =========================== PROJEKT-WIEDERGABE START ========================
function updateProjectPlaybackButtons() {
    const playPauseBtn = document.getElementById('projectPlayPauseBtn');
    if (!playPauseBtn) return;
    if (projectPlayState === 'playing') {
        playPauseBtn.textContent = '⏸';
    } else {
        playPauseBtn.textContent = '▶';
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

// Liefert alle Dateien mit vorhandener DE-Version in aktueller Reihenfolge
function getProjectPlaybackList() {
    return files.filter(f => getDeFilePath(f));
}

// Spielt die aktuelle Datei im Projekt ab
function playCurrentProjectFile() {
    if (projectPlayIndex >= playbackFiles.length) { stopProjectPlayback(); return; }
    const file = playbackFiles[projectPlayIndex];
    // Wenn keine DE-Datei existiert, überspringen wir diese Datei
    if (!getDeFilePath(file)) {
        projectPlayIndex++;
        if (projectPlayState === 'playing') {
            playCurrentProjectFile();
        }
        return;
    }

    highlightProjectRow(file.id);
    // Deutsche Version abspielen und danach ggf. naechste Datei starten
    playDeAudio(file.id, () => {
        clearProjectRowHighlight();
        projectPlayIndex++;
        if (projectPlayState === 'playing') {
            playCurrentProjectFile();
        }
    });
}

function startProjectPlayback() {
    playbackFiles = getProjectPlaybackList();
    projectPlayIndex = 0;
    projectPlayState = 'playing';
    updateProjectPlaybackButtons();
    playCurrentProjectFile();
}

function pauseProjectPlayback() {
    const audio = document.getElementById('audioPlayer');
    audio.pause();
    projectPlayState = 'paused';
    updateProjectPlaybackButtons();
}

function resumeProjectPlayback() {
    const audio = document.getElementById('audioPlayer');
    audio.play();
    projectPlayState = 'playing';
    updateProjectPlaybackButtons();
}

function stopProjectPlayback() {
    projectPlayState = 'stopped';
    projectPlayIndex = 0;
    playbackFiles = [];
    clearProjectRowHighlight();
    stopCurrentPlayback();
    updateProjectPlaybackButtons();
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
    
    console.log('=== Projekt-Bereinigung: Entferne fullPath ===');
    
    projects.forEach(project => {
        if (!project.files || project.files.length === 0) return;
        
        totalProjects++;
        let projectUpdated = 0;
        
        project.files.forEach(file => {
            if (file.fullPath) {
                console.log(`Bereinige ${project.name}: ${file.filename} - entferne fullPath`);
                delete file.fullPath;
                projectUpdated++;
                totalUpdated++;
            }
        });
        
        if (projectUpdated > 0) {
            console.log(`📁 Projekt "${project.name}": ${projectUpdated} Dateien bereinigt`);
        }
    });
    
    if (totalUpdated > 0) {
        // Speichere alle bereinigten Projekte
        saveProjects();
        console.log(`🎯 Gesamt: ${totalUpdated} Dateien in ${totalProjects} Projekten bereinigt`);
        
        // Aktualisiere das aktuelle Projekt
        if (currentProject) {
            const updatedProject = projects.find(p => p.id === currentProject.id);
            if (updatedProject) {
                files = updatedProject.files || [];
                renderFileTable();
                updateProgressStats();
            }
        }
        
        updateStatus(`📁 Projekt-Bereinigung: ${totalUpdated} fullPath Einträge entfernt`);
        
        alert(`✅ Projekt-Bereinigung erfolgreich!\n\n` +
              `📊 Statistik:\n` +
              `• ${totalUpdated} veraltete Pfade entfernt\n` +
              `• ${totalProjects} Projekte bereinigt\n` +
              `• Pfade werden jetzt dynamisch geladen\n\n` +
              `🎯 Alle Audio-Funktionen sollten wieder funktionieren!`);
    } else {
        alert('✅ Alle Projekte sind bereits bereinigt!\n\nKeine veralteten Pfade gefunden.');
    }
    
    console.log('=== Projekt-Bereinigung abgeschlossen ===');
}

// Automatische Aktualisierung aller Projekte nach einem Ordner-Scan
function updateAllProjectsAfterScan() {
    let totalUpdated   = 0; // Geänderte Pfade
    let totalCompleted = 0; // Neu als fertig markierte Dateien
    let totalProjects  = 0;
    
    console.log('=== Automatische Projekt-Aktualisierung nach Scan ===');
    
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
                
                console.log(`✅ ${project.name}: ${file.filename}`);
                console.log(`   Ordner: ${oldFolder} -> ${bestPath.folder}`);
                console.log(`   Pfad: ${oldPath} -> ${bestPath.fullPath}`);
            }

            // Wenn eine passende DE-Datei existiert, zählen
            const deRel = getFullPath(file);
            if (deAudioCache[deRel] && isFileCompleted(file)) {
                totalCompleted++;
            }
        });
        
        if (projectUpdated > 0) {
            console.log(`📁 Projekt "${project.name}": ${projectUpdated} Dateien aktualisiert`);
        }
    });
    
    if (totalUpdated > 0 || totalCompleted > 0) {
        // Speichere alle aktualisierten Projekte
        saveProjects();
        console.log(`🎯 Gesamt: ${totalUpdated} Dateien in ${totalProjects} Projekten aktualisiert, ${totalCompleted} abgeschlossen`);
        
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
        console.log('✅ Alle Projekt-Pfade sind bereits aktuell');
    }
    
    console.log('=== Projekt-Aktualisierung abgeschlossen ===');
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
                console.log(`Auto-Scan ausgeloest von ${functionName}: ${missingFiles.length} Dateien ohne Berechtigung`);

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
            document.getElementById('folderBrowserDialog').style.display = 'none';
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
        console.log('filePathDatabase leer, verwende Fallback mit aktuellen Projektdateien und textDatabase');
        
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
        console.log('Ordner-Browser leer, starte automatischen Scan...');
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
                    <div class="folder-card-count">${folder.files.length} Dateien</div>
                    <div class="folder-card-completion ${stats.isComplete ? 'complete' : stats.percentage > 0 ? 'partial' : 'none'}" style="color: ${completionColor};">
                        ${stats.percentage}% übersetzt
                        ${stats.isComplete ? ' ✅' : stats.percentage > 0 ? ' 🔄' : ' ⏳'}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Add debug info for development
    console.log(`Ordner-Browser: ${sortedFolders.length} Ordner gefunden`);
    console.log('Completion Stats:', Object.fromEntries(folderStats));
    console.log('Gefundene Ordner:', sortedFolders.map(f => f.name));
    console.log(`[GLOBAL STATS] EN: ${globalEN}, DE: ${globalDE}, Both: ${globalBoth}, Total: ${globalTotal}`);
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
    
    console.log('=== Bereinigung falscher Ordnernamen ===');
    
    // Sammle alle gescannten Pfade für Vergleich
    const realPaths = new Set();
    Object.values(audioFileCache).forEach(fileObj => {
        if (fileObj && fileObj.webkitRelativePath) {
            realPaths.add(fileObj.webkitRelativePath);
        }
    });
    
    console.log(`Gefundene echte Pfade: ${realPaths.size}`);
    
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
                console.log(`✅ Korrekt: ${filename} in ${pathInfo.folder}`);
            } else {
                // Pfad existiert nicht - versuche korrekten Pfad zu finden
                let foundCorrectPath = false;
                
                for (const realPath of realPaths) {
                    if (realPath.endsWith('/' + filename)) {
                        // Finde den korrekten Ordner für diese Datei
                        const parts = realPath.split('/');
                        const correctFolder = extractRelevantFolder(parts.slice(0, -1), realPath);
                        
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
                                
                                console.log(`🔧 Korrigiert: ${filename} von "${pathInfo.folder}" zu "${correctFolder}"`);
                                totalCorrected++;
                                foundCorrectPath = true;
                                break;
                            }
                        }
                    }
                }
                
                if (!foundCorrectPath) {
                    console.log(`❌ Entfernt: ${filename} in "${pathInfo.folder}" (Pfad existiert nicht: ${pathInfo.fullPath})`);
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
            console.log(`🗑️ Datei komplett entfernt: ${filename} (keine gültigen Pfade)`);
        }
    });
    
    // Speichere bereinigte Datenbank
    saveFilePathDatabase();
    
    // Aktualisiere Projekte
    updateAllProjectsAfterScan();
    
    const results = `✅ Ordnernamen-Bereinigung abgeschlossen!\n\n` +
        `📊 Statistik:\n` +
        `• ${totalChecked} Einträge geprüft\n` +
        `• ${totalCorrected} Ordnernamen korrigiert\n` +
        `• ${totalRemoved} falsche Einträge entfernt\n` +
        `• ${Object.keys(filePathDatabase).length} Dateien verbleiben\n\n` +
        `🎯 Alle Einträge haben jetzt korrekte Ordnernamen!`;
    
    updateStatus(`Ordnernamen bereinigt: ${totalCorrected} korrigiert, ${totalRemoved} entfernt`);
    
    // Aktualisiere aktuelle Ansicht falls Ordner-Browser offen
    const folderBrowserOpen = document.getElementById('folderBrowserDialog').style.display === 'flex';
    if (folderBrowserOpen) {
        showFolderGrid();
    }
    
    alert(results);
    console.log('=== Bereinigung abgeschlossen ===');
}
// =========================== CLEANUPINCORRECTFOLDERNAMES END ===========================

// =========================== SHOWFOLDERDEBUG START ===========================
// Zeigt alle bekannten Ordner aus der Datenbank an und markiert nicht gefundene
// Ordner. Fehlende Ordner lassen sich direkt löschen.
function showFolderDebug() {
    const wrapper = document.getElementById('debugConsoleWrapper');
    wrapper.open = true;

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

    dialog.style.display = 'flex';
}

function closeMissingFoldersDialog() {
    document.getElementById('missingFoldersDialog').style.display = 'none';
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
        console.log(`[CLEANUP] ${removed} verwaiste Ordner-Anpassungen entfernt`);
    }
}
// =========================== CLEANUPORPHANCUSTOMIZATIONS END ===============
// =========================== SHOWMISSINGFOLDERSDIALOG END ===================

// =========================== GETBROWSERDEBUGPATHINFO START ===========================
// Debug-Pfad-Information für Ordner-Browser
function getBrowserDebugPathInfo(file) {
    if (!filePathDatabase[file.filename]) {
        return '❌ Nicht in DB';
    }
    
    const dbPaths = filePathDatabase[file.filename];
    
    // Suche passende Pfade für diese spezifische Datei
    const exactMatches = dbPaths.filter(pathInfo => pathInfo.folder === file.folder);
    
    if (exactMatches.length > 0) {
        const bestPath = exactMatches[0];
        const isAudioAvailable = !!audioFileCache[bestPath.fullPath];
        const status = isAudioAvailable ? '✅' : '❌';
        return `${status} VERFÜGBAR<br><small style="word-break: break-all;">${bestPath.fullPath}</small>`;
    }
    
    // Normalisierte Suche
    const normalizedMatches = dbPaths.filter(pathInfo => {
        const normalizedFileFolder = normalizeFolderPath(file.folder);
        const normalizedDbFolder = normalizeFolderPath(pathInfo.folder);
        return normalizedFileFolder === normalizedDbFolder;
    });
    
    if (normalizedMatches.length > 0) {
        const bestPath = normalizedMatches[0];
        const isAudioAvailable = !!audioFileCache[bestPath.fullPath];
        const status = isAudioAvailable ? '⚠️' : '❌';
        return `${status} NORMALISIERT<br><small style="word-break: break-all;">Browser: ${file.folder}<br>DB: ${bestPath.folder}</small>`;
    }
    
    // Keine Matches - zeige verfügbare Ordner
    const availableFolders = dbPaths.map(p => p.folder).slice(0, 2).join('<br>');
    const moreCount = dbPaths.length > 2 ? ` (+${dbPaths.length - 2} weitere)` : '';
    return `❌ KEINE MATCHES<br><small style="word-break: break-all;">Browser: ${file.folder}<br>DB hat:<br>${availableFolders}${moreCount}</small>`;
}
// =========================== GETBROWSERDEBUGPATHINFO END ===========================

// =========================== SHOWFOLDERFILES START ===========================
function showFolderFiles(folderName) {
    const folderGrid      = document.getElementById('folderGrid');
    const folderFilesView = document.getElementById('folderFilesView');
    const folderBackBtn   = document.getElementById('folderBackBtn');
    const title           = document.getElementById('folderBrowserTitle');
    const description     = document.getElementById('folderBrowserDescription');

    folderGrid.style.display      = 'none';
    folderFilesView.style.display = 'block';
    folderBackBtn.style.display   = 'block';

    const lastFolderName = folderName.split('/').pop() || folderName;
    const customization  = folderCustomizations[folderName] || {};
    const folderIcon     = customization.icon || '📁';

    const { completionMap, projectCompletionMap } = getGlobalCompletionStatus();
    const folderFiles = [];

    // --- aus Datenbank sammeln ---
    Object.entries(filePathDatabase).forEach(([filename, paths]) => {
        paths.forEach(pathInfo => {
            if (pathInfo.folder !== folderName) return;

            const fileKey = `${pathInfo.folder}/${filename}`;
            const text    = textDatabase[fileKey] || {};

            folderFiles.push({
                filename,
                folder: pathInfo.folder,
                fullPath: pathInfo.fullPath,
                enText: text.en || '',
                deText: text.de || '',
                isCompleted: completionMap.has(fileKey),
                completedInProjects: projectCompletionMap.get(fileKey) || [],
                isIgnored: !!ignoredFiles[fileKey]
            });
        });
    });

    // --- Fallback aus Projekt ---
    if (folderFiles.length === 0) {
        files.filter(f => f.folder === folderName).forEach(f => {
            const fileKey = `${f.folder}/${f.filename}`;
            const text    = textDatabase[fileKey] || {};

            folderFiles.push({
                filename: f.filename,
                folder: f.folder,
                fullPath: f.fullPath,
                enText: text.en || '',
                deText: text.de || '',
                isCompleted: completionMap.has(fileKey),
                completedInProjects: projectCompletionMap.get(fileKey) || [],
                isIgnored: !!ignoredFiles[fileKey]
            });
        });
    }

    // --- Übersichts-Text ---
    const total     = folderFiles.length;
    const completed = folderFiles.filter(f => f.isCompleted).length;
    const ignored   = folderFiles.filter(f => f.isIgnored).length;

    title.innerHTML = `${folderIcon} ${lastFolderName} <button class="folder-customize-btn" onclick="showFolderCustomization('${folderName}')">⚙️</button>`;
    description.innerHTML = `✅ ${completed} übersetzt – 🚫 ${ignored} ignoriert – ⏳ ${total - completed - ignored} offen`;

    aktiveOrdnerDateien = folderFiles;
    renderFolderFilesList(folderFiles);

    // Suche nach jedem Tastendruck im Ordner aktivieren
    const searchInput = document.getElementById('folderFileSearchInput');
    searchInput.value = '';
    searchInput.addEventListener('input', handleFolderFileSearch);
}
// =========================== SHOWFOLDERFILES END ===========================

// =========================== FOLDER FILE SEARCH START =======================
function renderFolderFilesList(list, query = '') {
    const folderFilesView = document.getElementById('folderFilesView');
    const items = list.map(file => {
        const inProject = files.find(f => f.filename === file.filename && f.folder === file.folder);
        const debugPathInfo = getBrowserDebugPathInfo(file);
        return `
            <div class="folder-file-item ${file.isCompleted ? 'completed' : ''} ${file.isIgnored ? 'ignored' : ''}">
                <div class="folder-file-info">
                    <div class="folder-file-name">
                        ${query ? highlightText(file.filename, query) : file.filename}
                        ${file.isCompleted ? `<span class="folder-file-badge done"  title="Übersetzt">✅ Übersetzt</span>` : ''}
                        ${file.isIgnored ? `<span class="folder-file-badge skip">🚫 Ignoriert</span>` : ''}
                    </div>
                    <div style="font-size: 10px; color: #666; margin: 4px 0; padding: 4px 8px; background: #1a1a1a; border-radius: 3px; border-left: 3px solid #333;">
                        <strong>🔍 Pfad:</strong> ${debugPathInfo}
                    </div>
                    <div class="folder-file-texts">
                        <div class="folder-file-text">
                            <div class="folder-file-text-label">EN</div>
                            <div class="folder-file-text-content" title="${escapeHtml(file.enText)}">
                                ${query ? highlightText(file.enText || '(kein Text)', query) : (file.enText || '(kein Text)')}
                            </div>
                        </div>
                        <div class="folder-file-text">
                            <div class="folder-file-text-label">DE</div>
                            <div class="folder-file-text-content" title="${escapeHtml(file.deText)}">
                                ${query ? highlightText(file.deText || '(kein Text)', query) : (file.deText || '(kein Text)')}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="folder-file-actions">
                    <button class="folder-file-play" onclick="playFolderBrowserAudio('${file.fullPath}', this)">▶</button>
                    <button class="folder-file-add" ${inProject ? 'disabled' : ''}
                            onclick="addFileFromFolderBrowser('${file.filename}', '${file.folder}', '${file.fullPath}')">
                        ${inProject ? '✓ Bereits hinzugefügt' : '+ Hinzufügen'}
                    </button>
                    <button class="folder-file-ignore"
                            onclick="toggleSkipFile('${file.folder}', '${file.filename}')">
                        ${file.isIgnored ? '↩ Wieder aufnehmen' : '🚫 Ignorieren'}
                    </button>
                </div>
            </div>`;
    }).join('');

    folderFilesView.innerHTML = `
        <div class="folder-search-container">
            <input type="text" class="folder-search-input" id="folderFileSearchInput" placeholder="Text im Ordner suchen..." value="${escapeHtml(query)}">
        </div>
        <div id="folderFilesList">${items}</div>`;
}

function handleFolderFileSearch(e) {
    // Cursor-Position merken, damit sie nach dem Neuzeichnen erhalten bleibt
    const cursorPos = e.target.selectionStart;

    // Original eingegebener Text für die Anzeige
    const originalQuery = e.target.value;
    // Suchbegriffe für den Vergleich vorbereiten
    const words = originalQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

    // Dateien filtern: jeder Begriff muss irgendwo vorkommen
    const filtered = aktiveOrdnerDateien.filter(f =>
        words.every(w =>
            f.filename.toLowerCase().includes(w) ||
            f.enText.toLowerCase().includes(w) ||
            f.deText.toLowerCase().includes(w)
        )
    );

    // Trefferliste neu zeichnen
    renderFolderFilesList(filtered, originalQuery);

    // Event-Listener nach dem Neuzeichnen erneut binden
    const input = document.getElementById('folderFileSearchInput');
    input.addEventListener('input', handleFolderFileSearch);

    // Fokus und Cursor-Position wiederherstellen
    input.focus();
    const pos = Math.min(cursorPos, input.value.length);
    input.setSelectionRange(pos, pos);
}
// =========================== FOLDER FILE SEARCH END =========================

// =========================== REFRESHGLOBAL START ===========================
function refreshGlobalStatsAndGrids() {
    // Aktuelle Statistiken der Ordner ermitteln
    const folderStats = calculateFolderCompletionStats();

    // Fortschrittsbalken neu berechnen
    updateProgressStats();

    // Grid nur neu zeichnen, falls es sichtbar ist
    if (document.getElementById('folderGrid').style.display !== 'none') {
        showFolderGrid();
    }
}
// =========================== REFRESHGLOBAL END ===========================



// =========================== DELETEFOLDERFROMBROWSER START ===========================
function deleteFolderFromDatabase(folderName) {
    // Doppelte Sicherheitsprüfung
    let hasTexts = false;
    let hasProjectFiles = false;
    
    // Prüfe auf Texte
    Object.entries(textDatabase).forEach(([fileKey, texts]) => {
        if (fileKey.startsWith(folderName + '/')) {
            if ((texts.en && texts.en.trim()) || (texts.de && texts.de.trim())) {
                hasTexts = true;
            }
        }
    });
    
    // Prüfe auf Projekt-Dateien
    projects.forEach(project => {
        if (project.files && project.files.some(file => file.folder === folderName)) {
            hasProjectFiles = true;
        }
    });
    
    const lastFolderName = folderName.split('/').pop() || folderName;
    
    // Warnung wenn Texte oder Projekte vorhanden
    if (hasTexts || hasProjectFiles) {
        const warnings = [];
        if (hasTexts) warnings.push('Übersetzungen (EN/DE Texte)');
        if (hasProjectFiles) warnings.push('Dateien in Projekten');
        
        const warningText = warnings.join(' und ');
        
        if (!confirm(`⚠️ WARNUNG: Ordner kann nicht sicher gelöscht werden!\n\nDer Ordner "${lastFolderName}" enthält:\n• ${warningText}\n\nDas Löschen würde diese Daten beschädigen.\n\n💡 Empfehlung:\n1. Entfernen Sie zuerst alle Dateien aus Ihren Projekten\n2. Löschen Sie die Übersetzungen manuell\n3. Versuchen Sie dann erneut\n\nTROTZDEM LÖSCHEN? (Nicht empfohlen)`)) {
            return;
        }
    }
    
    // Bestätigungsdialog
    const fileCount = Object.entries(filePathDatabase).reduce((count, [filename, paths]) => {
        return count + paths.filter(p => p.folder === folderName).length;
    }, 0);
    
    if (!confirm(`🗑️ Ordner endgültig löschen\n\nMöchten Sie den Ordner "${lastFolderName}" wirklich aus der Datenbank löschen?\n\nDies entfernt:\n• ${fileCount} Dateipfade\n• Audio-Cache-Einträge\n• Ordner-Anpassungen\n${hasTexts ? '• Alle Übersetzungen (EN/DE)\n' : ''}${hasProjectFiles ? '• Alle Dateien aus Projekten\n' : ''}\n⚠️ Die Aktion kann NICHT rückgängig gemacht werden!\n\nFortfahren?`)) {
        return;
    }
    
    let deletedFiles = 0;
    let deletedAudioCache = 0;
    let deletedTexts = 0;
    let removedFromProjects = 0;
    
    // 1. Lösche alle Dateien aus diesem Ordner aus filePathDatabase
    Object.keys(filePathDatabase).forEach(filename => {
        const originalLength = filePathDatabase[filename].length;
        filePathDatabase[filename] = filePathDatabase[filename].filter(pathInfo => 
            pathInfo.folder !== folderName
        );
        
        const deletedFromFile = originalLength - filePathDatabase[filename].length;
        deletedFiles += deletedFromFile;
        
        // Entferne leere Einträge
        if (filePathDatabase[filename].length === 0) {
            delete filePathDatabase[filename];
        }
    });
    
    // 2. Lösche aus audioFileCache
    Object.keys(audioFileCache).forEach(fullPath => {
        if (fullPath.includes(folderName)) {
            delete audioFileCache[fullPath];
            deletedAudioCache++;
        }
    });
    
    // 3. Lösche Texte aus textDatabase
    Object.keys(textDatabase).forEach(fileKey => {
        if (fileKey.startsWith(folderName + '/')) {
            delete textDatabase[fileKey];
            deletedTexts++;
        }
    });
    
    // 4. Lösche Ordner-Anpassungen
    const hadCustomization = !!folderCustomizations[folderName];
    if (folderCustomizations[folderName]) {
        delete folderCustomizations[folderName];
    }
    
    // 5. Entferne Ordner aus allen Projekten
    projects.forEach(project => {
        if (project.files) {
            const originalLength = project.files.length;
            project.files = project.files.filter(file => file.folder !== folderName);
            removedFromProjects += originalLength - project.files.length;
        }
    });
    
    // 6. Speichere alle Änderungen
    saveFilePathDatabase();
    saveTextDatabase();
    saveFolderCustomizations();
    
    if (removedFromProjects > 0) {
        saveProjects();
        
        // Aktualisiere aktuelles Projekt falls betroffen
        if (currentProject) {
            const updatedProject = projects.find(p => p.id === currentProject.id);
            if (updatedProject) {
                files = updatedProject.files || [];
                renderFileTable();
                updateProgressStats();
                renderProjects();
            }
        }
    }
    
    // Erfolgs-Nachricht
    const successMessage = `✅ Ordner "${lastFolderName}" erfolgreich gelöscht!\n\n` +
        `📊 Entfernt:\n` +
        `• ${deletedFiles} Dateipfade\n` +
        `• ${deletedAudioCache} Audio-Cache-Einträge\n` +
        `• ${deletedTexts} Übersetzungseinträge\n` +
        `• ${removedFromProjects} Dateien aus Projekten\n` +
        `${hadCustomization ? '• Ordner-Anpassungen\n' : ''}` +
        `\n🎯 Verbleibend:\n` +
        `• ${Object.keys(filePathDatabase).length} Dateien in Datenbank\n` +
        `• ${Object.keys(textDatabase).length} Übersetzungseinträge`;
    
    alert(successMessage);
    updateStatus(`Ordner "${lastFolderName}" vollständig aus Datenbank gelöscht`);
    
    // Zurück zur Ordner-Übersicht
    showFolderGrid();
    
    console.log(`[DELETE FOLDER] ${lastFolderName} erfolgreich gelöscht - ${deletedFiles} Dateien, ${deletedTexts} Texte, ${removedFromProjects} Projektdateien entfernt`);
}
// =========================== DELETEFOLDERFROMBROWSER END ===========================

        function playFolderBrowserAudio(fullPath, button) {
            // In Electron nutzen wir den Dateipfad direkt zur Wiedergabe
            // Check if file is accessible, auto-scan if needed
            const fakeFile = { fullPath: fullPath, filename: fullPath.split('/').pop() };
            const scanResult = checkAndAutoScan([fakeFile], 'Ordner-Browser Audio');
            if (scanResult === true) {
                // Scan started
                updateStatus('Ordner-Browser Audio: Warte auf Ordner-Scan...');
                return;
            } else if (scanResult === false) {
                // User cancelled
                return;
            }
            // scanResult === null means file is accessible, continue
            
            const audio = document.getElementById('audioPlayer');

            if (currentlyPlaying === fullPath) {
                stopCurrentPlayback();
                return;
            }
            stopCurrentPlayback();
            
            // Try to play from cached File object
            if (audioFileCache[fullPath]) {
                const fileObject = audioFileCache[fullPath];
                let url = null;
                if (window.electronAPI && typeof fileObject === 'string') {
                    audio.src = fileObject;
                } else {
                    const blob = new Blob([fileObject], { type: fileObject.type });
                    url = URL.createObjectURL(blob);
                    audio.src = url;
                }

                audio.play().then(() => {
                    button.textContent = '⏸';
                    button.style.background = '#ff6b1a';
                    currentlyPlaying = fullPath;

                    audio.onended = () => {
                        if (url) URL.revokeObjectURL(url);
                        button.textContent = '▶';
                        button.style.background = '#444';
                        currentlyPlaying = null;
                    };
                }).catch(err => {
                    if (err && err.name === 'AbortError') {
                        // Fehler ignorieren, wenn play() frühzeitig gestoppt wurde
                        return;
                    }
                    console.error('Playback failed:', err);
                    updateStatus(`Fehler beim Abspielen`);
                    if (url) URL.revokeObjectURL(url);
                });
            } else {
                // This should not happen after auto-scan check, but just in case
                updateStatus('Audio nicht verfügbar - Berechtigung fehlt');
            }
        }

function addFileFromFolderBrowser(filename, folder, fullPath) {
    if (files.find(f => f.filename === filename && f.folder === folder)) {
        updateStatus('Datei bereits im Projekt');
        return;
    }
    
    const fileKey = `${folder}/${filename}`;
    const newFile = {
        id: Date.now() + Math.random(),
        filename: filename,
        folder: folder,
        // fullPath wird NICHT mehr gespeichert - wird dynamisch geladen
        enText: textDatabase[fileKey]?.en || '',
        deText: textDatabase[fileKey]?.de || '',
        autoTranslation: '',
        autoSource: '',
        selected: true,
        trimStartMs: 0,
        trimEndMs: 0,
        volumeMatched: false,
        radioEffect: false
    };
    
    files.push(newFile);
    updateAutoTranslation(newFile, true);
    updateAutoTranslation(newFile, true);
    
    // Update display order for new file
    displayOrder.push({ file: newFile, originalIndex: files.length - 1 });
    
    isDirty = true;
    renderFileTable();
    renderProjects(); // HINZUGEFÜGT für live Update
    updateStatus(`${filename} zum Projekt hinzugefügt`);
    updateProgressStats();
    
    // Update the button in the folder browser
    const addButton = event.target;
    addButton.disabled = true;
    addButton.textContent = '✓ Bereits hinzugefügt';
}

        // Folder customization functions
        function showFolderCustomization(folderName) {
            const customization = folderCustomizations[folderName] || {};
            const lastFolderName = folderName.split('/').pop() || folderName;
            
            // Get current values or defaults
            let currentIcon = customization.icon;
            let currentColor = customization.color || '#333333';
            
            // Get default icon if no custom one set
            if (!currentIcon) {
                if (lastFolderName.toLowerCase().includes('gman')) currentIcon = '👤';
                else if (lastFolderName.toLowerCase().includes('alyx')) currentIcon = '👩';
                else if (lastFolderName.toLowerCase().includes('russell')) currentIcon = '👨‍🔬';
                else if (lastFolderName.toLowerCase().includes('eli')) currentIcon = '👨‍🦳';
                else if (lastFolderName.toLowerCase().includes('vortigaunt')) currentIcon = '👽';
                else if (lastFolderName.toLowerCase().includes('combine')) currentIcon = '🤖';
                else if (lastFolderName.toLowerCase().includes('jeff')) currentIcon = '🧟';
                else if (lastFolderName.toLowerCase().includes('zombie')) currentIcon = '🧟‍♂️';
                else currentIcon = '📁';
            }
            
            // Create popup
            const overlay = document.createElement('div');
            overlay.className = 'customize-popup-overlay';
            overlay.onclick = () => closeFolderCustomization();
            
            const popup = document.createElement('div');
            popup.className = 'folder-customize-popup';
            popup.innerHTML = `
                <h4>⚙️ Ordner anpassen: ${lastFolderName}</h4>
                
                <div class="customize-field">
                    <label>Icon (Emoji):</label>
                    <input type="text" id="customIcon" value="${currentIcon}" maxlength="2" onInput="updateCustomizationPreview()">
                    <span class="icon-preview" id="iconPreview">${currentIcon}</span>
                </div>
                
                <div class="customize-field">
                    <label>Hintergrundfarbe:</label>
                    <input type="color" id="customColor" value="${currentColor}" onInput="updateCustomizationPreview()">
                    <span class="color-preview" id="colorPreview" style="background: ${currentColor};"></span>
                </div>

                <div class="customize-field">
                    <label>Voice ID:</label>
                    <input type="text" id="customVoiceId" value="${customization.voiceId || ''}" placeholder="ElevenLabs-ID">
                </div>
                
                <div class="customize-field">
                    <label>Voreinstellungen:</label>
                    <select id="presetSelect" onchange="applyPreset('${folderName}')">
                        <option value="">-- Voreinstellung wählen --</option>
                        <option value="gman">G-Man (👤, #4a148c)</option>
                        <option value="alyx">Alyx (👩, #1a237e)</option>
                        <option value="russell">Russell (👨‍🔬, #00695c)</option>
                        <option value="eli">Eli (👨‍🦳, #e65100)</option>
                        <option value="vortigaunt">Vortigaunt (👽, #263238)</option>
                        <option value="combine">Combine (🤖, #b71c1c)</option>
                        <option value="jeff">Jeff (🧟, #2e7d32)</option>
                        <option value="zombie">Zombie (🧟‍♂️, #424242)</option>
                        <option value="folder">Standard (📁, #333333)</option>
                    </select>
                </div>
                
                <div class="customize-buttons">
                    <button class="btn btn-secondary" onclick="resetFolderCustomization('${folderName}')">Zurücksetzen</button>
                    <button class="btn btn-secondary" onclick="closeFolderCustomization()">Abbrechen</button>
                    <button class="btn btn-success" onclick="saveFolderCustomization('${folderName}')">Speichern</button>
                </div>
            `;
            
            popup.onclick = (e) => e.stopPropagation();
            
            document.body.appendChild(overlay);
            document.body.appendChild(popup);

            // Fokussiere das Icon-Feld
            popup.querySelector('#customIcon').focus();
        }

        function updateCustomizationPreview() {
            const iconInput = document.getElementById('customIcon');
            const colorInput = document.getElementById('customColor');
            const iconPreview = document.getElementById('iconPreview');
            const colorPreview = document.getElementById('colorPreview');
            
            if (iconInput && iconPreview) {
                iconPreview.textContent = iconInput.value || '📁';
            }
            
            if (colorInput && colorPreview) {
                colorPreview.style.background = colorInput.value;
            }
        }

        function applyPreset(folderName) {
            const presetSelect = document.getElementById('presetSelect');
            const iconInput = document.getElementById('customIcon');
            const colorInput = document.getElementById('customColor');
            
            const presets = {
                'gman': { icon: '👤', color: '#4a148c' },
                'alyx': { icon: '👩', color: '#1a237e' },
                'russell': { icon: '👨‍🔬', color: '#00695c' },
                'eli': { icon: '👨‍🦳', color: '#e65100' },
                'vortigaunt': { icon: '👽', color: '#263238' },
                'combine': { icon: '🤖', color: '#b71c1c' },
                'jeff': { icon: '🧟', color: '#2e7d32' },
                'zombie': { icon: '🧟‍♂️', color: '#424242' },
                'folder': { icon: '📁', color: '#333333' }
            };
            
            const preset = presets[presetSelect.value];
            if (preset) {
                iconInput.value = preset.icon;
                colorInput.value = preset.color;
                updateCustomizationPreview();
            }
        }

        function saveFolderCustomization(folderName) {
            const iconInput = document.getElementById('customIcon');
            const colorInput = document.getElementById('customColor');
            const voiceInput = document.getElementById('customVoiceId');

            folderCustomizations[folderName] = {
                icon: iconInput.value || '📁',
                color: colorInput.value || '#333333',
                voiceId: voiceInput.value.trim()
            };
            if (!folderCustomizations[folderName].voiceId) {
                delete folderCustomizations[folderName].voiceId;
            }
            
            saveFolderCustomizations();
            closeFolderCustomization();
            
            // Refresh the folder view
            if (document.getElementById('folderGrid').style.display !== 'none') {
                showFolderGrid();
            } else {
                showFolderFiles(folderName);
            }
            
            // Refresh main table to show updated badges
            renderFileTable();
            
            updateStatus('Ordner-Anpassung gespeichert');
        }

        function resetFolderCustomization(folderName) {
            if (confirm('Möchten Sie die Anpassungen für diesen Ordner wirklich zurücksetzen?')) {
                delete folderCustomizations[folderName];
                saveFolderCustomizations();
                closeFolderCustomization();
                
                // Refresh the folder view
                if (document.getElementById('folderGrid').style.display !== 'none') {
                    showFolderGrid();
                } else {
                    showFolderFiles(folderName);
                }
                
                // Refresh main table to show updated badges
                renderFileTable();
                
                updateStatus('Ordner-Anpassung zurückgesetzt');
            }
        }

        function closeFolderCustomization() {
            const overlay = document.querySelector('.customize-popup-overlay');
            const popup = document.querySelector('.folder-customize-popup');
            
            if (overlay) overlay.remove();
            if (popup) popup.remove();
        }

        // Import/Export functions
        function showImportDialog() {
            document.getElementById('importDialog').style.display = 'flex';
            document.getElementById('columnSelection').style.display = 'none';
            document.getElementById('analyzeDataBtn').style.display = 'block';
            document.getElementById('startImportBtn').style.display = 'none';
            const field = document.getElementById('importData');
            field.value = '';
            field.focus();
        }

        function closeImportDialog() {
            document.getElementById('importDialog').style.display = 'none';
            document.getElementById('importData').value = '';
            document.getElementById('columnSelection').style.display = 'none';
            document.getElementById('analyzeDataBtn').style.display = 'block';
            document.getElementById('startImportBtn').style.display = 'none';
        }

        let parsedImportData = null;
        let detectedColumns = null;

        function analyzeImportData() {
            const data = document.getElementById('importData').value.trim();
            if (!data) {
                alert('Bitte fügen Sie erst Daten ein!');
                return;
            }
            
            try {
                // Parse the data
                if (data.includes('{|') && data.includes('|-') && data.includes('|')) {
                    // Wiki table format
                    parsedImportData = parseWikiTable(data);
                } else {
                    // Try pipe format
                    parsedImportData = parsePipeFormat(data);
                }
                
                if (!parsedImportData || parsedImportData.length === 0) {
                    alert('Keine gültigen Daten gefunden!\n\nUnterstützte Formate:\n• Wiki-Tabelle\n• Pipe-Format (Datei|Text|Text)');
                    return;
                }
                
                // Detect columns
                detectedColumns = detectColumns(parsedImportData);
                
                if (detectedColumns.filenameColumn === -1) {
                    alert('Keine Dateinamen-Spalte gefunden!\n\nDateinamen sollten erkennbar sein als:\n• Code-Tags: <code>dateiname</code>\n• Dateinamen mit Zahlen: 02_01103\n• Dateinamen mit Erweiterung: datei.mp3');
                    return;
                }
                
                // Show column selection UI
                setupColumnSelection();
                
            } catch (error) {
                console.error('Import analysis error:', error);
                alert('Fehler beim Analysieren der Daten: ' + error.message);
            }
        }

        function parseWikiTable(data) {
            const rows = [];
            
            // Split by row separators
            const lines = data.split('\n');
            let currentRow = [];
            let inTableRow = false;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // Skip table start/end and headers
                if (line.startsWith('{|') || line.startsWith('|}') || line.startsWith('!')) {
                    continue;
                }
                
                // Row separator
                if (line === '|-') {
                    if (currentRow.length > 0) {
                        rows.push([...currentRow]);
                        currentRow = [];
                    }
                    inTableRow = true;
                    continue;
                }
                
                // Cell content
                if (line.startsWith('|') && inTableRow) {
                    let cellContent = line.substring(1).trim();
                    
                    // Remove HTML comments
                    cellContent = cellContent.replace(/<!--.*?-->/g, '').trim();
                    
                    // Clean up code tags
                    cellContent = cellContent.replace(/<\/?code>/g, '');
                    
                    // Skip empty cells
                    if (cellContent && cellContent !== '|') {
                        currentRow.push(cellContent);
                    }
                }
            }
            
            // Add last row if exists
            if (currentRow.length > 0) {
                rows.push(currentRow);
            }
            
            // Filter out rows with less than 2 columns
            return rows.filter(row => row.length >= 2);
        }

        function parsePipeFormat(data) {
            const lines = data.split('\n');
            const rows = [];
            
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed && trimmed.includes('|')) {
                    const parts = trimmed.split('|').map(p => p.trim()).filter(p => p.length > 0);
                    if (parts.length >= 2) {
                        rows.push(parts);
                    }
                }
            }
            
            return rows;
        }

        function detectColumns(rows) {
            const columnCount = Math.max(...rows.map(row => row.length));
            
            // Intelligent filename detection with database comparison
            let bestFilenameColumn = -1;
            let bestScore = -1;
            
            for (let col = 0; col < columnCount; col++) {
                let score = 0;
                let sampleCount = 0;
                
                for (const row of rows.slice(0, Math.min(10, rows.length))) {
                    if (row[col]) {
                        const cell = row[col].trim();
                        sampleCount++;
                        
                        // Pattern-based scoring
                        if (/^\d+[_\d]*$/.test(cell)) { // Numbers with underscores (02_01103)
                            score += 5;
                        } else if (/^[a-zA-Z0-9_\-]+\.(mp3|wav|ogg)$/i.test(cell)) { // Audio files
                            score += 8;
                        } else if (/^[a-zA-Z0-9_\-]{3,15}$/.test(cell)) { // Short alphanumeric codes
                            score += 2;
                        } else if (cell.length > 50) { // Long text unlikely to be filename
                            score -= 3;
                        } else if (/[.!?,:;]/.test(cell)) { // Punctuation suggests text content
                            score -= 2;
                        }
                        
                        // Database-based scoring - check if similar files exist
                        const cleanCell = cell.replace(/\.(mp3|wav|ogg)$/i, '');
                        for (const dbFilename of Object.keys(filePathDatabase)) {
                            const dbClean = dbFilename.replace(/\.(mp3|wav|ogg)$/i, '');
                            if (dbClean.includes(cleanCell) || cleanCell.includes(dbClean)) {
                                score += 10; // Strong database match
                                break;
                            }
                        }
                        
                        // Check for exact database matches
                        if (filePathDatabase[cell] || 
                            filePathDatabase[cell + '.mp3'] || 
                            filePathDatabase[cell + '.wav']) {
                            score += 15; // Perfect database match
                        }
                    }
                }
                
                // Normalize score by sample count
                const normalizedScore = sampleCount > 0 ? score / sampleCount : -999;
                
                if (normalizedScore > bestScore) {
                    bestScore = normalizedScore;
                    bestFilenameColumn = col;
                }
            }
            
            return {
                suggestedFilenameColumn: bestFilenameColumn,
                columnCount: columnCount,
                confidence: bestScore
            };
        }

        function setupColumnSelection() {
            const columnSelection = document.getElementById('columnSelection');
            const filenameSelect = document.getElementById('filenameColumn');
            const englishSelect = document.getElementById('englishColumn');
            const germanSelect = document.getElementById('germanColumn');
            
            // Clear previous options
            filenameSelect.innerHTML = '<option value="">-- Bitte auswählen --</option>';
            englishSelect.innerHTML = '<option value="">-- Bitte auswählen --</option>';
            germanSelect.innerHTML = '<option value="">-- Keine / Nicht vorhanden --</option>';
            
            // Get column headers/samples for preview
            const sampleRow = parsedImportData[0] || [];
            const columnCount = detectedColumns.columnCount;
            const suggestedFilename = detectedColumns.suggestedFilenameColumn;
            
            // Add options for each column to all selects
            for (let i = 0; i < columnCount; i++) {
                const sample = sampleRow[i] || '';
                const preview = sample.length > 30 ? sample.substring(0, 30) + '...' : sample;
                
                // Check if this looks like filename content for better labeling
                const isLikelyFilename = (suggestedFilename === i);
                const confidence = isLikelyFilename ? detectColumnConfidence(i) : '';
                
                const optionText = `Spalte ${i + 1}: ${preview}${confidence}`;
                
                // Add to all dropdowns
                filenameSelect.appendChild(new Option(optionText, i));
                englishSelect.appendChild(new Option(optionText, i));
                germanSelect.appendChild(new Option(optionText, i));
            }
            
            // Set intelligent suggestions
            if (suggestedFilename >= 0) {
                filenameSelect.value = suggestedFilename;
                
                // Auto-suggest English column (first non-filename column)
                const otherColumns = Array.from({length: columnCount}, (_, i) => i).filter(i => i !== suggestedFilename);
                if (otherColumns.length > 0) {
                    englishSelect.value = otherColumns[0];
                }
                
                // If there's a third column, suggest it for German
                if (otherColumns.length > 1) {
                    germanSelect.value = otherColumns[1];
                }
            } else if (columnCount === 2) {
                // If no clear detection but only 2 columns, suggest both
                filenameSelect.value = 0;
                englishSelect.value = 1;
            }
            
            // Generate preview table
            generatePreviewTable();
            
            // Show column selection
            columnSelection.style.display = 'block';
            document.getElementById('analyzeDataBtn').style.display = 'none';
            document.getElementById('startImportBtn').style.display = 'block';
            
            const confidenceMsg = detectedColumns.confidence > 5 ? 
                'Hohe Konfidenz bei Dateinamen-Erkennung' : 
                'Niedrige Konfidenz - bitte Auswahl prüfen';
            updateStatus(`Daten analysiert - ${confidenceMsg}`);
        }

        function detectColumnConfidence(columnIndex) {
            if (columnIndex !== detectedColumns.suggestedFilenameColumn) return '';
            
            if (detectedColumns.confidence > 10) return ' ✅ (sehr sicher)';
            else if (detectedColumns.confidence > 5) return ' ✅ (sicher)';
            else if (detectedColumns.confidence > 0) return ' ⚠️ (unsicher)';
            else return ' ❓ (geraten)';
        }

        function updatePreviewHighlighting() {
            generatePreviewTable();
        }

        function generatePreviewTable() {
            const previewTable = document.getElementById('previewTableContent');
            const previewRows = parsedImportData.slice(0, 3);
            const columnCount = detectedColumns.columnCount;
            
            // Get current selections
            const selectedFilename = parseInt(document.getElementById('filenameColumn').value);
            const selectedEnglish = parseInt(document.getElementById('englishColumn').value);
            const selectedGerman = parseInt(document.getElementById('germanColumn').value);
            
            let html = '<thead><tr>';
            for (let i = 0; i < columnCount; i++) {
                let bgColor = '#2a2a2a';
                let label = `Spalte ${i + 1}`;
                
                if (i === selectedFilename) {
                    bgColor = '#4caf50';
                    label += ' (Dateinamen)';
                } else if (i === selectedEnglish) {
                    bgColor = '#2196f3';
                    label += ' (EN Text)';
                } else if (i === selectedGerman) {
                    bgColor = '#ff9800';
                    label += ' (DE Text)';
                }
                
                html += `<th style="padding: 8px; background: ${bgColor}; color: white; font-size: 11px;">
                    ${label}
                </th>`;
            }
            html += '</tr></thead><tbody>';
            
            previewRows.forEach((row, rowIndex) => {
                html += '<tr>';
                for (let i = 0; i < columnCount; i++) {
                    const cellContent = row[i] || '';
                    const displayContent = cellContent.length > 50 ? cellContent.substring(0, 50) + '...' : cellContent;
                    
                    let bgColor = 'transparent';
                    if (i === selectedFilename) {
                        bgColor = 'rgba(76, 175, 80, 0.1)';
                    } else if (i === selectedEnglish) {
                        bgColor = 'rgba(33, 150, 243, 0.1)';
                    } else if (i === selectedGerman) {
                        bgColor = 'rgba(255, 152, 0, 0.1)';
                    }
                    
                    html += `<td style="padding: 8px; border-bottom: 1px solid #444; background: ${bgColor}; font-size: 11px; max-width: 200px; overflow: hidden;">
                        ${escapeHtml(displayContent)}
                    </td>`;
                }
                html += '</tr>';
            });
            
            html += '</tbody>';
            previewTable.innerHTML = html;
        }




function checkFileAccess() {
    const totalFiles = files.length;
    const selectedFiles = files.filter(f => f.selected);
    let accessibleFiles = 0;
    let inaccessibleFiles = 0;
    
    selectedFiles.forEach(file => {
        // Dynamisch prüfen ob Datei verfügbar ist
        let isAccessible = false;
        
        if (filePathDatabase[file.filename]) {
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
                const bestPath = matchingPaths[0];
                if (audioFileCache[bestPath.fullPath]) {
                    isAccessible = true;
                }
            }
        }
        
        if (isAccessible) {
            accessibleFiles++;
        } else {
            inaccessibleFiles++;
        }
    });
    
    const stats = {
        totalFiles: totalFiles,
        selectedFiles: selectedFiles.length,
        accessibleFiles: accessibleFiles,
        inaccessibleFiles: inaccessibleFiles
    };
    
    console.log('File Access Stats:', stats);
    return stats;
}

        function updateFileAccessStatus() {
            const accessStatus = document.getElementById('accessStatus');
            const stats = checkFileAccess();
            
            if (stats.selectedFiles === 0) {
                accessStatus.textContent = '📂 Keine Auswahl';
                accessStatus.className = 'access-status none';
                accessStatus.title = 'Keine Dateien ausgewählt - Klicken für Info';
            } else if (stats.inaccessibleFiles === 0) {
                accessStatus.textContent = `✅ ${stats.selectedFiles} verfügbar`;
                accessStatus.className = 'access-status good';
                accessStatus.title = 'Alle Dateien verfügbar - Export möglich';
            } else if (stats.accessibleFiles === 0) {
                accessStatus.textContent = `❌ ${stats.selectedFiles} blockiert`;
                accessStatus.className = 'access-status error';
                accessStatus.title = 'Keine Dateien verfügbar - Klicken zum Scannen';
            } else {
                accessStatus.textContent = `⚠️ ${stats.accessibleFiles}/${stats.selectedFiles} verfügbar`;
                accessStatus.className = 'access-status warning';
                accessStatus.title = `${stats.inaccessibleFiles} Dateien nicht verfügbar - Klicken zum Scannen`;
            }
        }

        // Backup and Restore functionality
// =========================== CREATEBACKUP START ===========================
        function createBackup(showMsg = false) {
            const backup = {
                version: APP_VERSION,
                date: new Date().toISOString(),
                projects: projects,
                textDatabase: textDatabase,
                filePathDatabase: filePathDatabase,
                folderCustomizations: folderCustomizations,
                levelColors: levelColors,
                levelOrders: levelOrders,
                levelIcons: levelIcons,
                autoBackupInterval: autoBackupInterval,
                autoBackupLimit: autoBackupLimit,
                ignoredFiles: ignoredFiles,
                elevenLabsApiKey: elevenLabsApiKey,
                currentProjectId: currentProject?.id
            };

            const json = JSON.stringify(backup, null, 2);

            if (window.electronAPI && window.electronAPI.saveBackup) {
                window.electronAPI.saveBackup(json).then(() => {
                    enforceBackupLimit();
                    if (showMsg) updateStatus('Backup erstellt');
                    loadBackupList();
                });
            } else {
                let list = JSON.parse(localStorage.getItem('hla_backups') || '[]');
                const name = `backup_${new Date().toISOString()}.json`;
                list.push({ name, data: json });
                if (list.length > autoBackupLimit) list = list.slice(list.length - autoBackupLimit);
                localStorage.setItem('hla_backups', JSON.stringify(list));
                if (showMsg) updateStatus('Backup erstellt');
                loadBackupList();
            }
        }
// =========================== CREATEBACKUP END =============================

// =========================== ENFORCEBACKUPLIMIT START =====================
        async function enforceBackupLimit() {
            if (window.electronAPI && window.electronAPI.listBackups) {
                const files = await window.electronAPI.listBackups();
                if (files.length > autoBackupLimit) {
                    const remove = files.slice(autoBackupLimit);
                    for (const f of remove) {
                        await window.electronAPI.deleteBackup(f);
                    }
                }
            }
        }
// =========================== ENFORCEBACKUPLIMIT END =======================

// =========================== LOADBACKUPLIST START ========================
        async function loadBackupList() {
            const listDiv = document.getElementById('backupList');
            listDiv.innerHTML = '';
            let files = [];
            if (window.electronAPI && window.electronAPI.listBackups) {
                files = await window.electronAPI.listBackups();
            } else {
                files = (JSON.parse(localStorage.getItem('hla_backups') || '[]')).map(b => b.name);
            }
            files.slice(0, 10).forEach(name => {
                const item = document.createElement('div');
                item.className = 'backup-item';
                const label = document.createElement('span');
                label.textContent = name;
                const restoreBtn = document.createElement('button');
                restoreBtn.textContent = 'Wiederherstellen';
                restoreBtn.onclick = () => restoreFromBackup(name);
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Löschen';
                deleteBtn.onclick = () => { deleteBackup(name); };
                item.appendChild(label);
                item.appendChild(restoreBtn);
                item.appendChild(deleteBtn);
                listDiv.appendChild(item);
            });
            document.getElementById('backupInterval').value = autoBackupInterval;
            document.getElementById('backupLimit').value = autoBackupLimit;
        }
// =========================== LOADBACKUPLIST END ==========================

// =========================== SHOWBACKUPDIALOG START ======================
        function showBackupDialog() {
            document.getElementById('backupDialog').style.display = 'flex';
            loadBackupList();
            document.getElementById('backupInterval').focus();
            document.getElementById('backupInterval').onchange = () => {
                autoBackupInterval = parseInt(document.getElementById('backupInterval').value) || 1;
                localStorage.setItem('hla_autoBackupInterval', autoBackupInterval);
                startAutoBackup();
            };
            document.getElementById('backupLimit').onchange = () => {
                autoBackupLimit = parseInt(document.getElementById('backupLimit').value) || 1;
                localStorage.setItem('hla_autoBackupLimit', autoBackupLimit);
                enforceBackupLimit();
                startAutoBackup();
            };
            const sel = document.getElementById('lineEndingSelect');
            sel.value = csvLineEnding;
            sel.onchange = () => {
                csvLineEnding = sel.value;
                localStorage.setItem('hla_lineEnding', csvLineEnding);
            };
        }

        function closeBackupDialog() {
            document.getElementById('backupDialog').style.display = 'none';
        }

        function openBackupFolder() {
            if (window.electronAPI && window.electronAPI.openBackupFolder) {
                window.electronAPI.openBackupFolder();
            } else {
                // Fallback fuer Browser-Version: oeffnet den Unterordner "backups" im neuen Tab
                const url = new URL('backups/', window.location.href).toString();
                window.open(url, '_blank');
            }
        }

        // Backup aus Datei laden
        function initiateBackupUpload() {
            document.getElementById('backupUploadInput').click();
        }

        // Eingelesene Backup-Datei verarbeiten
        async function handleBackupUpload(input) {
            const file = input.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                const backup = JSON.parse(text);
                applyBackupData(backup);
            } catch (err) {
                alert('Fehler beim Importieren: ' + err.message);
            }
            input.value = '';
        }

        // =========================== SHOWAPIDIALOG START ======================
        async function showApiDialog() {
            document.getElementById('apiDialog').style.display = 'flex';
            document.getElementById('apiKeyInput').value = elevenLabsApiKey;

            await validateApiKey();

            // Vor dem Aufbau verwaiste Anpassungen entfernen
            cleanupOrphanCustomizations();

            const list = document.getElementById('voiceIdList');
            list.innerHTML = '';

            // Alle bekannten Ordner sammeln – projektübergreifend
            const folderSet = new Set();
            Object.values(filePathDatabase).forEach(paths => {
                paths.forEach(p => folderSet.add(p.folder));
            });
            const folders = Array.from(folderSet).sort();

            const groups = { combine: [], vortigaunt: [], citizen: [], other: [] };
            folders.forEach(name => {
                const lower = name.toLowerCase();
                if (lower.includes('combine')) groups.combine.push(name);
                else if (lower.includes('vort')) groups.vortigaunt.push(name);
                else if (lower.includes('citizen') || lower.includes('civilian')) groups.citizen.push(name);
                else groups.other.push(name);
            });

            const order = [
                ['combine', 'Combine'],
                ['vortigaunt', 'Vortigaunts'],
                ['citizen', 'Zivilisten'],
                ['other', 'Sonstige']
            ];

            order.forEach(([key, label]) => {
                if (groups[key].length === 0) return;
                const details = document.createElement('details');
                const summary = document.createElement('summary');
                summary.textContent = label;
                details.appendChild(summary);

                const container = document.createElement('div');
                container.className = 'voice-group';
                groups[key].forEach(name => {
                    const cust = folderCustomizations[name] || {};
                    const id = cust.voiceId || '';
                    const row = document.createElement('div');
                    row.className = 'voice-id-item';

                    const lab = document.createElement('label');
                    lab.textContent = name;
                    const select = document.createElement('select');
                    select.dataset.folder = name;
                    const empty = document.createElement('option');
                    empty.value = '';
                    empty.textContent = '-- wählen --';
                    select.appendChild(empty);
                    [...availableVoices, ...customVoices].forEach(v => {
                        const opt = document.createElement('option');
                        opt.value = v.voice_id;
                        opt.textContent = v.name;
                        select.appendChild(opt);
                    });
                    select.value = id;
                    row.appendChild(lab);
                    row.appendChild(select);
                    container.appendChild(row);
                });
                details.appendChild(container);
                list.appendChild(details);
            });

        const customList = document.getElementById('customVoicesList');
        customList.innerHTML = '';
            customVoices.forEach(v => {
                const item = document.createElement('div');
                item.className = 'custom-voice-item';

                const idInput = document.createElement('input');
                idInput.type = 'text';
                idInput.value = v.voice_id;
                idInput.className = 'custom-voice-id';

                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.value = v.name;
                nameInput.className = 'custom-voice-name';

                const fetchBtn = document.createElement('button');
                fetchBtn.textContent = '🔄';
                fetchBtn.onclick = () => fetchVoiceName(fetchBtn);

                const delBtn = document.createElement('button');
                delBtn.textContent = '🗑';
                delBtn.onclick = () => item.remove();

                item.appendChild(idInput);
                item.appendChild(nameInput);
                item.appendChild(fetchBtn);
                item.appendChild(delBtn);
                customList.appendChild(item);
            });

            updateVoiceSettingsDisplay();

            document.getElementById('apiKeyInput').focus();
        }

        async function saveApiSettings() {
            elevenLabsApiKey = document.getElementById('apiKeyInput').value.trim();
            localStorage.setItem('hla_elevenLabsApiKey', elevenLabsApiKey);

            document.querySelectorAll('#voiceIdList select').forEach(sel => {
                const folder = sel.dataset.folder;
                const val = sel.value.trim();
                if (!folderCustomizations[folder]) folderCustomizations[folder] = {};
                if (val) {
                    folderCustomizations[folder].voiceId = val;
                } else {
                    delete folderCustomizations[folder].voiceId;
                }
            });
            const newVoices = [];
            document.querySelectorAll('#customVoicesList .custom-voice-item').forEach(item => {
                const id = item.querySelector('.custom-voice-id').value.trim();
                if (!id) return;
                const name = item.querySelector('.custom-voice-name').value.trim() || id;
                newVoices.push({ voice_id: id, name });
            });
            customVoices = newVoices;
            localStorage.setItem('hla_customVoices', JSON.stringify(customVoices));

            saveFolderCustomizations();
            await validateApiKey();
            closeApiDialog();
            updateStatus('API-Einstellungen gespeichert');
        }

        function closeApiDialog() {
            document.getElementById('apiDialog').style.display = 'none';
        }
        // =========================== SHOWAPIDIALOG END ========================
        // Prueft den eingegebenen API-Key und laedt die verfuegbaren Stimmen
        async function validateApiKey() {
            const status = document.getElementById('apiKeyStatus');
            status.textContent = '⏳';
            try {
                const res = await fetch(`${API}/voices`, {
                    headers: { 'xi-api-key': document.getElementById('apiKeyInput').value.trim() }
                });
                if (!res.ok) throw new Error('Fehler');
                const data = await res.json();
                availableVoices = data.voices || [];
                // Eigene Stimmen anhaengen
                availableVoices.push(...customVoices);
                status.textContent = '✔';
                status.style.color = '#6cc644';
                return true;
            } catch (e) {
                // Bei Fehler nur eigene Stimmen anzeigen
                availableVoices = [...customVoices];
                status.textContent = '✖';
                status.style.color = '#e74c3c';
                return false;
            }
        }

        function testApiKey() {
            const btn = document.getElementById('testApiKeyBtn');
            btn.textContent = 'Teste...';
            btn.disabled = true;
            validateApiKey().then(ok => {
                btn.disabled = false;
                if (ok) {
                    btn.textContent = 'Alles in Ordnung';
                    btn.style.background = '#4caf50';
                } else {
                    btn.textContent = 'Ungültig';
                    btn.style.background = '#d32f2f';
                }
            });
        }

        function toggleApiKey() {
            const input = document.getElementById('apiKeyInput');
            input.type = input.type === 'password' ? 'text' : 'password';
        }

        function clearAllVoiceIds() {
            document.querySelectorAll('#voiceIdList select').forEach(sel => sel.value = '');
        }

        async function testVoiceIds() {
            updateStatus('Teste Stimmen...');
            for (const sel of document.querySelectorAll('#voiceIdList select')) {
                const id = sel.value.trim();
                if (!id) continue;
                try {
                    const res = await fetch(`${API}/voices/${id}`, {
                        headers: { 'xi-api-key': elevenLabsApiKey }
                    });
                    if (!res.ok) throw new Error('Fehler');
                } catch (e) {
                    updateStatus('Fehler bei Stimme ' + id);
                    return;
                }
            }
            updateStatus('Alle Stimmen OK');
        }

        // Fuegt eine eigene Voice-ID hinzu
        function addCustomVoice() {
            document.getElementById('newVoiceId').value = '';
            document.getElementById('newVoiceName').value = '';
            document.getElementById('addVoiceDialog').style.display = 'flex';
            document.getElementById('newVoiceId').focus();
        }

        function closeAddVoiceDialog() {
            document.getElementById('addVoiceDialog').style.display = 'none';
        }

        async function fetchNewVoiceName() {
            const id = document.getElementById('newVoiceId').value.trim();
            if (!id || !elevenLabsApiKey) return;
            try {
                const res = await fetch(`${API}/voices/${id}`, {
                    headers: { 'xi-api-key': elevenLabsApiKey }
                });
                if (res.ok) {
                    const data = await res.json();
                    document.getElementById('newVoiceName').value = data.name || '';
                }
            } catch (e) {}
        }

        async function fetchVoiceName(btn) {
            const item = btn.parentElement;
            const id = item.querySelector('.custom-voice-id').value.trim();
            const nameInput = item.querySelector('.custom-voice-name');
            if (!id || !elevenLabsApiKey) return;
            try {
                const res = await fetch(`${API}/voices/${id}`, {
                    headers: { 'xi-api-key': elevenLabsApiKey }
                });
                if (res.ok) {
                    const data = await res.json();
                    nameInput.value = data.name || '';
                }
            } catch (e) {}
        }

        async function confirmAddVoice() {
            const id = document.getElementById('newVoiceId').value.trim();
            let name = document.getElementById('newVoiceName').value.trim();
            if (!id) return;
            if (!name && elevenLabsApiKey) {
                try {
                    const res = await fetch(`${API}/voices/${id}`, {
                        headers: { 'xi-api-key': elevenLabsApiKey }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        name = data.name || '';
                    }
                } catch (e) {}
            }
            if (!name) name = id;
            const neu = { voice_id: id, name };
            customVoices.push(neu);
            localStorage.setItem('hla_customVoices', JSON.stringify(customVoices));
            availableVoices.push(neu);
            closeAddVoiceDialog();
            showApiDialog();
        }

        function showHistoryDialog(file) {
            currentHistoryPath = getFullPath(file);
            document.getElementById('historyDialog').style.display = 'flex';
            loadHistoryList(currentHistoryPath);
        }

        function closeHistoryDialog() {
            document.getElementById('historyDialog').style.display = 'none';
            currentHistoryPath = null;
        }

        async function loadHistoryList(relPath) {
            const listDiv = document.getElementById('historyList');
            listDiv.innerHTML = '';
            if (!window.electronAPI || !window.electronAPI.listDeHistory) {
                listDiv.textContent = 'Nur in der Desktop-Version verfügbar';
                return;
            }
            // Aktuelle Datei anzeigen
            const currentItem = document.createElement('div');
            currentItem.className = 'history-item';
            const curLabel = document.createElement('span');
            curLabel.textContent = 'Aktuelle Datei';
            const curPlay = document.createElement('button');
            curPlay.textContent = '▶';
            curPlay.onclick = () => playCurrentSample(relPath);
            currentItem.appendChild(curLabel);
            currentItem.appendChild(curPlay);
            listDiv.appendChild(currentItem);

            const files = await window.electronAPI.listDeHistory(relPath);
            files.forEach(name => {
                const item = document.createElement('div');
                item.className = 'history-item';
                const label = document.createElement('span');
                label.textContent = name;
                const playBtn = document.createElement('button');
                playBtn.textContent = '▶';
                playBtn.onclick = () => playHistorySample(relPath, name);
                const restoreBtn = document.createElement('button');
                restoreBtn.textContent = 'Wiederherstellen';
                restoreBtn.onclick = () => restoreHistoryVersion(relPath, name);
                item.appendChild(label);
                item.appendChild(playBtn);
                item.appendChild(restoreBtn);
                listDiv.appendChild(item);
            });
        }

        function playHistorySample(relPath, name) {
            const audio = document.getElementById('audioPlayer');
            audio.src = `sounds/DE-History/${relPath}/${name}`;
            audio.play();
        }

        function playCurrentSample(relPath) {
            const audio = document.getElementById('audioPlayer');
            audio.src = `sounds/DE/${relPath}`;
            audio.play();
        }

        async function restoreHistoryVersion(relPath, name) {
            if (!window.electronAPI || !window.electronAPI.restoreDeHistory) {
                alert('Nur in der Desktop-Version verfügbar');
                return;
            }
            await window.electronAPI.restoreDeHistory(relPath, name);
            deAudioCache[relPath] = `sounds/DE/${relPath}`;
            await updateHistoryCache(relPath);
            renderFileTable();
            loadHistoryList(relPath);
            updateStatus('Version wiederhergestellt');
        }
// =========================== SHOWBACKUPDIALOG END ========================

// =========================== RESTOREFROMBACKUP START =====================
        async function restoreFromBackup(name) {
            try {
                let content;
                if (window.electronAPI && window.electronAPI.readBackup) {
                    content = await window.electronAPI.readBackup(name);
                } else {
                    const list = JSON.parse(localStorage.getItem('hla_backups') || '[]');
                    const entry = list.find(b => b.name === name);
                    if (!entry) return;
                    content = entry.data;
                }
                const backup = JSON.parse(content);
                applyBackupData(backup);
            } catch (err) {
                alert('Fehler beim Wiederherstellen: ' + err.message);
            }
        }

        async function deleteBackup(name) {
            if (window.electronAPI && window.electronAPI.deleteBackup) {
                await window.electronAPI.deleteBackup(name);
            } else {
                let list = JSON.parse(localStorage.getItem('hla_backups') || '[]');
                list = list.filter(b => b.name !== name);
                localStorage.setItem('hla_backups', JSON.stringify(list));
            }
            loadBackupList();
        }
// =========================== RESTOREFROMBACKUP END =======================

// =========================== STARTAUTOBACKUP START =======================
        function startAutoBackup() {
            if (autoBackupTimer) clearInterval(autoBackupTimer);
            autoBackupTimer = setInterval(() => createBackup(false), autoBackupInterval * 60000);
        }
// =========================== STARTAUTOBACKUP END =========================

// =========================== APPLYBACKUPDATA START =======================
        function applyBackupData(backup) {
            if (!backup.version || !backup.projects) {
                throw new Error('Ungültiges Backup-Format');
            }
            if (!confirm('Dies wird alle aktuellen Daten überschreiben. Fortfahren?')) {
                return;
            }

            projects = backup.projects;
            textDatabase = backup.textDatabase || {};
            filePathDatabase = backup.filePathDatabase || {};
            folderCustomizations = backup.folderCustomizations || {};
            levelColors = backup.levelColors || {};
            levelOrders = backup.levelOrders || {};
            levelIcons = backup.levelIcons || {};
            autoBackupInterval = backup.autoBackupInterval || autoBackupInterval;
            autoBackupLimit = backup.autoBackupLimit || autoBackupLimit;
            ignoredFiles = backup.ignoredFiles || {};
            elevenLabsApiKey = backup.elevenLabsApiKey || elevenLabsApiKey;

            let migrationNeeded = false;
            projects.forEach(project => {
                // Icon-Felder aus alten Backups entfernen
                if (project.hasOwnProperty('icon')) {
                    delete project.icon;
                    migrationNeeded = true;
                }
                if (!project.hasOwnProperty('color')) {
                    project.color = '#333333';
                    migrationNeeded = true;
                }
            });
            if (migrationNeeded) {
                console.log('Wiederhergestellte Projekte migriert: Icons und Farben hinzugefügt');
            }

            saveProjects();
            saveTextDatabase();
            saveFilePathDatabase();
            saveFolderCustomizations();
            saveLevelColors();
            saveLevelOrders();
            saveLevelIcons();
            saveIgnoredFiles();
            localStorage.setItem('hla_elevenLabsApiKey', elevenLabsApiKey);
            localStorage.setItem('hla_autoBackupInterval', autoBackupInterval);
            localStorage.setItem('hla_autoBackupLimit', autoBackupLimit);
            startAutoBackup();

            renderProjects();

            if (backup.currentProjectId) {
                selectProject(backup.currentProjectId);
            } else if (projects.length > 0) {
                selectProject(projects[0].id);
            }

            updateStatus('Backup wiederhergestellt');
        }
// =========================== APPLYBACKUPDATA END =========================



// =========================== FINDDUPLICATES START ===========================
function findDuplicates() {
    const allDuplicates = new Map();
    
    // Finde Dateien mit mehreren Pfaden in der gleichen Datei-Gruppe
    Object.entries(filePathDatabase).forEach(([filename, paths]) => {
        if (paths.length > 1) {
            // Prüfe ob es echte Duplikate sind (gleicher Ordner) oder nur gleiche Dateinamen in verschiedenen Ordnern
            const folderGroups = new Map();
            
            paths.forEach((pathInfo, index) => {
                // Ordnername auf Kleinbuchstaben normalisieren, damit die
                // Duplikatsuche nicht von Groß-/Kleinschreibung abhängt
                const folder = pathInfo.folder.toLowerCase();
                if (!folderGroups.has(folder)) {
                    folderGroups.set(folder, []);
                }
                folderGroups.get(folder).push({
                    filename: filename,
                    pathInfo: pathInfo,
                    pathIndex: index,
                    key: `${pathInfo.folder}/${filename}`,
                    originalFolder: pathInfo.folder
                });
            });
            
            // Nur wenn der GLEICHE Ordner mehrere Einträge hat, ist es ein Duplikat
            folderGroups.forEach((group, folderName) => {
                if (group.length > 1) {
                    const duplicateKey = `duplicate_${folderName}/${filename}`;
                    allDuplicates.set(duplicateKey, group);
                    console.log(`Duplikat gefunden: ${filename} in ${folderName} (${group.length} Einträge)`);
                }
            });
        }
    });
    
    console.log(`Gefunden: ${allDuplicates.size} echte Duplikate`);
    return allDuplicates;
}
// =========================== FINDDUPLICATES END ===========================

        function scoreDuplicateItem(item) {
            let score = 0;
            const fileKey = item.key;
            
            // Check if has EN text in textDatabase
            if (textDatabase[fileKey] && textDatabase[fileKey].en) {
                score += 10;
            }
            
            // Check if is in any project
            const isInProject = projects.some(project => 
                project.files && project.files.some(file => 
                    file.filename === item.filename && file.folder === item.pathInfo.folder
                )
            );
            if (isInProject) {
                score += 20;
            }
            
            // Check if has audio file cached
            if (audioFileCache[item.pathInfo.fullPath]) {
                score += 5;
            }
            
            // Check if has German text
            if (textDatabase[fileKey] && textDatabase[fileKey].de) {
                score += 8;
            }
            
            // Tiebreaker: prefer first occurrence (lower pathIndex)
            score += 1 - (item.pathIndex * 0.1);
            
            return score;
        }

        function cleanupDuplicates() {
            const duplicates = findDuplicates();
            
            if (duplicates.size === 0) {
                alert('✅ Keine Duplikate gefunden!\n\nDie Datenbank ist bereits sauber.');
                return;
            }
            
            // Calculate scores and determine what to keep/delete
            const cleanupPlan = [];
            let totalToDelete = 0;
            
            duplicates.forEach((group, key) => {
                const scoredItems = group.map(item => ({
                    ...item,
                    score: scoreDuplicateItem(item)
                }));
                
                // Sort by score (highest first)
                scoredItems.sort((a, b) => b.score - a.score);
                
                // Keep the highest scored item, mark others for deletion
                const toKeep = scoredItems[0];
                const toDelete = scoredItems.slice(1);
                
                cleanupPlan.push({
                    key: key,
                    keep: toKeep,
                    delete: toDelete
                });
                
                totalToDelete += toDelete.length;
            });
            
            // Show confirmation dialog
            showCleanupConfirmation(cleanupPlan, totalToDelete);
        }

        function showCleanupConfirmation(cleanupPlan, totalToDelete) {
            const duplicateGroups = cleanupPlan.length;
            
            const confirmMessage = `🧹 Duplikate-Bereinigung\n\n` +
                `Gefunden: ${duplicateGroups} Duplikate-Gruppen\n` +
                `Zu löschen: ${totalToDelete} Einträge\n` +
                `Zu behalten: ${duplicateGroups} Einträge\n\n` +
                `Kriterien für das Behalten:\n` +
                `• In Projekt vorhanden: +20 Punkte\n` +
                `• Hat EN Text: +10 Punkte\n` +
                `• Hat DE Text: +8 Punkte\n` +
                `• Audio verfügbar: +5 Punkte\n\n` +
                `Möchten Sie fortfahren?`;
            
            if (!confirm(confirmMessage)) {
                return;
            }
            
            // Execute cleanup
            executeCleanup(cleanupPlan, totalToDelete);
        }

function executeCleanup(cleanupPlan, totalToDelete) {
    let deletedCount = 0;
    let mergedCount = 0;
    const deletedItems = [];
    
    updateStatus('Bereinige Duplikate intelligent...');
    
    // Execute cleanup plan with intelligent merging
    cleanupPlan.forEach(plan => {
        const filename = plan.keep.filename;
        
        if (!filePathDatabase[filename]) {
            console.log(`Warning: ${filename} not found in database during cleanup`);
            return;
        }
        
        // Collect all items to delete and the item to keep
        const toDelete = plan.delete;
        const toKeep = plan.keep;
        
        // Find the best item to keep (highest score)
        let bestItem = toKeep;
        let bestScore = toKeep.score;
        
        // Check all items including those marked for deletion to find the absolute best
        [...plan.delete, plan.keep].forEach(item => {
            const score = scoreDuplicateItem(item);
            if (score > bestScore) {
                bestScore = score;
                bestItem = item;
            }
        });
        
        console.log(`Cleaning up ${filename}: keeping ${bestItem.pathInfo.folder} (score: ${bestScore})`);
        
        // Create new paths array with only the best item
        const newPaths = [{
            folder: bestItem.pathInfo.folder,
            fullPath: bestItem.pathInfo.fullPath,
            fileObject: bestItem.pathInfo.fileObject
        }];
        
        // Count items being removed
        const originalCount = filePathDatabase[filename].length;
        const removedCount = originalCount - 1;
        
        // Track deleted items for reporting
        plan.delete.concat(plan.keep).forEach(item => {
            if (item !== bestItem) {
                deletedItems.push({
                    filename: filename,
                    folder: item.pathInfo.folder,
                    fullPath: item.pathInfo.fullPath,
                    score: item.score || scoreDuplicateItem(item)
                });
                
                // Remove from audio cache
                if (audioFileCache[item.pathInfo.fullPath]) {
                    delete audioFileCache[item.pathInfo.fullPath];
                }
            }
        });
        
        // Update the database with only the best item
        filePathDatabase[filename] = newPaths;
        deletedCount += removedCount;
        mergedCount++;
        
        console.log(`Merged ${originalCount} variants of ${filename} into 1 (removed ${removedCount})`);
    });
    
    // Clean up completely empty entries (shouldn't happen but just in case)
    Object.keys(filePathDatabase).forEach(filename => {
        if (filePathDatabase[filename].length === 0) {
            delete filePathDatabase[filename];
            console.log(`Removed empty entry: ${filename}`);
        }
    });
    
    // Save changes
    saveFilePathDatabase();
    
    // Update status
    updateStatus(`Intelligente Bereinigung: ${mergedCount} Dateien konsolidiert, ${deletedCount} Duplikate entfernt`);
    
    // Show detailed results
    const resultsMessage = `✅ Intelligente Bereinigung erfolgreich!\n\n` +
        `📊 Statistik:\n` +
        `• ${mergedCount} Dateien konsolidiert (mehrere Pfade → ein bester Pfad)\n` +
        `• ${deletedCount} Duplikate entfernt\n` +
        `• ${Object.keys(filePathDatabase).length} eindeutige Dateien verbleiben\n\n` +
        `🎯 Kriterien für beste Pfade:\n` +
        `• In Projekt vorhanden: +20 Punkte\n` +
        `• Hat EN Text: +10 Punkte\n` +
        `• Hat DE Text: +8 Punkte\n` +
        `• Audio verfügbar: +5 Punkte\n\n` +
        `🔍 Beispiele konsolidiert:\n` +
        deletedItems.slice(0, 5).map(item => 
            `• ${item.filename} (entfernt: ${item.folder.split('/').pop()})`
        ).join('\n') +
        (deletedItems.length > 5 ? `\n... und ${deletedItems.length - 5} weitere` : '');
    
    setTimeout(() => {
        alert(resultsMessage);
        
        // Refresh folder browser if open
        const folderBrowserOpen = document.getElementById('folderBrowserDialog').style.display === 'flex';
        if (folderBrowserOpen) {
            showFolderGrid();
        }
        
        // Refresh main table
        renderFileTable();
    }, 100);
}

        function resetFileDatabase() {
            if (!confirm('Dies löscht die gesamte Datei-Datenbank und alle Ordner-Anpassungen!\nAlle Pfadinformationen und Customizations gehen verloren.\n\nFortfahren?')) {
                return;
            }
            
            filePathDatabase = {};
            audioFileCache = {};
            folderCustomizations = {};
            saveFilePathDatabase();
            saveFolderCustomizations();
            updateStatus('Datei-Datenbank und Ordner-Anpassungen zurückgesetzt. Bitte Ordner neu scannen.');
        updateFileAccessStatus();
        }

        // Öffnet die Debug-Konsole und bei der Desktop-Version zusätzlich die DevTools
        function toggleDevTools() {
            const wrapper = document.getElementById('debugConsoleWrapper');
            if (wrapper) {
                wrapper.open = true; // Zeigt die eingebettete Konsole an
            }
            debugLog('Dev-Button aktiviert');
            if (window.electronAPI) {
                window.electronAPI.toggleDevTools();
            }
            openDebugInfo();
        }
        // Funktion global verfügbar machen, damit der Button im HTML immer wirkt
        window.toggleDevTools = toggleDevTools;

        // Öffnet ein Fenster mit detaillierten Debug-Informationen
        async function openDebugInfo() {
            // Zu sammelnde Informationen
            let info = {};
            if (window.electronAPI && window.electronAPI.getDebugInfo) {
                // Desktop-Version liefert Pfad- und System-Informationen
                info = await window.electronAPI.getDebugInfo();
            } else {
                // Fallback für die Browser-Version ohne Electron
                // Basisinformationen ohne Electron-API
                info = {
                    Hinweis: 'Browser-Version ohne Electron-API',
                    appVersion: APP_VERSION,
                    Browser: navigator.userAgent,
                    URL: location.href,
                    Plattform: navigator.platform,
                    Sprache: navigator.language,
                    'Electron-API vorhanden': isElectron,
                    'Im Browser gestartet': true
                };

                // Zusätzliche Infos, wenn ein Node-Process existiert
                if (typeof process !== 'undefined') {
                    info.nodeVersion = process.version;
                    if (process.versions) {
                        info.electronVersion = process.versions.electron || 'n/a';
                        info.chromeVersion = process.versions.chrome || 'n/a';
                    }
                    info['Process-Plattform'] = process.platform;
                    info['CPU-Architektur'] = process.arch;

                    // Renderer-spezifische Eigenschaften
                    if ('type' in process) info['Process-Typ'] = process.type;
                    if ('contextIsolated' in process) info['Context Isolation'] = String(process.contextIsolated);
                    if ('sandboxed' in process) info['Sandbox'] = String(process.sandboxed);

                    // Ein paar häufige Umgebungsvariablen
                    if (process.env.NODE_ENV) info['NODE_ENV'] = process.env.NODE_ENV;
                    if (process.env.ELECTRON_RUN_AS_NODE) info['ELECTRON_RUN_AS_NODE'] = process.env.ELECTRON_RUN_AS_NODE;
                    if (process.env.ELECTRON_DISABLE_SANDBOX) info['ELECTRON_DISABLE_SANDBOX'] = process.env.ELECTRON_DISABLE_SANDBOX;
                }
            }

            // Allgemeine Browser-Informationen
            info['Fenstergröße'] = `${window.innerWidth}x${window.innerHeight}`;
            info['Bildschirmauflösung'] = `${screen.width}x${screen.height}`;
            info['Seitenzustand'] = document.readyState;
            info['Sicherer Kontext'] = window.isSecureContext;
            info['Protokoll'] = location.protocol;
            info['Benutzeragent'] = navigator.userAgent;
            info['Verwendete Sprache'] = navigator.language;
            info.URL = location.href;
            info['Electron-API vorhanden'] = isElectron;
            info['Im Browser gestartet'] = !isElectron;

            // Debug-Konsole auslesen
            const debugText = document.getElementById('debugConsole')?.textContent || '';
            if (debugText.trim()) {
                info['Debug-Konsole'] = debugText.trim().split('\n').slice(-10).join('\n');
            }

            // setup.log wurde aus dem Hauptprozess geliefert
            if (info.setupLog) {
                info['setup.log'] = info.setupLog;
                delete info.setupLog;
            }

            // Versionsinformationen separat sammeln
            // Versionen der genutzten Plattformen sammeln; bei fehlendem
            // Node-Prozess werden leere Platzhalter verwendet
            const nodeDefined = typeof process !== 'undefined';
            const versionInfo = {
                'App-Version': info.appVersion ?? info['App-Version'] ?? APP_VERSION,
                'Node-Version': info.nodeVersion ?? info['Node-Version'] ?? (nodeDefined ? process.version : 'n/a'),
                'Electron-Version': info.electronVersion ?? info['Electron-Version'] ?? (nodeDefined && process.versions ? process.versions.electron || 'n/a' : 'n/a'),
                'Chrome-Version': info.chromeVersion ?? info['Chrome-Version'] ?? (nodeDefined && process.versions ? process.versions.chrome || 'n/a' : 'n/a')
            };
            delete info.appVersion; delete info['App-Version'];
            delete info.nodeVersion; delete info['Node-Version'];
            delete info.electronVersion; delete info['Electron-Version'];
            delete info.chromeVersion; delete info['Chrome-Version'];

            // HTML für die Anzeige aufbauen
            let html = '<h3>Debug-Informationen</h3>';
            html += '<h4>Programmversionen</h4><ul id="debugVersionList">';
            for (const [key, value] of Object.entries(versionInfo)) {
                html += `<li><strong>${escapeHtml(key)}</strong>: <code>${escapeHtml(String(value))}</code></li>`;
            }
            html += '</ul><ul id="debugInfoList">';
            for (const [key, value] of Object.entries(info)) {
                const val = String(value);
                if (val.includes('\n')) {
                    html += `<li><strong>${escapeHtml(key)}</strong>:<pre>${escapeHtml(val)}</pre></li>`;
                } else {
                    html += `<li><strong>${escapeHtml(key)}</strong>: <code>${escapeHtml(val)}</code></li>`;
                }
            }
            html += '</ul>';
            html += '<button id="copyDebugInfoBtn" class="btn btn-secondary">Kopieren</button>';
            ui.showModal(html);

            // Kopier-Knopf mit Funktion belegen
            const copyBtn = document.getElementById('copyDebugInfoBtn');
            if (copyBtn) {
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const allData = { ...versionInfo, ...info };
                    const text = Object.entries(allData)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join('\n');
                    navigator.clipboard.writeText(text)
                        .then(() => ui.notify('Debug-Daten kopiert'))
                        .catch(err => ui.notify('Kopieren fehlgeschlagen: ' + err, 'error'));
                });
            }
        }

        // Zeigt oder versteckt das Einstellungen-Menü
        function toggleSettingsMenu() {
            const menu = document.getElementById('settingsMenu');
            if (menu.style.display === 'block') {
                menu.style.display = 'none';
                document.removeEventListener('click', closeSettingsMenuOnOutside);
            } else {
                menu.style.display = 'block';
                setTimeout(() => {
                    document.addEventListener('click', closeSettingsMenuOnOutside);
                }, 0);
            }
        }

        // Schließt das Menü, wenn außerhalb geklickt wird
        function closeSettingsMenuOnOutside(e) {
            const menu = document.getElementById('settingsMenu');
            const btn = document.getElementById('settingsButton');
            if (!menu.contains(e.target) && e.target !== btn) {
                menu.style.display = 'none';
                document.removeEventListener('click', closeSettingsMenuOnOutside);
            }
        }


// =========================== WAEHLEPROJEKTORDNER START =======================
async function waehleProjektOrdner() {
    try {
        // Nutzer wählt den Wurzelordner aus
        projektOrdnerHandle = await window.showDirectoryPicker();
        await saveProjectFolderHandle(projektOrdnerHandle); // Merken des Ordners

        // DE-Ordner anlegen oder öffnen
        deOrdnerHandle = await projektOrdnerHandle.getDirectoryHandle('DE', { create: true });
        // EN-Ordner anlegen oder öffnen
        enOrdnerHandle = await projektOrdnerHandle.getDirectoryHandle('EN', { create: true });

        enDateien = [];
        deAudioCache = {};

        // Rekursives Einlesen aller Unterordner
        async function leseOrdner(handle, deHandle, pfad = '') {
            for await (const [name, child] of handle.entries()) {
                if (name === 'DE') continue; // DE-Ordner überspringen

                if (child.kind === 'file') {
                    if (name.match(/\.(mp3|wav|ogg)$/i)) {
                        enDateien.push({ pfad: pfad + name, handle: child });
                        if (deHandle) {
                            try {
                                const basisName = name.replace(/\.(mp3|wav|ogg)$/i, '');
                                const endungen = ['.mp3', '.wav', '.ogg'];
                                let deFile = null;
                                for (const endung of endungen) {
                                    try {
                                        const deFileHandle = await deHandle.getFileHandle(basisName + endung);
                                        deFile = await deFileHandle.getFile();
                                        break;
                                    } catch {}
                                }
                                if (deFile) {
                                    deAudioCache[pfad + name] = deFile;
                                }
                            } catch (e) {
                                // Keine passende DE-Datei gefunden
                            }
                        }
                    }
                } else if (child.kind === 'directory') {
                    let neuesDe = null;
                    if (deHandle) {
                        try {
                            neuesDe = await deHandle.getDirectoryHandle(name, { create: false });
                        } catch (e) {
                            // Ordner existiert noch nicht
                            neuesDe = null;
                        }
                    }
                    await leseOrdner(child, neuesDe, pfad + name + '/');
                }
            }
        }

        await leseOrdner(enOrdnerHandle, deOrdnerHandle);

        // Automatischer Scan des EN-Ordners nach der Auswahl
        await scanEnOrdner();
        // Projekte und Zugriffsstatus nach dem Scan aktualisieren
        updateAllProjectsAfterScan();
        updateFileAccessStatus();

        updateStatus('Projektordner eingelesen und gescannt');
        updateProjectFolderPathDisplay();
    } catch (e) {
        console.error('Ordnerauswahl fehlgeschlagen:', e);
    }
}
// =========================== WAEHLEPROJEKTORDNER END =========================

// =========================== STANDARDORDNERAENDERN START ====================
// Funktion nicht mehr benötigt – Pfad ist fest definiert
// =========================== STANDARDORDNERAENDERN END ======================

// =========================== SCANENORDNER START =============================
async function scanEnOrdner() {
    if (!enOrdnerHandle) {
        console.error('EN-Ordner nicht initialisiert');
        return;
    }

    const filesToScan = [];

    async function traverse(handle, path = '') {
        for await (const [name, child] of handle.entries()) {
            if (name === 'DE') continue;

            if (child.kind === 'file') {
                if (name.match(/\.(mp3|wav|ogg)$/i)) {
                    const file = await child.getFile();
                    file.webkitRelativePath = path + name;
                    file.fullPath = path + name;
                    filesToScan.push(file);
                }
            } else if (child.kind === 'directory') {
                await traverse(child, path + name + '/');
            }
        }
    }

    await traverse(enOrdnerHandle);
    if (filesToScan.length > 0) {
        verarbeiteGescannteDateien(filesToScan);
    }

    // 🟧 Nach dem EN-Scan auch den DE-Ordner durchsuchen
    await scanDeOrdner();

    // 🟧 Danach Projekt-Statistiken aktualisieren
    updateAllProjectsAfterScan();
    updateFileAccessStatus();
}
// =========================== SCANENORDNER END ===============================

// =========================== SCANDEORDNER START =============================
async function scanDeOrdner() {
    if (!deOrdnerHandle) {
        console.error('DE-Ordner nicht initialisiert');
        return;
    }

    const gefundeneDateien = [];

    async function traverse(handle, pfad = '') {
        for await (const [name, child] of handle.entries()) {
            if (child.kind === 'file') {
                if (name.match(/\.(mp3|wav|ogg)$/i)) {
                    const datei = await child.getFile();
                    datei.fullPath = pfad + name;
                    gefundeneDateien.push(datei);
                }
            } else if (child.kind === 'directory') {
                await traverse(child, pfad + name + '/');
            }
        }
    }

    await traverse(deOrdnerHandle);
    if (gefundeneDateien.length > 0) {
        gefundeneDateien.forEach(d => {
            deAudioCache[d.fullPath] = d;
        });
    }
}
// =========================== SCANDEORDNER END ===============================

// =========================== VERARBEITEGESCANNTE START =====================
function verarbeiteGescannteDateien(dateien) {
    for (const file of dateien) {
        const relPath  = file.fullPath;
        const parts    = relPath.split('/');
        const filename = parts.pop();
        const folder   = extractRelevantFolder(parts, relPath);

        if (!filePathDatabase[filename]) filePathDatabase[filename] = [];

        // Vorhandene Einträge mit gleichem Pfad entfernen
        filePathDatabase[filename] = filePathDatabase[filename].filter(p => p.fullPath !== relPath);

        // Aktuellen Pfad speichern
        filePathDatabase[filename].push({ folder, fullPath: relPath, fileObject: file });

        // In Electron besitzen wir nur Pfade, im Browser File-Objekte
        if (window.electronAPI) {
            audioFileCache[relPath] = `sounds/EN/${relPath}`;
        } else {
            audioFileCache[relPath] = file;
        }
    }

    saveFilePathDatabase();
    updateStatus(`${dateien.length} Dateien eingelesen`);
    updateFileAccessStatus();
}
// =========================== VERARBEITEGESCANNTE END =======================


// =========================== SPEICHEREUEBERSETZUNGSDATEI START ===============
async function speichereUebersetzungsDatei(datei, relativerPfad) {
    if (!deOrdnerHandle) {
        console.error('DE-Ordner nicht initialisiert');
        return;
    }

    const teile = relativerPfad.split('/');
    const dateiname = teile.pop();
    let zielOrdner = deOrdnerHandle;

    for (const teil of teile) {
        zielOrdner = await zielOrdner.getDirectoryHandle(teil, { create: true });
    }

    const fileHandle = await zielOrdner.getFileHandle(dateiname, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(datei);
    await writable.close();

    // DE-Audio im Cache aktualisieren
    deAudioCache[relativerPfad] = datei;
}
// =========================== SPEICHEREUEBERSETZUNGSDATEI END =================

// =========================== INITIATEDEUPLOAD START ==========================
function initiateDeUpload(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    aktuellerUploadPfad = getFullPath(file);
    document.getElementById('deUploadInput').click();
}
// =========================== INITIATEDEUPLOAD END ============================

// =========================== HANDLEDEUPLOAD START ============================
async function handleDeUpload(input) {
    const datei = input.files[0];
    if (!datei || !aktuellerUploadPfad) {
        return;
    }
    if (window.electronAPI && window.electronAPI.saveDeFile) {
        const buffer = await datei.arrayBuffer();
        await window.electronAPI.saveDeFile(aktuellerUploadPfad, new Uint8Array(buffer));
        deAudioCache[aktuellerUploadPfad] = `sounds/DE/${aktuellerUploadPfad}`;
        await updateHistoryCache(aktuellerUploadPfad);
    } else {
        await speichereUebersetzungsDatei(datei, aktuellerUploadPfad);
    }

    // Zugehörige Datei als fertig markieren
    const file = files.find(f => getFullPath(f) === aktuellerUploadPfad);
    if (file) {
        // Fertig-Status ergibt sich nun automatisch
    }

    aktuellerUploadPfad = null;
    input.value = '';
    renderFileTable();
updateStatus('DE-Datei gespeichert');
}
// =========================== HANDLEDEUPLOAD END ==============================

// =========================== INITIATEDUBBING START ==========================
function initiateDubbing(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    if (file.dubbingId) {
        const html = `
            <div class="dialog-overlay" id="dubbingActionDialog">
                <div class="dialog">
                    <h3>Vorhandenes Dubbing</h3>
                    <p>Für diese Datei existiert bereits eine Dubbing-ID.<br>ID: ${file.dubbingId}</p>
                    <div class="dialog-buttons">
                        <button class="btn btn-secondary" onclick="closeDubbingAction()">Abbrechen</button>
                        <button class="btn btn-warning" onclick="proceedNewDubbing(${fileId})">Neu dubben</button>
                        <button class="btn btn-success" onclick="proceedRedownload(${fileId})">Erneut herunterladen</button>
                    </div>
                </div>
            </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('dubbingActionDialog').style.display = 'flex';
    } else {
        chooseDubbingMode(fileId);
    }
}

function closeDubbingAction() {
    const dlg = document.getElementById('dubbingActionDialog');
    if (dlg) dlg.remove();
}

function proceedNewDubbing(fileId) {
    closeDubbingAction();
    chooseDubbingMode(fileId);
}

// Startet den Auswahl-Dialog für erneutes Herunterladen
function proceedRedownload(fileId) {
    closeDubbingAction();
    chooseRedownloadMode(fileId);
}

// Zeigt die Auswahl zwischen Beta und Halbautomatik an
function chooseRedownloadMode(fileId) {
    const html = `
        <div class="dialog-overlay" id="redlModeDialog">
            <div class="dialog">
                <h3>Download-Modus wählen</h3>
                <p>Beta-API nutzen oder halbautomatisch herunterladen?</p>
                <div class="dialog-buttons">
                    <button class="btn btn-secondary" onclick="closeRedownloadMode()">Abbrechen</button>
                    <button class="btn btn-info" onclick="selectRedownloadMode('manual', ${fileId})">Halbautomatisch</button>
                    <button class="btn btn-success" onclick="selectRedownloadMode('beta', ${fileId})">Beta-API</button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('redlModeDialog').style.display = 'flex';
}

function closeRedownloadMode() {
    const dlg = document.getElementById('redlModeDialog');
    if (dlg) dlg.remove();
}

function selectRedownloadMode(mode, fileId) {
    closeRedownloadMode();
    redownloadDubbing(fileId, mode);
}

// Fragt den Benutzer nach dem gewünschten Dubbing-Modus
function chooseDubbingMode(fileId) {
    const html = `
        <div class="dialog-overlay" id="dubModeDialog">
            <div class="dialog">
                <h3>Dubbing-Modus wählen</h3>
                <p>Beta-API nutzen oder halbautomatischen Modus starten?</p>
                <div class="dialog-buttons">
                    <button class="btn btn-secondary" onclick="closeDubMode()">Abbrechen</button>
                    <button class="btn btn-info" onclick="selectDubMode('manual', ${fileId})">Halbautomatisch</button>
                    <button class="btn btn-success" onclick="selectDubMode('beta', ${fileId})">Beta-API</button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('dubModeDialog').style.display = 'flex';
}

function closeDubMode() {
    const dlg = document.getElementById('dubModeDialog');
    if (dlg) dlg.remove();
}

function selectDubMode(mode, fileId) {
    currentDubMode = mode;
    closeDubMode();
    showDubbingSettings(fileId);
}
// =========================== INITIATEDUBBING END ============================

// =========================== SHOWDUBBINGSETTINGS START ======================
async function getDefaultVoiceSettings(apiKey) {
    const res = await fetch(`${API}/voices/settings/default`, {
        headers: { 'xi-api-key': apiKey }
    });
    if (!res.ok) throw new Error('Fehler beim Abrufen der Default-Settings');
    return await res.json();
}

async function showDubbingSettings(fileId, mode = currentDubMode) {
    currentDubbingFileId = fileId;
    currentDubMode = mode;
    const file = files.find(f => f.id === fileId) || {};
    const voiceId = folderCustomizations[file.folder]?.voiceId || '';
    let voiceName = voiceId;
    if (voiceId) {
        const v = availableVoices.find(v => v.voice_id === voiceId);
        if (v) voiceName = v.name;
    }
    let defaults = {
        stability: 1.0,
        similarity_boost: 1.0,
        style: 0.0,
        speed: 1.0,
        use_speaker_boost: true
    };
    if (storedVoiceSettings) {
        // Zuerst die gespeicherten Werte verwenden
        defaults = storedVoiceSettings;
    } else if (elevenLabsApiKey) {
        // Ansonsten Defaults von der API holen
        try {
            defaults = await getDefaultVoiceSettings(elevenLabsApiKey);
        } catch (e) {
            console.warn('Default-Settings konnten nicht geladen werden');
        }
    }

    const html = `
        <div class="dialog-overlay" id="dubbingSettingsDialog">
            <div class="dialog dubbing-dialog">
                <button class="dialog-close-btn" onclick="closeDubbingSettings()">×</button>
                <h3>🎤 Dubbing-Einstellungen</h3>
                <p class="file-name"><strong>${file.filename || ''}</strong></p>
                <p class="current-voice-line">Aktuelle Stimme: <span class="current-voice">${voiceName || 'Keine'}</span></p>
                <div class="dub-settings-grid">
                    <label for="dubSetStability">Stability <span class="info-icon" onclick="openDubTooltip(event, 'stability')">ⓘ</span></label>
                    <div class="slider-wrapper"><input type="range" id="dubSetStability" min="0" max="1" step="0.01" value="${defaults.stability}"><span class="slider-value" id="valStability">${defaults.stability}</span></div>

                    <label for="dubSetSimilarity">Similarity Boost <span class="info-icon" onclick="openDubTooltip(event, 'similarity')">ⓘ</span></label>
                    <div class="slider-wrapper"><input type="range" id="dubSetSimilarity" min="0" max="1" step="0.01" value="${defaults.similarity_boost}"><span class="slider-value" id="valSimilarity">${defaults.similarity_boost}</span></div>

                    <label for="dubSetStyle">Style <span class="info-icon" onclick="openDubTooltip(event, 'style')">ⓘ</span></label>
                    <div class="slider-wrapper"><input type="range" id="dubSetStyle" min="0" max="1" step="0.01" value="${defaults.style}"><span class="slider-value" id="valStyle">${defaults.style}</span></div>

                    <label for="dubSetSpeed">Speed <span class="info-icon" onclick="openDubTooltip(event, 'speed')">ⓘ</span></label>
                    <div class="slider-wrapper"><input type="range" id="dubSetSpeed" min="0.5" max="2" step="0.05" value="${defaults.speed}"><span class="slider-value" id="valSpeed">${defaults.speed}</span></div>

                    <label for="dubSetSpeaker">use_speaker_boost <span class="info-icon" onclick="openDubTooltip(event, 'speaker')">ⓘ</span></label>
                    <div class="slider-wrapper"><input type="checkbox" id="dubSetSpeaker" ${defaults.use_speaker_boost ? 'checked' : ''}></div>
                </div>

                <button class="btn btn-primary preview-btn" onclick="playDubPreview()">Probe abspielen</button>

                <div class="advanced-block">
                    <div class="accordion-header" onclick="toggleDubAdvanced()">Fortgeschrittene Einstellungen ▸</div>
                    <div class="accordion-content" id="dubAdvanced">
                        <div class="customize-field"><label>disable_voice_cloning</label><input type="checkbox" id="dubOptVoiceClone"></div>
                        <div class="customize-field"><label>num_speakers</label><input type="number" id="dubOptNumSpeakers" min="1" max="10" value="1"></div>
                        <div class="customize-field"><label>seed</label><input type="number" id="dubOptSeed" value="0"></div>
                    </div>
                </div>

                <div class="dialog-buttons">
                    <button class="btn btn-warning" onclick="resetStoredVoiceSettings()">Reset</button>
                    <button class="btn btn-secondary" onclick="closeDubbingSettings()">Abbrechen</button>
                    <button class="btn btn-success" id="dubStartBtn" onclick="confirmDubbingSettings(${fileId})">Dubben</button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    // Dialog sofort anzeigen
    document.getElementById('dubbingSettingsDialog').style.display = 'flex';
    bindDubSettingListeners();
}

function closeDubbingSettings() {
    const dlg = document.getElementById('dubbingSettingsDialog');
    if (dlg) dlg.remove();
}

// Verbindet alle Slider mit der zugehörigen Anzeige
function bindDubSettingListeners() {
    const felder = [
        ['dubSetStability', 'valStability'],
        ['dubSetSimilarity', 'valSimilarity'],
        ['dubSetStyle', 'valStyle'],
        ['dubSetSpeed', 'valSpeed']
    ];
    for (const [inputId, valId] of felder) {
        const eingabe = document.getElementById(inputId);
        const anzeige = document.getElementById(valId);
        if (eingabe && anzeige) {
            eingabe.oninput = () => { anzeige.textContent = eingabe.value; };
        }
    }
}

async function confirmDubbingSettings(fileId) {
    const btn = document.getElementById('dubStartBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span>';
    }
    const settings = {
        stability: parseFloat(document.getElementById('dubSetStability').value),
        similarity_boost: parseFloat(document.getElementById('dubSetSimilarity').value),
        style: parseFloat(document.getElementById('dubSetStyle').value),
        speed: parseFloat(document.getElementById('dubSetSpeed').value),
        use_speaker_boost: document.getElementById('dubSetSpeaker').checked
    };
    // Erweiterte Optionen erfassen
    const adv = {
        disable_voice_cloning: document.getElementById('dubOptVoiceClone').checked,
        num_speakers: parseInt(document.getElementById('dubOptNumSpeakers').value, 10),
        seed: parseInt(document.getElementById('dubOptSeed').value, 10)
    };
    settings.advanced = adv;
    // Gewählte Einstellungen persistent speichern
    localStorage.setItem('hla_voiceSettings', JSON.stringify(settings));
    storedVoiceSettings = settings;
    updateVoiceSettingsDisplay();
    await startDubbing(fileId, settings, 'de', currentDubMode);
    closeDubbingSettings();
}

// Entfernt gespeicherte Voice-Settings und lädt den Dialog neu
function resetStoredVoiceSettings() {
    localStorage.removeItem('hla_voiceSettings');
    storedVoiceSettings = null;
    updateVoiceSettingsDisplay();
    closeDubbingSettings();
    if (currentDubbingFileId !== null) {
        showDubbingSettings(currentDubbingFileId);
    }
}

// Schaltet den Abschnitt mit erweiterten Optionen ein oder aus
function toggleDubAdvanced() {
    const cont = document.getElementById('dubAdvanced');
    if (!cont) return;
    cont.style.display = cont.style.display === 'block' ? 'none' : 'block';
}

// Öffnet ein kleines Tooltip-Fenster mit einer Beschreibung
function openDubTooltip(ev, key) {
    const tips = {
        stability: 'Je höher, desto gleichmäßiger und weniger emotional klingt die Stimme. Niedrigere Werte bringen mehr Lebendigkeit.',
        similarity: 'Bestimmt, wie nah die Stimme am Original bleibt. Hohe Werte bewahren den Charakter besser.',
        style: 'Verstärkt den Sprechausdruck. Hohe Werte wirken dramatischer.',
        speed: 'Geschwindigkeit der Ausgabe. 1,0 ist unverändert.',
        speaker: 'Aktiviert zusätzliche Ähnlichkeit zum Sprecher.'
    };
    closeDubTooltip();
    const box = document.createElement('div');
    box.className = 'info-tooltip';
    box.id = 'dubTooltip';
    box.textContent = tips[key] || '';
    box.style.left = ev.clientX + 'px';
    box.style.top = ev.clientY + 'px';
    document.body.appendChild(box);
    document.addEventListener('keydown', escCloseDubTooltip);
}

// Schliesst das Tooltip-Fenster
function closeDubTooltip() {
    const box = document.getElementById('dubTooltip');
    if (box) box.remove();
    document.removeEventListener('keydown', escCloseDubTooltip);
}

function escCloseDubTooltip(e) { if (e.key === 'Escape') closeDubTooltip(); }

// Spielt ein kurzes Sample mit den aktuellen Einstellungen ab
async function playDubPreview() {
    const voiceId = folderCustomizations[files.find(f => f.id === currentDubbingFileId)?.folder]?.voiceId;
    if (!voiceId || !elevenLabsApiKey) return;
    const settings = {
        stability: parseFloat(document.getElementById('dubSetStability').value),
        similarity_boost: parseFloat(document.getElementById('dubSetSimilarity').value),
        style: parseFloat(document.getElementById('dubSetStyle').value),
        speed: parseFloat(document.getElementById('dubSetSpeed').value),
        use_speaker_boost: document.getElementById('dubSetSpeaker').checked
    };
    const body = {
        text: 'Dies ist eine Probe.',
        voice_settings: settings,
        model_id: 'eleven_monolingual_v1'
    };
    const res = await fetch(`${API}/text-to-speech/${voiceId}/stream`, {
        method: 'POST',
        headers: { 'xi-api-key': elevenLabsApiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.play();
}

// Zeigt einen Hinweis an, dass das Studio geöffnet wurde
function showStudioOverlay() {
    const ov = document.createElement('div');
    ov.className = 'dialog-overlay';
    ov.id = 'studioNoticeDialog';
    ov.style.display = 'flex';
    ov.innerHTML = `
        <div class="dialog">
            <h3>🎧 ElevenLabs Studio</h3>
            <p>Das Studio ist in einem neuen Tab geöffnet.<br>
               Klicken Sie dort auf „Generate Audio" und danach auf OK.</p>
            <div class="dialog-buttons">
                <button class="btn btn-success" onclick="closeStudioOverlay()">OK</button>
            </div>
        </div>`;
    document.body.appendChild(ov);
}

// Schließt den Studio-Hinweis
function closeStudioOverlay() {
    const ov = document.getElementById('studioNoticeDialog');
    if (ov) ov.remove();
}

// Zeigt ein Dialogfenster, das auf die manuelle Datei wartet
// und blendet dabei Ordnername sowie EN- und DE-Text ein
let waitDialogFileId = null;
async function showDownloadWaitDialog(fileId) {
    waitDialogFileId = fileId;
    const file = files.find(f => f.id === fileId) || {};
    const folder = escapeHtml(file.folder || '');
    const enText = escapeHtml(file.enText || '');
    const deText = escapeHtml(file.deText || '');
    let dlPath = 'Download';
    if (window.electronAPI && window.electronAPI.getDownloadPath) {
        dlPath = await window.electronAPI.getDownloadPath();
    }
    const html = `
        <div class="dialog-overlay" id="downloadWaitDialog">
            <div class="dialog">
                <h3>Alles gesendet</h3>
                <p>Bitte lege die fertige Datei in <code>${dlPath}</code>.</p>
                <div style="margin-bottom:10px;">
                    <p><strong>Ordner:</strong> ${folder}</p>
                    <p><strong>EN:</strong> ${enText}</p>
                    <p><strong>DE:</strong> ${deText}</p>
                </div>
                <p id="downloadFound" style="display:none;"></p>
                <div class="dialog-buttons" id="downloadWaitButtons">
                    <button class="btn btn-secondary" onclick="closeDownloadWaitDialog()">Abbrechen</button>
                </div>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('downloadWaitDialog').style.display = 'flex';
}

function updateDownloadWaitDialog(name) {
    const info = document.getElementById('downloadFound');
    if (info) {
        info.textContent = 'Datei gefunden: ' + name;
        info.style.display = 'block';
    }
    const btn = document.getElementById('downloadWaitButtons');
    if (btn) {
        btn.innerHTML = '<button class="btn btn-success" onclick="closeDownloadWaitDialog()">OK</button>';
    }
}

function closeDownloadWaitDialog() {
    const dlg = document.getElementById('downloadWaitDialog');
    if (dlg) dlg.remove();
    waitDialogFileId = null;
}

// Öffnet das Studio und zeigt einen Hinweis mit Download-Pfad an
async function openStudioAndWait(dubId) {
    const url = `https://elevenlabs.io/studio/dubbing/${dubId}`;
    window.open(url, '_blank');

    // Pfad aus Electron abrufen, falls verfügbar
    let dlPath = 'Download';
    if (window.electronAPI && window.electronAPI.getDownloadPath) {
        dlPath = await window.electronAPI.getDownloadPath();
    }

    ui.showModal(`
        <h3>Studio geöffnet</h3>
        <p>Generiere die deutsche Spur,
        lade die WAV herunter und lege sie in
        <code>${dlPath}</code>.</p>
        <p>Das Tool erkennt die Datei automatisch.</p>
    `);

    const currentItem = files.find(f => f.dubbingId === dubId);
    if (currentItem) {
        currentItem.waitingForManual = true;
        ui.setActiveDubItem(currentItem);
        renderFileTable();
        saveCurrentProject();
    }
}

// Wird aufgerufen, wenn der gelbe Status-Punkt angeklickt wird
function dubStatusClicked(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file || !file.dubbingId || file.dubReady) return;
    openStudioAndWait(file.dubbingId);
}

// Hilfsfunktion für das Manual Dubbing
// Wandelt Millisekunden in Sekundenwerte mit drei Nachkommastellen um
function msToSeconds(ms) {
    const seconds = Math.max(0, ms) / 1000;
    return seconds.toFixed(3);
}

// Erstellt eine CSV-Zeile für das Manual Dubbing
function createDubbingCSV(file, durationMs, lang = 'de') {
    // Prüfen, ob beide Texte vorhanden sind
    const translation = file[`${lang}Text`] || file.deText;
    if (!file.enText || !translation) {
        addDubbingLog('Übersetzung fehlt');
        return null;
    }
    // Kopfzeile wird immer vorangestellt
    const lineEnd = csvLineEnding === 'CRLF' ? '\r\n' : '\n';
    const header = 'speaker,start_time,end_time,transcription,translation' + lineEnd;
    const esc = t => '"' + String(t || '').replace(/"/g, '""') + '"';
    const startTime = msToSeconds(file.trimStartMs || 0);
    let endTime = '';
    if (typeof durationMs === 'number') {
        const endMs = durationMs - (file.trimEndMs || 0);
        endTime = msToSeconds(endMs);
    } else {
        endTime = msToSeconds(file.trimEndMs || 0);
    }
    const row = ['0', startTime, endTime, esc(file.enText), esc(translation)].join(',');
    // CSV-Zeile mit Zeilenende abschließen
    let csv = header + row + lineEnd;
    // Sicherheitshalber prüfen, ob ein Zeilenumbruch vorhanden ist
    if (!csv.endsWith('\n')) csv += '\n';
    // CSV-Blob jetzt mit UTF-8-Kodierung erzeugen
    return new Blob([csv], { type: 'text/csv;charset=utf-8' });
}

// Prüft den Aufbau einer CSV-Datei für Manual Dub
// Zerlegt einen CSV-Text in Zeilen, wobei Zeilenumbrüche in Anführungszeichen
// ignoriert werden
function splitCsvLines(text) {
    const lines = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            if (inQuotes && text[i + 1] === '"') {
                current += '""';
                i++;
            } else {
                current += '"';
                inQuotes = !inQuotes;
            }
        } else if ((c === '\n' || c === '\r') && !inQuotes) {
            if (c === '\r' && text[i + 1] === '\n') i++;
            lines.push(current);
            current = '';
        } else {
            current += c;
        }
    }
    if (current.length > 0) lines.push(current);
    return lines.filter(l => l.length > 0);
}

// Prüft den Aufbau einer CSV-Datei für Manual Dub
function validateCsv(csvText) {
    // Zeilen aufteilen (Leerzeilen ignorieren)
    const lines = splitCsvLines(csvText.trim());
    if (lines.length < 2) return false;
    // Kopfzeile muss exakt passen
    if (lines[0].trim() !== 'speaker,start_time,end_time,transcription,translation') {
        return false;
    }
    // Jede weitere Zeile muss genau 5 Spalten besitzen
    for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].match(/(?:"(?:[^"]|"")*"|[^,]+)/g) || [];
        if (cells.length !== 5) return false;
    }
    return true;
}
// =========================== SHOWDUBBINGSETTINGS END ========================


// =========================== STARTDUBBING START =============================
// Startet ElevenLabs-Dubbing für eine Datei und speichert das Ergebnis
async function startDubbing(fileId, settings = {}, targetLang = 'de', mode = 'beta') {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    // Ordnerspezifische Voice-ID ermitteln
    const folderVoiceId = folderCustomizations[file.folder]?.voiceId;
    // Log zu Beginn leeren
    dubbingLogMessages = [];
    const logPre = document.getElementById('dubbingLog');
    if (logPre) logPre.textContent = '';
    openDubbingLog();
    addDubbingLog(`Starte Dubbing für ${file.filename}`);
    if (!elevenLabsApiKey) {
        updateStatus('API-Key fehlt');
        addDubbingLog('API-Key fehlt');
        return;
    }

    const audioInfo = findAudioInFilePathCache(file.filename, file.folder);
    if (!audioInfo) {
        updateStatus('EN-Datei nicht gefunden');
        addDubbingLog('EN-Datei nicht gefunden');
        return;
    }

    let audioBlob;
    if (typeof audioInfo.audioFile === 'string') {
        try {
            const resp = await fetch(audioInfo.audioFile);
            if (!resp.ok) {
                const errText = await resp.text();
                updateStatus('EN-Datei nicht ladbar');
                addDubbingLog(`EN-Datei nicht ladbar: ${resp.status} ${errText}`);
                return;
            }
            audioBlob = await resp.blob();
            addDubbingLog('EN-Datei geladen');
        } catch (e) {
            addDubbingLog('Fehler: ' + e.message);
            updateStatus('EN-Datei nicht ladbar');
            return;
        }
    } else {
        audioBlob = audioInfo.audioFile;
        addDubbingLog('EN-Datei aus Cache geladen');
    }

    // Dauer der Audiodatei bestimmen
    const buffer = await loadAudioBuffer(audioBlob);
    const durationMs = buffer.length / buffer.sampleRate * 1000;

    // FormData für das Dubbing zusammenstellen
    const form = new FormData();
    form.append('file', audioBlob, file.filename);
    // Zielsprachen sowohl einzeln als auch als Liste übergeben
    form.append('target_lang', targetLang);
    form.append('target_languages', JSON.stringify([targetLang]));
    form.append('mode', 'manual');
    form.append('dubbing_studio', 'true');
    const csvBlob = createDubbingCSV(file, durationMs, targetLang);
    if (!csvBlob) {
        updateStatus('Übersetzung fehlt');
        addDubbingLog('Übersetzung fehlt');
        return;
    }
    // CSV-Text für Log und Fehlerausgabe zwischenspeichern
    const csvText = await csvBlob.text();
    addDubbingLog('CSV-Text: ' + csvText);
    // Vor dem Upload die CSV-Struktur prüfen
    if (!validateCsv(csvText)) {
        addDubbingLog('Ungültige CSV');
        return;
    }
    form.append('csv_file', csvBlob, 'input.csv');
    // 🟢 Neue Funktion: gewünschte Voice-Settings übermitteln
    if (settings && Object.keys(settings).length > 0) {
        form.append('voice_settings', JSON.stringify(settings));
    }
    // Bei vorhandener Ordner-Stimme Voice-ID übergeben und Voice Cloning abschalten
    const selectedVoiceId = (folderVoiceId || '').trim();
    if (selectedVoiceId) {
        form.append('voice_id', selectedVoiceId);
        form.append('disable_voice_cloning', 'true');
    }

    addDubbingLog(`POST ${API}/dubbing`);
    let res;
    try {
        res = await fetch(`${API}/dubbing`, {
            method: 'POST',
            headers: { 'xi-api-key': elevenLabsApiKey },
            body: form
        });
        logApiCall('POST', `${API}/dubbing`, res.status);
    } catch (e) {
        addDubbingLog('Fehler: ' + e.message);
        updateStatus('Dubbing fehlgeschlagen');
        return;
    }
    const resText = await res.text();
    addDubbingLog(`Antwort (${res.status}): ${resText}`);
    if (!res.ok) {
        let errorMsg = resText;
        try {
            const js = JSON.parse(resText);
            if (js.detail && js.detail.message) {
                errorMsg = js.detail.message;
            }
        } catch {}
        addDubbingLog(`Fehler: ${errorMsg}`);
        updateStatus('Dubbing fehlgeschlagen');
        showToast(errorMsg, 'error');
        addDubbingLog(`Dubbing fehlgeschlagen: ${res.status} ${resText}`);
        // Bei HTTP 400 den Anfang der CSV ausgeben
        if (res.status === 400) {
            addDubbingLog('CSV-Ausschnitt: ' + csvText.slice(0, 200));
        }
        return;
    }
    const data = JSON.parse(resText);
    // Vollständige Server-Antwort ausgeben
    addDubbingLog('Server-Antwort: ' + JSON.stringify(data));
    const id = data.dubbing_id || data.id;
    if (!id) {
        updateStatus('Keine Dubbing-ID erhalten');
        addDubbingLog('Keine Dubbing-ID erhalten');
        return;
    }

    addDubbingLog(`Dubbing-ID erhalten: ${id}`);

    // Dubbing-ID sofort merken und anzeigen
    file.dubbingId = id;
    file.dubReady = false; // Status auf "in Arbeit" setzen
    saveCurrentProject();
    renderFileTable();

    // Hauptprozess über neuen Job informieren
    if (window.electronAPI && window.electronAPI.sendDubStart) {
        // Modus mitgeben, damit der Hauptprozess Beta- und manuelle Jobs unterscheiden kann
        window.electronAPI.sendDubStart({ id, fileId: file.id, relPath: getFullPath(file), mode });
    }

    if (mode === 'manual') {
        showToast('Alles gesendet. Bitte Datei in Download legen.');
        const currentItem = file;
        currentItem.waitingForManual = true;
        ui.setActiveDubItem(currentItem);
        renderFileTable();
        await showDownloadWaitDialog(file.id);
        return;
    }

    try {
        await renderLanguage(id);
        const url = await pollRender(id);
        const dubbedBlob = await fetch(url).then(r => r.blob());
        const relPath = getFullPath(file);
        if (window.electronAPI && window.electronAPI.saveDeFile) {
            const buffer = await dubbedBlob.arrayBuffer();
            await window.electronAPI.saveDeFile(relPath, new Uint8Array(buffer));
            deAudioCache[relPath] = `sounds/DE/${relPath}`;
            await updateHistoryCache(relPath);
        } else {
            await speichereUebersetzungsDatei(dubbedBlob, relPath);
        }
        file.dubReady = true;
        updateStatus('Download abgeschlossen');
        showToast('Auto-Download erfolgreich.');
        addDubbingLog('Auto-Download erfolgreich');
        renderFileTable();
    } catch (e) {
        if (e.message === 'BETA_LOCKED') {
            showToast('Kein Beta-Zugang – bitte Studio nutzen & Datei in Download-Ordner legen.');
            await openStudioAndWait(id);
        } else {
            addDubbingLog('Fehler: ' + e.message);
            showToast('Fehler beim Auto-Download: ' + e.message, 'error');
        }
    }
}
// =========================== STARTDUBBING END ===============================

// =========================== ISDUBREADY START ===============================
// Prüft, ob eine Dub-Datei fertig ist
async function isDubReady(id, lang = 'de') {
    const hdr = { headers: { 'xi-api-key': elevenLabsApiKey } };
    const metaRes = await fetch(`${API}/dubbing/${id}`, hdr);
    logApiCall('GET', `${API}/dubbing/${id}`, metaRes.status);
    if (!metaRes.ok) return false;
    const meta = await metaRes.json();
    return meta.status === 'dubbed' && (meta.target_languages || []).includes(lang);
}
// =========================== ISDUBREADY END =================================

// =========================== REDOWNLOADDUBBING START ========================
// Lädt bereits erzeugtes Dubbing mithilfe der gespeicherten ID erneut herunter
async function redownloadDubbing(fileId, mode = 'beta') {
    const file = files.find(f => f.id === fileId);
    if (!file || !file.dubbingId) return;
    // Log zu Beginn leeren
    dubbingLogMessages = [];
    const logPre = document.getElementById('dubbingLog');
    if (logPre) logPre.textContent = '';
    openDubbingLog();
    addDubbingLog(`Lade Dubbing ${file.dubbingId} erneut`);
    if (mode === 'manual') {
        showToast('Bitte Spur manuell generieren und in den Download-Ordner legen.');
        await openStudioAndWait(file.dubbingId);
        await showDownloadWaitDialog(file.id);
        return;
    }

    if (!elevenLabsApiKey) {
        updateStatus('API-Key fehlt');
        addDubbingLog('API-Key fehlt');
        return;
    }

    if (!(await isDubReady(file.dubbingId))) {
        alert('Deutsch noch nicht fertig – erst im Studio generieren!');
        return;
    }

    const audioRes = await fetch(`${API}/dubbing/${file.dubbingId}/audio/de`, {
        headers: { 'xi-api-key': elevenLabsApiKey }
    });
    logApiCall('GET', `${API}/dubbing/${file.dubbingId}/audio/de`, audioRes.status);
    if (!audioRes.ok) {
        const errText = await audioRes.text();
        updateStatus('Download fehlgeschlagen');
        addDubbingLog(errText);
        if (errText.includes('dubbing_not_found')) {
            const msg = 'Spur manuell generieren oder Beta freischalten';
            showToast(msg, 'error');
            addDubbingLog(msg);
        }
        return;
    }
    const dubbedBlob = await audioRes.blob();
    const relPath = getFullPath(file);
    if (window.electronAPI && window.electronAPI.saveDeFile) {
        const buffer = await dubbedBlob.arrayBuffer();
        await window.electronAPI.saveDeFile(relPath, new Uint8Array(buffer));
        deAudioCache[relPath] = `sounds/DE/${relPath}`;
        await updateHistoryCache(relPath);
        addDubbingLog('Datei in Desktop-Version gespeichert');
    } else {
        await speichereUebersetzungsDatei(dubbedBlob, relPath);
        addDubbingLog('Datei im Browser gespeichert');
    }
    file.dubReady = true; // Nach erneutem Download fertig
    updateStatus('Download abgeschlossen');
    addDubbingLog('Fertig.');
    renderFileTable();
    saveCurrentProject();
}
// =========================== DOWNLOADDE START ===============================
// Lädt die fertige DE-Audiodatei ohne Protokoll herunter
async function downloadDe(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file || !file.dubbingId) return;
    if (!elevenLabsApiKey) {
        updateStatus('API-Key fehlt');
        return;
    }
    if (!(await isDubReady(file.dubbingId))) {
        alert('Deutsch noch nicht fertig – erst im Studio generieren!');
        return;
    }
    const blob = await downloadDubbingAudio(elevenLabsApiKey, file.dubbingId, 'de');
    const relPath = getFullPath(file);
    if (window.electronAPI && window.electronAPI.saveDeFile) {
        const buffer = await blob.arrayBuffer();
        await window.electronAPI.saveDeFile(relPath, new Uint8Array(buffer));
        deAudioCache[relPath] = `sounds/DE/${relPath}`;
        await updateHistoryCache(relPath);
    } else {
        await speichereUebersetzungsDatei(blob, relPath);
    }
    file.dubReady = true; // Status auf fertig setzen
    updateStatus('Deutsche Audiodatei gespeichert.');
    renderFileTable();
    saveCurrentProject();
}
// =========================== DOWNLOADDE END =================================
// =========================== REDOWNLOADDUBBING END ==========================

// =========================== LOADAUDIOBUFFER START ===========================
// Lädt eine Audiodatei (String-URL oder File) und liefert ein AudioBuffer
async function loadAudioBuffer(source) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    let arrayBuffer;
    if (typeof source === 'string') {
        const resp = await fetch(source);
        arrayBuffer = await resp.arrayBuffer();
    } else {
        arrayBuffer = await source.arrayBuffer();
    }
    return await ctx.decodeAudioData(arrayBuffer);
}
// =========================== LOADAUDIOBUFFER END =============================

// =========================== DRAWWAVEFORM START =============================
// Zeichnet ein einfaches Wellenbild in ein Canvas
function drawWaveform(canvas, buffer, opts = {}) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#ff6b1a';
    ctx.beginPath();
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    for (let i = 0; i < width; i++) {
        const start = i * step;
        let min = 1.0;
        let max = -1.0;
        for (let j = 0; j < step; j++) {
            const sample = data[start + j] || 0;
            if (sample < min) min = sample;
            if (sample > max) max = sample;
        }
        ctx.moveTo(i, (1 + min) * height / 2);
        ctx.lineTo(i, (1 + max) * height / 2);
    }
    ctx.stroke();

    const durationMs = buffer.length / buffer.sampleRate * 1000;
    if (opts.start !== undefined && opts.end !== undefined) {
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const startX = (opts.start / durationMs) * width;
        const endX = (opts.end / durationMs) * width;
        ctx.moveTo(startX, 0);
        ctx.lineTo(startX, height);
        ctx.moveTo(endX, 0);
        ctx.lineTo(endX, height);
        ctx.stroke();
        ctx.lineWidth = 1;

        ctx.fillStyle = '#e0e0e0';
        ctx.font = '10px sans-serif';
        ctx.fillText(Math.round(opts.start) + 'ms', startX + 2, 10);
        ctx.fillText(Math.round(opts.end) + 'ms', endX + 2, 10);
    }
    if (opts.progress !== undefined) {
        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 2;
        const x = (opts.progress / durationMs) * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        ctx.lineWidth = 1;
    }
}
// =========================== DRAWWAVEFORM END ===============================

// =========================== TRIMANDBUFFER START ============================
// Kürzt oder verlängert ein AudioBuffer um die angegebenen Millisekunden
function trimAndPadBuffer(buffer, startMs, endMs) {
    const sr = buffer.sampleRate;
    const startSamples = Math.max(0, Math.floor(startMs > 0 ? startMs * sr / 1000 : 0));
    const endSamples = Math.max(0, Math.floor(endMs > 0 ? endMs * sr / 1000 : 0));
    const padStart = Math.max(0, Math.floor(startMs < 0 ? -startMs * sr / 1000 : 0));
    const padEnd = Math.max(0, Math.floor(endMs < 0 ? -endMs * sr / 1000 : 0));
    const newLength = padStart + buffer.length - startSamples - endSamples + padEnd;
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const newBuffer = ctx.createBuffer(buffer.numberOfChannels, newLength, sr);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        const oldData = buffer.getChannelData(ch);
        const newData = newBuffer.getChannelData(ch);
        newData.set(oldData.subarray(startSamples, buffer.length - endSamples), padStart);
    }
    return newBuffer;
}
// =========================== LAUTSTAERKEANGLEICH START =====================
// Passt die Lautstärke eines Buffers an einen Ziel-Buffer an
function matchVolume(sourceBuffer, targetBuffer) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    const rms = bufferRms(sourceBuffer);
    const targetRms = bufferRms(targetBuffer);
    if (rms === 0) return sourceBuffer;
    const gain = targetRms / rms;

    const out = ctx.createBuffer(sourceBuffer.numberOfChannels, sourceBuffer.length, sourceBuffer.sampleRate);
    for (let ch = 0; ch < sourceBuffer.numberOfChannels; ch++) {
        const inData = sourceBuffer.getChannelData(ch);
        const outData = out.getChannelData(ch);
        for (let i = 0; i < inData.length; i++) {
            let sample = inData[i] * gain;
            outData[i] = Math.max(-1, Math.min(1, sample));
        }
    }
    return out;
}

// Berechnet die RMS-Lautstärke eines Buffers
function bufferRms(buffer) {
    let sum = 0;
    let len = 0;
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
        const data = buffer.getChannelData(ch);
        for (let i = 0; i < data.length; i++) {
            sum += data[i] * data[i];
        }
        len += data.length;
    }
    return Math.sqrt(sum / len);
}
// =========================== LAUTSTAERKEANGLEICH END =======================

// =========================== RADIOFILTER START ==============================
// Erzeugt einen Funkgeräteklang. Die Parameter werden über ein Objekt gesteuert
// und dauerhaft in localStorage gespeichert.
async function applyRadioFilter(buffer, opts = {}) {
    const {
        hp = radioHighpass,
        lp = radioLowpass,
        saturation = radioSaturation,
        noiseDb = radioNoise,
        crackle = radioCrackle,
        wet = radioEffectStrength
    } = opts;

    // Erster Verarbeitungsschritt: Bandpass und Sättigung
    const ctx1 = new OfflineAudioContext(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
    const source1 = ctx1.createBufferSource();
    source1.buffer = buffer;

    const high = ctx1.createBiquadFilter();
    high.type = 'highpass';
    high.frequency.value = hp;

    const low = ctx1.createBiquadFilter();
    low.type = 'lowpass';
    low.frequency.value = lp;

    const shaper = ctx1.createWaveShaper();
    const curve = new Float32Array(44100);
    const k = saturation * 100;
    for (let i = 0; i < curve.length; i++) {
        const x = i * 2 / curve.length - 1;
        curve[i] = (1 + k) * x / (1 + k * Math.abs(x));
    }
    shaper.curve = curve;
    shaper.oversample = '4x';

    source1.connect(high);
    high.connect(low);
    low.connect(shaper);
    shaper.connect(ctx1.destination);
    source1.start();
    let processed = await ctx1.startRendering();

    // Zweiter Schritt: Downsampling auf 8 kHz mit 8 Bit
    const targetRate = 8000;
    const ctx2 = new OfflineAudioContext(processed.numberOfChannels, Math.ceil(processed.length * targetRate / processed.sampleRate), targetRate);
    const source2 = ctx2.createBufferSource();
    source2.buffer = processed;
    source2.connect(ctx2.destination);
    source2.start();
    processed = await ctx2.startRendering();
    for (let ch = 0; ch < processed.numberOfChannels; ch++) {
        const data = processed.getChannelData(ch);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.round(data[i] * 127) / 127; // 8 Bit
        }
    }

    // Dritter Schritt: Rauschen und Knackser hinzufügen
    const amp = Math.pow(10, noiseDb / 20);
    for (let ch = 0; ch < processed.numberOfChannels; ch++) {
        const data = processed.getChannelData(ch);
        for (let i = 0; i < data.length; i++) {
            const rnd = (Math.random() * 2 - 1) * amp;
            data[i] += rnd;
            if (Math.random() < crackle / 1000) {
                data[i] += (Math.random() * 2 - 1) * 0.5;
            }
        }
    }

    // Push-to-Talk-Rauschen am Anfang und Ende
    const fadeSamples = Math.round(0.05 * processed.sampleRate);
    for (let ch = 0; ch < processed.numberOfChannels; ch++) {
        const data = processed.getChannelData(ch);
        for (let i = 0; i < fadeSamples; i++) {
            const gain = i / fadeSamples;
            data[i] += (Math.random() * 2 - 1) * amp * (1 - gain);
            const j = data.length - 1 - i;
            data[j] += (Math.random() * 2 - 1) * amp * (1 - gain);
        }
    }

    // Pegel auf -16 dBFS normalisieren
    const rms = bufferRms(processed);
    const target = Math.pow(10, -16 / 20);
    const gain = target / (rms || 1);
    for (let ch = 0; ch < processed.numberOfChannels; ch++) {
        const data = processed.getChannelData(ch);
        for (let i = 0; i < data.length; i++) {
            data[i] = Math.max(-1, Math.min(1, data[i] * gain));
        }
    }

    // Mischung mit Original
    const outCtx = new OfflineAudioContext(buffer.numberOfChannels, processed.length, processed.sampleRate);
    const dry = outCtx.createBufferSource();
    dry.buffer = buffer;
    const wetGain = outCtx.createGain();
    wetGain.gain.value = wet;
    const dryGain = outCtx.createGain();
    dryGain.gain.value = 1 - wet;
    const wetSource = outCtx.createBufferSource();
    wetSource.buffer = processed;
    dry.connect(dryGain);
    wetSource.connect(wetGain);
    dryGain.connect(outCtx.destination);
    wetGain.connect(outCtx.destination);
    dry.start();
    wetSource.start();
    return await outCtx.startRendering();
}
// =========================== RADIOFILTER END ================================
// =========================== TRIMANDBUFFER END ==============================

// =========================== BUFFERTOWAV START ==============================
// Wandelt einen AudioBuffer in einen WAV-Blob um
function bufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const arrBuffer = new ArrayBuffer(length);
    const view = new DataView(arrBuffer);
    const writeString = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + buffer.length * numOfChan * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * numOfChan * 2, true);
    view.setUint16(32, numOfChan * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, buffer.length * numOfChan * 2, true);
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
        for (let ch = 0; ch < numOfChan; ch++) {
            let sample = buffer.getChannelData(ch)[i];
            sample = Math.max(-1, Math.min(1, sample));
            view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
            offset += 2;
        }
    }
    return new Blob([view], { type: 'audio/wav' });
}
// =========================== BUFFERTOWAV END ================================

let currentEditFile = null;
let originalEditBuffer = null;
let savedOriginalBuffer = null; // Unverändertes DE-Audio
let volumeMatchedBuffer = null; // Lautstärke an EN angepasst
let isVolumeMatched = false;   // Merkt, ob der Lautstärkeabgleich ausgeführt wurde
let radioEffectBuffer = null;  // Buffer mit Funkgeräteffekt
let isRadioEffect = false;     // Merkt, ob der Funkgeräteffekt angewendet wurde

// =========================== OPENDEEDIT START ===============================
// Öffnet den Bearbeitungsdialog für eine DE-Datei
async function openDeEdit(fileId) {
    const file = files.find(f => f.id === fileId);
    if (!file) return;
    currentEditFile = file;
    const enSrc = `sounds/EN/${getFullPath(file)}`;
    const rel = getDeFilePath(file) || getFullPath(file);
    let deSrc = deAudioCache[rel];
    if (!deSrc) return;
    // Zuerst versuchen wir, die aktuelle DE-Datei zu laden
    try {
        originalEditBuffer = await loadAudioBuffer(deSrc);
    } catch {
        // Falls das fehlschlägt, greifen wir auf das Backup zurück
        const backupSrc = `sounds/DE-Backup/${rel}`;
        originalEditBuffer = await loadAudioBuffer(backupSrc);
    }
    savedOriginalBuffer = originalEditBuffer;
    volumeMatchedBuffer = null;
    isVolumeMatched = false;
    radioEffectBuffer = null;
    isRadioEffect = false;
    const enBuffer = await loadAudioBuffer(enSrc);
    editEnBuffer = enBuffer;
    // Länge der beiden Dateien in Sekunden bestimmen
    const enSeconds = enBuffer.length / enBuffer.sampleRate;
    const deSeconds = originalEditBuffer.length / originalEditBuffer.sampleRate;
    const maxSeconds = Math.max(enSeconds, deSeconds);
    editDurationMs = originalEditBuffer.length / originalEditBuffer.sampleRate * 1000;
    // Beide Cursor zurücksetzen
    editOrigCursor = 0;
    editDeCursor = 0;
    editPaused = false;
    editPlaying = null;
    if (editBlobUrl) { URL.revokeObjectURL(editBlobUrl); editBlobUrl = null; }
    editStartTrim = file.trimStartMs || 0;
    editEndTrim = file.trimEndMs || 0;
    document.getElementById('editStart').value = editStartTrim;
    document.getElementById('editEnd').value = editEndTrim;
    document.getElementById('editStart').oninput = e => { editStartTrim = parseInt(e.target.value) || 0; updateDeEditWaveforms(); };
    document.getElementById('editEnd').oninput = e => { editEndTrim = parseInt(e.target.value) || 0; updateDeEditWaveforms(); };

    const deCanvas = document.getElementById('waveEdited');
    const origCanvas = document.getElementById('waveOriginal');

    // Wellenbreite passend zur Länge setzen
    const enRatio = enSeconds / maxSeconds;
    const deRatio = deSeconds / maxSeconds;
    const baseWidth = 500;
    origCanvas.width = Math.round(baseWidth * enRatio);
    deCanvas.width  = Math.round(baseWidth * deRatio);
    origCanvas.style.width = `${enRatio * 100}%`;
    deCanvas.style.width  = `${deRatio * 100}%`;

    // Längen in Sekunden anzeigen
    document.getElementById('waveLabelOriginal').textContent = `EN (Original) - ${enSeconds.toFixed(2)}s`;
    document.getElementById('waveLabelEdited').textContent = `DE (bearbeiten) - ${deSeconds.toFixed(2)}s`;

    updateDeEditWaveforms();
    document.getElementById('deEditDialog').style.display = 'flex';

    // Regler für Funk-Effekt initialisieren
    const rStrength = document.getElementById('radioStrength');
    const rStrengthDisp = document.getElementById('radioStrengthDisplay');
    if (rStrength && rStrengthDisp) {
        rStrength.value = radioEffectStrength;
        rStrengthDisp.textContent = Math.round(radioEffectStrength * 100) + '%';
        rStrength.oninput = e => {
            radioEffectStrength = parseFloat(e.target.value);
            localStorage.setItem('hla_radioEffectStrength', radioEffectStrength);
            rStrengthDisp.textContent = Math.round(radioEffectStrength * 100) + '%';
            if (isRadioEffect) recomputeEditBuffer();
        };
    }
    const rHigh = document.getElementById('radioHighpass');
    if (rHigh) {
        rHigh.value = radioHighpass;
        rHigh.oninput = e => {
            radioHighpass = parseFloat(e.target.value);
            localStorage.setItem('hla_radioHighpass', radioHighpass);
            if (isRadioEffect) recomputeEditBuffer();
        };
    }
    const rLow = document.getElementById('radioLowpass');
    if (rLow) {
        rLow.value = radioLowpass;
        rLow.oninput = e => {
            radioLowpass = parseFloat(e.target.value);
            localStorage.setItem('hla_radioLowpass', radioLowpass);
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
            localStorage.setItem('hla_radioSaturation', radioSaturation);
            rSatDisp.textContent = Math.round(radioSaturation * 100) + '%';
            if (isRadioEffect) recomputeEditBuffer();
        };
    }
    const rNoise = document.getElementById('radioNoise');
    if (rNoise) {
        rNoise.value = radioNoise;
        rNoise.oninput = e => {
            radioNoise = parseFloat(e.target.value);
            localStorage.setItem('hla_radioNoise', radioNoise);
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
            localStorage.setItem('hla_radioCrackle', radioCrackle);
            rCrackleDisp.textContent = Math.round(radioCrackle * 100) + '%';
            if (isRadioEffect) recomputeEditBuffer();
        };
    }

    // Klick auf das Original-Wellenbild setzt den EN-Cursor
    origCanvas.onmousedown = e => {
        const rect = origCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = x / rect.width;
        editOrigCursor = ratio * editDurationMs;
        if (editPlaying === 'orig') {
            const audio = document.getElementById('audioPlayer');
            audio.currentTime = Math.min(editOrigCursor, editDurationMs) / 1000;
        }
        updateDeEditWaveforms(null, null);
    };

    // Klick auf das bearbeitete Wellenbild setzt Cursor bzw. Trimmer
    deCanvas.onmousedown = e => {
        const rect = deCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const startX = (editStartTrim / editDurationMs) * width;
        const endX = ((editDurationMs - editEndTrim) / editDurationMs) * width;
        if (Math.abs(x - startX) < 7) {
            editDragging = 'start';
        } else if (Math.abs(x - endX) < 7) {
            editDragging = 'end';
        } else {
            editDragging = null;
            editDeCursor = (x / width) * editDurationMs;
            if (editPlaying === 'de') {
                const audio = document.getElementById('audioPlayer');
                const dur = editDurationMs - editStartTrim - editEndTrim;
                audio.currentTime = Math.min(Math.max(editDeCursor - editStartTrim, 0), dur) / 1000;
            }
            updateDeEditWaveforms(null, null);
        }
    };
    window.onmousemove = e => {
        if (!editDragging) return;
        const rect = deCanvas.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const ratio = x / rect.width;
        const time = ratio * editDurationMs;
        if (editDragging === 'start') {
            editStartTrim = Math.min(time, editDurationMs - editEndTrim - 1);
        } else if (editDragging === 'end') {
            editEndTrim = Math.min(editDurationMs - time, editDurationMs - editStartTrim - 1);
        }
        updateDeEditWaveforms();
    };
window.onmouseup = () => { editDragging = null; };
}
// =========================== OPENDEEDIT END ================================

// =========================== APPLYVOLUMEMATCH START =======================
// Führt den Lautstärkeabgleich einmalig aus
// Beim ersten Aufruf wird das Original in die Historie geschrieben
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
    }
}

// =========================== RECOMPUTEEDITBUFFER START =====================
// Wendet aktuelle Effekte auf das Original an und aktualisiert den Buffer
async function recomputeEditBuffer() {
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
    originalEditBuffer = buf;
    editDurationMs = originalEditBuffer.length / originalEditBuffer.sampleRate * 1000;
    updateDeEditWaveforms();
}
// =========================== RECOMPUTEEDITBUFFER END =======================

// =========================== APPLYRADIOEFFECT START ========================
// Wendet den Funkgeräteffekt an und legt bei Erstbenutzung eine History an
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
}
// =========================== APPLYRADIOEFFECT END ==========================
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
    localStorage.setItem('hla_radioEffectStrength', radioEffectStrength);
    localStorage.setItem('hla_radioHighpass', radioHighpass);
    localStorage.setItem('hla_radioLowpass', radioLowpass);
    localStorage.setItem('hla_radioSaturation', radioSaturation);
    localStorage.setItem('hla_radioNoise', radioNoise);
    localStorage.setItem('hla_radioCrackle', radioCrackle);

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
// =========================== RESETRADIOSETTINGS END =======================

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
        drawWaveform(document.getElementById('waveOriginal'), editEnBuffer, { progress: showOrig });
    }
    if (originalEditBuffer) {
        const endPos = editDurationMs - editEndTrim;
        drawWaveform(document.getElementById('waveEdited'), originalEditBuffer, { start: editStartTrim, end: endPos, progress: showDe });
    }
    document.getElementById('editStart').value = Math.round(editStartTrim);
    document.getElementById('editEnd').value = Math.round(editEndTrim);
}
// =========================== UPDATEDEEDITWAVEFORMS END ====================

// =========================== STOPEDITPLAYBACK START =======================
function stopEditPlayback() {
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
    audio.play().then(() => {
        btn.classList.add('playing');
        btn.textContent = '⏸';
        editPlaying = 'orig';
        editPaused = false;
        editProgressTimer = setInterval(() => {
            updateDeEditWaveforms(audio.currentTime * 1000, null);
        }, 50);
        audio.onended = () => { URL.revokeObjectURL(editBlobUrl); editBlobUrl = null; stopEditPlayback(); };
    });
}
// =========================== PLAYORIGINALPREVIEW END ======================

// =========================== PLAYDEPREVIEW START ==========================
function playDePreview() {
    if (!originalEditBuffer) return;
    const btn = document.getElementById('playDePreview');
    const audio = document.getElementById('audioPlayer');
    if (editPlaying === 'de') {
        if (editPaused) {
            audio.play().then(() => {
                btn.classList.add('playing');
                btn.textContent = '⏸';
                editPaused = false;
                editProgressTimer = setInterval(() => {
                    updateDeEditWaveforms(null, audio.currentTime * 1000);
                }, 50);
            });
        } else {
            audio.pause();
            if (editProgressTimer) clearInterval(editProgressTimer);
            editProgressTimer = null;
            editPaused = true;
            // Position für DE merken
            editDeCursor = editStartTrim + audio.currentTime * 1000;
            btn.classList.remove('playing');
            btn.textContent = '▶';
            updateDeEditWaveforms();
        }
        return;
    }
    stopEditPlayback();
    const trimmed = trimAndPadBuffer(originalEditBuffer, editStartTrim, editEndTrim);
    const blob = bufferToWav(trimmed);
    editBlobUrl = URL.createObjectURL(blob);
    audio.src = editBlobUrl;
    audio.currentTime = Math.max(editDeCursor - editStartTrim, 0) / 1000;
    audio.play().then(() => {
        btn.classList.add('playing');
        btn.textContent = '⏸';
        editPlaying = 'de';
        editPaused = false;
        editProgressTimer = setInterval(() => {
            updateDeEditWaveforms(null, audio.currentTime * 1000);
        }, 50);
        audio.onended = () => { URL.revokeObjectURL(editBlobUrl); editBlobUrl = null; stopEditPlayback(); };
    });
}
// =========================== PLAYDEPREVIEW END ============================

// =========================== CLOSEDEEDIT START =============================
function closeDeEdit() {
    document.getElementById('deEditDialog').style.display = 'none';
    stopEditPlayback();
    currentEditFile = null;
    originalEditBuffer = null;
    savedOriginalBuffer = null;
    volumeMatchedBuffer = null;
    isVolumeMatched = false;
    radioEffectBuffer = null;
    isRadioEffect = false;
    editEnBuffer = null;
    window.onmousemove = null;
    window.onmouseup = null;
}
// =========================== CLOSEDEEDIT END ===============================

// =========================== RESETDEEDIT START =============================
// Stellt die letzte gespeicherte Version der DE-Datei aus dem Backup wieder her
async function resetDeEdit() {
    if (!currentEditFile) return;
    const relPath = getFullPath(currentEditFile);
    try {
        if (window.electronAPI && window.electronAPI.restoreDeFile) {
            await window.electronAPI.restoreDeFile(relPath);
            await window.electronAPI.deleteDeBackupFile(relPath);
            deAudioCache[relPath] = `sounds/DE/${relPath}`;
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
            deAudioCache[relPath] = fileData;
            originalEditBuffer = await loadAudioBuffer(fileData);
        }
        editStartTrim = 0;
        editEndTrim = 0;
        currentEditFile.trimStartMs = 0;
        currentEditFile.trimEndMs = 0;
        currentEditFile.volumeMatched = false;
        currentEditFile.radioEffect = false;
        volumeMatchedBuffer = null;
        isVolumeMatched = false;
        radioEffectBuffer = null;
        isRadioEffect = false;
        // Projekt als geändert markieren, damit Rücksetzungen gespeichert werden
        isDirty = true;
        editDurationMs = originalEditBuffer.length / originalEditBuffer.sampleRate * 1000;
        updateDeEditWaveforms();
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
async function applyDeEdit() {
    if (!currentEditFile || !originalEditBuffer) return;
    // Aktuellen Status des Lautstärkeabgleichs nutzen
    const relPath = getFullPath(currentEditFile);
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
        const newBuffer = trimAndPadBuffer(baseBuffer, editStartTrim, editEndTrim);
        drawWaveform(document.getElementById('waveEdited'), newBuffer, { start: 0, end: newBuffer.length / newBuffer.sampleRate * 1000 });
        const blob = bufferToWav(newBuffer);
        const buf = await blob.arrayBuffer();
        await window.electronAPI.saveDeFile(relPath, new Uint8Array(buf));
        deAudioCache[relPath] = `sounds/DE/${relPath}`;
        await updateHistoryCache(relPath);
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
                const backupFile = await ziel.getFileHandle(name, { create: true });
                const orgData = await orgFile.getFile();
                const w = await backupFile.createWritable();
                await w.write(orgData);
                await w.close();
            } catch {}
        }
        originalEditBuffer = savedOriginalBuffer;
        let baseBuffer = isVolumeMatched ? matchVolume(savedOriginalBuffer, editEnBuffer) : savedOriginalBuffer;
        if (isRadioEffect) {
            baseBuffer = await applyRadioFilter(baseBuffer);
        }
        const newBuffer = trimAndPadBuffer(baseBuffer, editStartTrim, editEndTrim);
        drawWaveform(document.getElementById('waveEdited'), newBuffer, { start: 0, end: newBuffer.length / newBuffer.sampleRate * 1000 });
        const blob = bufferToWav(newBuffer);
        await speichereUebersetzungsDatei(blob, relPath);
        deAudioCache[relPath] = blob;
        await updateHistoryCache(relPath);
    }
    currentEditFile.trimStartMs = editStartTrim;
    currentEditFile.trimEndMs = editEndTrim;
    currentEditFile.volumeMatched = isVolumeMatched;
    currentEditFile.radioEffect = isRadioEffect;
    // Änderungen sichern
    isDirty = true;
    renderFileTable();
    closeDeEdit();
    updateStatus('DE-Audio bearbeitet und gespeichert');
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
        isDirty = true;
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
        overlay.className = 'dialog-overlay';
        overlay.style.display = 'flex';
        
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
                            return `
                                <label id="folderOption_${index}_${pathIndex}" style="display: block; padding: 8px; margin: 5px 0; background: #2a2a2a; border-radius: 4px; cursor: pointer; border: 1px solid #333;" 
                                       onclick="selectFolder(${index}, ${pathIndex})">
                                    <input type="radio" name="folder_${index}" value="${pathIndex}" style="margin-right: 10px;">
                                    <span style="color: #4caf50;">${hasAudio ? '🎵' : '❓'}</span>
                                    <strong>${folderName}</strong>
                                    <br>
                                    <small style="color: #666; margin-left: 25px;">${path.folder}</small>
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
            console.log(`Selected folder ${pathIndex} for file ${fileIndex}`);
            
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
    
    console.log(`[IMPORT] Updated text for ${fileKey}: EN=${!!englishText}, DE=${!!germanText}`);
}
// =========================== IMPROVED IMPORT PROCESS END ===========================



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
        console.log(`[SEARCH] Multiple folders found for ${result.filename}, showing selection dialog`);
        
        const paths = filePathDatabase[result.filename];
        const selection = await showSingleFileSelectionDialog(result.filename, paths, result);
        
        if (selection === null) {
            updateStatus('Hinzufügen abgebrochen');
            return;
        }
        
        // Verwende ausgewählten Pfad
        const selectedPath = paths[selection.selectedIndex];
        addFileToProject(result.filename, selectedPath.folder, result);
    } else {
        // Nur ein Pfad oder bereits spezifischer Pfad aus Suchergebnis
        addFileToProject(result.filename, result.folder, result);
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
        overlay.className = 'dialog-overlay';
        overlay.style.display = 'flex';
        
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
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
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
function addFileToProject(filename, folder, originalResult) {
    const fileKey = `${folder}/${filename}`;
    const newFile = {
        id: Date.now() + Math.random(),
        filename: filename,
        folder: folder,
        // fullPath wird NICHT mehr gespeichert - wird dynamisch geladen
        enText: textDatabase[fileKey]?.en || '',
        deText: textDatabase[fileKey]?.de || '',
        autoTranslation: '',
        autoSource: '',
        selected: true,
        trimStartMs: 0,
        trimEndMs: 0,
        volumeMatched: false,
        radioEffect: false
    };
    
    files.push(newFile);
    
    // Update display order for new file
    displayOrder.push({ file: newFile, originalIndex: files.length - 1 });
    
    isDirty = true;
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

function loadIgnoredFiles() {
    try {
        const raw = localStorage.getItem('ignoredFiles');
        ignoredFiles = raw ? JSON.parse(raw) : {};
    } catch (e) {
        ignoredFiles = {};
    }
}

function saveIgnoredFiles() {
    localStorage.setItem('ignoredFiles', JSON.stringify(ignoredFiles));
}

// Beim Start laden
loadIgnoredFiles();
// =========================== IGNOREDFILES VAR END ===========================

// =========================== TOGGLESKIPFILE START ===========================
function toggleSkipFile(folder, filename) {
    const fileKey = `${folder}/${filename}`;

    if (ignoredFiles[fileKey]) {
        delete ignoredFiles[fileKey];
        console.log(`[IGNORED] Aufgehoben: ${fileKey}`);
    } else {
        ignoredFiles[fileKey] = true;
        console.log(`[IGNORED] Markiert: ${fileKey}`);
    }

    saveIgnoredFiles();

    // UI & Statistiken sofort aktualisieren
    showFolderFiles(folder);          // aktuelle Ansicht neu rendern
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
            
            isDirty = true;
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
                e.preventDefault();
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
            if (window.electronAPI && window.electronAPI.saveDeFile) {
                const buffer = await datei.arrayBuffer();
                await window.electronAPI.saveDeFile(zielPfad, new Uint8Array(buffer));
                deAudioCache[zielPfad] = `sounds/DE/${zielPfad}`;
                await updateHistoryCache(zielPfad);
            } else {
                await speichereUebersetzungsDatei(datei, zielPfad);
            }
            const f = files.find(fl => getFullPath(fl) === zielPfad);
            if (f) {
                // Fertig-Status ergibt sich nun automatisch
            }
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

        // Zeigt ein modales Dialogfenster mit HTML-Inhalt an
        function showModal(html) {
            const ov = document.createElement('div');
            ov.className = 'dialog-overlay';
            ov.style.display = 'flex';
            ov.innerHTML = `<div class="dialog">${html}</div>`;
            ov.addEventListener('click', () => ov.remove());
            document.body.appendChild(ov);
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
        function markDubAsReady(id, dest) {
            const file = files.find(f => f.id === id);
            if (!file) return;
            const rel = dest.replace(/^sounds\/DE\//i, '');
            deAudioCache[rel] = dest;
            file.dubReady = true;
            file.waitingForManual = false;
            renderFileTable();
            saveCurrentProject();
        }

        window.ui = { getActiveDubItem, markDubAsReady, notify: showToast, showModal, setActiveDubItem };

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

        // Auto-save on input changes with debouncing
        let saveTimeout;
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('text-input')) {
                // Auto-resize the input (height)
                autoResizeInput(e.target);
                
                // Debounced save
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    saveCurrentProject();
                }, 1000);
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
            if (projectItem && !e.target.classList.contains('delete-btn') && !e.target.classList.contains('project-customize-btn')) {
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
            setTimeout(() => {
                autoResizeAllInputs();
            }, 100);
        });

        // Initialize app
        console.log('%c🎮 Half-Life: Alyx Translation Tool geladen!', 'color: #ff6b1a; font-size: 16px; font-weight: bold;');
        console.log(`Version ${APP_VERSION} - Streaming-Fix`);
        console.log('✨ NEUE FEATURES:');
        console.log('• 📊 Globale Übersetzungsstatistiken: Projekt-übergreifendes Completion-Tracking');
        console.log('• 🟢 Ordner-Completion-Status: Grüne Rahmen für vollständig übersetzte Ordner');
        console.log('• ✅ Datei-Markierungen: Einzelne Dateien zeigen Übersetzungsstatus');
        console.log('• ✅ Level-Haken: Level-Reiter zeigen Vollständigkeit an');
        console.log('• 📈 Fortschritts-Prozentsätze: Detaillierte Statistiken pro Ordner');
        console.log('• 🎯 Smart-Sortierung: Übersetzte Dateien werden gruppiert angezeigt');
        console.log('• 📋 Projekt-Integration: Zeigt in welchen Projekten Dateien übersetzt sind');
        console.log('✅ ERWEITERTE FEATURES:');
        console.log('• 🔍 Erweiterte Suche: Ähnlichkeitssuche mit Normalisierung (ignoriert Groß-/Kleinschreibung, Punkte, Kommas)');
        console.log('• ⌨️ Keyboard-Navigation: Tab/Shift+Tab zwischen Textfeldern, Pfeiltasten für Zeilen, Leertaste für Audio');
        console.log('• 🖱️ Context-Menu: Rechtsklick für Audio, Text kopieren/einfügen, Ordner öffnen, Löschen');
        console.log('• 📋 Copy-Buttons: Direkte Kopierfunktion neben Textfeldern mit visuellem Feedback');
        console.log('• 📊 Fortschritts-Tracking: Completion-Status pro Datei, Statistiken pro Ordner');
        console.log('• 📋 Spalten-Sortierung: Nach Position, Name, Ordner, Completion - behält Export-Reihenfolge');
        console.log('• 📥 Erweiterte Import-Funktion: Intelligente Spalten-Erkennung mit Datenbank-Vergleich');
        console.log('✅ BESTEHENDE FEATURES:');
        console.log('• 🗂️ Projektverwaltung mit Auto-Save, Icons und Farben');
        console.log('• 🎨 Projekt & Ordner-Anpassung: Icons und Farben');
        console.log('• 📝 Drag & Drop Sortierung für Projekte und Dateien');
        console.log('• 🔢 Zeilennummer-Anpassung: Doppelklick auf # um Position zu ändern');
        console.log('• 📁 Intelligenter Ordner-Scan: Erkennt Struktur auf allen Ebenen');
        console.log('• 🧠 Smart Folder Detection: Findet Charaktere/Ordner automatisch');
        console.log('• 🔄 Universelles Auto-Scan für ALLE Funktionen');
        console.log('• ⚡ Intelligente Berechtigung-Erkennung mit sofortigem Scan');
        console.log('• 📏 Auto-Height Textboxen - EN/DE gleich breit, Höhe synchronisiert');
        console.log('• 📐 Responsive Spaltenbreite für alle Fenstergrößen');
        console.log('• ▶ Audio-Wiedergabe mit Auto-Scan direkt im Browser');
        console.log('• 💾 Backup/Restore mit Projekt-Migration');
        console.log('• 🛠️ Debug-Tools für Datenquellen-Analyse');
        console.log('• 🎯 Highlighting von Suchbegriffen');
        console.log('🚀 REVOLUTIONÄR: Projekt-übergreifende Verfolgung des Übersetzungsfortschritts mit visuellen Indikatoren!');

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        showDubbingSettings,
        createDubbingCSV,
        validateCsv,
        msToSeconds,
        isDubReady,
        startDubbing,
        redownloadDubbing,
        initiateDubbing,
        downloadDe,
        updateDubStatusForFiles,
        markDubAsReady,
        cleanupDubCache,
        getProjectPlaybackList,
        __setFiles: f => { files = f; },
        __setDeAudioCache: c => { deAudioCache = c; },
        __setRenderFileTable: fn => { renderFileTable = fn; },
        __setSaveCurrentProject: fn => { saveCurrentProject = fn; }
    };
}
