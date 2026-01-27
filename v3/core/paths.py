from __future__ import annotations

from pathlib import Path
from typing import Union


def get_target_path(relative_path: Union[str, Path], language: str = "german") -> Path:
    """Spiegelt einen Audio-Pfad in den Sprachordner (z. B. alyx -> alyx_german)."""

    path = Path(relative_path)
    parts = list(path.parts)
    lower_parts = [part.lower() for part in parts]

    if "vo" not in lower_parts:
        return path

    vo_index = len(lower_parts) - 1 - lower_parts[::-1].index("vo")
    if vo_index + 1 >= len(parts):
        return path

    voice_folder = parts[vo_index + 1]
    suffix = f"_{language}".lower()
    if voice_folder.lower().endswith(suffix):
        return path

    parts[vo_index + 1] = f"{voice_folder}_{language}"
    return Path(*parts)
