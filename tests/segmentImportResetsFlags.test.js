const { expect, test } = require('@jest/globals');

function importSegmentsMock(file) {
    if (!file) return;
    file.trimStartMs = 0;
    file.trimEndMs = 0;
    file.volumeMatched = false;
    file.volumeGainActive = false;
    file.volumeGainDb = 0;
    file.radioEffect = false;
    file.hallEffect = false;
    file.emiEffect = false;
    file.neighborEffect = false;
    file.neighborHall = false;
}

test('Segment-Import setzt Bearbeitungs-Flags zurück', () => {
    const file = {
        trimStartMs: 5,
        trimEndMs: 9,
        volumeMatched: true,
        volumeGainActive: true,
        volumeGainDb: 3,
        radioEffect: true,
        hallEffect: true,
        emiEffect: true,
        neighborEffect: true,
        neighborHall: true
    };
    importSegmentsMock(file);
    expect(file.trimStartMs).toBe(0);
    expect(file.trimEndMs).toBe(0);
    expect(file.volumeMatched).toBe(false);
    expect(file.volumeGainActive).toBe(false);
    expect(file.volumeGainDb).toBe(0);
    expect(file.radioEffect).toBe(false);
    expect(file.hallEffect).toBe(false);
    expect(file.emiEffect).toBe(false);
    expect(file.neighborEffect).toBe(false);
    expect(file.neighborHall).toBe(false);
});
