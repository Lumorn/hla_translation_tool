global.window = {};
require('../web/src/projectSwitch.js');

const { repairProjectIntegrity } = window;

test('repairProjectIntegrity verschiebt verwaiste Vorschläge und speichert', async () => {
  // Dummy Projekt mit einem verwaisten Vorschlag
  global.projects = [{
    id: '1',
    files: [],
    suggestions: [{ id: 's1', fileId: 'x', createdAt: '', payload: {} }],
    meta: { quarantine: { orphanSuggestions: [] } }
  }];

  // Fake-Speicheradapter
  const adapter = { setItem: jest.fn() };

  // Stub für repairOrphans, der einen Eintrag in die Quarantäne verschiebt
  window.repairOrphans = (project, saveFn) => {
    const orphan = project.suggestions[0];
    project.suggestions = [];
    project.meta.quarantine.orphanSuggestions.push({ suggestion: orphan, reason: 'missing-file', detectedAt: 'now' });
    saveFn(project);
    return { movedCount: 1 };
  };

  let infoText = '';
  const ui = { info: msg => { infoText = msg; } };

  await repairProjectIntegrity(adapter, '1', ui);

  expect(adapter.setItem).toHaveBeenCalled();
  expect(infoText).toMatch(/1 verwaiste Vorschläge/);
  expect(projects[0].meta.quarantine.orphanSuggestions).toHaveLength(1);
});
