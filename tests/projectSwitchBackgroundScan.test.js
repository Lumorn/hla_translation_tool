/** @jest-environment jsdom */
// Prüft das Hintergrund-Scanning nach Projektwechseln
const fs = require('fs');
const path = require('path');
const { setupProjectLoadingOverlay } = require('./testHelpers');

function ladeListenerRegistry() {
  const registryCode = fs
    .readFileSync(path.join(__dirname, '../web/src/utils/listenerRegistry.js'), 'utf8')
    .replace('export function resetRegisteredListeners', 'function resetRegisteredListeners');
  eval(registryCode);
}

function ladeProjektHilfen() {
  const helperCode = fs.readFileSync(path.join(__dirname, '../web/src/projectHelpers.js'), 'utf8');
  eval(helperCode);
}

function bereiteGemeinsameUmgebung({ aktuelleSignatur, gespeicherteSignatur }) {
  setupProjectLoadingOverlay();
  ladeListenerRegistry();
  window.waitForPendingWrites = jest.fn(() => Promise.resolve());
  ladeProjektHilfen();

  window.pauseAutosave = jest.fn(async () => {});
  window.detachAllEventListeners = jest.fn();
  window.clearInMemoryCachesHard = jest.fn();
  window.closeProjectData = jest.fn(async () => {});
  const metaStore = {};
  window.getStorageAdapter = jest.fn(() => ({
    capabilities: { atomicWrite: true },
    runTransaction: jest.fn(async () => {}),
    getItem: jest.fn(async key => metaStore[key] || null),
    setItem: jest.fn(async (key, value) => { metaStore[key] = value; })
  }));
  window.repairProjectIntegrity = jest.fn(async () => {});
  window.resumeAutosave = jest.fn(async () => {});
  window.cancelGptRequests = jest.fn();
  window.clearGptState = jest.fn();
  window.loadProjectData = jest.fn(async () => {});
  const scanEn = jest.fn(async () => {});
  const scanDe = jest.fn(async () => {});
  const processEn = jest.fn(async () => {});
  window.scanEnOrdner = scanEn;
  window.scanDeOrdner = scanDe;
  window.verarbeiteGescannteDateien = processEn;
  window.updateAllProjectsAfterScan = jest.fn();
  window.updateFileAccessStatus = jest.fn();
  window.reloadProjectList = jest.fn(async () => {});
  window.setDeAudioCacheEntry = jest.fn();
  window.repairFileExtensions = jest.fn(() => 0);
  window.debugLog = jest.fn();
  window.getFolderScanSignature = jest.fn(() => aktuelleSignatur);
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
          const waiter = state.waiters.splice(0);
          waiter.forEach(resolve => resolve());
        }
      };
    }),
    wait: jest.fn(() => window.folderScanState.running
      ? new Promise(resolve => window.folderScanState.waiters.push(resolve))
      : Promise.resolve())
  };
  window.projects = [{ id: 'p1', lastScanSignature: gespeicherteSignatur }];
  window.currentProject = { id: 'p1', lastScanSignature: gespeicherteSignatur };
  window.selectProject = jest.fn();

  const psCode = fs.readFileSync(path.join(__dirname, '../web/src/projectSwitch.js'), 'utf8');
  eval(psCode);

  return { metaStore, scanEn, scanDe, processEn };
}

test('switchProjectSafe überspringt Hintergrundscan bei identischer Signatur', async () => {
  const { scanEn, scanDe, processEn } = bereiteGemeinsameUmgebung({
    aktuelleSignatur: 'sig-1',
    gespeicherteSignatur: 'sig-1'
  });

  await window.scheduleFolderScan.waitForIdle();
  await window.switchProjectSafe('p1');
  await window.scheduleFolderScan.waitForIdle();

  expect(scanEn).not.toHaveBeenCalled();
  expect(scanDe).not.toHaveBeenCalled();
  expect(processEn).not.toHaveBeenCalled();
});

test('switchProjectSafe startet Hintergrundscan bei geänderter Signatur', async () => {
  const { metaStore, scanEn, scanDe, processEn } = bereiteGemeinsameUmgebung({
    aktuelleSignatur: 'sig-2',
    gespeicherteSignatur: 'sig-1'
  });

  await window.scheduleFolderScan.waitForIdle();
  await window.switchProjectSafe('p1');
  await window.scheduleFolderScan.waitForIdle();

  expect(scanEn).toHaveBeenCalled();
  expect(scanDe).toHaveBeenCalled();
  expect(processEn).not.toHaveBeenCalled();
  expect(window.projects[0].lastScanSignature).toBe('sig-2');
  const metaRaw = metaStore['project:p1:meta'];
  expect(metaRaw).toBeTruthy();
  expect(JSON.parse(metaRaw).lastScanSignature).toBe('sig-2');
});
