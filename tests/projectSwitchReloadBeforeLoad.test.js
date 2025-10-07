/** @jest-environment jsdom */
// Testet, dass beim Projektwechsel die Liste vor dem Öffnen aktualisiert wird
const fs = require('fs');
const path = require('path');
const { setupProjectLoadingOverlay } = require('./testHelpers');

test('switchProjectSafe lädt Liste vor dem Projekt ohne Fehler', async () => {
  // Overlay für den Ladebalken bereitstellen
  setupProjectLoadingOverlay();

  const aufrufReihenfolge = [];

  // Notwendige Helferfunktionen bereitstellen
  window.pauseAutosave = jest.fn(async () => {});
  window.flushPendingWrites = jest.fn(async () => {});
  window.detachAllEventListeners = jest.fn();
  window.clearInMemoryCachesHard = jest.fn();
  window.closeProjectData = jest.fn(async () => {});
  window.getStorageAdapter = jest.fn(() => ({}));
  window.repairProjectIntegrity = jest.fn(async () => {});
  window.resumeAutosave = jest.fn(async () => {});
  window.cancelGptRequests = jest.fn();
  window.clearGptState = jest.fn();
  window.loadProjectData = jest.fn(async () => { aufrufReihenfolge.push('loadProjectData'); });
  window.scanEnOrdner = jest.fn(async () => {});
  window.updateAllProjectsAfterScan = jest.fn();
  window.updateFileAccessStatus = jest.fn();

  // loadProjects wirft Fehler, falls skipSelect nicht true ist
  window.loadProjects = jest.fn(async (skipSelect) => {
    aufrufReihenfolge.push(`loadProjects:${skipSelect}`);
    if (!skipSelect) {
      throw new Error('Projekte konnten nicht geladen werden');
    }
  });
  window.reloadProjectList = jest.fn(async (skipSelect = true) => {
    await window.loadProjects(skipSelect);
    aufrufReihenfolge.push('reloadProjectList');
  });

  // switchProjectSafe laden
  const psCode = fs.readFileSync(path.join(__dirname, '../web/src/projectSwitch.js'), 'utf8');
  eval(psCode);

  await window.switchProjectSafe('p1');

  // Sicherstellen, dass loadProjects mit skipSelect=true aufgerufen wurde
  expect(window.loadProjects).toHaveBeenCalledWith(true);
  // Kontrolle der Aufrufreihenfolge: reloadProjectList vor loadProjectData
  const idxReload = aufrufReihenfolge.indexOf('reloadProjectList');
  const idxLoad = aufrufReihenfolge.indexOf('loadProjectData');
  expect(idxReload).toBeGreaterThan(-1);
  expect(idxLoad).toBeGreaterThan(-1);
  expect(idxReload).toBeLessThan(idxLoad);
});
