const { expect, test } = require('@jest/globals');

function importSegmentsMock(file) {
    if (!file) return;
    file.trimStartMs = 0;
    file.trimEndMs = 0;
    file.volumeMatched = false;
    file.radioEffect = false;
    file.hallEffect = false;
    file.emiEffect = false;
}

test('Segment-Import setzt Bearbeitungs-Flags zurück', () => {
    const file = {
        trimStartMs: 5,
        trimEndMs: 9,
        volumeMatched: true,
        radioEffect: true,
        hallEffect: true,
        emiEffect: true
    };
    importSegmentsMock(file);
    expect(file.trimStartMs).toBe(0);
    expect(file.trimEndMs).toBe(0);
    expect(file.volumeMatched).toBe(false);
    expect(file.radioEffect).toBe(false);
    expect(file.hallEffect).toBe(false);
    expect(file.emiEffect).toBe(false);
});
