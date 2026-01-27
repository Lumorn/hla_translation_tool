from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional

from pydantic import BaseModel


DEFAULT_VOICE_ID = "REPLACE_WITH_VOICE_ID"
DEFAULT_DUBBING_SUBDIR = Path("sounds/DE")
DEFAULT_ORIGINAL_DIRS = (
    Path("sounds/EN"),
    Path("sounds"),
    Path("soundevents"),
)


class AppSettings(BaseModel):
    """Definiert die Einstellungen für die V3-App."""

    openai_api_key: str = ""
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""
    target_language: str = "German"


class SettingsManager:
    """Lädt und speichert die App-Einstellungen als JSON."""

    def __init__(self, config_path: Optional[Path] = None) -> None:
        self._config_path = config_path or self._resolve_config_path()
        self._settings = self._load_settings()
        self.apply_to_environment()

    @property
    def settings(self) -> AppSettings:
        """Gibt die aktuell geladenen Einstellungen zurück."""

        return self._settings

    @property
    def config_path(self) -> Path:
        """Gibt den aktuell genutzten Konfigurationspfad zurück."""

        return self._config_path

    def update(self, **values: str) -> None:
        """Aktualisiert einzelne Felder und speichert sie."""

        self._settings = self._settings.model_copy(update=values)
        self.save()

    def save(self) -> None:
        """Speichert die Einstellungen in die JSON-Datei."""

        try:
            self._write_settings(self._config_path)
            return
        except OSError:
            # Fallback auf eine lokale Datei im Repo, falls der Benutzerpfad nicht beschreibbar ist.
            fallback_path = get_repo_root() / "config.json"
            self._write_settings(fallback_path)
            self._config_path = fallback_path

    def apply_to_environment(self) -> None:
        """Überträgt die gespeicherten Werte in die Umgebungsvariablen."""

        if self._settings.openai_api_key:
            os.environ["OPENAI_API_KEY"] = self._settings.openai_api_key
        if self._settings.elevenlabs_api_key:
            os.environ["ELEVENLABS_API_KEY"] = self._settings.elevenlabs_api_key
        if self._settings.elevenlabs_voice_id:
            os.environ["ELEVENLABS_VOICE_ID"] = self._settings.elevenlabs_voice_id
        if self._settings.target_language:
            os.environ["HLA_TARGET_LANGUAGE"] = self._settings.target_language

    def _resolve_config_path(self) -> Path:
        env_path = os.getenv("HLA_TRANSLATION_CONFIG", "").strip()
        if env_path:
            return Path(env_path).expanduser()

        return Path.home() / ".hla_translation_tool" / "config.json"

    def _load_settings(self) -> AppSettings:
        if not self._config_path.exists():
            return AppSettings()

        try:
            payload = json.loads(self._config_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            # Fallback auf Defaults, wenn die Datei nicht lesbar oder ungültig ist.
            return AppSettings()

        try:
            return AppSettings.model_validate(payload)
        except ValueError:
            # Fallback auf Defaults, wenn die Datenstruktur nicht passt.
            return AppSettings()

    def _write_settings(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(self._settings.model_dump_json(indent=2), encoding="utf-8")


def get_repo_root() -> Path:
    """Ermittelt das Repository-Stammverzeichnis."""

    return Path(__file__).resolve().parents[2]


settings_manager = SettingsManager()


def get_default_voice_id() -> str:
    """Liefert die konfigurierte Standard-Voice-ID."""

    voice_id = settings_manager.settings.elevenlabs_voice_id
    if voice_id:
        return voice_id
    return os.getenv("ELEVENLABS_VOICE_ID", DEFAULT_VOICE_ID)


def get_dubbing_output_path(key: str, suffix: str = ".mp3") -> Path:
    """Erzeugt den Zieldateipfad für generiertes Dubbing."""

    cleaned = key.strip().strip('"').replace("\\", "/").lstrip("/")
    relative = Path(cleaned)
    if relative.suffix.lower() not in {".mp3", ".wav"}:
        relative = relative.with_suffix(suffix)
    return get_repo_root() / DEFAULT_DUBBING_SUBDIR / relative


def get_original_search_dirs() -> tuple[Path, ...]:
    """Gibt die Suchordner für Original-Audio zurück."""

    root = get_repo_root()
    return tuple(root / entry for entry in DEFAULT_ORIGINAL_DIRS)
