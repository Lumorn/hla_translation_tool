/** @jest-environment jsdom */
// Prüft, ob bei "Projekt nicht gefunden" die Liste neu geladen und erneut versucht wird
const fs = require('fs');
const path = require('path');
const { setupProjectLoadingOverlay } = require('./testHelpers');

test('switchProjectSafe lädt nach Fehler die Projektliste neu', async () => {
  setupProjectLoadingOverlay();

  let ersterAufruf = true;
  window.pauseAutosave = jest.fn(async () => {});
  window.flushPendingWrites = jest.fn(async () => {});
  window.detachAllEventListeners = jest.fn();
  window.clearInMemoryCachesHard = jest.fn();
  window.closeProjectData = jest.fn(async () => {});
  window.loadProjectData = jest.fn(async () => {
    if (ersterAufruf) {
      ersterAufruf = false;
      throw new Error('Projekt p1 nicht gefunden');
    }
  });
  window.getStorageAdapter = jest.fn(() => ({}));
  window.repairProjectIntegrity = jest.fn(async () => false);
  window.reloadProjectList = jest.fn(async () => {});
  window.resumeAutosave = jest.fn(async () => {});
  window.cancelGptRequests = jest.fn();
  window.clearGptState = jest.fn();
  window.scanEnOrdner = jest.fn(async () => {});
  window.updateAllProjectsAfterScan = jest.fn();
  window.updateFileAccessStatus = jest.fn();

  const psCode = fs.readFileSync(path.join(__dirname, '../web/src/projectSwitch.js'), 'utf8');
  eval(psCode);

  await window.switchProjectSafe('p1');

  expect(window.reloadProjectList).toHaveBeenCalledTimes(2);
  expect(window.loadProjectData).toHaveBeenCalledTimes(2);
  expect(window.repairProjectIntegrity).toHaveBeenCalledTimes(2);
});
