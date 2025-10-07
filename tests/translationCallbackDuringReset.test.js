/** @jest-environment jsdom */
// Prüft, dass verspätete Übersetzungsrückläufer während eines Resets keine Projekte speichern
const fs = require('fs');
const path = require('path');
const { getProjectLoadingOverlayMarkup } = require('./testHelpers');

describe('Übersetzungs-Rückläufer während Reset', () => {
  let storageMock;
  let translateFinishedHandler;
  let restoreAddEventListener;
  let domReadyHandler;

  beforeEach(async () => {
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
      <div id="folderGrid" style="display: none"></div>
      ${getProjectLoadingOverlayMarkup()}
    `;

    window.showToast = jest.fn();
    window.updateStatus = jest.fn();

    domReadyHandler = null;
    const originalAddEventListener = document.addEventListener.bind(document);
    restoreAddEventListener = jest
      .spyOn(document, 'addEventListener')
      .mockImplementation((event, handler, options) => {
        if (event === 'DOMContentLoaded') {
          domReadyHandler = handler;
          return;
        }
        return originalAddEventListener(event, handler, options);
      });

    translateFinishedHandler = null;
    window.electronAPI = {
      translateText: jest.fn(),
      onTranslateFinished: jest.fn(cb => { translateFinishedHandler = cb; }),
      onManualFile: jest.fn(),
      onDubDone: jest.fn(),
      onDubError: jest.fn(),
      onDubStatus: jest.fn(),
      onDubLog: jest.fn(),
      onSoundBackupProgress: jest.fn(),
      scanFolders: jest.fn(() => Promise.resolve({ enFiles: [], deFiles: [] })),
      moveFile: jest.fn(() => Promise.resolve()),
      getDebugInfo: jest.fn(() => Promise.resolve({})),
      join: jest.fn((...parts) => parts.join('/')),
      openPath: jest.fn(() => Promise.resolve())
    };

    const mainCode = fs.readFileSync(path.join(__dirname, '../web/src/main.js'), 'utf8');
    const runMain = new Function(
      'window',
      'module',
      'require',
      `${mainCode}\nwindow.resetGlobalState = resetGlobalState;\nwindow.__testSetProjects = arr => { projects = arr; window.projects = projects; };\nwindow.__testGetPendingTranslations = () => pendingTranslations;\nwindow.__testOverrideForDomReady = overrides => {\n  if (overrides.updateProjectPlaybackButtons) { updateProjectPlaybackButtons = overrides.updateProjectPlaybackButtons; window.updateProjectPlaybackButtons = updateProjectPlaybackButtons; }\n  if (overrides.cleanupDubCache) { cleanupDubCache = overrides.cleanupDubCache; window.cleanupDubCache = cleanupDubCache; }\n  if (overrides.verarbeiteGescannteDateien) { verarbeiteGescannteDateien = overrides.verarbeiteGescannteDateien; window.verarbeiteGescannteDateien = verarbeiteGescannteDateien; }\n  if (overrides.updateAllProjectsAfterScan) { updateAllProjectsAfterScan = overrides.updateAllProjectsAfterScan; window.updateAllProjectsAfterScan = updateAllProjectsAfterScan; }\n  if (overrides.repairFileExtensions) { repairFileExtensions = overrides.repairFileExtensions; window.repairFileExtensions = repairFileExtensions; }\n  if (overrides.updateFileAccessStatus) { updateFileAccessStatus = overrides.updateFileAccessStatus; window.updateFileAccessStatus = updateFileAccessStatus; }\n  if (overrides.markDubAsReady) { markDubAsReady = overrides.markDubAsReady; window.markDubAsReady = markDubAsReady; }\n  if (overrides.resolveDuplicateAfterCopy) { resolveDuplicateAfterCopy = overrides.resolveDuplicateAfterCopy; window.resolveDuplicateAfterCopy = resolveDuplicateAfterCopy; }\n  if (overrides.renderFileTable) { renderFileTable = overrides.renderFileTable; window.renderFileTable = renderFileTable; }\n  if (overrides.saveCurrentProject) { saveCurrentProject = overrides.saveCurrentProject; window.saveCurrentProject = saveCurrentProject; }\n  if (overrides.updateDownloadWaitDialog) { updateDownloadWaitDialog = overrides.updateDownloadWaitDialog; window.updateDownloadWaitDialog = updateDownloadWaitDialog; }\n  if (overrides.updateTranslationDisplay) { updateTranslationDisplay = overrides.updateTranslationDisplay; window.updateTranslationDisplay = updateTranslationDisplay; }\n  if (overrides.updateTranslationQueueDisplay) { updateTranslationQueueDisplay = overrides.updateTranslationQueueDisplay; window.updateTranslationQueueDisplay = updateTranslationQueueDisplay; }\n  if (overrides.reloadProjectList) { reloadProjectList = overrides.reloadProjectList; window.reloadProjectList = reloadProjectList; }\n  if (overrides.loadProjects) { loadProjects = overrides.loadProjects; window.loadProjects = loadProjects; }\n  if (overrides.initializeEventListeners) { initializeEventListeners = overrides.initializeEventListeners; window.initializeEventListeners = initializeEventListeners; }\n  if (overrides.getFullPath) { getFullPath = overrides.getFullPath; window.getFullPath = getFullPath; }\n  if (overrides.setDeAudioCacheEntry) { setDeAudioCacheEntry = overrides.setDeAudioCacheEntry; window.setDeAudioCacheEntry = setDeAudioCacheEntry; }\n  if (overrides.updateHistoryCache) { updateHistoryCache = overrides.updateHistoryCache; window.updateHistoryCache = updateHistoryCache; }\n  if (overrides.addDubbingLog) { addDubbingLog = overrides.addDubbingLog; window.addDubbingLog = addDubbingLog; }\n  if (overrides.getActiveDubItem) { getActiveDubItem = overrides.getActiveDubItem; window.getActiveDubItem = getActiveDubItem; }\n  if (overrides.updateStatus) { updateStatus = overrides.updateStatus; window.updateStatus = updateStatus; }\n  if (overrides.showToast) { showToast = overrides.showToast; window.showToast = showToast; }\n  if (overrides.updateProjectPlaybackButtons) { updateProjectPlaybackButtons = overrides.updateProjectPlaybackButtons; window.updateProjectPlaybackButtons = updateProjectPlaybackButtons; }\n};`
    );
    runMain(window, { exports: {} }, key => {
      if (key === 'fs') return fs;
      if (key === 'path') return path;
      return {};
    });

    window.alert = jest.fn();
    window.__testOverrideForDomReady({
      updateProjectPlaybackButtons: jest.fn(),
      cleanupDubCache: jest.fn(),
      verarbeiteGescannteDateien: jest.fn(async () => {}),
      updateAllProjectsAfterScan: jest.fn(),
      repairFileExtensions: jest.fn(() => 0),
      updateFileAccessStatus: jest.fn(),
      markDubAsReady: jest.fn(),
      resolveDuplicateAfterCopy: jest.fn(() => Promise.resolve()),
      renderFileTable: jest.fn(),
      saveCurrentProject: jest.fn(),
      updateDownloadWaitDialog: jest.fn(),
      updateTranslationDisplay: jest.fn(),
      updateTranslationQueueDisplay: jest.fn(),
      reloadProjectList: jest.fn(() => Promise.resolve()),
      loadProjects: jest.fn(() => Promise.resolve()),
      initializeEventListeners: jest.fn(),
      getFullPath: jest.fn(() => ''),
      setDeAudioCacheEntry: jest.fn(),
      updateHistoryCache: jest.fn(() => Promise.resolve()),
      addDubbingLog: jest.fn(),
      getActiveDubItem: jest.fn(),
      updateStatus: window.updateStatus,
      showToast: window.showToast
    });

    if (typeof domReadyHandler === 'function') {
      await domReadyHandler(new Event('DOMContentLoaded'));
    }
  });

  afterEach(() => {
    if (restoreAddEventListener) {
      restoreAddEventListener.mockRestore();
    }
  });

  test('Callback während Reset speichert nicht und löst Promise auf', async () => {
    expect(typeof translateFinishedHandler).toBe('function');

    const projekt = { id: 'p1', name: 'Test', files: [] };
    const datei = { id: 'f1', enText: 'Hallo Welt' };
    projekt.files.push(datei);
    window.__testSetProjects([projekt]);

    window.resetGlobalState();
    window.__testSetProjects([projekt]);

    const pending = window.__testGetPendingTranslations();
    const jobId = 123;
    const promise = new Promise((resolve, reject) => {
      pending.set(jobId, { file: datei, resolve, reject, projectId: projekt.id });
    });
    const vorher = storageMock.setItem.mock.calls.filter(([key]) => key === 'hla_projects').length;

    translateFinishedHandler({ id: jobId, text: 'Fertige Übersetzung', error: null });

    await expect(promise).resolves.toBe('Fertige Übersetzung');

    const nachher = storageMock.setItem.mock.calls.filter(([key]) => key === 'hla_projects').length;
    expect(nachher).toBe(vorher);
    expect(datei.autoTranslation).toBeUndefined();

    const delayed = window.__testGetDelayedTranslations();
    expect(delayed.size).toBe(1);
    const queued = Array.from(delayed.values())[0];
    expect(queued.projectId).toBe(String(projekt.id));
    expect(queued.fileId).toBe(String(datei.id));
    expect(queued.autoTranslation).toBe('Fertige Übersetzung');

    window.__testSetProjects([projekt]);
    const applied = window.applyDelayedTranslations();
    expect(applied).toBe(true);
    expect(window.__testGetDelayedTranslations().size).toBe(0);
    expect(projekt.files[0].autoTranslation).toBe('Fertige Übersetzung');
  });
});
