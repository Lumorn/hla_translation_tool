"""Hilfsmodul für Übersetzungen von Benutzerhinweisen."""
import os
from typing import Dict

# Standard-Sprache ist Englisch
DEFAULT_LANGUAGE = "en"
LANG_ENV_VAR = "TRANSLATE_TEXT_LANG"

# Unterstützte Sprachen samt Textbausteinen
_MESSAGES: Dict[str, Dict[str, str]] = {
    "missing_dependency": {
        "en": (
            "The 'argostranslate' package or one of its dependencies is missing. "
            "Please run 'pip install -r requirements.txt' beforehand.\n"
            "On Windows you might need the Microsoft Visual C++ runtime.\n"
            "Error: {error}\n"
        ),
        "de": (
            "Das Paket 'argostranslate' oder eine seiner Abhängigkeiten fehlt. "
            "Bitte vorher 'pip install -r requirements.txt' ausführen.\n"
            "Unter Windows wird ggf. das Microsoft Visual C++ Laufzeitpaket benötigt.\n"
            "Fehler: {error}\n"
        ),
    },
    "download_disabled": {
        "en": (
            "Language package missing and download is disabled (--no-download).\n"
            "Please install it manually via 'argos-translate-cli'.\n"
        ),
        "de": (
            "Sprachpaket fehlt und Download ist deaktiviert (--no-download).\n"
            "Bitte zuvor per 'argos-translate-cli' installieren.\n"
        ),
    },
    "package_not_found": {
        "en": "No language package found for {from_code}->{to_code}.\n",
        "de": "Kein Sprachpaket für {from_code}->{to_code} gefunden.\n",
    },
    "translator_missing": {
        "en": "No translator available for the requested language pair.",
        "de": "Kein Übersetzer für die gewünschte Sprachkombination vorhanden.",
    },
    "invalid_json": {
        "en": "Invalid JSON: {details}",
        "de": "Ungültiges JSON: {details}",
    },
}


def resolve_language(cli_lang: str | None) -> str:
    """Bestimmt die Ausgabe-Sprache aus CLI-Flag, Umgebungsvariable oder Default."""

    def _normalize(candidate: str | None) -> str | None:
        """Normalisiert die Eingabe auf Kleinbuchstaben, falls vorhanden."""

        return candidate.lower() if candidate else None

    env_lang = _normalize(os.environ.get(LANG_ENV_VAR))
    chosen = _normalize(cli_lang) or env_lang or DEFAULT_LANGUAGE
    if chosen not in _MESSAGES["missing_dependency"]:
        return DEFAULT_LANGUAGE
    return chosen


def format_message(key: str, lang: str, **kwargs) -> str:
    """Liefert die formatierte Nachricht in der gewünschten Sprache."""

    template = _MESSAGES.get(key, {}).get(lang) or _MESSAGES.get(key, {}).get(
        DEFAULT_LANGUAGE, ""
    )
    return template.format(**kwargs)
