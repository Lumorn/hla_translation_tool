# reset_repo.py
"""
Ein Skript zum sauberen Zurücksetzen des Repositories, Installieren aller Abhängigkeiten
und Starten der Desktop-Version.

Änderungen:
- Bevorzuge vorhandenes npm (PATH). Corepack nur als Fallback, wenn npm fehlt.
- Prüfe git und npm robust (inkl. Windows-kompatibler Suche).
- Klarere Ausgaben und Fehlerbehandlung.
"""

from __future__ import annotations
import os
import sys
import shutil
import subprocess
from typing import Iterable, Optional


# -----------------------------
# Utilities
# -----------------------------

def is_windows() -> bool:
    return os.name == "nt"


def which_exe(name: str) -> Optional[str]:
    """
    Findet ein ausführbares Programm plattformgerecht.
    Unter Windows werden auch .cmd / .exe aufgelöst.
    """
    path = shutil.which(name)
    if path:
        return path
    if is_windows():
        for suffix in (".cmd", ".exe", ".bat"):
            path = shutil.which(name + suffix)
            if path:
                return path
    return None


def run(cmd: Iterable[str], cwd: Optional[str] = None) -> None:
    """Führt einen Prozess mit sichtbarer Ausgabe aus und bricht bei Fehler ab."""
    cmd_list = list(cmd)
    print(f"\n▶️  Führe aus: {' '.join(cmd_list)}" + (f"   (cwd={cwd})" if cwd else ""))
    subprocess.run(cmd_list, check=True, cwd=cwd)


def print_header(title: str) -> None:
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


def pause(msg: str = "Fertig. Mit Enter schließen...") -> None:
    try:
        input(msg)
    except EOFError:
        pass


# -----------------------------
# Tool Checks
# -----------------------------

def ensure_git() -> str:
    exe = which_exe("git")
    if not exe:
        print(
            "❌  Git wurde nicht gefunden.\n"
            "    Bitte Git installieren und sicherstellen, dass es im PATH liegt:\n"
            "    https://git-scm.com/downloads"
        )
        pause()
        sys.exit(1)
    print(f"✅  Git gefunden: {exe}")
    try:
        run([exe, "--version"])
    except subprocess.CalledProcessError:
        print("❌  Konnte 'git --version' nicht ausführen.")
        pause()
        sys.exit(1)
    return exe


def ensure_npm() -> str:
    """
    Versucht zuerst, ein vorhandenes npm aus dem PATH zu verwenden.
    Wenn nicht vorhanden, versucht (falls verfügbar) Corepack als Fallback.
    Gibt den Pfad zur npm-Executable zurück oder beendet mit Fehler.
    """
    npm_exe = which_exe("npm")
    if npm_exe:
        print(f"✅  npm gefunden: {npm_exe}")
        try:
            run([npm_exe, "--version"])
            return npm_exe
        except subprocess.CalledProcessError:
            print("❌  'npm --version' schlug fehl.")
            pause()
            sys.exit(1)

    # Fallback: Corepack probieren, wenn vorhanden
    corepack_exe = which_exe("corepack")
    if corepack_exe:
        print("ℹ️  npm nicht gefunden. Versuche Corepack zu aktivieren...")
        try:
            run([corepack_exe, "enable"])
            run([corepack_exe, "prepare", "npm@latest", "--activate"])
            npm_exe = which_exe("npm")
            if npm_exe:
                print(f"✅  npm über Corepack verfügbar: {npm_exe}")
                run([npm_exe, "--version"])
                return npm_exe
        except subprocess.CalledProcessError:
            print("⚠️  Corepack konnte npm nicht bereitstellen.")

    # Kein npm verfügbar
    print(
        "❌  npm wurde nicht gefunden und konnte nicht automatisch bereitgestellt werden.\n"
        "    Bitte Node.js (inkl. npm) installieren: https://nodejs.org/\n"
        "    Anschließend sicherstellen, dass 'npm' im PATH verfügbar ist."
    )
    pause()
    sys.exit(1)


# -----------------------------
# Main workflow
# -----------------------------

def main() -> None:
    # In das Repo-Wurzelverzeichnis wechseln (Verzeichnis dieser Datei)
    repo_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(repo_dir)

    print_header("Initiale Prüfungen")
    git_exe = ensure_git()
    npm_exe = ensure_npm()

    # Pfade
    electron_dir = os.path.join(repo_dir, "electron")
    if not os.path.isdir(electron_dir):
        print(
            f"❌  Ordner 'electron' nicht gefunden bei: {electron_dir}\n"
            "    Bitte Skript im Repo-Wurzelordner ausführen."
        )
        pause()
        sys.exit(1)

    print_header("Git-Reset & Clean")
    try:
        run([git_exe, "reset", "--hard", "HEAD"])
        run([
            git_exe,
            "clean",
            "-fd",
            "-e", "web/sounds",
            "-e", "web/Sounds",
            "-e", "web/backups",
            "-e", "web/Backups",
            "-e", "web/Download",
        ])
        run([git_exe, "pull"])
    except subprocess.CalledProcessError as e:
        print(f"❌  Git-Befehl fehlgeschlagen: {e}")
        pause()
        sys.exit(e.returncode if hasattr(e, "returncode") else 1)

    print_header("Dependencies installieren (Root)")
    try:
        # NPM v7+ nutzt automatisch package-lock; 'ci' ist deterministisch
        run([npm_exe, "ci"])
    except subprocess.CalledProcessError as e:
        print("❌  'npm ci' im Root ist fehlgeschlagen.")
        pause()
        sys.exit(e.returncode if hasattr(e, "returncode") else 1)

    print_header("Dependencies installieren (electron)")
    try:
        run([npm_exe, "ci"], cwd=electron_dir)
    except subprocess.CalledProcessError as e:
        print("❌  'npm ci' im Ordner 'electron' ist fehlgeschlagen.")
        pause()
        sys.exit(e.returncode if hasattr(e, "returncode") else 1)

    print_header("Desktop-App starten (electron)")
    try:
        run([npm_exe, "start"], cwd=electron_dir)
    except subprocess.CalledProcessError as e:
        print("❌  Start der Desktop-App ist fehlgeschlagen.")
        pause()
        sys.exit(e.returncode if hasattr(e, "returncode") else 1)

    print("\n✅  Tool wurde erfolgreich gestartet.")
    pause()


if __name__ == "__main__":
    main()
