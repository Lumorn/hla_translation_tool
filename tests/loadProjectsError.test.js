/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

test('loadProjects zeigt Fehlerdialog bei Speicherproblemen', async () => {
    const code = fs.readFileSync(path.join(__dirname, '../web/src/main.js'), 'utf8');
    const start = code.indexOf('async function loadProjects');
    const end = code.indexOf('// =========================== LOAD PROJECTS END ===========================', start);
    eval(code.slice(start, end));

    window.storage = {
        getItem: async () => { throw new Error('kaputt'); }
    };
    window.electronAPI = { showProjectError: jest.fn() };
    window.renderProjects = jest.fn();
    window.updateGlobalProjectProgress = jest.fn();
    window.selectProject = jest.fn();
    window.saveProjects = jest.fn();

    window.projects = [{ id: 1 }];
    window.levelColors = {};
    window.levelOrders = {};
    window.levelIcons = {};
    window.levelColorHistory = [];
    window.textDatabase = {};
    window.filePathDatabase = {};

    await loadProjects();

    expect(window.electronAPI.showProjectError).toHaveBeenCalled();
    expect(window.projects).toEqual([]);
    expect(window.renderProjects).toHaveBeenCalled();
});
