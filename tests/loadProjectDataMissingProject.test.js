/** @jest-environment jsdom */
// Prüft, ob loadProjectData bei fehlendem Projekt mit Fehlermeldung abbricht
const fs = require('fs');
const path = require('path');
const { getProjectLoadingOverlayMarkup } = require('./testHelpers');

test('loadProjectData bricht bei fehlendem Projekt ab', async () => {
  // Overlay simulieren, um Spinner zu prüfen
  document.body.innerHTML = getProjectLoadingOverlayMarkup({ hidden: false });

  // Projekte sind leer, Nachladen bringt nichts
  window.projects = [];
  window.selectProject = jest.fn();
  // electronAPI simulieren, sollte aber nicht aufgerufen werden
  window.electronAPI = { showProjectError: jest.fn() };

  const helpersCode = fs.readFileSync(path.join(__dirname, '../web/src/projectHelpers.js'), 'utf8');
  eval(helpersCode);
  // Nach dem Laden Mock für reloadProjectList setzen
  window.reloadProjectList = jest.fn(async () => { window.projects = []; });

  await expect(window.loadProjectData('p1')).rejects.toThrow('Projekt p1 nicht gefunden');
  expect(window.reloadProjectList).toHaveBeenCalled();
  expect(window.selectProject).not.toHaveBeenCalled();
  expect(window.electronAPI.showProjectError).not.toHaveBeenCalled();
  expect(document.getElementById('projectLoadingOverlay').classList.contains('hidden')).toBe(false);
});
