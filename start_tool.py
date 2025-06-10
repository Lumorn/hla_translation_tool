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

# Pfad dieses Skripts und Log-Datei festlegen
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOGFILE = os.path.join(BASE_DIR, "setup.log")


def log(message: str) -> None:
    """Nachricht mit Zeitstempel in die Log-Datei schreiben."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(LOGFILE, "a", encoding="utf-8") as f:
        f.write(f"{timestamp} {message}\n")


def run(cmd: str) -> None:
    """Kommando ausfuehren und Ausgabe direkt weitergeben."""
    subprocess.check_call(cmd, shell=True)


log("Setup gestartet")
print("=== Starte HLA Translation Tool Setup ===")

# ----------------------- Git pruefen -----------------------
log("Pruefe Git-Version")
try:
    run("git --version")
except subprocess.CalledProcessError:
    print("[Fehler] Git wurde nicht gefunden. Bitte installieren und im PATH verfuegbar machen.")
    log("Git nicht gefunden")
    sys.exit(1)

# ----------------------- Node pruefen ----------------------
log("Pruefe Node-Version")
try:
    run("node --version")
except subprocess.CalledProcessError:
    print("[Fehler] Node.js wurde nicht gefunden. Bitte installieren und im PATH verfuegbar machen.")
    log("Node.js nicht gefunden")
    sys.exit(1)

# ----------------------- npm pruefen -----------------------
log("Pruefe npm-Version")
try:
    run("npm --version")
except subprocess.CalledProcessError:
    print("[Fehler] npm wurde nicht gefunden. Node 22 enthaelt standardmaessig kein npm. Bitte \"npm install -g npm\" oder \"corepack enable\" ausfuehren.")
    log("npm nicht gefunden")
    sys.exit(1)

log("Repository-Pruefung")
# Standardpfad ist der Ordner dieses Skripts
repo_path = BASE_DIR
# Liegt hier kein Git-Repo, wird in den Unterordner gewechselt bzw. geklont
if not os.path.exists(os.path.join(repo_path, ".git")):
    repo_path = os.path.join(BASE_DIR, "hla_translation_tool")
    if not os.path.exists(os.path.join(repo_path, ".git")):
        if not os.path.exists(repo_path):
            print("Repository wird geklont...")
            log("Repository wird geklont")
            run(f"git clone https://github.com/Lumorn/hla_translation_tool \"{repo_path}\"")
    os.chdir(repo_path)
else:
    os.chdir(repo_path)

# ----------------------- Lokale Änderungen verwerfen --------------------
log("Verwerfe lokale Änderungen")
try:
    # Sounds-Ordner nicht überschreiben
    run("git reset --hard HEAD -- :!sounds")
    log("Lokale Änderungen verworfen")
except subprocess.CalledProcessError:
    log("git reset fehlgeschlagen")

# ----------------------- git pull --------------------------
log("git pull starten")
print("Neueste Aenderungen werden geholt...")
try:
    run("git pull")
    log("git pull erfolgreich")
except subprocess.CalledProcessError:
    log("git pull fehlgeschlagen")

# Sicherstellen, dass der Electron-Ordner existiert
if not os.path.isdir("electron"):
    print("'electron'-Ordner fehlt, wird wiederhergestellt...")
    log("Electron-Ordner fehlt - versuche Wiederherstellung")
    try:
        run("git checkout -- electron")
        log("Electron-Ordner wiederhergestellt")
    except subprocess.CalledProcessError:
        log("Electron-Ordner konnte nicht wiederhergestellt werden")
        sys.exit(1)

# ----------------------- Electron-Setup --------------------
os.chdir("electron")
log("npm install starten")
print("Abhaengigkeiten werden installiert...")
try:
    run("npm install")
    log("npm install erfolgreich")
except subprocess.CalledProcessError:
    log("npm install fehlgeschlagen")
    sys.exit(1)

print("Anwendung wird gestartet...")
log("Starte Anwendung")

# Unter Windows existiert os.geteuid nicht. Darum pruefen wir zuerst,
# ob die Funktion vorhanden ist. Wenn sie vorhanden ist und einen
# Root-User meldet, muss Electron ohne Sandbox gestartet werden.
geteuid = getattr(os, "geteuid", None)
if geteuid is not None and geteuid() == 0:
    run("npm start -- --no-sandbox")
else:
    run("npm start")

log("Anwendung beendet")
print(f"Log gespeichert unter {LOGFILE}")
print("Vorgang abgeschlossen.")
