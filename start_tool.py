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
    log(f"Fuehre aus: {cmd}")
    subprocess.check_call(cmd, shell=True)


log("Setup gestartet")
log(f"Python-Version: {sys.version.split()[0]} auf {sys.platform}")
print("=== Starte HLA Translation Tool Setup ===")

# ----------------------- Git pruefen -----------------------
log("Pruefe Git-Version")
try:
    run("git --version")
except subprocess.CalledProcessError as e:
    print("[Fehler] Git wurde nicht gefunden. Bitte installieren und im PATH verfuegbar machen.")
    print("Weitere Details siehe setup.log")
    log("Git nicht gefunden")
    log(str(e))
    sys.exit(1)

# ----------------------- Node pruefen ----------------------
log("Pruefe Node-Version")
try:
    run("node --version")
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
    run("npm --version")
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
        run(f"git clone https://github.com/Lumorn/hla_translation_tool \"{repo_path}\"")

os.chdir(repo_path)

# ----------------------- Lokale Änderungen verwerfen --------------------
log("Verwerfe lokale Änderungen")
try:
    # Kompletter Reset, Sounds- und Backup-Ordner bleiben unberührt
    run("git reset --hard HEAD")
    log("Lokale Änderungen verworfen")
except subprocess.CalledProcessError:
    print("git reset fehlgeschlagen. Weitere Details siehe setup.log")
    log("git reset fehlgeschlagen")
    log(str(sys.exc_info()[1]))

# ----------------------- git pull --------------------------
log("git pull starten")
print("Neueste Aenderungen werden geholt...")
try:
    run("git pull")
    log("git pull erfolgreich")
except subprocess.CalledProcessError:
    print("git pull fehlgeschlagen. Weitere Details siehe setup.log")
    log("git pull fehlgeschlagen")
    log(str(sys.exc_info()[1]))

# ----------------------- Nicht mehr benötigte Dateien entfernen -----------------
log("Bereinige verwaiste Dateien")
try:
    # Sounds- und Backups-Ordner niemals löschen
    run("git clean -fd -e web/sounds -e web/Sounds -e web/backups -e web/Backups -e web/Download")
    log("Verwaiste Dateien bereinigt")
except subprocess.CalledProcessError:
    print("git clean fehlgeschlagen. Weitere Details siehe setup.log")
    log("git clean fehlgeschlagen")
    log(str(sys.exc_info()[1]))

# ----------------------- Haupt-Abhaengigkeiten installieren -----------------
log("npm ci (root) starten")
print("Abhaengigkeiten im Hauptverzeichnis werden installiert...")
try:
    run("npm ci")
    log("npm ci (root) erfolgreich")
except subprocess.CalledProcessError as e:
    print("npm ci im Hauptverzeichnis fehlgeschlagen. Weitere Details siehe setup.log")
    log("npm ci (root) fehlgeschlagen")
    log(str(e))
    sys.exit(1)

# Sicherstellen, dass der Electron-Ordner existiert
if not os.path.isdir("electron"):
    print("'electron'-Ordner fehlt, wird wiederhergestellt...")
    log("Electron-Ordner fehlt - versuche Wiederherstellung")
    try:
        run("git checkout -- electron")
        log("Electron-Ordner wiederhergestellt")
    except subprocess.CalledProcessError as e:
        print("Electron-Ordner konnte nicht wiederhergestellt werden. Weitere Details siehe setup.log")
        log("Electron-Ordner konnte nicht wiederhergestellt werden")
        log(str(e))
        sys.exit(1)

# ----------------------- Electron-Setup --------------------
os.chdir("electron")
log("npm ci starten")
print("Abhaengigkeiten werden installiert...")
try:
    run("npm ci")
    log("npm ci erfolgreich")
except subprocess.CalledProcessError:
    print("npm ci fehlgeschlagen. Weitere Details siehe setup.log")
    log("npm ci fehlgeschlagen")
    log(str(sys.exc_info()[1]))
    sys.exit(1)

# Nach der Installation pruefen, ob das Electron-Modul existiert
if not os.path.isdir(os.path.join("node_modules", "electron")):
    print("Electron-Modul fehlt, wird nachinstalliert...")
    log("Electron-Modul fehlt - versuche 'npm install electron'")
    install_error = False
    try:
        run("npm install electron")
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
        run("npm start -- --no-sandbox")
    else:
        log("Starte Electron mit Sandbox")
        run("npm start")
except subprocess.CalledProcessError as e:
    print("[Fehler] Anwendung konnte nicht gestartet werden. Weitere Details siehe setup.log")
    log("Anwendung konnte nicht gestartet werden")
    log(str(e))
finally:
    log("Anwendung beendet")
    print(f"Log gespeichert unter {LOGFILE}")
    print("Vorgang abgeschlossen.")
    # Fenster offen halten, damit Fehlermeldungen sichtbar bleiben
    input("Zum Beenden Enter drücken...")
