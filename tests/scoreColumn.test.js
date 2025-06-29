const { scoreCellTemplate } = require('../web/src/scoreColumn.js');

test('scoreCellTemplate erstellt farbige Zelle mit Tooltip', () => {
  const file = { score: 80, comment: 'gut', suggestion: 'neu' };
  const html = scoreCellTemplate(file, t => t);
  expect(html).toContain('class="score-cell score-high"');
  expect(html).toContain('data-suggestion="neu"');
  expect(html).toContain('data-comment="gut"');
  expect(html).toContain('title="gut - neu"');
  expect(html).toContain('>80<');
});

test('scoreCellTemplate nutzt Defaultwerte', () => {
  const html = scoreCellTemplate({}, t => t);
  expect(html).toContain('class="score-cell score-none"');
  expect(html).toContain('>0<');
});
