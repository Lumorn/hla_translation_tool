/** @jest-environment jsdom */
// Stellt sicher, dass switchProjectSafe nicht mehr drei Sekunden wartet, wenn keine Schreibpromises offen sind
const fs = require('fs');
const path = require('path');
const { setupProjectLoadingOverlay } = require('./testHelpers');

test('switchProjectSafe kehrt ohne Timeout zurück, wenn keine Schreibpromises offen sind', async () => {
  jest.useFakeTimers();
  setupProjectLoadingOverlay();

  const registryCode = fs
    .readFileSync(path.join(__dirname, '../web/src/utils/listenerRegistry.js'), 'utf8')
    .replace('export function resetRegisteredListeners', 'function resetRegisteredListeners');
  eval(registryCode);

  const testButton = document.createElement('button');
  testButton.id = 'dummyListenerButton';
  document.body.appendChild(testButton);
  const initialListener = jest.fn();
  testButton.addEventListener('click', initialListener);

  // Projekt-Helfer laden, damit flushPendingWrites mit Tracking bereitsteht
  window.waitForPendingWrites = jest.fn(() => Promise.resolve());
  const helperCode = fs.readFileSync(path.join(__dirname, '../web/src/projectHelpers.js'), 'utf8');
  eval(helperCode);

  const spiegleAufGlobal = (name) => {
    const wert = window[name];
    global[name] = wert;
    globalThis[name] = wert;
    eval(`${name} = window.${name};`);
  };

  const originalFlush = window.flushPendingWrites;
  const flushSpy = jest.spyOn(window, 'flushPendingWrites');
  flushSpy.mockImplementation((ms) => originalFlush(ms));
  spiegleAufGlobal('flushPendingWrites');
  expect(flushPendingWrites).toBe(window.flushPendingWrites);

  window.pauseAutosave = jest.fn(async () => {});
  spiegleAufGlobal('pauseAutosave');
  spiegleAufGlobal('detachAllEventListeners');
  window.clearInMemoryCachesHard = jest.fn();
  spiegleAufGlobal('clearInMemoryCachesHard');
  window.closeProjectData = jest.fn(async () => {});
  spiegleAufGlobal('closeProjectData');
  const metaStore = {};
  window.getStorageAdapter = jest.fn(() => ({
    capabilities: { atomicWrite: true },
    runTransaction: jest.fn(async () => {}),
    getItem: jest.fn(async key => metaStore[key] || null),
    setItem: jest.fn(async (key, value) => { metaStore[key] = value; })
  }));
  spiegleAufGlobal('getStorageAdapter');
  window.repairProjectIntegrity = jest.fn(async () => {});
  spiegleAufGlobal('repairProjectIntegrity');
  window.resumeAutosave = jest.fn(async () => {});
  spiegleAufGlobal('resumeAutosave');
  window.cancelGptRequests = jest.fn();
  window.clearGptState = jest.fn();
  window.loadProjectData = jest.fn(async () => {});
  window.scanEnOrdner = jest.fn(async () => {});
  window.scanDeOrdner = jest.fn(async () => {});
  window.verarbeiteGescannteDateien = jest.fn(async () => {});
  window.updateAllProjectsAfterScan = jest.fn();
  window.updateFileAccessStatus = jest.fn();
  window.reloadProjectList = jest.fn(async () => {});
  window.setDeAudioCacheEntry = jest.fn();
  window.repairFileExtensions = jest.fn(() => 0);
  window.debugLog = jest.fn();
  window.getFolderScanSignature = jest.fn(() => 'sig-1');
  window.folderScanState = {
    running: false,
    reason: '',
    activeCalls: 0,
    waiters: [],
    start: jest.fn(reason => {
      const state = window.folderScanState;
      state.running = true;
      state.reason = reason;
      state.activeCalls += 1;
      return () => {
        state.activeCalls = Math.max(0, state.activeCalls - 1);
        if (state.activeCalls === 0) {
          state.running = false;
          state.reason = '';
          const listeners = state.waiters.splice(0);
          listeners.forEach(resolve => resolve());
        }
      };
    }),
    wait: jest.fn(() => window.folderScanState.running
      ? new Promise(resolve => window.folderScanState.waiters.push(resolve))
      : Promise.resolve())
  };
  spiegleAufGlobal('cancelGptRequests');
  spiegleAufGlobal('clearGptState');
  spiegleAufGlobal('loadProjectData');
  spiegleAufGlobal('scanEnOrdner');
  spiegleAufGlobal('scanDeOrdner');
  spiegleAufGlobal('verarbeiteGescannteDateien');
  spiegleAufGlobal('updateAllProjectsAfterScan');
  spiegleAufGlobal('updateFileAccessStatus');
  spiegleAufGlobal('reloadProjectList');
  window.projects = [{ id: 'p1', lastScanSignature: 'sig-1' }];
  window.currentProject = { id: 'p1', lastScanSignature: 'sig-1' };
  window.selectProject = jest.fn();
  spiegleAufGlobal('selectProject');

  const psCode = fs.readFileSync(path.join(__dirname, '../web/src/projectSwitch.js'), 'utf8');
  eval(psCode);

  await window.scheduleFolderScan.waitForIdle();

  await expect(window.switchProjectSafe('p1')).resolves.toBeUndefined();

  expect(flushSpy).toHaveBeenCalledWith(3000);
  expect(window.waitForPendingWrites).toHaveBeenCalled();

  const neuerListener = jest.fn();
  testButton.addEventListener('click', neuerListener);
  testButton.dispatchEvent(new Event('click'));
  expect(initialListener).not.toHaveBeenCalled();
  expect(neuerListener).toHaveBeenCalledTimes(1);

  flushSpy.mockRestore();
  jest.useRealTimers();
});
