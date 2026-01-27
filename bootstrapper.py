import os
import subprocess
import sys
import venv
import traceback


def create_venv() -> None:
    """Erstellt bei Bedarf ein lokales virtuelles Environment."""
    venv_path = os.path.join(os.getcwd(), "venv")
    if not os.path.isdir(venv_path):
        builder = venv.EnvBuilder(with_pip=True)
        builder.create(venv_path)


def install_requirements() -> None:
    """Installiert die V3-Abhängigkeiten in die aktuelle Python-Umgebung."""
    requirements_path = os.path.join(os.getcwd(), "v3", "requirements.txt")
    subprocess.run(
        [sys.executable, "-m", "pip", "install", "-r", requirements_path],
        check=True,
    )


def run_app() -> None:
    """Startet die V3-App über den Modulaufruf."""
    env = os.environ.copy()
    env["PYTHONPATH"] = os.getcwd()
    subprocess.run([sys.executable, "-m", "v3.main"], check=True, env=env)


def main() -> int:
    try:
        create_venv()
        install_requirements()
        run_app()
    except Exception:
        error_text = traceback.format_exc()
        print(f"\033[91m{error_text}\033[0m")
        input("Drücke Enter zum Beenden...")
        return 1

    input("Drücke Enter zum Beenden...")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
