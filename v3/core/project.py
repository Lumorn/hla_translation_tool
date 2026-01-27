from __future__ import annotations

from typing import List

from v3.core.models import CaptionLine
from v3.core.parser import CaptionParser


class Project:
    """Verwaltet den aktuellen Projektzustand für die V3-GUI."""

    def __init__(self) -> None:
        # Der Pfad der aktuell geladenen Datei.
        self.filepath: str = ""
        # Alle geparsten Untertitelzeilen aus der Datei.
        self.captions: List[CaptionLine] = []

    def load_from_file(self, filepath: str) -> None:
        """Lädt eine Closecaption-Datei und aktualisiert den Projektzustand."""

        parser = CaptionParser()
        self.filepath = filepath
        self.captions = parser.parse_file(filepath)
