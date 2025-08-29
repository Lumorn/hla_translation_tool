/**
 * Kleiner invertierter Index pro Projekt.
 * Speichert je Lemma die zugehörigen Zeilen-IDs.
 */
export class LocalIndex {
    constructor() {
        this.map = {};
    }

    /**
     * Fügt einen Text unter einer ID zum Index hinzu.
     * @param {string} id   eindeutige Kennung
     * @param {string} text zu analysierender Text
     */
    add(id, text) {
        for (const token of tokenize(text)) {
            if (!this.map[token]) this.map[token] = new Set();
            this.map[token].add(id);
        }
    }

    /**
     * Entfernt alle Einträge einer ID aus dem Index.
     * @param {string} id   Kennung
     * @param {string} text zu entfernender Text
     */
    remove(id, text) {
        for (const token of tokenize(text)) {
            const set = this.map[token];
            if (!set) continue;
            set.delete(id);
            if (set.size === 0) delete this.map[token];
        }
    }

    /**
     * Sucht nach einem Token und liefert die passenden IDs.
     * @param {string} term Suchbegriff
     * @returns {string[]} Liste der passenden IDs
     */
    search(term) {
        return Array.from(this.map[term.toLowerCase()] || []);
    }
}

// Zerlegt Text in Kleinbuchstaben-Token
function tokenize(str) {
    return str.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}
