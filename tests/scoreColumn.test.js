const { scoreCellTemplate, getScoreClass } = require('../web/src/scoreColumn.js');

test('getScoreClass liefert richtige Klassen', () => {
  expect(getScoreClass(80)).toBe('score-high');
  expect(getScoreClass(50)).toBe('score-medium');
  expect(getScoreClass(20)).toBe('score-low');
  expect(getScoreClass(undefined)).toBe('score-none');
});

test('scoreCellTemplate erzeugt korrekte HTML-Attribute', () => {
  const html = scoreCellTemplate({ score: 75, comment: 'gut', suggestion: 'neu' }, s => s);
  expect(html).toContain('score-high');
  expect(html).toContain('data-comment="gut"');
  expect(html).toContain('data-suggestion="neu"');
  expect(html).toContain('>75<');
});
