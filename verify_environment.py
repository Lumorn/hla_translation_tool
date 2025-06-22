#!/usr/bin/env python3
"""verify_environment.py
Prüft die installierten Versionen von Python, Node und npm sowie die wichtigsten Ordner.
Das Skript nimmt keine Änderungen vor und meldet, ob die Umgebung korrekt eingerichtet ist.
"""

import os
import subprocess
import sys
import importlib.util

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


def run(cmd: str) -> str:
    """Führt ein Kommando aus und gibt die Ausgabe zurück."""
    return subprocess.check_output(cmd, shell=True, text=True).strip()


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
    """Prüft die installierte Python-Version."""
    if sys.version_info < (3, 9):
        report("Python-Version", False, f"{sys.version.split()[0]} (<3.9)")
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
    report("Electron-Ordner", False, "fehlt")
    return False


def check_python_packages() -> bool:
    """Prüft, ob alle in requirements.txt aufgeführten Pakete installiert sind."""
    req = os.path.join(BASE_DIR, "requirements.txt")
    if not os.path.exists(req):
        report("requirements.txt", False, "nicht gefunden")
        return False
    missing: list[str] = []
    with open(req, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            mod = line.split("==")[0].split(">=")[0]
            if importlib.util.find_spec(mod) is None:
                missing.append(mod)
    if missing:
        report("Python-Pakete", False, ", ".join(missing))
        return False
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
        report("Git-Status", False, "Lokale Änderungen")
        return False
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
            report(name, False, "fehlt")
            ok = False
    return ok


def main() -> None:
    ok = True
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

