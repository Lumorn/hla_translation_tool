/** @jest-environment jsdom */
// Prüft, dass Reparaturen beide Projektlisten synchronisieren und die Auswahl funktioniert
const fs = require('fs');
const path = require('path');

jest.mock('../../elevenlabs', () => ({
  downloadDubbingAudio: jest.fn(),
  renderLanguage: jest.fn(),
  pollRender: jest.fn()
}), { virtual: true });
jest.mock('../../extensionUtils', () => ({
  repairFileExtensions: jest.fn()
}), { virtual: true });
jest.mock('../../closecaptionParser', () => ({
  loadClosecaptions: jest.fn()
}), { virtual: true });
jest.mock('./dubbing.js', () => ({
  initDubbing: jest.fn(),
  mountWaveTimeline: jest.fn(),
  renderWaveTimeline: jest.fn(),
  syncWaveTimelineControls: jest.fn()
}), { virtual: true });
jest.mock('./fileUtils.js', () => ({
  calculateTextSimilarity: jest.fn(),
  levenshteinDistance: jest.fn()
}), { virtual: true });
jest.mock('./pathUtils.js', () => ({
  extractRelevantFolder: jest.fn()
}), { virtual: true });
jest.mock('./calculateProjectStats.js', () => ({
  calculateProjectStats: jest.fn()
}), { virtual: true });
jest.mock('./actions/projectEvaluate.js', () => ({
  applyEvaluationResults: jest.fn()
}), { virtual: true });

test('repairProjectIntegrity synchronisiert Projekte und Auswahl', async () => {
  const mainCode = fs.readFileSync(path.join(__dirname, '../web/src/main.js'), 'utf8');
  eval(mainCode);
  const helperCode = fs.readFileSync(path.join(__dirname, '../web/src/projectHelpers.js'), 'utf8');
  eval(helperCode);
  eval('window.__getProjectsForTest = () => projects; window.__getCurrentProjectForTest = () => (typeof currentProject === "undefined" ? undefined : currentProject);');

  document.body.innerHTML = `
    <input id="restTranslationCheckbox" />
    <div id="projectMetaBar"></div>
    <span id="metaProjectName"></span>
    <span id="metaLevelName"></span>
    <span id="metaPartNumber"></span>
    <select id="mapSelect"></select>
    <div id="levelStatsContent"></div>
  `;

  // Abhängigkeiten werden durch harmlose Platzhalter ersetzt
  window.setRestMode = jest.fn();
  window.stopProjectPlayback = jest.fn();
  stopProjectPlayback = window.stopProjectPlayback;
  window.storeSegmentState = jest.fn();
  storeSegmentState = window.storeSegmentState;
  window.clearGptState = jest.fn();
  clearGptState = window.clearGptState;
  window.renderProjects = jest.fn();
  renderProjects = window.renderProjects;
  window.runTranslationQueue = jest.fn();
  runTranslationQueue = window.runTranslationQueue;
  window.renderFileTable = jest.fn();
  renderFileTable = window.renderFileTable;
  window.resizeTextFields = jest.fn();
  resizeTextFields = window.resizeTextFields;
  window.updateDubStatusForFiles = jest.fn();
  updateDubStatusForFiles = window.updateDubStatusForFiles;
  window.updateStatus = jest.fn();
  updateStatus = window.updateStatus;
  window.updateFileAccessStatus = jest.fn();
  updateFileAccessStatus = window.updateFileAccessStatus;
  window.updateProgressStats = jest.fn();
  updateProgressStats = window.updateProgressStats;
  window.updateGlobalProjectProgress = jest.fn();
  updateGlobalProjectProgress = window.updateGlobalProjectProgress;
  window.updateProjectMetaBar = jest.fn();
  updateProjectMetaBar = window.updateProjectMetaBar;
  window.updateTranslationQueueDisplay = jest.fn();
  updateTranslationQueueDisplay = window.updateTranslationQueueDisplay;
  window.refreshGlobalStatsAndGrids = jest.fn();
  refreshGlobalStatsAndGrids = window.refreshGlobalStatsAndGrids;
  window.showToast = jest.fn();
  window.getLevelChapter = jest.fn().mockReturnValue(null);
  window.getLevelOrder = jest.fn().mockReturnValue(0);
  window.getLevelColor = jest.fn().mockReturnValue('#fff');
  window.debugLog = jest.fn();
  window.acquireProjectLock = jest.fn().mockResolvedValue({ readOnly: false, release: jest.fn() });
  window.cancelTranslationQueue = jest.fn();

  const adapter = {
    store: {
      'project:77:meta': JSON.stringify({ id: '77' }),
      'project:77:index': '[]',
      hla_projects: JSON.stringify([])
    },
    async getItem(key) { return this.store[key]; },
    async setItem(key, value) { this.store[key] = value; }
  };

  const ui = { warn: jest.fn(), info: jest.fn() };

  window.replaceProjectList([]);
  expect(window.projects).toHaveLength(0);

  const changed = await window.repairProjectIntegrity(adapter, '77', ui);
  expect(changed).toBe(true);

  const internalProjects = window.__getProjectsForTest();
  expect(window.projects).toBe(internalProjects);

  const placeholder = window.projects.find(p => String(p.id) === '77');
  expect(placeholder).toBeDefined();
  expect(JSON.parse(adapter.store.hla_projects).some(p => String(p.id) === '77')).toBe(true);

  placeholder.files = [];
  selectProject('77');
  await Promise.resolve();

  expect(window.acquireProjectLock).toHaveBeenCalledWith('77');
  expect(window.storage.getItem('hla_lastActiveProject')).toBe('77');
  expect(window.renderProjects).toHaveBeenCalled();
});
