import os
import unittest
from unittest import mock

import translate_text_i18n as i18n


class ResolveLanguageTest(unittest.TestCase):
    """Tests für die Sprachauflösung beim CLI-Aufruf."""

    def test_cli_value_overrides_env(self) -> None:
        """CLI-Argument hat Vorrang vor der Umgebungsvariable."""

        with mock.patch.dict(os.environ, {i18n.LANG_ENV_VAR: "de"}):
            self.assertEqual(i18n.resolve_language("en"), "en")

    def test_env_used_when_cli_missing(self) -> None:
        """Ohne CLI-Angabe wird die Umgebungsvariable berücksichtigt."""

        with mock.patch.dict(os.environ, {i18n.LANG_ENV_VAR: "de"}, clear=True):
            self.assertEqual(i18n.resolve_language(None), "de")

    def test_default_to_english_on_unknown_language(self) -> None:
        """Unbekannte Sprachen führen zurück auf den englischen Default."""

        with mock.patch.dict(os.environ, {i18n.LANG_ENV_VAR: "fr"}, clear=True):
            self.assertEqual(i18n.resolve_language(None), i18n.DEFAULT_LANGUAGE)


class MessageFormattingTest(unittest.TestCase):
    """Prüft die Formatierung der Textbausteine."""

    def test_message_uses_placeholder(self) -> None:
        """Platzhalter werden korrekt ersetzt."""

        msg = i18n.format_message("missing_dependency", "de", error="FehlerX")
        self.assertIn("FehlerX", msg)

    def test_fallback_to_english_when_missing(self) -> None:
        """Fehlende Übersetzungen nutzen automatisch Englisch."""

        msg = i18n.format_message("missing_dependency", "fr", error="boom")
        self.assertIn("The 'argostranslate' package", msg)


if __name__ == "__main__":
    unittest.main()
