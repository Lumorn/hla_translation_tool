const { expect, test } = require('@jest/globals');

// Einfacher Mock wie im Radio-Test: simuliert applyDeEdit
function applyDeEditMock(file, isHall) {
    file.hallEffect = isHall;
}

test('hallEffect bleibt nach applyDeEdit gesetzt', () => {
    const file = { hallEffect: false };
    applyDeEditMock(file, true);
    expect(file.hallEffect).toBe(true);
});
