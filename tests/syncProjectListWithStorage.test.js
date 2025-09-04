/** @jest-environment jsdom */
// Prüft, ob fehlende Projekte beim Start automatisch in die Liste aufgenommen werden
const fs = require('fs');
const path = require('path');

test('syncProjectListWithStorage ergänzt fehlende Einträge', async () => {
  const adapter = {
    store: {
      'project:7:meta': '{}',
      'project:7:index': '[]'
    },
    async getItem(k) { return this.store[k]; },
    async setItem(k, v) { this.store[k] = v; },
    async keys() { return Object.keys(this.store); }
  };
  window.projects = [];
  const helperCode = fs.readFileSync(path.join(__dirname, '../web/src/projectHelpers.js'), 'utf8');
  eval(helperCode);
  await window.syncProjectListWithStorage(adapter);
  const list = JSON.parse(adapter.store['hla_projects']);
  expect(list.some(p => String(p.id) === '7')).toBe(true);
});
