from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path


class ProjectManager:
    """Kapselt die Anlage neuer Projekte."""

    def create_project(self, base_path: str, project_name: str) -> Path:
        """Erstellt die Projektstruktur und initialisiert project.json."""

        base = Path(base_path).expanduser()
        if not base.exists():
            raise FileNotFoundError(f"Speicherort nicht gefunden: {base}")

        project_root = base / project_name
        project_root.mkdir(parents=True, exist_ok=True)

        source_audio = project_root / "source_audio"
        target_audio = project_root / "target_audio"
        backups = project_root / "backups"
        data = project_root / "data"

        for folder in (source_audio, target_audio, backups, data):
            folder.mkdir(parents=True, exist_ok=True)

        project_payload = {
            "schema_version": 1,
            "project_name": project_name,
            "created_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
            "assets": [],
        }

        project_file = data / "project.json"
        project_file.write_text(json.dumps(project_payload, indent=2), encoding="utf-8")

        return project_root
