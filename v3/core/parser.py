import re
from pathlib import Path
from typing import List

from v3.core.models import CaptionLine


class CaptionParser:
    """Parser für Source-Engine-Closecaption-Dateien."""

    _LINE_REGEX = re.compile(r'^"([^\"]+)"\s+"(.+)"$')

    def parse_file(self, filepath: str) -> List[CaptionLine]:
        """Liest eine Closecaption-Datei ein und gibt geparste Zeilen zurück."""

        content = self._read_text_with_fallback(Path(filepath))
        lines = content.splitlines()
        parsed_lines: List[CaptionLine] = []
        line_number = 0

        for line in lines:
            stripped = line.strip()
            if not stripped:
                continue
            if stripped.startswith("//"):
                continue

            match = self._LINE_REGEX.match(stripped)
            if not match:
                continue

            line_number += 1
            parsed_lines.append(
                CaptionLine(
                    key=match.group(1),
                    original_text=match.group(2),
                    translated_text=None,
                    line_number=line_number,
                )
            )

        return parsed_lines

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
