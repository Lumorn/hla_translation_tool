const { expect, test } = require('@jest/globals');

// Beispielprojekte mit unsortierten Levelnamen
let projects = [
    { levelName: 'Gamma' },
    { levelName: 'Alpha' },
    { levelName: 'Beta' }
];

// Zuordnung der Level zu ihren Nummern
let levelOrders = { 'Alpha': 1, 'Beta': 2, 'Gamma': 3 };

function getLevelOrder(name) {
    return levelOrders[name] || 9999;
}

// Erzeugt die Level-Liste wie im Projekt-Dialog
function getKnownLevels() {
    return [...new Set(projects.map(p => p.levelName).filter(Boolean))]
        .sort((a, b) => getLevelOrder(a) - getLevelOrder(b));
}

test('Level-Dropdown sortiert nach Nummer', () => {
    expect(getKnownLevels()).toEqual(['Alpha', 'Beta', 'Gamma']);
});
