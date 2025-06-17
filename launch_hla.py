import os
from urllib.parse import quote


def start_hla(mode: str = "normal", lang: str = "english") -> None:
    """Startet Half-Life: Alyx über das Steam-Protokoll.

    Args:
        mode: "normal" oder "workshop". Bei "workshop" wird -hlvr_workshop angehängt.
        lang: "german" oder "english". Wird als -language Parameter verwendet.
    """
    # Basis-URL mit der App-ID des Spiels
    base_url = "steam://rungameid/546560"
    args = []

    # Workshop-Modus aktivieren
    if mode == "workshop":
        args.append("-hlvr_workshop")

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
