import os
import subprocess
from urllib.parse import quote
try:
    import winreg
except ImportError:  # Nicht-Windows-Systeme
    winreg = None


CHEAT_ARGS: dict[str, list[str]] = {
    "god": ["-vconsole", "-console", "+sv_cheats", "1", "+god"],
    "ammo": ["-vconsole", "-console", "+sv_cheats", "1", "+sv_infinite_ammo", "1"],
    "both": ["-vconsole", "-console", "+sv_cheats", "1", "+god", "+sv_infinite_ammo", "1"],
    "console": ["-vconsole", "-console"],
}


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


def start_hla(mode: str = "normal", lang: str = "english", level: str | None = None, preset: str = "normal") -> bool:
    """Startet Half-Life: Alyx oder den Workshop-Modus.

    Bei ``mode == 'workshop'`` wird ``hlvrcfg.exe`` direkt aufgerufen.
    Ansonsten erfolgt der Start über ``steam.exe``. Optional kann ein
    Level per ``+map`` übergeben werden. Mit ``preset`` lassen sich
    voreingestellte Cheats aktivieren.
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

        if preset in CHEAT_ARGS:
            cmd.extend(CHEAT_ARGS[preset])

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

    if preset in CHEAT_ARGS:
        args.extend(CHEAT_ARGS[preset])

    if level:
        args.extend(["+map", level])

    url = base_url
    if args:
        encoded = quote(" ".join(args))
        url = f"{base_url}/{encoded}"

    opener = "xdg-open" if os.name == "posix" else "open"
    try:
        subprocess.Popen([opener, url])
    except OSError:
        return False
    return True


if __name__ == "__main__":
    # Optionaler Aufruf über Kommandozeile: ``python launch_hla.py workshop german a1 intro god``
    import sys
    mode = sys.argv[1] if len(sys.argv) > 1 else "normal"
    lang = sys.argv[2] if len(sys.argv) > 2 else "english"
    level = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else None
    preset = sys.argv[4] if len(sys.argv) > 4 else "normal"
    ok = start_hla(mode, lang, level, preset)
    sys.exit(0 if ok else 1)
