"""reset_repo.py
Einfaches Skript, um das Git-Repository des HLA Translation Tools komplett
zurueckzusetzen und die neuesten Aenderungen zu holen.
Nur doppelklicken und warten.
"""

import os
import subprocess


def run(cmd: str) -> None:
    """Hilfsfunktion zum Ausfuehren eines Befehls."""
    print(f"Fuehre aus: {cmd}")
    subprocess.check_call(cmd, shell=True)


def main() -> None:
    # Verzeichnis dieses Skripts ermitteln
    repo_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(repo_dir)

    try:
        run("git reset --hard HEAD")
        run("git clean -fd")
        run("git pull")
    except subprocess.CalledProcessError as e:
        print(f"Fehler: {e}")
    else:
        print("Repository wurde erfolgreich aktualisiert.")
    finally:
        input("Fertig. Mit Enter schliessen...")


if __name__ == "__main__":
    main()
