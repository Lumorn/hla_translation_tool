const { expect, test } = require('@jest/globals');
// Prüft die Aufteilung großer Mengen fehlender Dateien in einzelne Projekte

let projects = [];
const filePathDatabase = {};
const textDatabase = {};

function getLevelIcon() { return '📁'; }
function getLevelColor() { return '#fff'; }
function saveProjects() {}
function renderProjects() {}
function updateStatus() {}
function ensureOffeneStruktur() {}
function getGlobalCompletionStatus() { return { completionMap: new Map() }; }

function buildProjectFile(filename, folder) {
    return { id: Date.now() + Math.random(), filename, folder };
}

function createProjectWithMissingFiles(folderName) {
    const MAX_FILES = 50;
    const { completionMap } = getGlobalCompletionStatus();
    const all = [];
    Object.entries(filePathDatabase).forEach(([fn, paths]) => {
        paths.forEach(p => {
            if (p.folder !== folderName) return;
            const key = `${p.folder}/${fn}`;
            if (!completionMap.has(key)) {
                all.push({ filename: fn, folder: p.folder });
            }
        });
    });
    if (all.length === 0) return;
    all.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' }));
    const levelName = folderName;
    const existing = projects.find(p => p.levelName === levelName && p.name === folderName);
    if (existing) {
        const existingKeys = new Set(existing.files.map(f => `${f.folder}/${f.filename}`));
        const toAdd = all.filter(f => !existingKeys.has(`${f.folder}/${f.filename}`));
        if (toAdd.length === 0) return;
        ensureOffeneStruktur(levelName);
        const maxAdd = Math.max(0, MAX_FILES - existing.files.length);
        const firstChunk = toAdd.splice(0, maxAdd);
        firstChunk.forEach(f => existing.files.push(buildProjectFile(f.filename, f.folder)));
        let nextPart = Math.max(...projects.filter(p => p.levelName === levelName).map(p => p.levelPart));
        while (toAdd.length > 0) {
            const chunk = toAdd.splice(0, MAX_FILES);
            const prj = {
                id: Date.now() + Math.random(),
                name: folderName,
                levelName,
                levelPart: ++nextPart,
                files: chunk.map(f => buildProjectFile(f.filename, f.folder)),
                icon: getLevelIcon(levelName),
                color: getLevelColor(levelName)
            };
            projects.push(prj);
        }
        return;
    }
    ensureOffeneStruktur(levelName);
    const total = all.length;
    const chunks = [];
    for (let i = 0; i < total; i += MAX_FILES) {
        chunks.push(all.slice(i, i + MAX_FILES));
    }
    let nextPart = Math.max(0, ...projects.filter(p => p.levelName === levelName).map(p => p.levelPart));
    chunks.forEach((chunk, idx) => {
        const prj = {
            id: Date.now() + idx,
            name: folderName,
            levelName,
            levelPart: nextPart + idx + 1,
            files: chunk.map(f => buildProjectFile(f.filename, f.folder)),
            icon: getLevelIcon(levelName),
            color: getLevelColor(levelName)
        };
        projects.push(prj);
    });
}

test('legt mehrere Projekte an wenn mehr als 50 Dateien fehlen', () => {
    projects = [];
    for (const key of Object.keys(filePathDatabase)) delete filePathDatabase[key];
    for (let i = 1; i <= 60; i++) {
        filePathDatabase[`file${i}.wav`] = [{ folder: 'foo' }];
    }
    createProjectWithMissingFiles('foo');
    expect(projects.length).toBe(2);
    expect(projects[0].files.length).toBe(50);
    expect(projects[1].files.length).toBe(10);
});

test('teilt bestehendes Projekt bei Überschreitung der Grenze auf', () => {
    projects = [{ id: 1, name: 'foo', levelName: 'foo', levelPart: 1, files: [] }];
    for (const key of Object.keys(filePathDatabase)) delete filePathDatabase[key];
    for (let i = 1; i <= 45; i++) {
        projects[0].files.push(buildProjectFile(`file${i}.wav`, 'foo'));
        filePathDatabase[`file${i}.wav`] = [{ folder: 'foo' }];
    }
    for (let i = 46; i <= 55; i++) {
        filePathDatabase[`file${i}.wav`] = [{ folder: 'foo' }];
    }
    createProjectWithMissingFiles('foo');
    expect(projects.length).toBe(2);
    expect(projects[0].files.length).toBe(50);
    expect(projects[1].files.length).toBe(5);
    expect(projects[1].levelPart).toBe(2);
});
