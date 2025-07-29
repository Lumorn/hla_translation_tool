#!/usr/bin/env python3
"""update_repo.py
Prüft, ob das lokale Git-Repository aktuell ist und führt bei Bedarf ein
Update durch. Anschließend werden die eingespielten Commits angezeigt.
"""

import subprocess


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    """Hilfsfunktion zum Ausführen eines Kommandos."""
    return subprocess.run(cmd, capture_output=True, text=True)


def main() -> None:
    """Hauptfunktion des Skripts."""
    result = run(["git", "rev-parse", "--is-inside-work-tree"])
    if result.returncode != 0 or result.stdout.strip() != "true":
        print("Dieses Verzeichnis ist kein Git-Repository.")
        input("Mit Enter schließen...")
        return

    branch_res = run(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    if branch_res.returncode != 0:
        print("Aktueller Branch konnte nicht ermittelt werden.")
        input("Mit Enter schließen...")
        return
    branch = branch_res.stdout.strip()

    upstream_res = run(["git", "rev-parse", "--abbrev-ref", "@{u}"])
    if upstream_res.returncode == 0:
        upstream = upstream_res.stdout.strip()
    else:
        upstream = f"origin/{branch}"

    print("Prüfe auf Updates...")
    run(["git", "fetch"])

    behind_res = run(["git", "rev-list", "--count", f"{branch}..{upstream}"])
    if behind_res.returncode != 0:
        print("Kein Remote-Repository konfiguriert oder Upstream unbekannt.")
        input("Mit Enter schließen...")
        return

    behind = int(behind_res.stdout.strip())
    if behind == 0:
        print("Alles aktuell. Keine Updates verfügbar.")
        input("Mit Enter schließen...")
        return

    log_res = run(["git", "log", "--oneline", f"{branch}..{upstream}"])
    print("Folgende Änderungen werden übernommen:")
    print(log_res.stdout)

    pull_res = run(["git", "pull"])
    if pull_res.returncode == 0:
        print("Repository wurde aktualisiert.")
    else:
        print("Fehler beim Aktualisieren:")
        print(pull_res.stderr)
        input("Mit Enter schließen...")
        return

    input("Fertig. Mit Enter schließen...")


if __name__ == "__main__":
    main()

