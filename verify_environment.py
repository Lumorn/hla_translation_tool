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


def run(cmd: str) -> str:
    """Führt ein Kommando aus und gibt die Ausgabe zurück."""
    return subprocess.check_output(cmd, shell=True, text=True).strip()


def check_python() -> bool:
    """Prüft die installierte Python-Version."""
    print("Prüfe Python-Version...")
    if sys.version_info < (3, 9):
        print("[Fehler] Python 3.9 oder neuer wird benötigt.")
        return False
    print(f"Python-Version: {sys.version.split()[0]}")
    return True


def check_node() -> bool:
    """Prüft, ob eine unterstützte Node-Version installiert ist."""
    print("Prüfe Node-Version...")
    try:
        version = run("node --version")
    except Exception:
        print("[Fehler] Node wurde nicht gefunden.")
        return False
    print(f"Gefundene Node-Version: {version}")
    try:
        major = int(version.lstrip("v").split(".")[0])
    except ValueError:
        print("[Fehler] Node-Version konnte nicht bestimmt werden.")
        return False
    if major < 18 or major >= 23:
        print("[Fehler] Node-Version nicht unterstützt (18–22 erwartet).")
        return False
    return True


def check_npm() -> bool:
    """Prüft, ob npm verfügbar ist."""
    print("Prüfe npm...")
    try:
        version = run("npm --version")
        print(f"npm-Version: {version}")
        return True
    except Exception:
        print("[Fehler] npm wurde nicht gefunden.")
        return False


def check_electron_folder() -> bool:
    """Kontrolliert, ob der Ordner 'electron' existiert."""
    print("Prüfe Electron-Ordner...")
    path = os.path.join(BASE_DIR, "electron")
    if os.path.isdir(path):
        print("Electron-Ordner vorhanden.")
        return True
    print("[Fehler] Electron-Ordner fehlt.")
    return False


def check_python_packages() -> bool:
    """Prüft, ob alle in requirements.txt aufgeführten Pakete installiert sind."""
    print("Prüfe Python-Abhängigkeiten...")
    req = os.path.join(BASE_DIR, "requirements.txt")
    if not os.path.exists(req):
        print("requirements.txt nicht gefunden.")
        return True
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
        print("[Fehler] Fehlende Pakete: " + ", ".join(missing))
        return False
    print("Alle Pakete vorhanden.")
    return True


def main() -> None:
    ok = True
    if not check_python():
        ok = False
    if not check_node():
        ok = False
    if not check_npm():
        ok = False
    if not check_electron_folder():
        ok = False
    if not check_python_packages():
        ok = False

    if ok:
        print("Umgebung OK. Tool kann gestartet werden.")
        sys.exit(0)
    else:
        print("Mindestens eine Prüfung ist fehlgeschlagen.")
        sys.exit(1)


if __name__ == "__main__":
    main()

