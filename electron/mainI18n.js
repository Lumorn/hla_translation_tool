// @ts-check
// Einfache i18n-Unterstützung für den Hauptprozess mit Fallback auf Englisch
const fs = require('fs');
const path = require('path');

// Standard-Sprache immer Englisch, damit Dialoge lesbar bleiben
const defaultLanguage = 'en';
let currentLanguage = defaultLanguage;
/** @type {Record<string, Record<string, string>>} */
const cache = {};

// Lade eine Sprachdatei, falls vorhanden, ansonsten leeres Objekt zurückgeben
function loadLanguageFile(lang) {
  try {
    const localePath = path.join(__dirname, 'locales', 'main', `${lang}.json`);
    if (fs.existsSync(localePath)) {
      const content = fs.readFileSync(localePath, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('[i18n-main] Sprachdatei konnte nicht geladen werden', err);
  }
  return {};
}

// Stelle sicher, dass die Standardsprache immer im Cache liegt
cache[defaultLanguage] = loadLanguageFile(defaultLanguage);

// Setzt die aktive Sprache und lädt fehlende Dateien nach
function setLanguage(lang) {
  if (!lang) return currentLanguage;
  const normalized = String(lang).toLowerCase();
  if (!cache[normalized]) {
    cache[normalized] = loadLanguageFile(normalized);
  }
  // Falls die Sprachdatei leer ist, auf Englisch zurückfallen
  currentLanguage = Object.keys(cache[normalized] || {}).length > 0 ? normalized : defaultLanguage;
  return currentLanguage;
}

// Gibt die aktuell verwendete Sprache zurück
function getLanguage() {
  return currentLanguage;
}

// Ersetzt Platzhalter im Text
function applyReplacements(text, replacements) {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(replacements, key)) {
      return String(replacements[key]);
    }
    return match;
  });
}

// Übersetzung mit Fallback auf Englisch oder Schlüssel selbst
function t(key, replacements = {}) {
  const byLang = cache[currentLanguage] || {};
  const fallback = cache[defaultLanguage] || {};
  const value = byLang[key] ?? fallback[key] ?? key;
  return applyReplacements(value, replacements);
}

module.exports = {
  t,
  setLanguage,
  getLanguage,
  defaultLanguage,
};
