#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""start_tool.py
Python-Version des Start-Skripts fuer das HLA Translation Tool.
Fuehrt die gleichen Schritte wie die Batch- bzw. Node-Variante aus:
- Pruefen von Git, Node und npm
- Repository klonen und aktualisieren
- Abhaengigkeiten installieren
- Electron-Anwendung starten
"""

from __future__ import annotations

import os
import subprocess
import sys
from datetime import datetime
import importlib
import shutil
import hashlib
from typing import Optional, Iterable

# =======================
# Hilfsfunktionen
# =======================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOGFILE = os.path.join(BASE_DIR, "setup.log")


def log(message: str) -> None:
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOGFILE, "a", encoding="utf-8") as f:
        f.write(f"{timestamp} {message}\n")


def is_windows() -> bool:
    return os.name == "nt"


def which_exe(name: str) -> Optional[str]:
    """Sucht eine Executable plattformgerecht (unter Windows inkl. .cmd/.exe/.bat)."""
    path = shutil.which(name)
    if path:
        return path
    if is_windows():
        for suf in (".cmd", ".exe", ".bat"):
            path = shutil.which(name + suf)
            if path:
                return path
    return None


def find_compatible_python() -> Optional[str]:
    """Durchsucht das System nach einer passenden Python-Version (3.9–3.12, 64-Bit)."""
    candidates = []
    py_launcher = which_exe("py")
    if py_launcher:
        try:
            out = subprocess.check_output([py_launcher, "-0p"], text=True)
            for line in out.splitlines():
                parts = line.strip().split()
                if len(parts) == 2:
                    candidates.append(parts[1])
        except subprocess.CalledProcessError:
            pass
    for ver in ("3.12", "3.11", "3.10", "3.9"):
        exe = which_exe(f"python{ver}")
        if exe:
            candidates.append(exe)
    for name in ("python3", "python"):
        exe = which_exe(name)
        if exe:
            candidates.append(exe)
    seen = set()
    unique = []
    for exe in candidates:
        if exe not in seen:
            unique.append(exe)
            seen.add(exe)
    for exe in unique:
        try:
            out = subprocess.check_output(
                [exe, "-c", "import sys,struct;print(sys.version_info[0],sys.version_info[1],struct.calcsize('P')*8)"],
                text=True,
            ).strip()
            major, minor, bits = map(int, out.split())
            if major == 3 and 9 <= minor < 13 and bits == 64:
                return exe
        except Exception:
            continue
    return None


def run(cmd: Iterable[str], cwd: Optional[str] = None) -> None:
    cmd_list = list(cmd)
    log("Fuehre aus: " + " ".join(cmd_list) + (f" (cwd={cwd})" if cwd else ""))
    subprocess.run(cmd_list, check=True, cwd=cwd)


def has_module(name: str) -> bool:
    """Prueft durch direkten Import, ob ein Python-Modul funktioniert."""
    try:
        importlib.import_module(name)
        return True
    except Exception:
        return False


def needs_npm_ci(lockfile: str, modules_dir: str) -> bool:
    if not os.path.isdir(modules_dir):
        return True
    stamp = os.path.join(modules_dir, ".modules_hash")
    with open(lockfile, "rb") as lf:
        h = hashlib.sha1(lf.read()).hexdigest()
    if not os.path.exists(stamp):
        return True
    with open(stamp, "r", encoding="utf-8") as sf:
        return sf.read().strip() != h


def write_npm_hash(lockfile: str, modules_dir: str) -> None:
    os.makedirs(modules_dir, exist_ok=True)
    with open(lockfile, "rb") as lf:
        h = hashlib.sha1(lf.read()).hexdigest()
    with open(os.path.join(modules_dir, ".modules_hash"), "w", encoding="utf-8") as f:
        f.write(h)


# =======================
# Tool-Pruefungen
# =======================

def ensure_git() -> str:
    git_exe = which_exe("git")
    if not git_exe:
        print("[Fehler] Git wurde nicht gefunden. Bitte installieren und im PATH verfuegbar machen (https://git-scm.com/).")
        log("Git nicht gefunden")
        sys.exit(1)
    try:
        run([git_exe, "--version"])
    except subprocess.CalledProcessError as e:
        print("[Fehler] 'git --version' schlug fehl.")
        log("Git --version fehlgeschlagen: " + str(e))
        sys.exit(1)
    return git_exe


def ensure_node() -> str:
    node_exe = which_exe("node")
    if not node_exe:
        print("[Fehler] Node.js wurde nicht gefunden. Bitte installieren und im PATH verfuegbar machen.")
        log("Node.js nicht gefunden")
        sys.exit(1)
    try:
        out = subprocess.check_output([node_exe, "--version"], text=True).strip()
        log(f"Gefundene Node-Version: {out}")
        major = None
        try:
            major = int(out.lstrip("v").split(".")[0])
        except ValueError:
            pass
        if major is None or major < 18 or major >= 23:
            print(f"[Fehler] Node.js Version {out} wird nicht unterstuetzt. Bitte Node 18–22 installieren.")
            log("Unpassende Node-Version")
            sys.exit(1)
    except subprocess.CalledProcessError as e:
        print("[Fehler] 'node --version' schlug fehl.")
        log("node --version fehlgeschlagen: " + str(e))
        sys.exit(1)
    return node_exe


def ensure_npm() -> str:
    """
    Bevorzugt vorhandenes npm (PATH). Falls nicht vorhanden:
    Fallback ueber Corepack (falls installiert).
    """
    npm_exe = which_exe("npm")
    if npm_exe:
        try:
            run([npm_exe, "--version"])
            return npm_exe
        except subprocess.CalledProcessError as e:
            log("npm --version fehlgeschlagen: " + str(e))
            print("[Fehler] npm ist vorhanden, aber nicht funktionsfaehig.")
            sys.exit(1)

    corepack_exe = which_exe("corepack")
    if corepack_exe:
        print("npm nicht gefunden – versuche Corepack zu aktivieren...")
        log("Versuche corepack enable + prepare npm@latest --activate")
        try:
            run([corepack_exe, "enable"])
            run([corepack_exe, "prepare", "npm@latest", "--activate"])
            npm_exe = which_exe("npm")
            if npm_exe:
                run([npm_exe, "--version"])
                return npm_exe
        except subprocess.CalledProcessError as e:
            log("Corepack konnte npm nicht bereitstellen: " + str(e))

    print(
        "[Fehler] npm wurde nicht gefunden. Node 22 kann ohne npm kommen.\n"
        '        Bitte entweder Node mit npm installieren oder einmal "corepack enable" ausfuehren.'
    )
    log("npm nicht gefunden (auch nach Corepack-Fallback)")
    sys.exit(1)


def has_remote() -> bool:
    try:
        output = subprocess.check_output(["git", "remote"], text=True).strip()
        return bool(output)
    except subprocess.CalledProcessError:
        return False


def quote_path(path: str) -> str:
    return f'"{path}"' if " " in path else path


# =======================
# Start
# =======================

log("Setup gestartet")
log(f"Python-Version: {sys.version.split()[0]} auf {sys.platform}")

def supported_python() -> bool:
    return (3, 9) <= sys.version_info < (3, 13) and sys.maxsize > 2**32

if not supported_python():
    log("Suche nach kompatibler Python-Version")
    alt = find_compatible_python()
    if alt and os.path.abspath(alt) != os.path.abspath(sys.executable):
        print(f"Starte neu mit {alt} ...")
        log(f"Starte neu mit {alt}")
        os.execv(alt, [alt, __file__, *sys.argv[1:]])
    if sys.version_info < (3, 9):
        print("[Fehler] Python 3.9 oder neuer wird benoetigt.")
        log("Python-Version zu alt")
        sys.exit(1)
    if sys.maxsize <= 2**32:
        print("[Fehler] 32-Bit-Python wird nicht unterstuetzt. Bitte 64-Bit installieren.")
        log("Python-Architektur 32-Bit")
        sys.exit(1)
    if sys.version_info >= (3, 13):
        print("[Warnung] Python 3.13 oder neuer erkannt. Diese Version wird moeglicherweise nicht unterstuetzt.")
        log("Python-Version zu neu")
        antwort = input("Fortsetzen? [j/N] ")
        if antwort.lower() not in ("j", "ja"):
            print("Abbruch.")
            sys.exit(1)

print("=== Starte HLA Translation Tool Setup ===")

CHECK_MODE = "--check" in sys.argv
if CHECK_MODE:
    log("Check-Modus aktiviert")
    print("Kurzer Testlauf wird gestartet...")
    os.chdir(os.path.join(BASE_DIR, "electron"))
    uid = getattr(os, "geteuid", lambda: None)()
    try:
        # In Check-Umgebung nutzen wir systemweites npm, wenn vorhanden
        npm_exe = which_exe("npm") or "npm"
        if uid == 0:
            log("Starte Electron ohne Sandbox (Test)")
            subprocess.Popen([npm_exe, "start", "--", "--no-sandbox"])
        else:
            log("Starte Electron mit Sandbox (Test)")
            subprocess.Popen([npm_exe, "start"])
        import time
        time.sleep(5)
        # Nicht hart beenden – kurz testen reicht
        log("Testlauf beendet")
        sys.exit(0)
    except Exception as e:
        log("Testlauf fehlgeschlagen: " + str(e))
        print("[Fehler] Testlauf fehlgeschlagen. Weitere Details siehe setup.log")
        sys.exit(1)

# Werkzeuge pruefen
git_exe = ensure_git()
node_exe = ensure_node()
npm_exe = ensure_npm()

# ----------------------- Repository-Ort bestimmen -----------------------
log("Repository-Pruefung")
cwd = os.getcwd()
repo_path: Optional[str] = None

if os.path.exists(os.path.join(cwd, ".git")):
    repo_path = cwd
elif os.path.exists(os.path.join(cwd, "hla_translation_tool", ".git")):
    repo_path = os.path.join(cwd, "hla_translation_tool")
elif os.path.exists(os.path.join(BASE_DIR, ".git")):
    repo_path = BASE_DIR
elif os.path.exists(os.path.join(BASE_DIR, "hla_translation_tool", ".git")):
    repo_path = os.path.join(BASE_DIR, "hla_translation_tool")
else:
    repo_path = os.path.join(BASE_DIR, "hla_translation_tool")
    if not os.path.exists(repo_path):
        print("Repository wird geklont...")
        log("Repository wird geklont")
        run([git_exe, "clone", "https://github.com/Lumorn/hla_translation_tool", repo_path])

os.chdir(repo_path)

# ----------------------- Repository aktualisieren ----------------------
HEAD_FILE = os.path.join(repo_path, ".last_head")
current_head = subprocess.check_output([git_exe, "rev-parse", "HEAD"], text=True).strip()
last_head = None
if os.path.exists(HEAD_FILE):
    with open(HEAD_FILE, "r", encoding="utf-8") as f:
        last_head = f.read().strip()

if current_head == last_head:
    log("Repository unverändert - ueberspringe Reset und Pull")
else:
    log("Setze Repository zurueck und hole Updates")
    try:
        if has_remote():
            run([git_exe, "fetch", "--depth=1"])
            run([git_exe, "reset", "--hard", "origin/main"])
        else:
            log("Kein Remote gefunden - setze lokal zurueck")
            run([git_exe, "reset", "--hard", "HEAD"])
        run([
            git_exe, "clean", "-fd",
            "-e", "web/sounds",
            "-e", "web/Sounds",
            "-e", "web/backups",
            "-e", "web/Backups",
            "-e", "web/Download",
        ])
        current_head = subprocess.check_output([git_exe, "rev-parse", "HEAD"], text=True).strip()
        with open(HEAD_FILE, "w", encoding="utf-8") as f:
            f.write(current_head)
        log("Repository aktualisiert")
    except subprocess.CalledProcessError as e:
        print("git-Update fehlgeschlagen. Weitere Details siehe setup.log")
        log("git-Update fehlgeschlagen: " + str(e))

# ----------------------- Python-Abhängigkeiten -------------------------
log("Installiere Python-Abhaengigkeiten")
req_file = os.path.join(repo_path, "requirements.txt")
if os.path.exists(req_file):
    try:
        with open(req_file, "r", encoding="utf-8") as f:
            packages = []
            for ln in f:
                clean = ln.split("#", 1)[0].strip()
                if clean:
                    packages.append(clean)
        missing = []
        for pkg in packages:
            mod = pkg.split("==")[0].split(">=")[0]
            if not has_module(mod):
                missing.append(pkg)
        if missing:
            cmd = [sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "-q", *missing]
            log("Fuehre aus: " + " ".join(cmd))
            subprocess.check_call(cmd)
        log("pip install erfolgreich")
    except subprocess.CalledProcessError as e:
        print("pip install fehlgeschlagen. Weitere Details siehe setup.log")
        log("pip install fehlgeschlagen: " + str(e))
        sys.exit(1)
else:
    log("requirements.txt nicht gefunden")

# ----------------------- npm ci (root) -------------------------
log("npm ci (root) starten")
if needs_npm_ci("package-lock.json", "node_modules"):
    print("Abhaengigkeiten im Hauptverzeichnis werden installiert...")
    try:
        run([npm_exe, "ci", "--prefer-offline", "--no-audit", "--progress=false"])
        log("npm ci (root) erfolgreich")
        write_npm_hash("package-lock.json", "node_modules")
    except subprocess.CalledProcessError as e:
        print("npm ci im Hauptverzeichnis fehlgeschlagen. Weitere Details siehe setup.log")
        log("npm ci (root) fehlgeschlagen: " + str(e))
        sys.exit(1)
else:
    log("node_modules sind aktuell - npm ci wird uebersprungen")

# ----------------------- Electron-Ordner sichern ----------------------
if not os.path.isdir("electron"):
    print("'electron'-Ordner fehlt, wird wiederhergestellt...")
    log("Electron-Ordner fehlt - versuche Wiederherstellung")
    try:
        run([git_exe, "checkout", "--", "electron"])
        log("Electron-Ordner wiederhergestellt")
    except subprocess.CalledProcessError as e:
        print("Electron-Ordner konnte nicht wiederhergestellt werden. Weitere Details siehe setup.log")
        log("Electron-Ordner konnte nicht wiederhergestellt werden: " + str(e))
        sys.exit(1)

# ----------------------- npm ci (electron) ----------------------
os.chdir("electron")
log("npm ci (electron) starten")
if needs_npm_ci("package-lock.json", "node_modules"):
    print("Abhaengigkeiten werden installiert...")
    try:
        run([npm_exe, "ci", "--prefer-offline", "--no-audit", "--progress=false"])
        log("npm ci (electron) erfolgreich")
        write_npm_hash("package-lock.json", "node_modules")
    except subprocess.CalledProcessError as e:
        print("npm ci fehlgeschlagen. Weitere Details siehe setup.log")
        log("npm ci (electron) fehlgeschlagen: " + str(e))
        sys.exit(1)
else:
    log("node_modules sind aktuell - npm ci wird uebersprungen")

# Electron-Modul sicherstellen
if not os.path.isdir(os.path.join("node_modules", "electron")):
    print("Electron-Modul fehlt, wird nachinstalliert...")
    log("Electron-Modul fehlt - versuche 'npm install electron'")
    try:
        run([npm_exe, "install", "electron"])
        log("npm install electron erfolgreich")
    except subprocess.CalledProcessError as e:
        print("npm install electron fehlgeschlagen. Weitere Details siehe setup.log")
        log("npm install electron fehlgeschlagen: " + str(e))
        # Trotzdem prüfen, ob das Modul jetzt existiert
    if not os.path.isdir(os.path.join("node_modules", "electron")):
        print("[Fehler] Electron-Modul fehlt weiterhin.")
        log("Electron-Modul weiterhin nicht vorhanden")
        sys.exit(1)

# ----------------------- App starten --------------------------
print("Anwendung wird gestartet...")
log("Starte Anwendung")

uid = getattr(os, "geteuid", lambda: None)()
try:
    if uid == 0:
        log("Starte Electron ohne Sandbox")
        run([npm_exe, "start", "--", "--no-sandbox"])
    else:
        log("Starte Electron mit Sandbox")
        run([npm_exe, "start"])
except subprocess.CalledProcessError as e:
    print("[Fehler] Anwendung konnte nicht gestartet werden. Weitere Details siehe setup.log")
    log("Anwendung konnte nicht gestartet werden: " + str(e))
finally:
    log("Anwendung beendet")
    print(f"Log gespeichert unter {LOGFILE}")
    print("Vorgang abgeschlossen.")
    if "--check" not in sys.argv:
        try:
            input("Zum Beenden Enter drücken...")
        except EOFError:
            pass
