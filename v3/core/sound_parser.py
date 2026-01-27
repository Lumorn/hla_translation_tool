from __future__ import annotations

import re
from pathlib import Path
from typing import Dict


class SoundEventManager:
    """Verarbeitet Soundevent-Wiki-Dateien und baut eine Key-zu-Pfad-Map."""

    _LINE_REGEX = re.compile(r'^\s*([A-Za-z0-9_./-]+)\s*=\s*\"([^\"]+)\"')

    def parse_wiki_files(self, directory: str) -> Dict[str, str]:
        """Liest alle .wiki-Dateien rekursiv ein und extrahiert Sound-Mappings."""

        root = Path(directory)
        if not root.exists():
            return {}

        mapping: Dict[str, str] = {}
        for wiki_file in root.rglob("*.wiki"):
            content = self._read_text_with_fallback(wiki_file)
            for line in content.splitlines():
                match = self._LINE_REGEX.match(line)
                if not match:
                    continue
                key = match.group(1).strip()
                path = match.group(2).strip().replace("\\", "/").lstrip("/")
                if not key or not path:
                    continue
                if key in mapping:
                    # Doppelte Keys behalten wir beim ersten Treffer, um Überschreibungen zu vermeiden.
                    continue
                mapping[key] = path

        return mapping

    def _read_text_with_fallback(self, path: Path) -> str:
        """Liest Textdateien mit UTF-16/UTF-16-LE/UTF-8-Fallback."""

        raw = path.read_bytes()
        for encoding in ("utf-16", "utf-16-le", "utf-8"):
            try:
                return raw.decode(encoding)
            except UnicodeError:
                # Nächste Kodierung probieren, wenn die aktuelle fehlschlägt.
                continue

        # Letzter Ausweg: Als Latin-1 lesen, um Abstürze zu vermeiden.
        return raw.decode("latin-1")
