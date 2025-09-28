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
    global.saveProjects = window.saveProjects;

    const originalProjects = [{ id: 1, name: 'Alt' }];
    const originalLevelColors = { foo: '#fff' };
    const originalLevelOrders = { foo: ['bar'] };
    const originalLevelIcons = { foo: '🔧' };
    const originalLevelHistory = ['#fff'];

    window.projects = originalProjects;
    global.projects = window.projects;
    window.levelColors = originalLevelColors;
    global.levelColors = window.levelColors;
    window.levelOrders = originalLevelOrders;
    global.levelOrders = window.levelOrders;
    window.levelIcons = originalLevelIcons;
    global.levelIcons = window.levelIcons;
    window.levelColorHistory = originalLevelHistory;
    global.levelColorHistory = window.levelColorHistory;
    window.textDatabase = {};
    window.filePathDatabase = {};

    await loadProjects();

    expect(window.electronAPI.showProjectError).toHaveBeenCalled();
    expect(window.projects).toBe(originalProjects);
    expect(projects).toBe(originalProjects);
    expect(levelColors).toBe(originalLevelColors);
    expect(levelOrders).toBe(originalLevelOrders);
    expect(levelIcons).toBe(originalLevelIcons);
    expect(levelColorHistory).toBe(originalLevelHistory);
    expect(window.renderProjects).not.toHaveBeenCalled();
    expect(window.saveProjects).not.toHaveBeenCalled();
});
