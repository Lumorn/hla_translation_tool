#!/usr/bin/env python3
import sys
import argparse

try:
    from argostranslate import package, translate
except ModuleNotFoundError:
    # Abhängigkeit nicht vorhanden -> Hinweis ausgeben und abbrechen
    sys.stderr.write(
        "Das Paket 'argostranslate' fehlt. Bitte vorher 'pip install -r requirements.txt' ausfuehren.\n"
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


def main() -> None:
    parser = argparse.ArgumentParser(description="Text offline übersetzen")
    parser.add_argument(
        "--no-download",
        action="store_true",
        help="Fehlende Sprachpakete nicht automatisch herunterladen",
    )
    args = parser.parse_args()

    text = sys.stdin.read()
    if not text:
        return
    # Nur falls nötig Pakete installieren
    ensure_package(FROM_CODE, TO_CODE, allow_download=not args.no_download)
    translated = translate.translate(text, FROM_CODE, TO_CODE)
    print(translated)


if __name__ == "__main__":
    main()
