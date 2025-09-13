const { expect, test } = require('@jest/globals');

// Einfacher Mock: simuliert das Speichern mit Telefon-auf-Tisch-Effekt
function applyDeEditMock(file, tableEffect) {
    file.tableMicEffect = tableEffect;
}

test('tableMicEffect wird gespeichert', () => {
    const file = { tableMicEffect: false };
    applyDeEditMock(file, true);
    expect(file.tableMicEffect).toBe(true);
});
