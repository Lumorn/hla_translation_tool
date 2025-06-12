const { expect, test } = require('@jest/globals');

let projects = [
    { name: '5.Hallo', levelName: 'Hallo', levelPart: 1, color: '#fff' },
    { name: '5.Hallo', levelName: 'Hallo', levelPart: 2, color: '#fff' },
    { name: 'Anderes', levelName: 'Anderes', levelPart: 1, color: '#fff' }
];

let levelOrders = { 'Hallo': 5, 'Anderes': 1 };
let levelColors = { 'Hallo': '#fff', 'Anderes': '#fff' };

function setLevelOrder(levelName, order) {
    levelOrders[levelName] = order;
}

function renameLevel(oldName, newName, newOrder, newColor) {
    const oldOrder = levelOrders[oldName];
    const oldDisplayName = `${oldOrder}.${oldName}`;
    const newDisplayName = `${newOrder}.${newName}`;

    projects.forEach(p => {
        if (p.levelName === oldName) {
            if (p.name === oldName || p.name === oldDisplayName || p.name === `${oldOrder} ${oldName}`) {
                p.name = newDisplayName;
            }
            p.levelName = newName;
            p.color = newColor;
        }
    });
    if (levelColors[oldName] && oldName !== newName) delete levelColors[oldName];
    if (levelOrders[oldName] && oldName !== newName) delete levelOrders[oldName];
    levelColors[newName] = newColor;
    setLevelOrder(newName, newOrder);
}

test('rename level updates project names', () => {
    renameLevel('Hallo', 'Hallo2', 6, '#0f0');
    expect(projects[0].name).toBe('6.Hallo2');
    expect(projects[1].name).toBe('6.Hallo2');
    expect(projects[2].name).toBe('Anderes');
});
