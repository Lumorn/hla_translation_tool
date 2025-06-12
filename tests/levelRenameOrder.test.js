const { expect, test } = require('@jest/globals');

// Globale Datenstrukturen wie im Tool
let projects = [{ levelName: 'Alt', color: '#ffffff' }];
let levelOrders = { 'Alt': 1 };
let levelColors = { 'Alt': '#ffffff' };

function setLevelOrder(levelName, order) {
    levelOrders[levelName] = order;
    // Speichern simulieren
}

test('Level umbenennen speichert Reihenfolge', () => {
    const oldName = 'Alt';
    const newName = 'Neu';
    const newOrder = 5;
    const newColor = '#00ff00';

    // Umbenennen wie in showLevelCustomization
    projects.forEach(p => {
        if (p.levelName === oldName) {
            p.levelName = newName;
            p.color = newColor;
        }
    });
    if (levelColors[oldName] && oldName !== newName) delete levelColors[oldName];
    if (levelOrders[oldName] && oldName !== newName) delete levelOrders[oldName];

    levelColors[newName] = newColor;
    levelOrders[newName] = newOrder;
    setLevelOrder(newName, newOrder);

    expect(levelOrders[newName]).toBe(newOrder);
    expect(levelOrders[oldName]).toBeUndefined();
});
