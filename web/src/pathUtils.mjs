// Wrapper für Pfadfunktionen
let extractRelevantFolder;

if (typeof window === 'undefined') {
    // Node.js: CommonJS-Modul laden
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    ({ extractRelevantFolder } = require('./pathUtils.js'));
} else {
    // Browser: Modul nur der Nebenwirkungen wegen laden
    await import('./pathUtils.js');
    extractRelevantFolder = window.extractRelevantFolder;
}

export { extractRelevantFolder };

