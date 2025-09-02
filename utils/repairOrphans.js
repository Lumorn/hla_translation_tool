'use strict';

// Diese Datei enthält Hilfsfunktionen, um verwaiste Vorschläge zu erkennen
// und in eine Quarantäne innerhalb des Projekts zu verschieben.

/**
 * Verschiebt alle Vorschläge ohne gültige Datei-ID in die Projektquarantäne.
 * @param {Object} project   Das Projektobjekt mit Dateien und Vorschlägen.
 * @param {Function} [saveProject]  Optionale Speicherfunktion für sofortiges Persistieren.
 * @returns {{project: Object, movedCount: number}}  Rückgabe des Projekts und Anzahl verschobener Vorschläge.
 */
function repairOrphans(project, saveProject = () => {}) {
  // Gültige Datei-IDs sammeln
  const validFileIds = new Set((project.files || []).map(f => f.id));
  const all = project.suggestions || [];
  const valid = [];
  const orphans = [];
  const now = new Date().toISOString();

  for (const s of all) {
    if (validFileIds.has(s.fileId)) {
      // Vorschlag referenziert eine existierende Datei
      valid.push(s);
    } else {
      // Datei fehlt → Vorschlag wandert in die Quarantäne
      orphans.push({
        suggestion: s,
        reason: 'missing-file',
        missingFileId: s.fileId,
        detectedAt: now
      });
    }
  }

  if (!project.meta) project.meta = {};
  if (!project.meta.quarantine) project.meta.quarantine = { orphanSuggestions: [] };

  project.meta.quarantine.orphanSuggestions.push(...orphans);
  project.meta.quarantine.lastAutoRepairAt = now;

  project.suggestions = valid;

  if (orphans.length > 0) {
    // Bei Änderungen sofortiges Speichern anstoßen
    try {
      saveProject(project);
    } catch (e) {
      // Speichern darf die Reparatur nicht blockieren
      console.warn('Speichern nach Reparatur fehlgeschlagen:', e);
    }
  }

  return { project, movedCount: orphans.length };
}

/**
 * Verschiebt angegebene Vorschläge mit Grundangabe in die Quarantäne.
 * @param {Object} project    Projektobjekt.
 * @param {Array} items       Liste der zu verschiebenden Vorschläge.
 * @param {string} reason     Grund, z.B. 'missing-file' oder 'file-renamed'.
 */
function moveSuggestionsToQuarantine(project, items, reason) {
  if (!project.meta) project.meta = {};
  if (!project.meta.quarantine) {
    project.meta.quarantine = { orphanSuggestions: [] };
  }

  const q = project.meta.quarantine;
  const now = new Date().toISOString();

  for (const s of items) {
    q.orphanSuggestions.push({
      suggestion: s,
      reason,
      missingFileId: s.fileId,
      detectedAt: now
    });
  }

  const ids = new Set(items.map(i => i.id));
  project.suggestions = (project.suggestions || []).filter(s => !ids.has(s.id));
}

// Die Funktionen sowohl für Node (module.exports) als auch für den Browser bereitstellen
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    repairOrphans,
    moveSuggestionsToQuarantine
  };
} else {
  // Im Browser global verfügbar machen
  window.repairOrphans = repairOrphans;
  window.moveSuggestionsToQuarantine = moveSuggestionsToQuarantine;
}

