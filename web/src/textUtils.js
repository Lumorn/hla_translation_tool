// Hilfsfunktionen rund um Texte

// Maskiert HTML-Zeichen
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Hebt alle Vorkommen des Suchbegriffs hervor und maskiert den Text
function highlightText(text, query) {
    if (!text || !query) return escapeHtml(text);
    const words = query.split(/\s+/)
        .filter(Boolean)
        .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${words.join('|')})`, 'gi');
    const escaped = escapeHtml(text);
    return escaped.replace(regex, '<span class="search-result-match">$1</span>');
}

// Export für Node.js und Browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { escapeHtml, highlightText };
} else {
    window.escapeHtml = escapeHtml;
    window.highlightText = highlightText;
}
