import os
import tempfile
import unittest
from unittest import mock

import verify_environment


class CheckPythonPackagesTest(unittest.TestCase):
    """Tests für die Python-Paketprüfung."""

    def test_fix_mode_installs_only_required_packages(self) -> None:
        """Prüft, dass im Reparaturmodus nur Pflichtpakete installiert werden."""

        requirements = """
        pflichtpaket==1.0.0
        optionalpaket==1.0.0 # optional
        """.strip()

        installed = {"pflichtpaket": False, "optionalpaket": False}

        def fake_find_spec(name: str):
            """Simuliert installierte Module ohne echte Importversuche."""

            if name in installed and installed[name]:
                return object()
            return None

        def fake_ensure(req_str: str):
            """Markiert nur das Pflichtpaket als installiert."""

            if req_str.startswith("pflichtpaket"):
                installed["pflichtpaket"] = True

        with tempfile.TemporaryDirectory() as tmpdir:
            req_path = os.path.join(tmpdir, "requirements.txt")
            with open(req_path, "w", encoding="utf-8") as handle:
                handle.write(requirements)

            with mock.patch.object(verify_environment, "BASE_DIR", tmpdir), \
                mock.patch.object(verify_environment, "FIX_MODE", True), \
                mock.patch.object(verify_environment.importlib.util, "find_spec", side_effect=fake_find_spec), \
                mock.patch.object(verify_environment.metadata, "version", side_effect=lambda name: "1.0.0"), \
                mock.patch.object(verify_environment, "ensure_package", side_effect=fake_ensure), \
                mock.patch.object(verify_environment, "report", lambda *_, **__: None):

                verify_environment.FAIL = []
                verify_environment.REPORTS.clear()

                self.assertTrue(verify_environment.check_python_packages())
                # Optionale Pakete dürfen nicht automatisch installiert werden
                self.assertFalse(installed["optionalpaket"])
                # Pflichtpaket wurde im Reparaturmodus angefordert
                self.assertTrue(installed["pflichtpaket"])


if __name__ == "__main__":
    unittest.main()
