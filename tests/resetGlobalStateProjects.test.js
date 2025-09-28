/** @jest-environment jsdom */
// Prüft, dass resetGlobalState die Projektliste in-place leert und Fenster-Referenzen behält
const fs = require('fs');
const path = require('path');

describe('resetGlobalState synchronisiert projects', () => {
  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = `
      <div id="totalProgress"></div>
      <div id="folderProgress"></div>
      <div id="emoProgress"></div>
      <div id="folderGrid" style="display: none"></div>
      <div id="projectLoadingOverlay" class="hidden"></div>
    `;
    window.storage = window.localStorage;
    window.showToast = jest.fn();
    window.updateStatus = jest.fn();

    const mainCode = fs.readFileSync(path.join(__dirname, '../web/src/main.js'), 'utf8');
    const runMain = new Function('window', 'module', 'require', mainCode + '\nwindow.resetGlobalState = resetGlobalState; window.__testAccessProjects = () => projects;');
    runMain(window, { exports: {} }, () => ({}));
    const helperCode = fs.readFileSync(path.join(__dirname, '../web/src/projectHelpers.js'), 'utf8');
    eval(helperCode);
  });

  test('leert projects vor dem erneuten Laden vollständig', async () => {
    const interneListe = window.__testAccessProjects();
    interneListe.push({ id: 'alt' });
    expect(window.projects).toBe(interneListe);

    window.selectProject = jest.fn();
    window.reloadProjectList = jest.fn(async () => {
      // Vor dem erneuten Laden muss die Referenz leer sein
      expect(window.projects).toBe(interneListe);
      expect(interneListe.length).toBe(0);
      // Neue Projektdaten simulieren
      interneListe.push({ id: 'neu' });
    });

    await window.resetGlobalState();
    expect(interneListe.length).toBe(0);
    await window.loadProjectData('neu');

    expect(window.reloadProjectList).toHaveBeenCalledTimes(1);
    expect(window.selectProject).toHaveBeenCalledWith('neu');
    expect(window.__testAccessProjects()).toBe(interneListe);
  });
});
