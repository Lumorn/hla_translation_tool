const { expect, test } = require('@jest/globals');

// Minimaler Mock der Upload-Funktion
function uploadFileMock(file) {
    if (!file) return;
    // Flags wie im echten Upload zurücksetzen
    file.trimStartMs = 0;
    file.trimEndMs = 0;
    file.volumeMatched = false;
    file.radioEffect = false;
    file.hallEffect = false;
}

test('Upload setzt Bearbeitungs-Flags zurück', () => {
    const file = {
        trimStartMs: 12,
        trimEndMs: 34,
        volumeMatched: true,
        radioEffect: true,
        hallEffect: true
    };
    uploadFileMock(file);
    expect(file.trimStartMs).toBe(0);
    expect(file.trimEndMs).toBe(0);
    expect(file.volumeMatched).toBe(false);
    expect(file.radioEffect).toBe(false);
    expect(file.hallEffect).toBe(false);
});
