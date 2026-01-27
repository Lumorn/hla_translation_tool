from __future__ import annotations

from typing import Sequence

from PySide6.QtCore import QThread, Signal

from v3.config import settings
from v3.core.audio import AudioEngine
from v3.core.models import CaptionLine
from v3.core.translator import Translator


class BatchTranslator(QThread):
    """Übersetzt fehlende Zeilen in einem Hintergrund-Thread."""

    progress_update = Signal(int, int)
    error = Signal(str)

    def __init__(self, captions: Sequence[CaptionLine], translator: Translator) -> None:
        super().__init__()
        self._captions = list(captions)
        self._translator = translator

    def run(self) -> None:
        """Startet die Stapelübersetzung."""

        total = len(self._captions)
        for index, caption in enumerate(self._captions, start=1):
            if not caption.translated_text:
                try:
                    caption.translated_text = self._translator.generate_translation(
                        caption.original_text,
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

    def __init__(self, captions: Sequence[CaptionLine], audio_engine: AudioEngine, voice_id: str) -> None:
        super().__init__()
        self._captions = list(captions)
        self._audio_engine = audio_engine
        self._voice_id = voice_id

    def run(self) -> None:
        """Startet das Stapel-Dubbing."""

        total = len(self._captions)
        for index, caption in enumerate(self._captions, start=1):
            if not caption.translated_text:
                self.progress_update.emit(index, total)
                continue

            output_path = settings.get_dubbing_output_path(caption.key)
            if output_path.exists():
                self.progress_update.emit(index, total)
                continue

            try:
                self._audio_engine.generate_dub(
                    caption.translated_text,
                    self._voice_id,
                    str(output_path),
                )
            except Exception as exc:  # noqa: BLE001 - GUI soll Fehlermeldungen anzeigen
                self.error.emit(str(exc))
                return

            self.progress_update.emit(index, total)
