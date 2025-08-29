const { validateProjectManifest } = require('../utils/projectSchema.js');

test('valide Manifestdaten werden akzeptiert', () => {
    const data = { schemaVersion: 1, name: 'Testprojekt' };
    expect(validateProjectManifest(data)).toEqual(data);
});

test('ungültige Daten lösen einen Fehler aus', () => {
    expect(() => validateProjectManifest({ name: 'Ohne Version' })).toThrow();
});
