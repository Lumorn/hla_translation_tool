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

// Verwaltet die strukturierte Schritt-Anzeige im Ladeoverlay
class LadeSchrittVerwaltung {
  constructor() {
    this.schritte = new Map();
  }

  liste() {
    return document.getElementById('projectLoadingSteps');
  }

  start(titel) {
    const container = this.liste();
    if (!container) return null;
    const eintrag = document.createElement('li');
    eintrag.className = 'loading-step loading-step--running';

    const symbol = document.createElement('span');
    symbol.className = 'loading-step__icon';
    symbol.textContent = '⏳';

    const text = document.createElement('span');
    text.className = 'loading-step__label';
    text.textContent = titel;

    const zeit = document.createElement('span');
    zeit.className = 'loading-step__time';
    zeit.textContent = '';

    eintrag.append(symbol, text, zeit);
    container.appendChild(eintrag);

    const id = Symbol(titel);
    this.schritte.set(id, { start: performance.now(), element: eintrag, icon: symbol, time: zeit });
    return id;
  }

  abschliessen(id, status = 'ok', fehler = null) {
    if (!id || !this.schritte.has(id)) return;
    const daten = this.schritte.get(id);
    this.schritte.delete(id);
    const dauer = performance.now() - daten.start;
    daten.element.classList.remove('loading-step--running');
    if (status === 'error') {
      daten.element.classList.add('loading-step--error');
      daten.icon.textContent = '⚠️';
      if (fehler) {
        daten.element.setAttribute('data-error', String(fehler));
      }
    } else {
      daten.element.classList.add('loading-step--done');
      daten.icon.textContent = '✔️';
    }
    daten.time.textContent = this.formatiereDauer(dauer);
  }

  formatiereDauer(ms) {
    if (!Number.isFinite(ms) || ms < 0) return '';
    if (ms < 1000) {
      return `${ms.toFixed(0)} ms`;
    }
    if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)} s`;
    }
    const minuten = Math.floor(ms / 60000);
    const sekunden = Math.round((ms % 60000) / 1000);
    const sekundenText = String(sekunden).padStart(2, '0');
    return `${minuten}:${sekundenText} min`;
  }

  leeren() {
    const container = this.liste();
    if (container) {
      container.innerHTML = '';
    }
    this.schritte.clear();
  }
}

const ladeSchritte = new LadeSchrittVerwaltung();

// Hilfsfunktion zum Erfassen eines asynchronen Schritts mit Zeitmessung
async function verfolgeSchritt(titel, aktion, { ignoriereFehler = false } = {}) {
  const id = ladeSchritte.start(titel);
  try {
    const ergebnis = await aktion();
    ladeSchritte.abschliessen(id);
    return ergebnis;
  } catch (err) {
    ladeSchritte.abschliessen(id, 'error', err);
    if (ignoriereFehler) {
      return undefined;
    }
    throw err;
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
  ladeSchritte.leeren();
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
        await verfolgeSchritt('Autosave pausieren', () => pauseAutosave());
        autosavePaused = true;
      }
      // Ausstehende Schreibvorgänge abwarten
      await verfolgeSchritt('Schreibpuffer leeren', () => flushPendingWrites(3000), { ignoriereFehler: true });
      // GPT-Anfragen sofort abbrechen und verworfene Jobs protokollieren
      if (window.cancelGptRequests) window.cancelGptRequests('Projektwechsel');
      // Laufende Ladevorgänge abbrechen
      if (projectAbort) {
        projectAbort.abort();
      }
      projectAbort = new AbortController();
      // Event-Listener und Caches zurücksetzen
      await verfolgeSchritt('Event-Listener lösen', async () => {
        detachAllEventListeners();
      });
      if (typeof window.cancelTranslationQueue === 'function') {
        await verfolgeSchritt('Übersetzungswarteschlange stoppen', () => window.cancelTranslationQueue('Projektwechsel'));
      }
      await verfolgeSchritt('Caches leeren', async () => {
        clearInMemoryCachesHard();
      });
      // Offenes Projekt schließen
      await verfolgeSchritt('Projekt schließen', () => closeProjectData(), { ignoriereFehler: true });
      // Projektliste aktualisieren, ohne automatisch ein Projekt zu öffnen
      await verfolgeSchritt('Projektliste aktualisieren', () => reloadProjectList(true));
      // GPT-Zustände und UI leeren
      if (window.clearGptState) window.clearGptState();
      // Neues Projekt laden und auf Promise warten
      let geladen = false;
      try {
        await verfolgeSchritt('Projekt laden', () => loadProjectData(projectId, { signal: projectAbort.signal }));
        geladen = true;
      } catch (err) {
        // Wenn das Projekt fehlt, zunächst Reparaturversuch starten
        // Prüft Fehlermeldungen auf Deutsch und Englisch
        const msg = err ? String(err.message) : '';
        if (/(nicht gefunden|not found)/i.test(msg)) {
          const adapter = getStorageAdapter('current');
          try {
            await verfolgeSchritt('Projekt reparieren', () => repairProjectIntegrity(adapter, projectId, ui));
          } catch {}
          // Danach Liste neu laden und erneut versuchen
          await verfolgeSchritt('Projektliste aktualisieren', () => reloadProjectList(true));
          await verfolgeSchritt('Projekt laden', () => loadProjectData(projectId, { signal: projectAbort.signal }));
          geladen = true;
        } else {
          throw err; // Unbekannter Fehler wird nach außen gereicht
        }
      }
      if (currentSession !== mySession || !geladen) return;
      // Direkt im Anschluss verwaiste Einträge reparieren
      const adapter = getStorageAdapter('current');
      const neuAngelegt = await verfolgeSchritt('Projektintegrität prüfen', () => repairProjectIntegrity(adapter, projectId, ui));
      if (neuAngelegt) {
        // Projekt wurde angelegt: Liste neu laden und Projekt erneut öffnen
        await verfolgeSchritt('Projektliste aktualisieren', () => reloadProjectList(true));
        await verfolgeSchritt('Projekt laden', () => loadProjectData(projectId, { signal: projectAbort.signal }));
        if (currentSession !== mySession) return;
      }
      // Nach erfolgreichem Laden alle relevanten Ordner scannen
      if (window.electronAPI?.scanFolders) {
        // Electron-Umgebung: Scan über die Hauptanwendung
        const data = await verfolgeSchritt('Ordner scannen (Electron)', () => window.electronAPI.scanFolders());
        await verfolgeSchritt('EN-Dateien verarbeiten', () => verarbeiteGescannteDateien(data.enFiles));
        data.deFiles.forEach(f => {
          if (typeof setDeAudioCacheEntry === 'function') {
            setDeAudioCacheEntry(f.fullPath, `sounds/DE/${f.fullPath}`);
          } else {
            deAudioCache[f.fullPath] = `sounds/DE/${f.fullPath}`;
          }
        });
      } else {
        // Browser-Fallback: lokale Ordner direkt scannen
        await verfolgeSchritt('EN-Ordner scannen', () => scanEnOrdner());
        if (typeof scanDeOrdner === 'function') {
          await verfolgeSchritt('DE-Ordner scannen', () => scanDeOrdner());
        }
      }
      // Anschließend Projekte und Zugriffsstatus aktualisieren
      await verfolgeSchritt('Projektstatus aktualisieren', async () => {
        updateAllProjectsAfterScan();
        updateFileAccessStatus();
      });
      // Nach dem Laden Toolbar-Knöpfe neu verbinden
      await verfolgeSchritt('Toolbar neu verbinden', async () => {
        window.initToolbarButtons?.(); // bindet alle Listener der Werkzeugleiste erneut
        window.initVideoManager?.(); // richtet den Video-Manager nach jedem Wechsel neu ein
      });
      // Event-Listener wie die Live-Suche neu setzen
      await verfolgeSchritt('Event-Listener reinitialisieren', async () => {
        window.initializeEventListeners?.();
      });
    } finally {
      // Autosave wieder aktivieren
      if (autosavePaused) {
        await verfolgeSchritt('Autosave fortsetzen', () => resumeAutosave());
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

// Globale Bereitstellung für die Oberfläche
window.switchProjectSafe = switchProjectSafe;
