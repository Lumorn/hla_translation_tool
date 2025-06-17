import os
from urllib.parse import quote


def start_hla(mode: str = "normal", lang: str = "english") -> None:
    """Starte Half-Life: Alyx über das Steam-URL-Protokoll.

    Args:
        mode: "normal" oder "tools". Bei "tools" wird -tools angehängt.
        lang: Sprache wie "german" oder "english". Wird als -language Parameter verwendet.
    """
    # Basis-URL mit der App-ID von Half-Life: Alyx
    base_url = "steam://rungameid/546560"
    args = []

    # Optionalen Modus anfügen
    if mode == "tools":
        args.append("-tools")

    # Sprachparameter immer anfügen
    if lang:
        args.extend(["-language", lang])

    # Argumente zu einem String verbinden und korrekt escapen
    url = base_url
    if args:
        encoded = quote(" ".join(args))
        url = f"{base_url}/{encoded}"

    # Unter Windows die URL per os.startfile öffnen
    if os.name == "nt":
        os.startfile(url)
    else:
        # Auf anderen Systemen versuchen wir es mit xdg-open oder open
        opener = "xdg-open" if os.name == "posix" else "open"
        try:
            os.spawnlp(os.P_NOWAIT, opener, opener, url)
        except OSError:
            pass


if __name__ == "__main__":
    # Kleiner Selbsttest: Start im Normalmodus
    start_hla()
