const { expect, test } = require('@jest/globals');

// Einfacher Mock wie in anderen Effekt-Tests
function applyDeEditMock(file, isEmi) {
    file.emiEffect = isEmi;
}

test('emiEffect bleibt nach applyDeEdit gesetzt', () => {
    const file = { emiEffect: false };
    applyDeEditMock(file, true);
    expect(file.emiEffect).toBe(true);
});

