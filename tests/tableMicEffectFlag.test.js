const { expect, test } = require('@jest/globals');

// Einfacher Mock: simuliert das Speichern mit Telefon-auf-Tisch-Effekt
function applyDeEditMock(file, tableEffect, room) {
    file.tableMicEffect = tableEffect;
    file.tableMicRoom = room;
}

test('tableMicEffect und Raumtyp werden gespeichert', () => {
    const file = { tableMicEffect: false, tableMicRoom: 'wohnzimmer' };
    applyDeEditMock(file, true, 'halle');
    expect(file.tableMicEffect).toBe(true);
    expect(file.tableMicRoom).toBe('halle');
});
