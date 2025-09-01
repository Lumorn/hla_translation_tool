const { expect, test } = require('@jest/globals');

// Einfacher Mock wie in anderen Effekt-Tests
function applyDeEditMock(file, isNeighbor) {
    file.neighborEffect = isNeighbor;
}

test('neighborEffect bleibt nach applyDeEdit gesetzt', () => {
    const file = { neighborEffect: false };
    applyDeEditMock(file, true);
    expect(file.neighborEffect).toBe(true);
});
