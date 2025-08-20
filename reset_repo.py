"""reset_repo.py
Ein Skript zum Zurücksetzen des Repositories, Installieren aller Abhängigkeiten
und Starten der Desktop-Version. Nur doppelklicken und warten.
"""

import os
import subprocess


def run(cmd: list[str], cwd: str | None = None) -> None:
    """Hilfsfunktion zum Ausführen eines Befehls."""
    print(f"Führe aus: {' '.join(cmd)}")
    try:
        subprocess.run(cmd, check=True, cwd=cwd)
    except FileNotFoundError as e:
        # Fehlende Programme als normalen Fehler weiterreichen
        raise subprocess.CalledProcessError(127, cmd) from e


def main() -> None:
    # Verzeichnis dieses Skripts ermitteln
    repo_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(repo_dir)

    electron_dir = os.path.join(repo_dir, "electron")

    try:
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
        run(["git", "pull"])
        print("Installiere Abh\u00e4ngigkeiten im Hauptordner...")
        run(["npm", "ci"])
        print("Installiere Abh\u00e4ngigkeiten im electron-Ordner...")
        run(["npm", "ci"], cwd=electron_dir)
        print("Starte Desktop-App...")
        run(["npm", "start"], cwd=electron_dir)
    except subprocess.CalledProcessError as e:
        print(f"Fehler: {e}")
    else:
        print("Tool wurde erfolgreich gestartet.")
    finally:
        input("Fertig. Mit Enter schliessen...")


if __name__ == "__main__":
    main()
