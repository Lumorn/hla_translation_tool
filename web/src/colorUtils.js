// Hilfsfunktionen rund um Farben

// Gibt abhängig von der Versionsnummer einen Grünton zurück
function getVersionColor(v) {
    if (!v || v <= 1) return '#555';
    if (v > 10) return '#002200';
    const ratio = (v - 1) / 9; // Wertebereich 0..1
    const start = { r: 85, g: 85, b: 85 }; // Grau
    const end = { r: 0, g: 68, b: 0 };     // Dunkelgrün
    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);
    return `rgb(${r},${g},${b})`;
}

// Export für Node.js und Browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getVersionColor };
} else {
    window.getVersionColor = getVersionColor;
}
