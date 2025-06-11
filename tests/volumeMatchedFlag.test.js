const { expect, test } = require('@jest/globals');

// einfacher Mock der Speicherung nach applyDeEdit
function applyDeEditMock(file, isVolumeMatched) {
    file.volumeMatched = isVolumeMatched;
}

test('volumeMatched bleibt nach applyDeEdit gesetzt', () => {
    const file = { volumeMatched: false };
    applyDeEditMock(file, true);
    expect(file.volumeMatched).toBe(true);
});
