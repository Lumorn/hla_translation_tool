/** @jest-environment jsdom */
// Prüft, ob selectProject die Projektliste nach einem Wechsel zentriert
const fs = require('fs');
const path = require('path');

test('selectProject zentriert die Projektliste auf den aktiven Eintrag', () => {
    // Einfaches DOM mit zwei Projekten vorbereiten
    document.body.innerHTML = `
        <ul id="projectList">
            <li class="project-item" data-project-id="1"></li>
            <li class="project-item" data-project-id="2"></li>
        </ul>
    `;
    const items = Array.from(document.querySelectorAll('.project-item'));
    // scrollIntoView mocken, um Aufrufe zu prüfen
    items.forEach(el => { el.scrollIntoView = jest.fn(); });

    // Benötigte globale Helfer und Daten bereitstellen
    global.projects = [
        { id: '1', levelName: 'A', files: [] },
        { id: '2', levelName: 'B', files: [] }
    ];
    global.stopProjectPlayback = jest.fn();
    global.saveCurrentProject = jest.fn();
    global.storeSegmentState = jest.fn();
    global.clearGptState = jest.fn();
    global.getLevelChapter = () => 'Kapitel';
    global.renderProjects = jest.fn();
    global.showToast = jest.fn();
    global.storage = { setItem: jest.fn(), getItem: jest.fn(() => '1') };
    global.window = global;
    global.acquireProjectLock = jest.fn(() => Promise.resolve({ release: jest.fn(), readOnly: false }));
    global.currentProjectLock = null;
    global.autoRetryDone = false;

    // selectProject-Funktion aus main.js extrahieren und ausführen
    const code = fs.readFileSync(path.join(__dirname, '../web/src/main.js'), 'utf8');
    const start = code.indexOf('function selectProject');
    const end = code.indexOf('files = currentProject.files', start);
    const fnCode = code.slice(start, end) + '}';
    eval(fnCode); // definiert eine verkürzte Version von selectProject

    // Projekt 2 auswählen und Scroll-Aufruf überprüfen
    selectProject('2');
    expect(items[1].scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ block: 'center' }));
});

