const { expect, test } = require('@jest/globals');

let projects = [
    { id: 1, name: 'Neu 1', levelName: 'Testlevel', levelPart: 1, files: [], icon: '🗂️', color: '#fff', restTranslation: false },
    { id: 2, name: 'Neu 2', levelName: 'Testlevel', levelPart: 2, files: [], icon: '🗂️', color: '#fff', restTranslation: false }
];

function getLevelColor() { return '#fff'; }
function saveProjects() {}
function renderProjects() {}

function quickAddProject(levelName) {
    // Alle vergebenen Nummern der "Neu"-Projekte global sammeln
    const usedNums = new Set();
    projects.forEach(p => {
        const m = p.name.match(/^Neu (\d+)$/);
        if (m) usedNums.add(parseInt(m[1]));
    });

    // Kleinste noch freie Projektnummer ermitteln
    let nextNum = 1;
    while (usedNums.has(nextNum)) {
        nextNum++;
    }

    // Nächste freie Teil-Nummer für dieses Level bestimmen
    const nextPart = Math.max(0, ...projects
        .filter(p => p.levelName === levelName)
        .map(p => p.levelPart)) + 1;

    const prj = {
        id: Date.now(),
        name: `Neu ${nextNum}`,
        levelName,
        levelPart: nextPart,
        files: [],
        icon: '🗂️',
        color: getLevelColor(levelName),
        restTranslation: false
    };

    projects.push(prj);
    saveProjects();
    renderProjects();
}

test('quickAddProject vergibt aufsteigende Teil-Nummern', () => {
    quickAddProject('Testlevel');
    expect(projects[projects.length - 1].levelPart).toBe(3);
    quickAddProject('Testlevel');
    expect(projects[projects.length - 1].levelPart).toBe(4);
});
