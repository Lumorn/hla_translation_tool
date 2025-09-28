/** @jest-environment jsdom */
// Stellt sicher, dass resetGlobalState laufende Übersetzungen abbricht und keine leeren Projekte speichert
const fs = require('fs');
const path = require('path');

describe('resetGlobalState stoppt Übersetzungswarteschlange zuverlässig', () => {
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
      <div id="translateProgress" class="active"></div>
      <div id="translateStatus"></div>
      <div id="translateFill"></div>
      <div id="totalProgress"></div>
      <div id="folderProgress"></div>
      <div id="emoProgress"></div>
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
      `${mainCode}\nwindow.resetGlobalState = resetGlobalState;\nwindow.__testSetProjects = arr => { projects = arr; window.projects = projects; };\nwindow.__testSetCurrentProject = proj => { currentProject = proj; window.currentProject = proj; };\nwindow.__testUpdateAutoTranslation = updateAutoTranslation;\nwindow.__testInvokeTranslateFinished = payload => {\n  if (!payload || typeof payload.id === 'undefined') return false;\n  const entry = pendingTranslations.get(payload.id);\n  if (!entry) return false;\n  pendingTranslations.delete(payload.id);\n  saveProjects();\n  if (typeof entry.resolve === 'function') { entry.resolve(payload.text); }\n  updateTranslationQueueDisplay();\n  return true;\n};`
    );
    runMain(window, { exports: {} }, () => ({}));
  });

  test('späte Übersetzung triggert kein Speichern mit leerer Projektliste', async () => {
    const projekt = { id: 'p1', files: [] };
    const datei = { id: 7, enText: 'Hello there' };
    window.__testSetProjects([projekt]);
    window.__testSetCurrentProject(projekt);

    const promise = window.__testUpdateAutoTranslation(datei, true, projekt.id);
    expect(window.electronAPI.translateText).toHaveBeenCalledTimes(1);
    const [jobId] = window.electronAPI.translateText.mock.calls[0];

    window.resetGlobalState();

    await expect(promise).rejects.toThrow('Globaler Reset');

    const before = storageMock.setItem.mock.calls.filter(([key]) => key === 'hla_projects').length;
    const handled = window.__testInvokeTranslateFinished({ id: jobId, text: 'Late result', error: null });
    expect(handled).toBe(false);
    const after = storageMock.setItem.mock.calls.filter(([key]) => key === 'hla_projects').length;

    expect(after).toBe(before);
  });
});
