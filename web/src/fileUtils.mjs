// Wrapper für die Funktionen in fileUtils.js
// Funktioniert sowohl im Browser als auch unter Node
let calculateTextSimilarity, levenshteinDistance;

if (typeof window === 'undefined') {
    // Node.js: CommonJS-Modul laden
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    ({ calculateTextSimilarity, levenshteinDistance } = require('./fileUtils.js'));
} else {
    // Browser: als ES-Modul importieren
    ({ calculateTextSimilarity, levenshteinDistance } = await import('./fileUtils.js'));
}

export { calculateTextSimilarity, levenshteinDistance };
