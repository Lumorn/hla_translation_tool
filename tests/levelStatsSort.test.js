const { expect, test } = require('@jest/globals');

// Beispiel-Level mit zufälliger Reihenfolge
const map = {
    'Gamma': { total: 1, complete: 0, parts: new Set() },
    'Alpha': { total: 1, complete: 0, parts: new Set() },
    'Beta':  { total: 1, complete: 0, parts: new Set() }
};

const levelOrders = { 'Alpha': 1, 'Beta': 2, 'Gamma': 3 };

function getLevelOrder(name) {
    return levelOrders[name] || 9999;
}

function sortRows(map) {
    return Object.entries(map)
        .sort((a, b) => getLevelOrder(a[0]) - getLevelOrder(b[0]))
        .map(([name]) => name);
}

test('Level-Statistiken werden nach Nummer sortiert', () => {
    expect(sortRows(map)).toEqual(['Alpha', 'Beta', 'Gamma']);
});
