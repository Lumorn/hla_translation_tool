#!/usr/bin/env python3
"""verify_environment.py
Prüft die installierten Versionen von Python, Node und npm sowie die wichtigsten
Ordner. Fehlen Abhängigkeiten oder Ordner, versucht das Skript diese automatisch
nachzuladen. Mit ``--check-only`` lassen sich die Reparaturversuche abschalten."""

import os
import subprocess
import sys
import importlib.util
import json
from importlib import metadata

# Verpackung für Versionsabgleiche sicherstellen
try:
    from packaging.requirements import Requirement
    from packaging.version import Version
    from packaging.specifiers import SpecifierSet
except Exception:  # pragma: no cover - nur beim ersten Lauf nötig
    subprocess.run([sys.executable, "-m", "pip", "install", "packaging"], check=False)
    from packaging.requirements import Requirement
    from packaging.version import Version
    from packaging.specifiers import SpecifierSet

FAIL: list[str] = []  # gescheiterte Paket-Installationen sammeln

FIX_MODE = "--check-only" not in sys.argv
# Terminal nach der Ausgabe offen lassen?
PAUSE = "--no-pause" not in sys.argv

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REPORTS: list[tuple[str, bool, str]] = []


def report(name: str, ok: bool, detail: str = "") -> None:
    """Gibt das Ergebnis einer Prüfung mit Häkchen aus."""
    symbol = "✓" if ok else "✗"
    text = f"{symbol} {name}"
    if detail:
        text += f": {detail}"
    print(text)
    REPORTS.append((name, ok, detail))


def run(cmd: list[str], cwd: str | None = BASE_DIR) -> str:
    """Führt ein Kommando im angegebenen Verzeichnis aus und gibt die Ausgabe zurück."""
    result = subprocess.run(
        cmd, cwd=cwd, text=True, capture_output=True, check=True
    )
    return result.stdout.strip()


def ensure_package(requirement: str) -> None:
    """Installiert fehlende Python-Pakete oder korrigiert Versionen."""
    name = requirement.split("==")[0].split(">=")[0].split("<")[0].strip()
    mod = {
        "pillow": "PIL",
        "opencv-python-headless": "cv2",
    }.get(name.lower(), name)
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", requirement])
        __import__(mod)
    except Exception as e:
        FAIL.append(f"{requirement} ({e})")


def node_version_satisfies(installed: str, req: str) -> bool:
    """Vergleicht Node-Versionen grob nach SemVer-Regeln."""
    try:
        inst = Version(installed)
    except Exception:
        return False
    if req.startswith("^"):
        base = Version(req[1:])
        return inst >= base and inst.major == base.major
    if req.startswith("~"):
        base = Version(req[1:])
        return inst >= base and inst.major == base.major and inst.minor == base.minor
    if req.startswith(">="):
        base = Version(req[2:])
        return inst >= base
    return installed == req.lstrip("=")


def check_git_installed() -> bool:
    """Prüft, ob Git verfügbar ist."""
    try:
        version = run(["git", "--version"])
    except Exception:
        report("Git", False, "nicht gefunden")
        return False
    report("Git", True, version.split()[2])
    return True


def check_python() -> bool:
    """Prüft Version **und Architektur** von Python."""
    if sys.version_info < (3, 9):
        report("Python-Version", False, f"{sys.version.split()[0]} (<3.9)")
        return False
    if sys.maxsize <= 2**32:
        # Hinweis fuer 32-Bit-Umgebungen
        detail = "32-Bit nicht unterst\u00fctzt (64-Bit Python installieren)"
        report("Python-Architektur", False, detail)
        return False
    report("Python-Version", True, sys.version.split()[0])
    return True


def check_node() -> bool:
    """Prüft, ob eine unterstützte Node-Version installiert ist."""
    try:
        version = run(["node", "--version"])
    except Exception:
        report("Node-Version", False, "nicht gefunden")
        return False
    try:
        major = int(version.lstrip("v").split(".")[0])
    except ValueError:
        report("Node-Version", False, "unbekannt")
        return False
    if major < 18 or major >= 23:
        report("Node-Version", False, version)
        return False
    report("Node-Version", True, version)
    return True


def check_npm() -> bool:
    """Prüft, ob npm verfügbar ist."""
    try:
        version = run(["npm", "--version"])
    except Exception:
        report("npm", False, "nicht gefunden")
        return False
    report("npm", True, version)
    return True


def check_node_packages(retry: bool = False) -> bool:
    """Prüft, ob die in package.json genannten Node-Pakete installiert und in der richtigen Version vorliegen."""
    pkg_path = os.path.join(BASE_DIR, "package.json")
    if not os.path.exists(pkg_path):
        report("Node-Pakete", False, "package.json fehlt")
        return False
    try:
        result = subprocess.run(
            ["npm", "ls", "--depth=0", "--json"],
            cwd=BASE_DIR,
            text=True,
            capture_output=True,
            check=True,
        )
        data = json.loads(result.stdout or "{}")
    except subprocess.CalledProcessError as e:
        if FIX_MODE and not retry:
            try:
                subprocess.check_call(["npm", "ci", "--ignore-scripts"], cwd=BASE_DIR)
                return check_node_packages(True)
            except Exception as inst:
                report("Node-Pakete", False, str(inst))
                return False
        report("Node-Pakete", False, "npm ls fehlgeschlagen")
        return False

    with open(pkg_path, "r", encoding="utf-8") as f:
        pkg_json = json.load(f)
    required = {**pkg_json.get("dependencies", {}), **pkg_json.get("devDependencies", {})}
    deps = data.get("dependencies", {})
    fehlend: list[str] = []
    falsch: list[str] = []

    for name, req_ver in required.items():
        info = deps.get(name)
        if not info or info.get("missing"):
            fehlend.append(name)
            continue
        installed = info.get("version", "")
        if not node_version_satisfies(installed, req_ver):
            falsch.append(f"{name} {installed} ≠ {req_ver}")

    if (fehlend or falsch) and FIX_MODE and not retry:
        try:
            subprocess.check_call(["npm", "ci", "--ignore-scripts"], cwd=BASE_DIR)
            return check_node_packages(True)
        except Exception as inst:
            report("Node-Pakete", False, str(inst))
            return False

    if fehlend or falsch:
        teile: list[str] = []
        if fehlend:
            teile.append("fehlend: " + ", ".join(fehlend))
        if falsch:
            teile.append("Version: " + ", ".join(falsch))
        report("Node-Pakete", False, "; ".join(teile))
        return False

    report("Node-Pakete", True, "alle vorhanden")
    return True


def check_electron_folder() -> bool:
    """Kontrolliert, ob der Ordner 'electron' existiert."""
    path = os.path.join(BASE_DIR, "electron")
    if os.path.isdir(path):
        report("Electron-Ordner", True)
        return True
    if FIX_MODE:
        try:
            run(["git", "checkout", "--", "electron"])
        except Exception:
            pass
        if os.path.isdir(path):
            report("Electron-Ordner", True, "wiederhergestellt")
            return True
    report("Electron-Ordner", False, "fehlt")
    return False


def check_python_packages(retry: bool = False) -> bool:
    """Prüft, ob alle in requirements.txt aufgeführten Pakete mit korrekter Version installiert sind."""
    global FAIL
    FAIL = []
    req = os.path.join(BASE_DIR, "requirements.txt")
    if not os.path.exists(req):
        report("requirements.txt", False, "nicht gefunden")
        return False

    fehlend: list[str] = []          # Pflicht-Pakete, die fehlen
    fehlend_optional: list[str] = []  # Optionale Pakete, die fehlen
    falsch: list[tuple[str, str]] = []            # (Anforderung, Hinweis)
    falsch_optional: list[tuple[str, str]] = []   # Optionale Pakete mit falscher Version

    with open(req, "r", encoding="utf-8") as f:
        for line in f:
            zeile = line.strip()
            if not zeile or zeile.startswith("#"):
                continue

            optional = "# optional" in zeile
            req_str = zeile.split("#")[0].strip()
            r = Requirement(req_str)
            pip_pkg = r.name
            mod = {
                "pillow": "PIL",
                "opencv-python-headless": "cv2",
            }.get(pip_pkg.lower(), pip_pkg)

            spec = r.specifier
            if importlib.util.find_spec(mod) is None:
                if optional:
                    fehlend_optional.append(req_str)
                else:
                    fehlend.append(req_str)
                continue
            if spec:
                try:
                    installed = Version(metadata.version(pip_pkg))
                except metadata.PackageNotFoundError:
                    if optional:
                        fehlend_optional.append(req_str)
                    else:
                        fehlend.append(req_str)
                    continue
                if not spec.contains(installed, prereleases=True):
                    info = f"{pip_pkg} {installed} erwartet {spec}"
                    if optional:
                        falsch_optional.append((req_str, info))
                    else:
                        falsch.append((req_str, info))

    if fehlend or falsch or fehlend_optional or falsch_optional:
        if FIX_MODE and not retry:
            for req_str in fehlend + [f[0] for f in falsch] + fehlend_optional + [f[0] for f in falsch_optional]:
                ensure_package(req_str)
            if FAIL:
                report("Python-Pakete", False, ", ".join(FAIL))
                return False
            return check_python_packages(True)

    if fehlend or falsch:
        teile: list[str] = []
        if fehlend:
            teile.append("fehlend: " + ", ".join(fehlend))
        if falsch:
            teile.append("Version: " + ", ".join(t[1] for t in falsch))
        report("Python-Pakete", False, "; ".join(teile))
        return False

    if fehlend_optional or falsch_optional:
        teile: list[str] = []
        if fehlend_optional:
            teile.append("fehlend: " + ", ".join(fehlend_optional))
        if falsch_optional:
            teile.append("Version: " + ", ".join(t[1] for t in falsch_optional))
        report("Optionale Pakete", True, "; ".join(teile))
    else:
        report("Python-Pakete", True, "alle vorhanden")

    return True


def check_repo_clean() -> bool:
    """Prüft, ob ein Git-Repository vorhanden und sauber ist."""
    try:
        inside = run(["git", "rev-parse", "--is-inside-work-tree"])
    except Exception:
        report("Git-Repository", False, "nicht gefunden")
        return False
    if inside.strip() != "true":
        report("Git-Repository", False, "nicht gefunden")
        return False
    try:
        output = run(["git", "status", "--porcelain"])
    except Exception:
        report("Git", False, "Fehler bei 'git status'")
        return False
    if output:
        if FIX_MODE:
            try:
                run(["git", "reset", "--hard"])
                run(["git", "clean", "-fd"])
                output = run(["git", "status", "--porcelain"])
            except Exception as e:
                report("Git-Status", False, str(e))
                return False
            if output:
                report("Git-Status", False, "Lokale Änderungen")
                return False
        else:
            report("Git-Status", False, "Lokale Änderungen")
            return False
    if FIX_MODE:
        try:
            run(["git", "fetch", "--depth=1"])
            run(["git", "reset", "--hard", "origin/main"])
            run(["git", "clean", "-fd"])
        except Exception as e:
            report("Git-Update", False, str(e))
    report("Git-Status", True, "sauber")
    return True


def check_files() -> bool:
    """Kontrolliert, ob wichtige Dateien vorhanden sind."""
    files = ["README.md", "package.json", "requirements.txt", "start_tool.py"]
    ok = True
    for name in files:
        path = os.path.join(BASE_DIR, name)
        if os.path.exists(path):
            report(name, True)
        else:
            if FIX_MODE:
                try:
                    run(["git", "checkout", "--", name])
                except Exception:
                    pass
            if os.path.exists(path):
                report(name, True, "wiederhergestellt")
            else:
                report(name, False, "fehlt")
                ok = False
    return ok


def main() -> None:
    ok = True
    if FIX_MODE:
        print("Automatische Reparatur aktiv")
    else:
        print("Nur Überprüfung ohne Änderungen")
    if not check_python():
        ok = False
    if not check_node():
        ok = False
    if not check_npm():
        ok = False
    if not check_node_packages():
        ok = False
    if not check_git_installed():
        ok = False
    if not check_electron_folder():
        ok = False
    if not check_python_packages():
        ok = False
    if not check_repo_clean():
        ok = False
    if not check_files():
        ok = False

    print("\nZusammenfassung:")
    for name, state, detail in REPORTS:
        symbol = "✓" if state else "✗"
        text = f"{symbol} {name}"
        if detail:
            text += f": {detail}"
        print(text)

    if ok:
        print("Umgebung OK. Tool kann gestartet werden.")
        status = 0
    else:
        print("Mindestens eine Prüfung ist fehlgeschlagen.")
        status = 1

    if PAUSE:
        try:
            input("\nDrücke Enter zum Schließen...")
        except EOFError:
            pass
    sys.exit(status)


if __name__ == "__main__":
    main()

