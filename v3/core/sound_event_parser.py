from __future__ import annotations

import re
from pathlib import Path
from typing import Dict, Optional


class SoundEventParser:
    """Liest Soundevent-Wiki-Dateien und baut eine Caption-Key-Map."""

    _ASSIGNMENT_REGEX = re.compile(r'^\s*([A-Za-z0-9_./-]+)\s*=\s*"([^"]+)"')
    _UNQUOTED_ASSIGNMENT_REGEX = re.compile(r'^\s*([A-Za-z0-9_./-]+)\s*=\s*([A-Za-z0-9_./-]+\.(?:vsnd|wav|mp3))', re.IGNORECASE)
    _BLOCK_START_REGEX = re.compile(r'^\s*([A-Za-z0-9_./-]+)\s*=\s*\{?\s*$')
    _SOUND_PATH_REGEX = re.compile(r'"([^"]+\.(?:vsnd|wav|mp3))"', re.IGNORECASE)

    def parse_directory(self, directory: str) -> Dict[str, str]:
        """Liest alle .wiki-Dateien und liefert ein Key-zu-Pfad-Dictionary."""

        root = Path(directory)
        if not root.exists():
            return {}

        mapping: Dict[str, str] = {}
        for wiki_file in root.rglob("*.wiki"):
            mapping.update(self.parse_file(wiki_file))
        return mapping

    def parse_file(self, file_path: str | Path) -> Dict[str, str]:
        """Parst eine einzelne .wiki-Datei in ein Mapping."""

        path = Path(file_path)
        content = self._read_text_with_fallback(path)
        mapping: Dict[str, str] = {}

        current_key: Optional[str] = None
        brace_depth = 0

        for raw_line in content.splitlines():
            line = raw_line.strip()
            if not line or line.startswith("//"):
                continue

            if current_key:
                brace_depth += line.count("{")
                brace_depth -= line.count("}")

                sound_path = self._extract_sound_path(line)
                if sound_path and current_key not in mapping:
                    mapping[current_key] = sound_path

                if brace_depth <= 0:
                    current_key = None
                continue

            assignment = self._extract_assignment(line)
            if assignment:
                key, sound_path = assignment
                if key not in mapping:
                    mapping[key] = sound_path
                continue

            block_key = self._extract_block_start(line)
            if block_key:
                current_key = block_key
                brace_depth = max(1, line.count("{"))

        return mapping

    def _extract_assignment(self, line: str) -> Optional[tuple[str, str]]:
        """Versucht, eine direkte Zuweisung in der Zeile zu finden."""

        match = self._ASSIGNMENT_REGEX.match(line)
        if match:
            key = match.group(1)
            sound_path = self._normalize_sound_path(match.group(2))
            if sound_path:
                return key, sound_path

        match = self._UNQUOTED_ASSIGNMENT_REGEX.match(line)
        if match:
            key = match.group(1)
            sound_path = self._normalize_sound_path(match.group(2))
            if sound_path:
                return key, sound_path

        return None

    def _extract_block_start(self, line: str) -> Optional[str]:
        """Prüft, ob eine neue Blockdefinition beginnt."""

        match = self._BLOCK_START_REGEX.match(line)
        if match:
            return match.group(1)
        return None

    def _extract_sound_path(self, line: str) -> Optional[str]:
        """Extrahiert Pfade innerhalb eines Blocks."""

        match = self._SOUND_PATH_REGEX.search(line)
        if not match:
            return None
        return self._normalize_sound_path(match.group(1))

    def _normalize_sound_path(self, raw_path: str) -> Optional[str]:
        """Normalisiert Soundpfade und konvertiert .vsnd in .wav."""

        if not raw_path:
            return None

        cleaned = raw_path.replace("\\", "/").lstrip("/")
        if not cleaned:
            return None

        path = Path(cleaned)
        suffix = path.suffix.lower()
        if suffix == ".vsnd":
            cleaned = f"{path.with_suffix('.wav')}"

        parts = cleaned.split("/")
        if len(parts) == 1:
            return cleaned

        folder_parts = parts[:-1]
        filename = parts[-1]
        folder = self._extract_relevant_folder(folder_parts)
        if folder:
            return f"{folder}/{filename}"
        return filename

    def _extract_relevant_folder(self, folder_parts: list[str]) -> str:
        """Spiegelt die Logik aus der Web-App für relevante Audio-Pfade."""

        if not folder_parts:
            return ""

        lower_parts = [part.lower() for part in folder_parts]
        if "vo" in lower_parts:
            vo_index = len(lower_parts) - 1 - lower_parts[::-1].index("vo")
            return "/".join(folder_parts[vo_index:])

        start_index = 1 if lower_parts[0] == "sounds" else 0
        return "/".join(folder_parts[start_index:])

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
