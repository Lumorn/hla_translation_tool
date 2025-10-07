/** @jest-environment jsdom */
// Testet, ob beim Projektwechsel der GPT-Zustand geleert wird
const fs = require('fs');
const path = require('path');
const { setupProjectLoadingOverlay } = require('./testHelpers');

test('switchProjectSafe setzt gptEvaluationResults auf null', async () => {
    // Overlay für den Ladebalken bereitstellen
    setupProjectLoadingOverlay();

    // GPT-Zustand und Reset-Funktion simulieren
    gptEvaluationResults = { score: 99 };
    function clearGptState() { gptEvaluationResults = null; }
    window.clearGptState = jest.fn(clearGptState);
    const spy = window.clearGptState;

    // Benötigte Helferfunktionen für switchProjectSafe mocken
    window.pauseAutosave = jest.fn(async () => {});
    window.flushPendingWrites = jest.fn(async () => {});
    window.detachAllEventListeners = jest.fn();
    window.clearInMemoryCachesHard = jest.fn();
    window.closeProjectData = jest.fn(async () => {});
    window.loadProjectData = jest.fn(async () => {});
    window.getStorageAdapter = jest.fn(() => ({}));
    window.repairProjectIntegrity = jest.fn(async () => {});
    window.resumeAutosave = jest.fn(async () => {});
    window.cancelGptRequests = jest.fn();
    window.reloadProjectList = jest.fn(async () => {});
    window.scanEnOrdner = jest.fn(async () => {});
    window.updateAllProjectsAfterScan = jest.fn();
    window.updateFileAccessStatus = jest.fn();

    // switchProjectSafe aus projectSwitch.js laden
    const psCode = fs.readFileSync(path.join(__dirname, '../web/src/projectSwitch.js'), 'utf8');
    eval(psCode);

    await window.switchProjectSafe('p1');

    expect(spy).toHaveBeenCalled();
    expect(gptEvaluationResults).toBeNull();
});
