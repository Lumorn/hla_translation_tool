const { moveSuggestionsToQuarantine } = require('../utils/repairOrphans');

// Dieser Test prüft die Kaskadenbehandlung beim Löschen einer Datei.
test('verschobene Vorschläge landen in der Quarantäne', () => {
  const projekt = {
    suggestions: [
      { id: 'a', fileId: '1', createdAt: '', payload: {} },
      { id: 'b', fileId: '2', createdAt: '', payload: {} }
    ],
    meta: {}
  };
  const zuLoeschende = [projekt.suggestions[0]];
  moveSuggestionsToQuarantine(projekt, zuLoeschende, 'missing-file');
  expect(projekt.suggestions.length).toBe(1);
  expect(projekt.meta.quarantine.orphanSuggestions).toHaveLength(1);
  expect(projekt.meta.quarantine.orphanSuggestions[0].suggestion.id).toBe('a');
  expect(projekt.meta.quarantine.orphanSuggestions[0].reason).toBe('missing-file');
});
