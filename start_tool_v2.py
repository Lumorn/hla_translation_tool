#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""start_tool_v2.py
Eigenständiges Startskript für die V2-Vorschau des HLA Translation Tools.
Es kümmert sich ausschließlich um die Vorbereitung der V2-Abhängigkeiten und
startet anschließend `npm run --prefix v2 start`.
"""

from __future__ import annotations

import hashlib
import os
import shutil
import subprocess
import sys
from typing import Iterable, Optional

from verify_environment import ensure_supported_python  # sorgt beim Import für kompatible Python-Versionen

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
V2_DIR = os.path.join(BASE_DIR, "v2")
V2_NODE_MODULES = os.path.join(V2_DIR, "node_modules")
V2_LOCKFILE = os.path.join(V2_DIR, "package-lock.json")
HASH_STAMP = os.path.join(V2_NODE_MODULES, ".modules_hash")


# =======================
# Hilfsfunktionen
# =======================

def log(text: str) -> None:
    """Schreibt einfache Statusmeldungen auf die Konsole."""
    print(text)


def run(cmd: Iterable[str], *, cwd: Optional[str] = None, env: Optional[dict[str, str]] = None) -> None:
    """Führt einen Unterprozess sichtbar aus und bricht bei Fehlern ab."""
    resolved = list(cmd)
    log("$ " + " ".join(resolved))
    subprocess.run(resolved, check=True, cwd=cwd, env=env)


def which_exe(name: str) -> Optional[str]:
    """Sucht ein ausführbares Programm plattformunabhängig."""
    path = shutil.which(name)
    if path:
        return path
    if os.name == "nt":
        for suffix in (".cmd", ".exe", ".bat"):
            path = shutil.which(name + suffix)
            if path:
                return path
    return None


def ensure_node() -> str:
    """Überprüft, ob eine passende Node-Version verfügbar ist."""
    node_exe = which_exe("node")
    if not node_exe:
        print("[Fehler] Node.js wurde nicht gefunden. Bitte Node 18 bis 22 installieren.")
        sys.exit(1)
    version_output = subprocess.check_output([node_exe, "--version"], text=True).strip()
    log(f"Gefundene Node-Version: {version_output}")
    try:
        major = int(version_output.lstrip("v").split(".")[0])
    except ValueError:
        major = None
    if major is None or major < 18 or major >= 23:
        print(f"[Fehler] Node.js Version {version_output} wird nicht unterstützt. Bitte Node 18 bis 22 verwenden.")
        sys.exit(1)
    return node_exe


def ensure_npm() -> str:
    """Stellt ein funktionsfähiges npm bereit oder versucht Corepack zu aktivieren."""
    npm_exe = which_exe("npm")
    if npm_exe:
        run([npm_exe, "--version"])
        return npm_exe

    corepack_exe = which_exe("corepack")
    if corepack_exe:
        print("npm nicht gefunden – versuche Corepack zu aktivieren...")
        run([corepack_exe, "enable"])
        run([corepack_exe, "prepare", "npm@latest", "--activate"])
        npm_exe = which_exe("npm")
        if npm_exe:
            run([npm_exe, "--version"])
            return npm_exe

    print("[Fehler] npm konnte nicht gefunden oder aktiviert werden.")
    sys.exit(1)


def needs_dependency_install() -> bool:
    """Vergleicht die Hash-Summe der package-lock.json mit dem gespeicherten Stempel."""
    if not os.path.isdir(V2_NODE_MODULES):
        return True
    if not os.path.isfile(V2_LOCKFILE):
        print("[Fehler] package-lock.json fehlt im v2-Verzeichnis.")
        sys.exit(1)
    with open(V2_LOCKFILE, "rb") as lock_file:
        current_hash = hashlib.sha1(lock_file.read()).hexdigest()
    if not os.path.isfile(HASH_STAMP):
        return True
    with open(HASH_STAMP, "r", encoding="utf-8") as stamp_file:
        saved_hash = stamp_file.read().strip()
    return current_hash != saved_hash


def write_dependency_hash() -> None:
    """Aktualisiert den Hash-Stempel nach erfolgreicher Installation."""
    os.makedirs(V2_NODE_MODULES, exist_ok=True)
    with open(V2_LOCKFILE, "rb") as lock_file:
        current_hash = hashlib.sha1(lock_file.read()).hexdigest()
    with open(HASH_STAMP, "w", encoding="utf-8") as stamp_file:
        stamp_file.write(current_hash)


def find_electron_binary() -> Optional[str]:
    """Sucht nach der ausführbaren Electron-Datei in den installierten Modulen."""
    dist_dir = os.path.join(V2_NODE_MODULES, "electron", "dist")
    candidates = [
        os.path.join(dist_dir, "electron"),
        os.path.join(dist_dir, "electron.exe"),
        os.path.join(dist_dir, "Electron.app", "Contents", "MacOS", "Electron"),
    ]
    for candidate in candidates:
        if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
            return candidate
    return None


def ensure_electron_ready(npm_exe: str) -> None:
    """Prüft die Verfügbarkeit von Electron und führt bei Bedarf ein Reparaturkommando aus."""
    if find_electron_binary():
        return
    log("Electron-Binärdatei fehlt – starte npm rebuild electron ...")
    try:
        run([npm_exe, "rebuild", "electron", "--prefix", V2_DIR])
    except subprocess.CalledProcessError:
        print(
            "[Fehler] Electron konnte nicht automatisch repariert werden. Bitte `node_modules/electron` löschen und das Setup erneut ausführen."
        )
        sys.exit(1)
    if not find_electron_binary():
        print(
            "[Fehler] Electron fehlt weiterhin. Entfernen Sie `v2/node_modules` und führen Sie anschließend `npm ci --prefix v2` aus."
        )
        sys.exit(1)


# =======================
# Hauptablauf
# =======================

def main() -> None:
    """Bereitet die V2-Umgebung vor und startet anschließend die Electron-Vorschau."""
    ensure_supported_python()
    ensure_node()
    npm_exe = ensure_npm()

    if needs_dependency_install():
        log("Installiere V2-Abhängigkeiten über npm ci...")
        run([npm_exe, "ci", "--prefix", V2_DIR])
        write_dependency_hash()
    else:
        log("V2-Abhängigkeiten sind bereits aktuell.")

    ensure_electron_ready(npm_exe)

    env = os.environ.copy()
    uid = getattr(os, "geteuid", lambda: None)()
    if uid == 0:
        log("Starte Electron ohne Sandbox, da das Skript als Root läuft.")
        env["ELECTRON_DISABLE_SANDBOX"] = "1"

    log("Starte npm run --prefix v2 start ...")
    run([npm_exe, "run", "--prefix", V2_DIR, "start"], env=env)


if __name__ == "__main__":
    main()
