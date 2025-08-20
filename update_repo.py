#!/usr/bin/env python3
"""update_repo.py
Prüft, ob das lokale Git-Repository aktuell ist und führt bei Bedarf ein
Update durch. Anschließend werden die eingespielten Commits angezeigt.
"""

import subprocess


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    """Hilfsfunktion zum Ausführen eines Kommandos."""
    return subprocess.run(cmd, capture_output=True, text=True, check=True)


def main() -> None:
    """Hauptfunktion des Skripts."""
    try:
        result = run(["git", "rev-parse", "--is-inside-work-tree"])
        if result.stdout.strip() != "true":
            raise subprocess.CalledProcessError(1, "git rev-parse")
    except subprocess.CalledProcessError:
        print("Dieses Verzeichnis ist kein Git-Repository.")
        input("Mit Enter schließen...")
        return

    try:
        branch_res = run(["git", "rev-parse", "--abbrev-ref", "HEAD"])
        branch = branch_res.stdout.strip()
    except subprocess.CalledProcessError:
        print("Aktueller Branch konnte nicht ermittelt werden.")
        input("Mit Enter schließen...")
        return

    try:
        upstream_res = run(["git", "rev-parse", "--abbrev-ref", "@{u}"])
        upstream = upstream_res.stdout.strip()
    except subprocess.CalledProcessError:
        upstream = f"origin/{branch}"

    print("Prüfe auf Updates...")
    run(["git", "fetch"])

    try:
        behind_res = run(["git", "rev-list", "--count", f"{branch}..{upstream}"])
        behind = int(behind_res.stdout.strip())
    except subprocess.CalledProcessError:
        print("Kein Remote-Repository konfiguriert oder Upstream unbekannt.")
        input("Mit Enter schließen...")
        return
    if behind == 0:
        print("Alles aktuell. Keine Updates verfügbar.")
        input("Mit Enter schließen...")
        return

    log_res = run(["git", "log", "--oneline", f"{branch}..{upstream}"])
    print("Folgende Änderungen werden übernommen:")
    print(log_res.stdout)

    try:
        run(["git", "pull"])
        print("Repository wurde aktualisiert.")
    except subprocess.CalledProcessError as e:
        print("Fehler beim Aktualisieren:")
        print(e.stderr)
        input("Mit Enter schließen...")
        return

    input("Fertig. Mit Enter schließen...")


if __name__ == "__main__":
    main()

