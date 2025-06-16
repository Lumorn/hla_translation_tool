#!/usr/bin/env python3
import sys

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


def ensure_package(from_code: str, to_code: str) -> None:
    """Stellt sicher, dass das benoetigte Sprachpaket installiert ist."""
    installed = translate.load_installed_languages()
    # pruefen, ob das gewuenschte Uebersetzungspaar bereits vorhanden ist
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
    package.update_package_index()
    available = package.get_available_packages()
    pkg = next(p for p in available if p.from_code == from_code and p.to_code == to_code)
    package.install_from_path(pkg.download())


def main() -> None:
    text = sys.stdin.read()
    if not text:
        return
    ensure_package(FROM_CODE, TO_CODE)
    translated = translate.translate(text, FROM_CODE, TO_CODE)
    print(translated)


if __name__ == "__main__":
    main()
