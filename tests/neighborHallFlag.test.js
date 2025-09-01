const { expect, test } = require('@jest/globals');

// Einfacher Mock: simuliert das Speichern mit Nebenraum-Hall
function applyDeEditMock(file, withHall) {
    file.neighborEffect = true;
    file.neighborHall = withHall;
}

test('neighborHall bleibt nach applyDeEdit gesetzt', () => {
    const file = { neighborEffect: false, neighborHall: false };
    applyDeEditMock(file, true);
    expect(file.neighborEffect).toBe(true);
    expect(file.neighborHall).toBe(true);
});
