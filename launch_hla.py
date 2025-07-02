import os
import subprocess
import sys
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


def start_hla(mode: str = "normal", lang: str = "english", level: str | None = None) -> bool:
    """Startet Half-Life: Alyx oder den Workshop-Modus.

    Bei ``mode == 'workshop'`` wird ``hlvrcfg.exe`` direkt aufgerufen.
    Ansonsten erfolgt der Start über ``steam.exe``. Optional kann ein
    Level per ``+map`` übergeben werden.
    Gibt ``True`` bei Erfolg zurück.
    """

    if os.name == "nt":
        steam_path = _get_steam_path()
        if not steam_path:
            print("[Fehler] Steam-Installation konnte nicht ermittelt werden")
            return False

        if mode == "workshop":
            exe = os.path.join(steam_path, "steamapps", "common", "Half-Life Alyx", "game", "bin", "win64", "hlvrcfg.exe")
            if not os.path.isfile(exe):
                print(f"[Fehler] hlvrcfg.exe nicht gefunden unter {exe}")
                return False
            cmd = [exe, "-steam", "-retail"]
        else:
            exe = os.path.join(steam_path, "steam.exe")
            if not os.path.isfile(exe):
                print(f"[Fehler] steam.exe nicht gefunden unter {exe}")
                return False
            cmd = [exe, "-applaunch", "546560"]

        if lang:
            cmd.extend(["-language", lang])
        if level:
            cmd.extend(["+map", level])
        subprocess.Popen(cmd)
        return True

    # Fallback: Start über Steam-URL
    base_url = "steam://rungameid/546560"
    args = []
    if mode == "workshop":
        args.append("-hlvr_workshop")
    if lang:
        args.extend(["-language", lang])
    if level:
        args.extend(["+map", level])

    url = base_url
    if args:
        encoded = quote(" ".join(args))
        url = f"{base_url}/{encoded}"

    # Unter Windows nutzen wir os.startfile, da es keinen 'open'-Befehl gibt
    if os.name == "nt":
        try:
            os.startfile(url)
        except OSError:
            return False
    else:
        # macOS verwendet 'open', Linux 'xdg-open'
        opener = "open" if sys.platform == "darwin" else "xdg-open"
        try:
            subprocess.Popen([opener, url])
        except OSError:
            return False
    return True


if __name__ == "__main__":
    # Optionaler Aufruf über Kommandozeile: ``python launch_hla.py workshop german``
    import sys
    mode = sys.argv[1] if len(sys.argv) > 1 else "normal"
    lang = sys.argv[2] if len(sys.argv) > 2 else "english"
    level = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else None
    ok = start_hla(mode, lang, level)
    sys.exit(0 if ok else 1)
