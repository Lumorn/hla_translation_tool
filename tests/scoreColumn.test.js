const fs = require('fs');
const path = require('path');

// Lädt die Funktion scoreClass aus dem Modul ohne ES-Import
const file = fs.readFileSync(path.join(__dirname, '../web/src/scoreColumn.js'), 'utf8');
const match = file.match(/export function scoreClass\(score\) {[^}]+}/);
// eslint-disable-next-line no-eval
eval(match[0].replace('export ', ''));

describe('scoreClass', () => {
  test('liefert score-high ab 95', () => {
    expect(scoreClass(100)).toBe('score-high');
    expect(scoreClass(95)).toBe('score-high');
  });

  test('liefert score-medium zwischen 80 und 94', () => {
    expect(scoreClass(94)).toBe('score-medium');
    expect(scoreClass(80)).toBe('score-medium');
  });

  test('liefert score-low unter 80', () => {
    expect(scoreClass(79)).toBe('score-low');
    expect(scoreClass(0)).toBe('score-low');
  });

  test('liefert score-none ohne Wert', () => {
    expect(scoreClass(null)).toBe('score-none');
    expect(scoreClass(undefined)).toBe('score-none');
  });
});
