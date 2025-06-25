/**
 * @jest-environment jsdom
 */
// Testet die Maskierung von highlightText
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function highlightText(text, query) {
  if (!text || !query) return escapeHtml(text);
  const words = query
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${words.join('|')})`, 'gi');
  const escaped = escapeHtml(text);
  return escaped.replace(regex, '<span class="search-result-match">$1</span>');
}

describe('highlightText', () => {
  test('maskiert HTML korrekt', () => {
    const result = highlightText('<script>', 'script');
    expect(result).toBe('&lt;<span class="search-result-match">script</span>&gt;');
    expect(result).not.toContain('<script>');
  });
});
