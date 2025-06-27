// Hilfsfunktionen für Text-Vergleiche

function calculateTextSimilarity(text1, text2) {
    // Normalisiere beide Texte
    const normalize = (text) => {
        return text.toLowerCase()
                   .replace(/[^\w\s]/g, '') // Entferne Satzzeichen
                   .replace(/\s+/g, ' ')    // Mehrfache Leerzeichen zu einem
                   .trim();
    };

    const norm1 = normalize(text1);
    const norm2 = normalize(text2);

    // Exakte Übereinstimmung
    if (norm1 === norm2) return 1.0;

    // Enthaltensein-Test
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
        const shorter = norm1.length < norm2.length ? norm1 : norm2;
        const longer = norm1.length >= norm2.length ? norm1 : norm2;
        return shorter.length / longer.length;
    }

    // Wort-basierte Ähnlichkeit
    const words1 = norm1.split(/\s+/);
    const words2 = norm2.split(/\s+/);

    let commonWords = 0;
    const allWords = new Set([...words1, ...words2]);

    words1.forEach(word1 => {
        if (words2.some(word2 => {
            // Bei kurzen Wörtern nur genaue Treffer zulassen
            const len = Math.min(word1.length, word2.length);
            const schwelle = len < 5 ? 0 : Math.max(1, Math.floor(len * 0.3));
            return word1 === word2 || levenshteinDistance(word1, word2) <= schwelle;
        })) {
            commonWords++;
        }
    });

    const maxWords = Math.max(words1.length, words2.length);
    const wordSimilarity = commonWords / maxWords;

    // Levenshtein-Distanz für Zeichen-Ähnlichkeit
    const maxLength = Math.max(norm1.length, norm2.length);
    const editDistance = levenshteinDistance(norm1, norm2);
    const charSimilarity = (maxLength - editDistance) / maxLength;

    // Kombiniere beide Metriken
    return Math.max(wordSimilarity, charSimilarity * 0.7);
}

// Hilfsfunktion: Levenshtein-Distanz
function levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
        for (let i = 1; i <= str1.length; i++) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,     // Löschung
                matrix[j - 1][i] + 1,     // Einfügen
                matrix[j - 1][i - 1] + indicator // Ersetzen
            );
        }
    }

    return matrix[str2.length][str1.length];
}

// Exporte für Node.js und Browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateTextSimilarity, levenshteinDistance };
} else {
    window.calculateTextSimilarity = calculateTextSimilarity;
    window.levenshteinDistance = levenshteinDistance;
}
