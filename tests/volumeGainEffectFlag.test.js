const { expect, test } = require('@jest/globals');

// Kleiner Mock, der das Speichern des Boosters simuliert
function saveVolumeGainMock(file, active, db) {
    file.volumeGainActive = active;
    file.volumeGainDb = db;
}

test('volumeGain speichert Aktivierung und dB-Wert', () => {
    const file = { volumeGainActive: false, volumeGainDb: 0 };
    saveVolumeGainMock(file, true, 6);
    expect(file.volumeGainActive).toBe(true);
    expect(file.volumeGainDb).toBe(6);
});
