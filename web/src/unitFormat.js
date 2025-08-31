/**
 * Hilfsfunktionen zum Formatieren von Zahlenwerten mit Einheiten.
 * Verwendet deutsches Dezimaltrennzeichen und ein geschütztes Leerzeichen
 * zwischen Zahl und Einheit.
 * @param {number} value - Der darzustellende Zahlenwert.
 * @param {string} unit - Die Einheit, z. B. '%', 'ms' oder 's'.
 * @param {number} fractionDigits - Anzahl der Nachkommastellen.
 * @returns {string} Formatierter Wert mit Einheit.
 */
export function withUnit(value, unit, fractionDigits = 0) {
    const formatter = new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits
    });
    // Geschütztes Leerzeichen zwischen Zahl und Einheit
    return `${formatter.format(value)}\u00A0${unit}`;
}
