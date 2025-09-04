/** @jest-environment jsdom */
// Prüft, ob bei dauerhaft fehlendem Projekt die Liste erneut geladen wird
const fs = require('fs');
const path = require('path');

test('switchProjectSafe lädt Liste bei dauerhaft fehlendem Projekt erneut', async () => {
  document.body.innerHTML = '<div id="projectLoadingOverlay" class="hidden"></div>';

  window.pauseAutosave = jest.fn(async () => {});
  window.flushPendingWrites = jest.fn(async () => {});
  window.detachAllEventListeners = jest.fn();
  window.clearInMemoryCachesHard = jest.fn();
  window.closeProjectData = jest.fn(async () => {});
  window.loadProjectData = jest.fn(async () => { throw new Error('Projekt p1 nicht gefunden'); });
  window.getStorageAdapter = jest.fn(() => ({}));
  window.repairProjectIntegrity = jest.fn(async () => false);
  window.reloadProjectList = jest.fn(async () => {});
  window.resumeAutosave = jest.fn(async () => {});
  window.cancelGptRequests = jest.fn();
  window.clearGptState = jest.fn();

  const psCode = fs.readFileSync(path.join(__dirname, '../web/src/projectSwitch.js'), 'utf8');
  eval(psCode);

  await window.switchProjectSafe('p1');

  expect(window.reloadProjectList).toHaveBeenCalledTimes(2);
  expect(window.loadProjectData).toHaveBeenCalledTimes(3);
});
