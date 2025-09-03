/** @jest-environment jsdom */
const fs = require('fs');
const path = require('path');

test('reloadProjectList ruft loadProjects ohne Autoauswahl auf', async () => {
  // loadProjects-Mock, der Parameter protokolliert
  window.loadProjects = jest.fn(async () => {});

  const helpersCode = fs.readFileSync(path.join(__dirname, '../web/src/projectHelpers.js'), 'utf8');
  eval(helpersCode);

  await window.reloadProjectList();
  expect(window.loadProjects).toHaveBeenCalledWith(true);
});
