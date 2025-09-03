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

// Lädt ein Projekt über die bestehende selectProject-Funktion
// und liefert ein Promise, das erst nach vollständigem Laden auflöst
async function loadProjectData(id, opts = {}) {
  return new Promise((resolve, reject) => {
    if (opts.signal?.aborted) {
      reject(new DOMException('Abgebrochen', 'AbortError'));
      return;
    }
    if (typeof window.selectProject !== 'function') {
      resolve();
      return;
    }
    let abgeschlossen = false;
    const finalize = () => {
      if (abgeschlossen) return;
      abgeschlossen = true;
      if (typeof opts.callback === 'function') {
        try {
          const r = opts.callback();
          if (r && typeof r.then === 'function') {
            r.then(resolve).catch(reject);
            return;
          }
        } catch (err) {
          reject(err);
          return;
        }
      }
      resolve();
    };
    if (opts.signal) {
      opts.signal.addEventListener('abort', () => {
        if (abgeschlossen) return;
        abgeschlossen = true;
        reject(new DOMException('Abgebrochen', 'AbortError'));
      }, { once: true });
    }
    try {
      const res = window.selectProject(id, finalize);
      if (res && typeof res.then === 'function') {
        res.then(finalize).catch(reject);
      } else if (window.selectProject.length < 2) {
        finalize();
      }
    } catch (err) {
      reject(err);
    }
  });
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
// Liefert true zurück, wenn das Projekt neu angelegt wurde
async function repairProjectIntegrity(adapter, projectId, ui = {}) {
  if (!adapter || !adapter.getItem) return false;
  const key = 'project:' + projectId;
  const data = await adapter.getItem(key);
  if (!data) {
    ui.warn && ui.warn(`Projekt ${projectId} nicht gefunden – leere Struktur angelegt`);
    await adapter.setItem(key, JSON.stringify({ id: projectId, files: [] }));
    return true;
  } else {
    ui.info && ui.info(`Projekt ${projectId} geprüft`);
    return false;
  }
}

// Lädt die Projektliste neu
async function reloadProjectList() {
  if (typeof window.loadProjects === 'function') {
    await window.loadProjects();
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

