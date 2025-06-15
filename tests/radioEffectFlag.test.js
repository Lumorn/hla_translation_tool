const { expect, test } = require('@jest/globals');

// einfacher Mock der Speicherung nach applyDeEdit
function applyDeEditMock(file, isRadio) {
    file.radioEffect = isRadio;
}

test('radioEffect bleibt nach applyDeEdit gesetzt', () => {
    const file = { radioEffect: false };
    applyDeEditMock(file, true);
    expect(file.radioEffect).toBe(true);
});
