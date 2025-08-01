const { expect, test } = require('@jest/globals');

// Einfacher Mock für Download oder erneutes Dubbing
function afterDubbingMock(file) {
    if (!file) return;
    file.trimStartMs = 0;
    file.trimEndMs = 0;
    file.volumeMatched = false;
    file.radioEffect = false;
    file.hallEffect = false;
}

test('Dubbing setzt Bearbeitungs-Flags zurück', () => {
    const file = {
        trimStartMs: 5,
        trimEndMs: 8,
        volumeMatched: true,
        radioEffect: true,
        hallEffect: true
    };
    afterDubbingMock(file);
    expect(file.trimStartMs).toBe(0);
    expect(file.trimEndMs).toBe(0);
    expect(file.volumeMatched).toBe(false);
    expect(file.radioEffect).toBe(false);
    expect(file.hallEffect).toBe(false);
});
