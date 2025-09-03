// Hilfsfunktionen für sicheren Projekt- und Speicherwechsel
// Alle Funktionen werden global bereitgestellt und nutzen bestehende Strukturen

// Pausiert ein mögliches Autosave-Intervall
async function pauseAutosave() {
  // Merker für das Intervall im globalen Fenster
  if (window.__autosaveHandle) {
    clearInterval(window.__autosaveHandle);
    window.__autosaveHandle = null;
  }
}

// Setzt das Autosave-Intervall fort
async function resumeAutosave() {
  if (!window.__autosaveHandle && typeof window.triggerAutosave === 'function') {
    // Alle 30 Sekunden autosaven
    window.__autosaveHandle = setInterval(() => {
      try { window.triggerAutosave(); } catch {}
    }, 30000);
  }
}

// Wartet, bis ausstehende Schreibvorgänge abgeschlossen sind
async function flushPendingWrites(ms = 0) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

// Entfernt alle dynamisch registrierten Event-Listener durch Klonen der Elemente
function detachAllEventListeners() {
  document.querySelectorAll('*').forEach(el => {
    if (el.tagName === 'SCRIPT') return; // Skripte nicht anfassen
    const clone = el.cloneNode(true);
    // Inline-Event-Handler erhalten
    for (const attr of el.getAttributeNames()) {
      if (attr.startsWith('on')) {
        clone[attr] = el[attr];
      }
    }
    el.replaceWith(clone);
  });
}

// Leert In-Memory-Caches durch Aufruf des globalen Reset
function clearInMemoryCachesHard() {
  if (typeof window.resetGlobalState === 'function') {
    window.resetGlobalState();
  }
}

// Speichert aktuelle Projektdaten und gibt Locks frei
async function closeProjectData() {
  if (typeof window.saveCurrentProject === 'function') {
    window.saveCurrentProject();
  }
  if (window.currentProjectLock && typeof window.currentProjectLock.release === 'function') {
    try { window.currentProjectLock.release(); } catch {}
    window.currentProjectLock = null;
  }
  window.currentProject = null;
}

// Merker für laufende Ladeprozesse, um Doppelaufrufe zu verhindern
let laufendeProjektladung = null;

// Lädt ein Projekt über die bestehende selectProject-Funktion
// und wartet auf deren Abschluss, egal ob sie synchron oder asynchron arbeitet
async function loadProjectData(id, opts = {}) {
  // Läuft bereits eine Ladung, diese zurückgeben
  if (laufendeProjektladung) {
    return laufendeProjektladung;
  }

  laufendeProjektladung = (async () => {
    // Abbruch vor Beginn berücksichtigen
    if (opts.signal?.aborted) {
      throw new DOMException('Abgebrochen', 'AbortError');
    }

    // Projektliste bei Bedarf nachladen
    if (!Array.isArray(window.projects) || window.projects.length === 0) {
      if (typeof window.reloadProjectList === 'function') {
        await window.reloadProjectList();
      }
    }

    // Projekt anhand String-Vergleich ermitteln
    const existiert = Array.isArray(window.projects) &&
      window.projects.some(p => String(p.id) === String(id));

    if (!existiert) {
      const overlay = document.getElementById('projectLoadingOverlay');
      if (overlay) overlay.classList.add('hidden');
      const msg = `Projekt ${id} nicht gefunden`;
      if (window.electronAPI && window.electronAPI.showProjectError) {
        window.electronAPI.showProjectError('Projekt-Ladefehler', msg);
      } else {
        alert('Projekt-Ladefehler:\n' + msg);
      }
      throw new Error(msg);
    }

    // Abbruch während des Ladens prüfen
    if (opts.signal?.aborted) {
      throw new DOMException('Abgebrochen', 'AbortError');
    }

    // Projekt laden und auf eine mögliche Promise warten
    if (typeof window.selectProject === 'function') {
      const res = window.selectProject(id);
      if (res && typeof res.then === 'function') {
        await res;
      }
    }

    // Nach dem Laden erneut auf Abbruch prüfen
    if (opts.signal?.aborted) {
      throw new DOMException('Abgebrochen', 'AbortError');
    }

    // Optionalen Callback ausführen
    if (typeof opts.callback === 'function') {
      await opts.callback();
    }
  })();

  try {
    return await laufendeProjektladung;
  } finally {
    laufendeProjektladung = null;
  }
}

// Liefert das gewünschte Speicher-Backend
function getStorageAdapter(mode) {
  if (mode === 'current') return window.storage;
  if (typeof window.createStorage === 'function') {
    try { return window.createStorage(mode); } catch { return null; }
  }
  return null;
}

// Setzt das globale Speicher-Backend
function setStorageAdapter(adapter) {
  window.storage = adapter;
}

// Repariert offensichtliche Inkonsistenzen im Projekt
// Prüft dabei das neue Namensschema "project:<id>:meta" und "project:<id>:index"
// Liefert true zurück, wenn das Projekt neu angelegt wurde
async function repairProjectIntegrity(adapter, projectId, ui = {}) {
  if (!adapter || !adapter.getItem) return false;

  // Schlüssel nach neuem Schema bilden
  const metaKey = `project:${projectId}:meta`;
  const indexKey = `project:${projectId}:index`;
  const listKey = 'hla_projects';

  // Alle benötigten Daten parallel aus dem Speicher laden
  const [meta, index, listRaw] = await Promise.all([
    adapter.getItem(metaKey),
    adapter.getItem(indexKey),
    adapter.getItem(listKey)
  ]);

  let changed = false;
  const writes = []; // Sammeln der Schreibvorgänge

  // Fehlende Metadaten durch leere Struktur ersetzen
  if (!meta) {
    ui.warn && ui.warn(`Projekt ${projectId} nicht gefunden – Metadaten angelegt`);
    writes.push(adapter.setItem(metaKey, JSON.stringify({ id: projectId })));
    changed = true;
  }

  // Fehlenden Index durch leeres Array ersetzen
  if (!index) {
    ui.warn && ui.warn(`Projekt ${projectId} nicht gefunden – Index angelegt`);
    writes.push(adapter.setItem(indexKey, '[]'));
    changed = true;
  }

  // Projektliste prüfen und Platzhalter eintragen, falls das Projekt fehlt
  let list = [];
  try {
    if (listRaw) list = JSON.parse(listRaw);
  } catch { /* Ungültige Liste wird ignoriert */ }

  if (!list.some(p => String(p.id) === String(projectId))) {
    ui.warn && ui.warn(`Projekt ${projectId} fehlte in der Projektliste – Platzhalter erstellt`);
    list.push({
      id: projectId,
      name: 'Unbenannt',
      files: [],
      color: '#333333',
      restTranslation: false,
      gptTests: [],
      gptTabIndex: 0,
      segmentAssignments: {},
      segmentSegments: null,
      segmentAudio: null,
      segmentAudioPath: null,
      segmentIgnored: [],
      levelName: '',
      levelPart: 1
    });
    writes.push(adapter.setItem(listKey, JSON.stringify(list)));
    changed = true;
    // In-Memory-Projekte sofort aktualisieren, um Race-Conditions zu vermeiden
    if (Array.isArray(window.projects)) {
      window.projects = list;
    }
  }

  // Auf Abschluss aller Schreibvorgänge warten
  await Promise.all(writes);

  if (changed) {
    return true;
  } else {
    ui.info && ui.info(`Projekt ${projectId} geprüft`);
    return false;
  }
}

// Lädt die Projektliste neu
// Über den Parameter "skipSelect" wird verhindert, dass loadProjects ein Projekt öffnet
async function reloadProjectList(skipSelect = true) {
  if (typeof window.loadProjects === 'function') {
    await window.loadProjects(skipSelect);
  }
}

// Globale Bereitstellung
window.pauseAutosave = pauseAutosave;
window.flushPendingWrites = flushPendingWrites;
window.detachAllEventListeners = detachAllEventListeners;
window.clearInMemoryCachesHard = clearInMemoryCachesHard;
window.closeProjectData = closeProjectData;
window.loadProjectData = loadProjectData;
window.getStorageAdapter = getStorageAdapter;
window.repairProjectIntegrity = repairProjectIntegrity;
window.resumeAutosave = resumeAutosave;
window.setStorageAdapter = setStorageAdapter;
window.reloadProjectList = reloadProjectList;

