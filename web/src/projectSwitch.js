// Sorgt für sicheren Projekt- und Speicherwechsel, um Race-Conditions zu vermeiden
// Kommentare sind auf Deutsch gehalten

// Quarantäne-Helfer bereitstellen
import '../../utils/repairOrphans.js';

// Warteschlange, damit Wechsel nacheinander abgearbeitet werden
let switchQueue = Promise.resolve();
// Laufende Sitzung zur Vermeidung veralteter Rückläufer
let currentSession = 0;
// AbortController für laufende Lade- oder Speicherprozesse
let projectAbort = null;
// Merker, ob das automatische Speichern pausiert wurde
let autosavePaused = false;

// Einfache UI-Hilfen zum Protokollieren
const ui = {
  info: m => console.log(m),
  warn: m => console.warn(m),
  // Fortschrittsanzeige optional
  progress: (d, t) => {}
};

/**
 * Repariert verwaiste Vorschläge und speichert das Projekt sofort.
 * @param {Object} adapter   Aktueller Speicheradapter zum Persistieren.
 * @param {string|number} projectId ID des zu prüfenden Projekts.
 * @param {Object} ui        Hilfsobjekt für Hinweise.
 */
async function repairProjectIntegrity(adapter, projectId, ui) {
  const index = (projects || []).findIndex(p => p.id === projectId);
  if (index === -1) return; // Kein Projekt vorhanden

  const project = projects[index];
  const { movedCount } = window.repairOrphans(project, p => {
    projects[index] = p;
    adapter.setItem('hla_projects', JSON.stringify(projects));
  });

  if (movedCount > 0) {
    const msg = `${movedCount} verwaiste Vorschläge in Quarantäne verschoben – Debug › Quarantäne.`;
    if (typeof window.showToast === 'function') {
      window.showToast(msg);
    } else if (ui && typeof ui.info === 'function') {
      ui.info(msg);
    }
  }
}

/**
 * Blendet einen globalen Ladebalken ein oder aus,
 * um weitere Projektwechsel während des Ladens zu verhindern.
 */
function setBusy(aktiv) {
  const overlay = document.getElementById('projectLoadingOverlay');
  if (!overlay) return; // Falls Oberfläche fehlt, nichts tun
  overlay.classList.toggle('hidden', !aktiv);
}

/**
 * Führt einen sicheren Projektwechsel durch.
 * Alle laufenden Vorgänge werden abgebrochen und Caches geleert.
 */
function switchProjectSafe(projectId) {
  switchQueue = switchQueue.then(async () => {
    const mySession = ++currentSession;
    setBusy(true);
    try {
      // Autosave kurz anhalten
      if (!autosavePaused) {
        await pauseAutosave();
        autosavePaused = true;
      }
      // Ausstehende Schreibvorgänge abwarten
      try {
        await flushPendingWrites(3000);
      } catch {}
      // Laufende Ladevorgänge abbrechen
      if (projectAbort) {
        projectAbort.abort();
      }
      projectAbort = new AbortController();
      // Event-Listener und Caches zurücksetzen
      detachAllEventListeners();
      clearInMemoryCachesHard();
      // Offenes Projekt schließen
      try { await closeProjectData(); } catch {}
      // Neues Projekt laden
      await loadProjectData(projectId, { signal: projectAbort.signal });
      if (currentSession !== mySession) return;
      // Direkt im Anschluss verwaiste Einträge reparieren
      const adapter = getStorageAdapter('current');
      await repairProjectIntegrity(adapter, projectId, ui);
    } finally {
      // Autosave wieder aktivieren
      if (autosavePaused) {
        await resumeAutosave();
        autosavePaused = false;
      }
      if (currentSession === mySession) setBusy(false);
    }
  }).catch(err => {
    setBusy(false);
    console.error('switchProjectSafe error', err);
  });
  return switchQueue;
}

/**
 * Wechselt das Speichersystem sicher und leert vorher alle Zustände.
 */
async function switchStorageSafe(mode) {
  await (switchQueue = switchQueue.then(async () => {
    const mySession = ++currentSession;
    setBusy(true);
    try {
      if (!autosavePaused) {
        await pauseAutosave();
        autosavePaused = true;
      }
      try { await flushPendingWrites(3000); } catch {}
      if (projectAbort) projectAbort.abort();
      projectAbort = new AbortController();
      detachAllEventListeners();
      clearInMemoryCachesHard();
      try { await closeProjectData(); } catch {}
      // Gewünschten Adapter setzen und initialisieren
      const adapter = getStorageAdapter(mode);
      setStorageAdapter(adapter);
      if (adapter && typeof adapter.init === 'function') {
        await adapter.init();
      }
      await reloadProjectList();
    } finally {
      if (autosavePaused) {
        await resumeAutosave();
        autosavePaused = false;
      }
      if (currentSession === mySession) setBusy(false);
    }
  }));
}

// Globale Bereitstellung für die Oberfläche
window.switchProjectSafe = switchProjectSafe;
window.switchStorageSafe = switchStorageSafe;
