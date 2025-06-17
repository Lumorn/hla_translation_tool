import os
import subprocess
from urllib.parse import quote
try:
    import winreg
except ImportError:  # Nicht-Windows-Systeme
    winreg = None


def _get_steam_path() -> str | None:
    """Liest den Installationspfad von Steam aus der Registry aus."""
    if winreg is None:
        return None
    try:
        with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam") as key:
            value, _ = winreg.QueryValueEx(key, "SteamPath")
            return value
    except OSError:
        return None


def start_hla(mode: str = "normal", lang: str = "english") -> None:
    """Startet Half-Life: Alyx oder den Workshop-Modus.

    Bei ``mode == 'workshop'`` wird direkt ``hlvrcfg.exe`` ausgeführt. Der
    Steam-Pfad wird dazu aus der Registry gelesen. Bei allen anderen Fällen
    erfolgt der Start weiterhin über eine ``steam://``-URL.
    """

    if mode == "workshop" and os.name == "nt":
        steam_path = _get_steam_path()
        if steam_path:
            exe = os.path.join(
                steam_path,
                "steamapps",
                "common",
                "Half-Life Alyx",
                "game",
                "bin",
                "win64",
                "hlvrcfg.exe",
            )
            if os.path.isfile(exe):
                cmd = [exe, "-steam", "-retail", "-language", lang or "english"]
                subprocess.Popen(cmd)
                return
            else:
                print(f"[Fehler] hlvrcfg.exe nicht gefunden unter {exe}")
                return
        else:
            print("[Fehler] Steam-Installation konnte nicht ermittelt werden")
            return

    # Fallback: Start über Steam-URL
    base_url = "steam://rungameid/546560"
    args = []
    if mode == "workshop":
        args.append("-hlvr_workshop")
    if lang:
        args.extend(["-language", lang])

    url = base_url
    if args:
        encoded = quote(" ".join(args))
        url = f"{base_url}/{encoded}"

    if os.name == "nt":
        os.startfile(url)
    else:
        opener = "xdg-open" if os.name == "posix" else "open"
        try:
            os.spawnlp(os.P_NOWAIT, opener, opener, url)
        except OSError:
            pass


if __name__ == "__main__":
    # Optionaler Aufruf über Kommandozeile: ``python launch_hla.py workshop german``
    import sys
    mode = sys.argv[1] if len(sys.argv) > 1 else "normal"
    lang = sys.argv[2] if len(sys.argv) > 2 else "english"
    start_hla(mode, lang)
