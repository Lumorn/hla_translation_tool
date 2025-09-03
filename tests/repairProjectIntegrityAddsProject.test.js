/** @jest-environment jsdom */
// Prüft, ob fehlende Projekte der Liste hinzugefügt werden
const fs = require('fs');
const path = require('path');

test('repairProjectIntegrity ergänzt Projekt in Liste', async () => {
  const adapter = {
    store: {},
    async getItem(k) { return this.store[k]; },
    async setItem(k, v) { this.store[k] = v; }
  };
  const ui = { warn: jest.fn(), info: jest.fn() };
  const helperCode = fs.readFileSync(path.join(__dirname, '../web/src/projectHelpers.js'), 'utf8');
  eval(helperCode);
  const changed = await window.repairProjectIntegrity(adapter, '42', ui);
  expect(changed).toBe(true);
  const list = JSON.parse(adapter.store['hla_projects']);
  expect(list.some(p => String(p.id) === '42')).toBe(true);
});
