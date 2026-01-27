from __future__ import annotations

import wave
from pathlib import Path
from typing import List, Optional

from v3.core.models import AudioFile


class AudioScanner:
    """Durchsucht einen Ordner nach Audio-Dateien."""

    _SUPPORTED_SUFFIXES = {".wav", ".mp3"}

    def scan_source_folder(self, source_folder_path: str) -> List[AudioFile]:
        """Durchsucht den source_audio-Ordner rekursiv und liefert Audio-Dateien."""

        root = Path(source_folder_path)
        if not root.exists() or not root.is_dir():
            raise FileNotFoundError(f"Quellordner nicht gefunden: {source_folder_path}")

        results: List[AudioFile] = []
        for path in root.rglob("*"):
            if not path.is_file():
                continue
            if path.suffix.lower() not in self._SUPPORTED_SUFFIXES:
                continue

            relative = path.relative_to(root)
            relative_dir = relative.parent.as_posix()
            if relative_dir == ".":
                relative_dir = ""

            results.append(
                AudioFile(
                    filename=path.name,
                    relative_path=relative_dir,
                    size_bytes=path.stat().st_size,
                    duration_seconds=self._read_duration_seconds(path),
                )
            )

        return results

    def _read_duration_seconds(self, path: Path) -> Optional[float]:
        """Ermittelt die Audiodauer, sofern möglich."""

        if path.suffix.lower() == ".wav":
            try:
                with wave.open(str(path), "rb") as wav_file:
                    frames = wav_file.getnframes()
                    rate = wav_file.getframerate()
                    if rate > 0:
                        return frames / float(rate)
            except wave.Error:
                return None
        return None
