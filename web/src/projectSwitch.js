// Sorgt für sicheren Projekt- und Speicherwechsel, um Race-Conditions zu vermeiden
// Kommentare sind auf Deutsch gehalten

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
      // GPT-Anfragen sofort abbrechen und verworfene Jobs protokollieren
      if (window.cancelGptRequests) window.cancelGptRequests('Projektwechsel');
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
      // Projektliste aktualisieren, ohne automatisch ein Projekt zu öffnen
      await reloadProjectList(true);
      // GPT-Zustände und UI leeren
      if (window.clearGptState) window.clearGptState();
      // Neues Projekt laden und auf Promise warten
      let geladen = false;
      try {
        await loadProjectData(projectId, { signal: projectAbort.signal });
        geladen = true;
      } catch (err) {
        // Wenn das Projekt fehlt, zunächst Reparaturversuch starten
        // Prüft Fehlermeldungen auf Deutsch und Englisch
        const msg = err ? String(err.message) : '';
        if (/(nicht gefunden|not found)/i.test(msg)) {
          const adapter = getStorageAdapter('current');
          try {
            await repairProjectIntegrity(adapter, projectId, ui);
          } catch {}
          // Danach Liste neu laden und erneut versuchen
          await reloadProjectList(true);
          await loadProjectData(projectId, { signal: projectAbort.signal });
          geladen = true;
        } else {
          throw err; // Unbekannter Fehler wird nach außen gereicht
        }
      }
      if (currentSession !== mySession || !geladen) return;
      // Direkt im Anschluss verwaiste Einträge reparieren
      const adapter = getStorageAdapter('current');
      const neuAngelegt = await repairProjectIntegrity(adapter, projectId, ui);
      if (neuAngelegt) {
        // Projekt wurde angelegt: Liste neu laden und Projekt erneut öffnen
        await reloadProjectList(true);
        await loadProjectData(projectId, { signal: projectAbort.signal });
        if (currentSession !== mySession) return;
      }
      // Nach erfolgreichem Laden alle relevanten Ordner scannen
      if (window.electronAPI?.scanFolders) {
        // Electron-Umgebung: Scan über die Hauptanwendung
        const data = await window.electronAPI.scanFolders();
        await verarbeiteGescannteDateien(data.enFiles);
        data.deFiles.forEach(f => {
          deAudioCache[f.fullPath] = `sounds/DE/${f.fullPath}`;
        });
      } else {
        // Browser-Fallback: lokale Ordner direkt scannen
        await scanEnOrdner();
        if (typeof scanDeOrdner === 'function') {
          await scanDeOrdner();
        }
      }
      // Anschließend Projekte und Zugriffsstatus aktualisieren
      updateAllProjectsAfterScan();
      updateFileAccessStatus();
      // Nach dem Laden Toolbar-Knöpfe neu verbinden
      window.initToolbarButtons?.();
      // Event-Listener wie die Live-Suche neu setzen
      window.initializeEventListeners?.();
    } finally {
      // Autosave wieder aktivieren
      if (autosavePaused) {
        await resumeAutosave();
        autosavePaused = false;
      }
      if (currentSession === mySession) setBusy(false);
    }
}).catch(async err => {
  setBusy(false);
  // Text der Fehlermeldung für Auswertung zwischenspeichern
  const msg = err ? String(err.message) : '';
  if (/(from|vorherige[s]? Projekt).*?(nicht gefunden|not found)/i.test(msg)) {
    // Fehlendes Ausgangsprojekt nur protokollieren und Liste neu indizieren
    console.warn('Vorheriges Projekt nicht gefunden, versuche es erneut:', msg);
    try {
      await reloadProjectList(true);
    } catch {}
    // Wechsel erneut anstoßen, damit er abgeschlossen wird
    return switchProjectSafe(projectId);
  } else if (/(nicht gefunden|not found)/i.test(msg)) {
    // Projekt fehlt: Liste neu laden und Platzhalter versuchen
    console.warn('Projekt nicht gefunden, versuche Platzhalter zu laden:', msg);
    try {
      const adapter = getStorageAdapter('current');
      try { await repairProjectIntegrity(adapter, projectId, ui); } catch {}
      await reloadProjectList(true);
      try {
        await loadProjectData(projectId, projectAbort ? { signal: projectAbort.signal } : {});
      } catch (e2) {
        console.warn('Platzhalter-Projekt konnte nicht geladen werden:', String(e2.message || e2));
      }
    } catch {}
  } else {
    console.error('switchProjectSafe error', err);
  }
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
      // GPT-Anfragen sofort abbrechen und verworfene Jobs protokollieren
      if (window.cancelGptRequests) window.cancelGptRequests('Speicherwechsel');
      if (projectAbort) projectAbort.abort();
      projectAbort = new AbortController();
      detachAllEventListeners();
      clearInMemoryCachesHard();
      try { await closeProjectData(); } catch {}
      // GPT-Zustände und UI leeren
      if (window.clearGptState) window.clearGptState();
      // Gewünschten Adapter setzen und initialisieren
      const adapter = getStorageAdapter(mode);
      setStorageAdapter(adapter);
      if (adapter && typeof adapter.init === 'function') {
        await adapter.init();
      }
      await reloadProjectList(true);
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
