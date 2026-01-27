import os
import subprocess
import sys


def main():
    print("=== HLA Translation Tool V3 Launcher ===")

    base_dir = os.path.dirname(os.path.abspath(__file__))
    v3_main = os.path.join(base_dir, "v3", "main.py")

    if not os.path.exists(v3_main):
        print(f"FEHLER: Konnte die Datei nicht finden:\n{v3_main}")
        input("\nDrücke Enter zum Beenden...")
        return

    env = os.environ.copy()
    env["PYTHONPATH"] = base_dir

    print(f"Starte: {v3_main}...")
    print("----------------------------------------\n")

    try:
        result = subprocess.run([sys.executable, v3_main], cwd=base_dir, env=env)

        if result.returncode != 0:
            print("\n----------------------------------------")
            print(f"Das Programm wurde mit Fehlercode {result.returncode} beendet.")
            print("Überprüfe die Fehlermeldung oben.")
            input("Drücke Enter zum Beenden...")
    except Exception as exc:
        print(f"\nKRITISCHER FEHLER beim Starten: {exc}")
        input("Drücke Enter zum Beenden...")


if __name__ == "__main__":
    main()
