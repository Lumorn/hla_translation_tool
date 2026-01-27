from __future__ import annotations

from typing import Sequence

from PySide6.QtCore import QThread, Signal

from v3.core.audio import AudioEngine
from v3.core.models import GameAsset
from v3.core.translator import Translator


class BatchTranslator(QThread):
    """Übersetzt fehlende Assets in einem Hintergrund-Thread."""

    progress_update = Signal(int, int)
    error = Signal(str)

    def __init__(self, assets: Sequence[GameAsset], translator: Translator) -> None:
        super().__init__()
        self._assets = list(assets)
        self._translator = translator

    def run(self) -> None:
        """Startet die Stapelübersetzung."""

        total = len(self._assets)
        for index, asset in enumerate(self._assets, start=1):
            if not asset.original_text:
                self.progress_update.emit(index, total)
                continue

            if not asset.translated_text:
                try:
                    asset.translated_text = self._translator.generate_translation(
                        asset.original_text,
                        "",
                    )
                except Exception as exc:  # noqa: BLE001 - GUI soll Fehlermeldungen anzeigen
                    self.error.emit(str(exc))
                    return

            self.progress_update.emit(index, total)


class BatchDubber(QThread):
    """Erstellt fehlende Dubbing-Audios im Hintergrund."""

    progress_update = Signal(int, int)
    error = Signal(str)

    def __init__(self, assets: Sequence[GameAsset], audio_engine: AudioEngine, voice_id: str) -> None:
        super().__init__()
        self._assets = list(assets)
        self._audio_engine = audio_engine
        self._voice_id = voice_id
        self._output_resolver = None

    def configure_output_resolver(self, resolver) -> None:
        """Setzt eine Funktion zur Ermittlung des Zieldateipfads."""

        self._output_resolver = resolver

    def run(self) -> None:
        """Startet das Stapel-Dubbing."""

        total = len(self._assets)
        for index, asset in enumerate(self._assets, start=1):
            if not asset.translated_text:
                self.progress_update.emit(index, total)
                continue

            if not self._output_resolver:
                self.error.emit("Kein Zielpfad für das Dubbing konfiguriert.")
                return

            output_path = self._output_resolver(asset)
            if output_path is None:
                self.progress_update.emit(index, total)
                continue
            if output_path.exists():
                self.progress_update.emit(index, total)
                continue

            try:
                self._audio_engine.generate_dub(
                    asset.translated_text,
                    self._voice_id,
                    str(output_path),
                )
            except Exception as exc:  # noqa: BLE001 - GUI soll Fehlermeldungen anzeigen
                self.error.emit(str(exc))
                return

            self.progress_update.emit(index, total)
