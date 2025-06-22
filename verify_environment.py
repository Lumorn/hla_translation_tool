#!/usr/bin/env python3
"""verify_environment.py
Prüft die installierten Versionen von Python, Node und npm sowie die wichtigsten
Ordner. Fehlen Abhängigkeiten oder Ordner, versucht das Skript diese automatisch
nachzuladen. Mit ``--check-only`` lassen sich die Reparaturversuche abschalten."""

import os
import subprocess
import sys
import importlib.util

FAIL: list[str] = []  # gescheiterte Paket-Installationen sammeln

FIX_MODE = "--check-only" not in sys.argv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REPORTS: list[tuple[str, bool, str]] = []


def report(name: str, ok: bool, detail: str = "") -> None:
    """Gibt das Ergebnis einer Prüfung mit Häkchen aus."""
    symbol = "✓" if ok else "✗"
    text = f"{symbol} {name}"
    if detail:
        text += f": {detail}"
    print(text)
    REPORTS.append((name, ok, detail))


def run(cmd: str, cwd: str | None = BASE_DIR) -> str:
    """Führt ein Kommando im angegebenen Verzeichnis aus und gibt die Ausgabe zurück."""
    return subprocess.check_output(cmd, shell=True, cwd=cwd, text=True).strip()


def ensure_package(pkg: str) -> None:
    """Installiert fehlende Python-Pakete bei Bedarf."""
    try:
        import importlib.util, subprocess, sys
        if importlib.util.find_spec(pkg) is None:
            subprocess.check_call([sys.executable, "-m", "pip", "install", pkg])
        import importlib  # nach der Installation erneut laden
        __import__(pkg)
    except Exception as e:
        FAIL.append(f"Python-Pakete: {pkg} ({e})")


def check_git_installed() -> bool:
    """Prüft, ob Git verfügbar ist."""
    try:
        version = run("git --version")
    except Exception:
        report("Git", False, "nicht gefunden")
        return False
    report("Git", True, version.split()[2])
    return True


def check_python() -> bool:
    """Prüft Version **und Architektur** von Python."""
    if sys.version_info < (3, 9):
        report("Python-Version", False, f"{sys.version.split()[0]} (<3.9)")
        return False
    if sys.maxsize <= 2**32:
        report("Python-Architektur", False, "32-Bit nicht unterst\u00fctzt")
        return False
    report("Python-Version", True, sys.version.split()[0])
    return True


def check_node() -> bool:
    """Prüft, ob eine unterstützte Node-Version installiert ist."""
    try:
        version = run("node --version")
    except Exception:
        report("Node-Version", False, "nicht gefunden")
        return False
    try:
        major = int(version.lstrip("v").split(".")[0])
    except ValueError:
        report("Node-Version", False, "unbekannt")
        return False
    if major < 18 or major >= 23:
        report("Node-Version", False, version)
        return False
    report("Node-Version", True, version)
    return True


def check_npm() -> bool:
    """Prüft, ob npm verfügbar ist."""
    try:
        version = run("npm --version")
    except Exception:
        report("npm", False, "nicht gefunden")
        return False
    report("npm", True, version)
    return True


def check_electron_folder() -> bool:
    """Kontrolliert, ob der Ordner 'electron' existiert."""
    path = os.path.join(BASE_DIR, "electron")
    if os.path.isdir(path):
        report("Electron-Ordner", True)
        return True
    if FIX_MODE:
        try:
            run("git checkout -- electron")
        except Exception:
            pass
        if os.path.isdir(path):
            report("Electron-Ordner", True, "wiederhergestellt")
            return True
    report("Electron-Ordner", False, "fehlt")
    return False


def check_python_packages(retry: bool = False) -> bool:
    """Prüft, ob alle in requirements.txt aufgeführten Pakete installiert sind."""
    global FAIL
    FAIL = []
    req = os.path.join(BASE_DIR, "requirements.txt")
    if not os.path.exists(req):
        report("requirements.txt", False, "nicht gefunden")
        return False

    fehlend: list[str] = []          # Pflicht-Pakete, die fehlen
    fehlend_optional: list[str] = []  # Optionale Pakete, die fehlen

    with open(req, "r", encoding="utf-8") as f:
        for line in f:
            zeile = line.strip()
            if not zeile or zeile.startswith("#"):
                continue

            optional = "# optional" in zeile
            mod = zeile.split("#")[0].split("==")[0].split(">=")[0].strip()

            if importlib.util.find_spec(mod) is None:
                if optional:
                    fehlend_optional.append(mod)
                else:
                    fehlend.append(mod)

    if fehlend or fehlend_optional:
        if FIX_MODE and not retry:
            for pkg in fehlend + fehlend_optional:
                ensure_package(pkg)
            if FAIL:
                report("Python-Pakete", False, ", ".join(FAIL))
                return False
            return check_python_packages(True)

    if fehlend:
        report("Python-Pakete", False, ", ".join(fehlend))
        return False

    if fehlend_optional:
        detail = "fehlend: " + ", ".join(fehlend_optional)
        report("Optionale Pakete", True, detail)
    else:
        report("Python-Pakete", True, "alle vorhanden")

    return True


def check_repo_clean() -> bool:
    """Prüft, ob ein Git-Repository vorhanden und sauber ist."""
    try:
        inside = run("git rev-parse --is-inside-work-tree")
    except Exception:
        report("Git-Repository", False, "nicht gefunden")
        return False
    if inside.strip() != "true":
        report("Git-Repository", False, "nicht gefunden")
        return False
    try:
        output = run("git status --porcelain")
    except Exception:
        report("Git", False, "Fehler bei 'git status'")
        return False
    if output:
        if FIX_MODE:
            try:
                run("git reset --hard")
                run("git clean -fd")
                output = run("git status --porcelain")
            except Exception as e:
                report("Git-Status", False, str(e))
                return False
            if output:
                report("Git-Status", False, "Lokale Änderungen")
                return False
        else:
            report("Git-Status", False, "Lokale Änderungen")
            return False
    if FIX_MODE:
        try:
            run("git fetch --depth=1")
            run("git reset --hard origin/main")
            run("git clean -fd")
        except Exception as e:
            report("Git-Update", False, str(e))
    report("Git-Status", True, "sauber")
    return True


def check_files() -> bool:
    """Kontrolliert, ob wichtige Dateien vorhanden sind."""
    files = ["README.md", "package.json", "requirements.txt", "start_tool.py"]
    ok = True
    for name in files:
        path = os.path.join(BASE_DIR, name)
        if os.path.exists(path):
            report(name, True)
        else:
            if FIX_MODE:
                try:
                    run(f"git checkout -- {name}")
                except Exception:
                    pass
            if os.path.exists(path):
                report(name, True, "wiederhergestellt")
            else:
                report(name, False, "fehlt")
                ok = False
    return ok


def main() -> None:
    ok = True
    if FIX_MODE:
        print("Automatische Reparatur aktiv")
    else:
        print("Nur Überprüfung ohne Änderungen")
    if not check_python():
        ok = False
    if not check_node():
        ok = False
    if not check_npm():
        ok = False
    if not check_git_installed():
        ok = False
    if not check_electron_folder():
        ok = False
    if not check_python_packages():
        ok = False
    if not check_repo_clean():
        ok = False
    if not check_files():
        ok = False

    print("\nZusammenfassung:")
    for name, state, detail in REPORTS:
        symbol = "✓" if state else "✗"
        text = f"{symbol} {name}"
        if detail:
            text += f": {detail}"
        print(text)

    if ok:
        print("Umgebung OK. Tool kann gestartet werden.")
        sys.exit(0)
    else:
        print("Mindestens eine Prüfung ist fehlgeschlagen.")
        sys.exit(1)


if __name__ == "__main__":
    main()

