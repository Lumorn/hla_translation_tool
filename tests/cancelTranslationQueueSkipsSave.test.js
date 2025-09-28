/** @jest-environment jsdom */
// Prüft, dass ein Abbruch der Übersetzungswarteschlange kein unnötiges Speichern auslöst
const fs = require('fs');
const path = require('path');

describe('cancelTranslationQueue blockiert Speichern nach Abbruch', () => {
  let storageMock;

  beforeEach(() => {
    jest.resetModules();

    const storageData = {};
    storageMock = {
      getItem: jest.fn(key => (Object.prototype.hasOwnProperty.call(storageData, key) ? storageData[key] : null)),
      setItem: jest.fn((key, value) => { storageData[key] = String(value); }),
      removeItem: jest.fn(key => { delete storageData[key]; }),
      clear: jest.fn(() => { Object.keys(storageData).forEach(k => delete storageData[k]); }),
      key: jest.fn(index => Object.keys(storageData)[index] || null)
    };
    Object.defineProperty(storageMock, 'length', {
      get: () => Object.keys(storageData).length
    });

    Object.defineProperty(window, 'localStorage', {
      value: storageMock,
      configurable: true
    });
    window.storage = storageMock;

    document.body.innerHTML = `
      <div id="translateProgress"></div>
      <div id="translateStatus"></div>
      <div id="translateFill"></div>
      <div id="totalProgress"></div>
      <div id="folderProgress"></div>
      <div id="emoProgress"></div>
      <div id="folderGrid" style="display:none"></div>
    `;

    window.showToast = jest.fn();
    window.updateStatus = jest.fn();

    window.electronAPI = {
      translateText: jest.fn(),
      onTranslateFinished: jest.fn(),
      onManualFile: jest.fn(),
      onDubDone: jest.fn(),
      onDubError: jest.fn(),
      onDubStatus: jest.fn(),
      onDubLog: jest.fn(),
      onSoundBackupProgress: jest.fn()
    };

    const mainCode = fs.readFileSync(path.join(__dirname, '../web/src/main.js'), 'utf8');
    const runMain = new Function(
      'window',
      'module',
      'require',
      `${mainCode}\nwindow.__testSetProjects = arr => { projects = arr; window.projects = arr; };\nwindow.__testSetCurrentProject = proj => { currentProject = proj; window.currentProject = proj; };\nwindow.__testRunTranslationQueue = runTranslationQueue;\nwindow.__testOverrideUpdateAutoTranslation = fn => { updateAutoTranslation = fn; };`
    );
    runMain(window, { exports: {} }, () => ({}));
  });

  test('Abbruch löst kein Speichern aus und lässt Status leer', async () => {
    const projekt = { id: 'p1', name: 'Testprojekt', files: [] };
    const datei = { id: 42, enText: 'Hello there' };
    window.__testSetProjects([projekt]);
    window.__testSetCurrentProject(projekt);

    const resolverListe = [];
    window.__testOverrideUpdateAutoTranslation(() => new Promise(resolve => {
      resolverListe.push(resolve);
    }));

    const vorAbbruch = storageMock.setItem.mock.calls.filter(([key]) => key === 'hla_projects').length;

    window.__testRunTranslationQueue([datei], projekt.id);
    expect(resolverListe.length).toBe(1);

    window.cancelTranslationQueue('Testabbruch');

    resolverListe.forEach(resolve => resolve());

    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));

    const nachAbbruch = storageMock.setItem.mock.calls.filter(([key]) => key === 'hla_projects').length;
    expect(nachAbbruch).toBe(vorAbbruch);

    const status = document.getElementById('translateStatus');
    expect(status.textContent).toBe('');
  });
});
