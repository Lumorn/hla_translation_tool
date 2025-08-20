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

import os
import subprocess
import sys
from datetime import datetime
import importlib.util
import shutil
import hashlib

# Pruefen, ob ein Git-Remote existiert
def has_remote() -> bool:
    """Gibt True zurueck, wenn ein Git-Remote konfiguriert ist."""
    try:
        output = subprocess.check_output("git remote", shell=True, text=True).strip()
        return bool(output)
    except subprocess.CalledProcessError:
        return False

# Helfer, um Pfade mit Leerzeichen korrekt zu quoten
def quote_path(path: str) -> str:
    """Gibt den Pfad in Anführungszeichen zurück, falls nötig."""
    return f'"{path}"' if " " in path else path

# Pfad dieses Skripts und Log-Datei festlegen
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOGFILE = os.path.join(BASE_DIR, "setup.log")


def log(message: str) -> None:
    """Nachricht mit Zeitstempel in die Log-Datei schreiben."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOGFILE, "a", encoding="utf-8") as f:
        f.write(f"{timestamp} {message}\n")


def run(cmd: list[str]) -> None:
    """Kommando ausführen und Ausgabe direkt weitergeben."""
    log(f"Fuehre aus: {' '.join(cmd)}")
    subprocess.run(cmd, check=True)


def has_module(name: str) -> bool:
    """Prueft, ob ein Python-Modul bereits installiert ist."""
    return importlib.util.find_spec(name) is not None


def needs_npm_ci(lockfile: str, modules_dir: str) -> bool:
    """Prüft, ob npm ci erforderlich ist."""
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
    """Speichert den Hash des Lockfiles in node_modules."""
    os.makedirs(modules_dir, exist_ok=True)
    with open(lockfile, "rb") as lf:
        h = hashlib.sha1(lf.read()).hexdigest()
    with open(os.path.join(modules_dir, ".modules_hash"), "w", encoding="utf-8") as f:
        f.write(h)


log("Setup gestartet")
log(f"Python-Version: {sys.version.split()[0]} auf {sys.platform}")
if sys.version_info < (3, 9):
    # Python-Version ist zu alt
    print("[Fehler] Python 3.9 oder neuer wird benoetigt.")
    log("Python-Version zu alt")
    sys.exit(1)
if sys.version_info >= (3, 13):
    # Warnung fuer noch nicht unterstuetzte Python-Version
    print("[Warnung] Python 3.13 oder neuer erkannt. Diese Version wird moeglicherweise nicht unterstuetzt.")
    log("Python-Version zu neu")
    antwort = input("Fortsetzen? [j/N] ")
    if antwort.lower() not in ("j", "ja"):
        print("Abbruch.")
        sys.exit(1)

if sys.maxsize <= 2**32:
    print("[Fehler] 32-Bit-Python wird nicht unterstuetzt. Bitte 64-Bit installieren.")
    log("Python-Architektur 32-Bit")
    sys.exit(1)
print("=== Starte HLA Translation Tool Setup ===")

# "--check" startet nur einen kurzen Testlauf der Desktop-App
CHECK_MODE = "--check" in sys.argv

if CHECK_MODE:
    log("Check-Modus aktiviert")
    print("Kurzer Testlauf wird gestartet...")
    os.chdir(os.path.join(BASE_DIR, "electron"))
    uid = None
    geteuid = getattr(os, "geteuid", None)
    if geteuid is not None:
        uid = geteuid()
        log(f"Aktuelle UID: {uid}")
    else:
        log("Keine UID verfuegbar (Windows?)")

    try:
        if uid == 0:
            log("Starte Electron ohne Sandbox (Test)")
            proc = subprocess.Popen("npm start -- --no-sandbox", shell=True)
        else:
            log("Starte Electron mit Sandbox (Test)")
            proc = subprocess.Popen("npm start", shell=True)
        # Fünf Sekunden laufen lassen
        import time
        time.sleep(5)
        proc.terminate()
        proc.wait(timeout=10)
        log("Testlauf beendet")
        sys.exit(0 if proc.returncode == 0 else 1)
    except Exception as e:
        log("Testlauf fehlgeschlagen")
        log(str(e))
        print("[Fehler] Testlauf fehlgeschlagen. Weitere Details siehe setup.log")
        sys.exit(1)

# ----------------------- Git pruefen -----------------------
log("Pruefe Git-Version")
try:
    run(["git", "--version"])
except subprocess.CalledProcessError as e:
    print("[Fehler] Git wurde nicht gefunden. Bitte installieren und im PATH verfuegbar machen.")
    print("Weitere Details siehe setup.log")
    log("Git nicht gefunden")
    log(str(e))
    sys.exit(1)

# ----------------------- Node pruefen ----------------------
log("Pruefe Node-Version")
try:
    run(["node", "--version"])
    # Version erneut abfragen, um sie auswerten zu koennen
    output = subprocess.check_output("node --version", shell=True, text=True).strip()
    log(f"Gefundene Node-Version: {output}")
    try:
        major = int(output.lstrip("v").split(".")[0])
    except ValueError:
        major = None
    # Node 22 wird nun ebenfalls unterstuetzt
    if major is None or major < 18 or major >= 23:
        print(f"[Fehler] Node.js Version {output} wird nicht unterstuetzt. Bitte Node 18–22 installieren.")
        log("Unpassende Node-Version")
        sys.exit(1)
except subprocess.CalledProcessError as e:
    print("[Fehler] Node.js wurde nicht gefunden. Bitte installieren und im PATH verfuegbar machen.")
    print("Weitere Details siehe setup.log")
    log("Node.js nicht gefunden")
    log(str(e))
    sys.exit(1)

# ----------------------- npm pruefen -----------------------
log("Pruefe npm-Version")
try:
    run(["npm", "--version"])
except subprocess.CalledProcessError as e:
    print("[Fehler] npm wurde nicht gefunden. Node 22 enthaelt standardmaessig kein npm. Bitte \"npm install -g npm\" oder \"corepack enable\" ausfuehren.")
    print("Weitere Details siehe setup.log")
    log("npm nicht gefunden")
    log(str(e))
    sys.exit(1)

log("Repository-Pruefung")
# Arbeitsverzeichnis, in dem das Skript gestartet wurde
cwd = os.getcwd()
# Spaeter genutzter Pfad zum Repository
repo_path = None

# 1) Liegt im aktuellen Arbeitsverzeichnis bereits ein Git-Repository?
if os.path.exists(os.path.join(cwd, ".git")):
    repo_path = cwd
# 2) Liegt im Arbeitsverzeichnis ein Unterordner mit dem Repository?
elif os.path.exists(os.path.join(cwd, "hla_translation_tool", ".git")):
    repo_path = os.path.join(cwd, "hla_translation_tool")
# 3) Befindet sich das Repository im Ordner dieses Skripts?
elif os.path.exists(os.path.join(BASE_DIR, ".git")):
    repo_path = BASE_DIR
# 4) Liegt es als Unterordner neben diesem Skript?
elif os.path.exists(os.path.join(BASE_DIR, "hla_translation_tool", ".git")):
    repo_path = os.path.join(BASE_DIR, "hla_translation_tool")
else:
    # Kein Repository vorhanden -> Klonen in den Skriptordner
    repo_path = os.path.join(BASE_DIR, "hla_translation_tool")
    if not os.path.exists(repo_path):
        print("Repository wird geklont...")
        log("Repository wird geklont")
        run(["git", "clone", "https://github.com/Lumorn/hla_translation_tool", repo_path])

os.chdir(repo_path)


# ----------------------- Repository aktualisieren ----------------------
HEAD_FILE = os.path.join(repo_path, ".last_head")
current_head = subprocess.check_output("git rev-parse HEAD", shell=True, text=True).strip()
last_head = None
if os.path.exists(HEAD_FILE):
    with open(HEAD_FILE, "r", encoding="utf-8") as f:
        last_head = f.read().strip()

if current_head == last_head:
    log("Repository unver\u00e4ndert - \u00fcberspringe Reset und Pull")
else:
    log("Setze Repository zur\u00fcck und hole Updates")
    try:
        if has_remote():
            run(["git", "fetch", "--depth=1"])
            run(["git", "reset", "--hard", "origin/main"])
        else:
            log("Kein Remote gefunden - setze lokal zurueck")
            run(["git", "reset", "--hard", "HEAD"])
        run([
            "git",
            "clean",
            "-fd",
            "-e",
            "web/sounds",
            "-e",
            "web/Sounds",
            "-e",
            "web/backups",
            "-e",
            "web/Backups",
            "-e",
            "web/Download",
        ])
        current_head = subprocess.check_output("git rev-parse HEAD", shell=True, text=True).strip()
        with open(HEAD_FILE, "w", encoding="utf-8") as f:
            f.write(current_head)
        log("Repository aktualisiert")
    except subprocess.CalledProcessError as e:
        print("git-Update fehlgeschlagen. Weitere Details siehe setup.log")
        log("git-Update fehlgeschlagen")
        log(str(e))


# ----------------------- Python-Abhängigkeiten installieren -----------------
log("Installiere Python-Abhaengigkeiten")
req_file = os.path.join(repo_path, "requirements.txt")
if os.path.exists(req_file):
    try:
        with open(req_file, "r", encoding="utf-8") as f:
            packages = []
            for ln in f:
                # Kommentare am Zeilenende entfernen, damit pip keine Fehlermeldung wirft
                clean = ln.split("#", 1)[0].strip()
                if clean:
                    packages.append(clean)
        missing = []
        for pkg in packages:
            mod = pkg.split("==")[0].split(">=")[0]
            if not has_module(mod):
                missing.append(pkg)
        if missing:
            # Pakete ohne Shell-Pufferung installieren
            cmd = [sys.executable, "-m", "pip", "install", "--disable-pip-version-check", "-q", *missing]
            log("Fuehre aus: " + " ".join(cmd))
            subprocess.check_call(cmd)
        log("pip install erfolgreich")
    except subprocess.CalledProcessError as e:
        print("pip install fehlgeschlagen. Weitere Details siehe setup.log")
        log("pip install fehlgeschlagen")
        log(str(e))
        sys.exit(1)
else:
    log("requirements.txt nicht gefunden")
# ----------------------- Haupt-Abhaengigkeiten installieren -----------------
log("npm ci (root) starten")
if needs_npm_ci("package-lock.json", "node_modules"):
    print("Abhaengigkeiten im Hauptverzeichnis werden installiert...")
    try:
        run(["npm", "ci", "--prefer-offline", "--no-audit", "--progress=false"])
        log("npm ci (root) erfolgreich")
        write_npm_hash("package-lock.json", "node_modules")
    except subprocess.CalledProcessError as e:
        print("npm ci im Hauptverzeichnis fehlgeschlagen. Weitere Details siehe setup.log")
        log("npm ci (root) fehlgeschlagen")
        log(str(e))
        sys.exit(1)
else:
    log("node_modules sind aktuell - npm ci wird uebersprungen")

# Sicherstellen, dass der Electron-Ordner existiert
if not os.path.isdir("electron"):
    print("'electron'-Ordner fehlt, wird wiederhergestellt...")
    log("Electron-Ordner fehlt - versuche Wiederherstellung")
    try:
        run(["git", "checkout", "--", "electron"])
        log("Electron-Ordner wiederhergestellt")
    except subprocess.CalledProcessError as e:
        print("Electron-Ordner konnte nicht wiederhergestellt werden. Weitere Details siehe setup.log")
        log("Electron-Ordner konnte nicht wiederhergestellt werden")
        log(str(e))
        sys.exit(1)

# ----------------------- Electron-Setup --------------------
os.chdir("electron")
log("npm ci starten")
if needs_npm_ci("package-lock.json", "node_modules"):
    print("Abhaengigkeiten werden installiert...")
    try:
        run(["npm", "ci", "--prefer-offline", "--no-audit", "--progress=false"])
        log("npm ci erfolgreich")
        write_npm_hash("package-lock.json", "node_modules")
    except subprocess.CalledProcessError:
        print("npm ci fehlgeschlagen. Weitere Details siehe setup.log")
        log("npm ci fehlgeschlagen")
        log(str(sys.exc_info()[1]))
        sys.exit(1)
else:
    log("node_modules sind aktuell - npm ci wird uebersprungen")

# Nach der Installation pruefen, ob das Electron-Modul existiert
if not os.path.isdir(os.path.join("node_modules", "electron")):
    print("Electron-Modul fehlt, wird nachinstalliert...")
    log("Electron-Modul fehlt - versuche 'npm install electron'")
    install_error = False
    try:
        run(["npm", "install", "electron"])
        log("npm install electron erfolgreich")
    except subprocess.CalledProcessError as e:
        install_error = True
        print("npm install electron fehlgeschlagen. Weitere Details siehe setup.log")
        log("npm install electron fehlgeschlagen")
        log(str(e))
    # Nach der Installation erneut pruefen
    if not os.path.isdir(os.path.join("node_modules", "electron")):
        print("[Fehler] Electron-Modul fehlt weiterhin.")
        log("Electron-Modul weiterhin nicht vorhanden")
        sys.exit(1)
    elif install_error:
        # Modul existiert, aber die Installation meldete Fehler
        print("Electron wurde installiert, trotz Fehlermeldung.")

print("Anwendung wird gestartet...")
log("Starte Anwendung")

# Betriebssystem und Benutzer-ID protokollieren
uid = None
geteuid = getattr(os, "geteuid", None)
if geteuid is not None:
    uid = geteuid()
    log(f"Aktuelle UID: {uid}")
else:
    log("Keine UID verfuegbar (Windows?)")

# Unter Windows existiert os.geteuid nicht. Darum pruefen wir zuerst,
# ob die Funktion vorhanden ist. Wenn root erkannt wird, startet Electron ohne Sandbox.
try:
    if uid == 0:
        log("Starte Electron ohne Sandbox")
        run(["npm", "start", "--", "--no-sandbox"])
    else:
        log("Starte Electron mit Sandbox")
        run(["npm", "start"])
except subprocess.CalledProcessError as e:
    print("[Fehler] Anwendung konnte nicht gestartet werden. Weitere Details siehe setup.log")
    log("Anwendung konnte nicht gestartet werden")
    log(str(e))
finally:
    log("Anwendung beendet")
    print(f"Log gespeichert unter {LOGFILE}")
    print("Vorgang abgeschlossen.")
    # Im normalen Modus auf Nutzereingabe warten
    if not CHECK_MODE:
        input("Zum Beenden Enter drücken...")
