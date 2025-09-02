const { repairOrphans } = require('../utils/repairOrphans');

// Dieser Test stellt sicher, dass verwaiste Vorschläge erkannt und korrekt verschoben werden.
test('verwaiste Vorschläge landen in der Quarantäne', () => {
  const project = {
    files: [
      { id: '1' },
      { id: '2' }
    ],
    suggestions: [
      { id: 'a', fileId: '1', createdAt: '2024-01-01T00:00:00Z', payload: {} },
      { id: 'b', fileId: '999', createdAt: '2024-01-01T00:00:00Z', payload: {} },
      { id: 'c', fileId: '2', createdAt: '2024-01-01T00:00:00Z', payload: {} }
    ],
    meta: {}
  };

  let saved = false;
  const { movedCount } = repairOrphans(project, () => { saved = true; });

  expect(movedCount).toBe(1);
  expect(saved).toBe(true);
  expect(project.suggestions.length).toBe(2);
  expect(project.meta.quarantine.orphanSuggestions.length).toBe(1);
  expect(project.meta.quarantine.orphanSuggestions[0].suggestion.id).toBe('b');
});
