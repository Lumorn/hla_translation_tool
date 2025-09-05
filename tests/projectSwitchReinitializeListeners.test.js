/** @jest-environment jsdom */
// Stellt sicher, dass switchProjectSafe Event-Listener neu setzt
const fs = require('fs');
const path = require('path');

test('switchProjectSafe initialisiert Listener neu', async () => {
  // Platzhalter für Overlay
  document.body.innerHTML = '<div id="projectLoadingOverlay" class="hidden"></div>';

  // Benötigte Helferfunktionen bereitstellen
  window.pauseAutosave = jest.fn(async () => {});
  window.flushPendingWrites = jest.fn(async () => {});
  window.detachAllEventListeners = jest.fn();
  window.clearInMemoryCachesHard = jest.fn();
  window.closeProjectData = jest.fn(async () => {});
  window.reloadProjectList = jest.fn(async () => {});
  window.cancelGptRequests = jest.fn();
  window.clearGptState = jest.fn();
  window.loadProjectData = jest.fn(async () => {});
  window.repairProjectIntegrity = jest.fn(async () => false);
  window.getStorageAdapter = jest.fn(() => ({}));
  window.updateAllProjectsAfterScan = jest.fn();
  window.updateFileAccessStatus = jest.fn();
  window.scanEnOrdner = jest.fn(async () => {});
  window.initToolbarButtons = jest.fn();
  window.resumeAutosave = jest.fn(async () => {});
  window.initializeEventListeners = jest.fn();

  // Code laden und ausführen
  const psCode = fs.readFileSync(path.join(__dirname, '../web/src/projectSwitch.js'), 'utf8');
  eval(psCode);

  await window.switchProjectSafe('p1');

  // Sicherstellen, dass initializeEventListeners aufgerufen wurde
  expect(window.initializeEventListeners).toHaveBeenCalled();
});
