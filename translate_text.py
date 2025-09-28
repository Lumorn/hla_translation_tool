#!/usr/bin/env python3
import sys
import argparse
import json

try:
    from argostranslate import package, translate
except (ModuleNotFoundError, ImportError):
    # Versuch, Argos Translate automatisch nachzuinstallieren
    try:
        import subprocess

        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "argostranslate"],
            stdout=subprocess.DEVNULL,
        )
        from argostranslate import package, translate  # erneuter Import
    except Exception as exc2:  # pragma: no cover - nur bei fehlgeschlagener Installation
        # Abhängigkeit fehlt oder kann nicht geladen werden -> verständlichen Hinweis ausgeben
        sys.stderr.write(
            "Das Paket 'argostranslate' oder eine seiner Abhängigkeiten fehlt. "
            "Bitte vorher 'pip install -r requirements.txt' ausführen.\n"
            "Unter Windows wird ggf. das Microsoft Visual C++ Laufzeitpaket benötigt.\n"
            f"Fehler: {exc2}\n"
        )
        sys.exit(1)

FROM_CODE = "en"
TO_CODE = "de"


def ensure_package(from_code: str, to_code: str, allow_download: bool = True) -> None:
    """Stellt sicher, dass das benoetigte Sprachpaket installiert ist."""
    installed = translate.load_installed_languages()
    # prüfen, ob das gewünschte Übersetzungspaket bereits installiert ist
    have_translation = any(
        lang.code == from_code
        and any(
            t.to_lang.code == to_code
            for t in getattr(lang, "translations_from", [])
        )
        for lang in installed
    )
    if have_translation:
        return
    if not allow_download:
        sys.stderr.write(
            "Sprachpaket fehlt und Download ist deaktiviert (--no-download).\n"
            "Bitte zuvor per 'argos-translate-cli' installieren.\n"
        )
        sys.exit(1)
    # Paket nur herunterladen, wenn es nicht vorhanden ist
    package.update_package_index()
    available = package.get_available_packages()
    # passendes Paket suchen; liefert None, wenn nichts gefunden wird
    pkg = next(
        (
            p for p in available if p.from_code == from_code and p.to_code == to_code
        ),
        None,
    )
    if pkg is None:
        sys.stderr.write(
            f"Kein Sprachpaket für {from_code}->{to_code} gefunden.\n"
        )
        sys.exit(1)
    package.install_from_path(pkg.download())


def _find_translator(from_code: str, to_code: str):
    """Sucht einen passenden Translator in den geladenen Sprachen."""
    languages = translate.load_installed_languages()
    for lang in languages:
        if lang.code != from_code:
            continue
        # passenden Übersetzer in den verfügbaren Sprachen suchen
        for translator in getattr(lang, "translations_from", []) or []:
            if translator.to_lang.code == to_code:
                return translator
    return None


def run_server(allow_download: bool) -> None:
    """Verarbeitet Übersetzungsaufträge im Servermodus."""
    # Pakete nur einmal beim Start sicherstellen
    ensure_package(FROM_CODE, TO_CODE, allow_download=allow_download)
    translator = _find_translator(FROM_CODE, TO_CODE)
    if translator is None:
        # Verständliche Fehlermeldung zurückgeben, statt sofort zu beenden
        sys.stdout.write(
            json.dumps(
                {
                    "id": None,
                    "text": "",
                    "error": "Kein Übersetzer für die gewünschte Sprachkombination vorhanden.",
                }
            )
            + "\n"
        )
        sys.stdout.flush()
        return

    # Eingehende Zeilen als einzelne JSON-Aufträge verarbeiten
    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue
        try:
            payload = json.loads(line)
        except json.JSONDecodeError as exc:
            # Fehlformatierte Eingaben mit Hinweis beantworten
            response = {
                "id": None,
                "text": "",
                "error": f"Ungültiges JSON: {exc.msg}",
            }
            sys.stdout.write(json.dumps(response, ensure_ascii=False) + "\n")
            sys.stdout.flush()
            continue

        job_id = payload.get("id")
        text = payload.get("text", "")
        try:
            translated = translator.translate(text)
            response = {"id": job_id, "text": translated, "error": ""}
        except Exception as exc:  # pragma: no cover - hängt von argostranslate ab
            # Übersetzungsfehler verständlich melden
            response = {
                "id": job_id,
                "text": "",
                "error": str(exc),
            }
        sys.stdout.write(json.dumps(response, ensure_ascii=False) + "\n")
        sys.stdout.flush()


def main() -> None:
    parser = argparse.ArgumentParser(description="Text offline übersetzen")
    parser.add_argument(
        "--no-download",
        action="store_true",
        help="Fehlende Sprachpakete nicht automatisch herunterladen",
    )
    parser.add_argument(
        "--server",
        action="store_true",
        help="Servermodus: JSON-Aufträge über stdin empfangen",
    )
    args = parser.parse_args()

    allow_download = not args.no_download
    if args.server:
        run_server(allow_download)
        return

    text = sys.stdin.read()
    if not text:
        return
    # Nur falls nötig Pakete installieren
    ensure_package(FROM_CODE, TO_CODE, allow_download=allow_download)
    translated = translate.translate(text, FROM_CODE, TO_CODE)
    print(translated)


if __name__ == "__main__":
    main()
