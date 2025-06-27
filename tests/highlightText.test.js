/**
 * @jest-environment jsdom
 */
// Testet die Maskierung von highlightText
const { highlightText } = require('../web/src/textUtils.js');

describe('highlightText', () => {
  test('maskiert HTML korrekt', () => {
    const result = highlightText('<script>', 'script');
    expect(result).toBe('&lt;<span class="search-result-match">script</span>&gt;');
    expect(result).not.toContain('<script>');
  });
});
