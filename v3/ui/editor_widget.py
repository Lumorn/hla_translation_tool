from __future__ import annotations

import os
from typing import Optional

from PySide6.QtCore import QObject, Qt, QThread, Signal
from PySide6.QtWidgets import (
    QFormLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QProgressBar,
    QPushButton,
    QTextEdit,
    QVBoxLayout,
    QWidget,
)

from v3.core.audio import AudioEngine
from v3.core.models import GameAsset
from v3.core.project import Project
from v3.core.translator import Translator
from v3.ui.audio_player import AudioPlayer


class TranslationWorker(QObject):
    """Führt den API-Aufruf in einem separaten Thread aus."""

    finished = Signal(str)
    failed = Signal(str)

    def __init__(self, translator: Translator, original_text: str, context: str) -> None:
        super().__init__()
        self._translator = translator
        self._original_text = original_text
        self._context = context

    def run(self) -> None:
        """Startet die Übersetzung und meldet das Ergebnis."""

        try:
            result = self._translator.generate_translation(self._original_text, self._context)
        except Exception as exc:  # noqa: BLE001 - GUI soll Fehlermeldungen anzeigen
            self.failed.emit(str(exc))
            return

        self.finished.emit(result)


class DubWorker(QObject):
    """Erstellt Dubbing-Audio in einem separaten Thread."""

    finished = Signal(str)
    failed = Signal(str)

    def __init__(self, engine: AudioEngine, text: str, voice_id: str, output_path: str) -> None:
        super().__init__()
        self._engine = engine
        self._text = text
        self._voice_id = voice_id
        self._output_path = output_path

    def run(self) -> None:
        """Startet den Dubbing-Export und meldet das Ergebnis."""

        try:
            result_path = self._engine.generate_dub(self._text, self._voice_id, self._output_path)
        except Exception as exc:  # noqa: BLE001 - GUI soll Fehlermeldungen anzeigen
            self.failed.emit(str(exc))
            return

        self.finished.emit(result_path)


class EditorWidget(QWidget):
    """Editor-Maske für einzelne Mod-Assets."""

    dataChanged = Signal(int)

    def __init__(self, project: Project, parent: Optional[QWidget] = None) -> None:
        super().__init__(parent)
        self._project = project
        self._current_asset: Optional[GameAsset] = None
        self._current_row: int = -1
        self._worker_thread: Optional[QThread] = None
        self._dub_thread: Optional[QThread] = None

        self._translator: Optional[Translator]
        self._translator_error: Optional[str] = None
        try:
            self._translator = Translator()
        except Exception as exc:  # noqa: BLE001 - GUI soll Fehlermeldungen anzeigen
            self._translator = None
            self._translator_error = str(exc)

        self._audio_engine = AudioEngine()

        self._filename_input = QLineEdit()
        self._filename_input.setReadOnly(True)

        self._relative_path_input = QLineEdit()
        self._relative_path_input.setReadOnly(True)

        self._original_input = QTextEdit()

        self._original_audio_player = AudioPlayer("Original-Audio")

        self._translation_input = QTextEdit()

        self._context_input = QTextEdit()

        self._dub_audio_player = AudioPlayer("Dubbing (DE)")

        self._generate_audio_button = QPushButton("Audio generieren (ElevenLabs)")
        self._generate_audio_button.clicked.connect(self._on_generate_dub_clicked)

        self._audio_status_label = QLabel("")
        self._audio_status_label.setAlignment(Qt.AlignLeft | Qt.AlignVCenter)

        self._translate_button = QPushButton("Mit AI übersetzen")
        self._translate_button.clicked.connect(self._on_translate_clicked)

        self._save_button = QPushButton("Speichern")
        self._save_button.clicked.connect(self._on_save_clicked)

        self._status_label = QLabel("")
        self._status_label.setAlignment(Qt.AlignLeft | Qt.AlignVCenter)

        self._progress_bar = QProgressBar()
        self._progress_bar.setRange(0, 1)
        self._progress_bar.setVisible(False)

        self._build_layout()
        self._update_controls_enabled(False)

    def load_asset(self, asset: Optional[GameAsset], row: int = -1) -> None:
        """Lädt die Daten eines Assets in den Editor."""

        self._current_asset = asset
        self._current_row = row

        if asset is None:
            self._filename_input.clear()
            self._relative_path_input.clear()
            self._original_input.clear()
            self._translation_input.clear()
            self._context_input.clear()
            self._status_label.setText("")
            self._audio_status_label.setText("")
            self._original_audio_player.load_file(None)
            self._dub_audio_player.load_file(None)
            self._update_controls_enabled(False)
            return

        self._filename_input.setText(asset.audio_filename)
        self._relative_path_input.setText(asset.relative_path)
        self._original_input.setPlainText(asset.original_text)
        self._translation_input.setPlainText(asset.translated_text)
        self._context_input.clear()
        self._status_label.setText("")
        self._audio_status_label.setText("")
        self._load_audio_for_asset(asset)
        self._update_controls_enabled(True)

    def _build_layout(self) -> None:
        """Erstellt das Formlayout für den Editor."""

        layout = QFormLayout()
        layout.addRow("Audio-Datei", self._filename_input)
        layout.addRow("Relativer Pfad", self._relative_path_input)
        layout.addRow("Original", self._original_input)
        layout.addRow("Original-Audio", self._original_audio_player)
        layout.addRow("Übersetzung", self._translation_input)
        layout.addRow("KI-Kontext", self._context_input)

        dubbing_container = QWidget()
        dubbing_layout = QVBoxLayout(dubbing_container)
        dubbing_layout.addWidget(self._dub_audio_player)
        dubbing_layout.addWidget(self._generate_audio_button)
        dubbing_layout.addWidget(self._audio_status_label)
        dubbing_layout.setContentsMargins(0, 0, 0, 0)
        layout.addRow("Dubbing", dubbing_container)

        button_layout = QHBoxLayout()
        button_layout.addWidget(self._translate_button)
        button_layout.addWidget(self._save_button)

        layout.addRow(button_layout)
        layout.addRow(self._status_label)
        layout.addRow(self._progress_bar)

        self.setLayout(layout)

    def _update_controls_enabled(self, enabled: bool) -> None:
        """Aktiviert oder deaktiviert die Bedienelemente."""

        self._translate_button.setEnabled(enabled and self._translator is not None)
        self._save_button.setEnabled(enabled)
        self._generate_audio_button.setEnabled(enabled)

    def _on_translate_clicked(self) -> None:
        """Startet die Übersetzung über einen Hintergrund-Thread."""

        if not self._current_asset:
            return
        if self._translator is None:
            self._status_label.setText(self._translator_error or "OpenAI ist nicht konfiguriert.")
            return

        original_text = self._original_input.toPlainText().strip()
        if not original_text:
            self._status_label.setText("Kein Originaltext vorhanden.")
            return

        context_text = self._context_input.toPlainText().strip()
        self._set_busy_state(True, "Übersetze…")

        worker = TranslationWorker(self._translator, original_text, context_text)
        thread = QThread(self)
        worker.moveToThread(thread)

        thread.started.connect(worker.run)
        worker.finished.connect(self._on_translation_ready)
        worker.failed.connect(self._on_translation_failed)
        worker.finished.connect(thread.quit)
        worker.failed.connect(thread.quit)
        thread.finished.connect(worker.deleteLater)
        thread.finished.connect(thread.deleteLater)

        self._worker_thread = thread
        thread.start()

    def _on_translation_ready(self, translation: str) -> None:
        """Füllt die Übersetzung nach erfolgreichem API-Call."""

        self._translation_input.setPlainText(translation)
        self._set_busy_state(False, "Übersetzung bereit.")

    def _on_translation_failed(self, message: str) -> None:
        """Zeigt Fehler an und setzt den Status zurück."""

        self._set_busy_state(False, f"Fehler: {message}")

    def _set_busy_state(self, busy: bool, message: str) -> None:
        """Aktualisiert den Ladezustand im Editor."""

        self._status_label.setText(message)
        self._progress_bar.setVisible(busy)
        if busy:
            self._progress_bar.setRange(0, 0)
        else:
            self._progress_bar.setRange(0, 1)
        self._translate_button.setEnabled(not busy and self._current_asset is not None)
        self._save_button.setEnabled(not busy and self._current_asset is not None)

    def _load_audio_for_asset(self, asset: GameAsset) -> None:
        """Lädt Original- und Dubbing-Audio für das Asset."""

        original_path = self._project.get_source_audio_path(asset)
        self._original_audio_player.load_file(str(original_path) if original_path else None)

        dub_path = self._project.get_target_audio_path(asset)
        self._dub_audio_player.load_file(str(dub_path) if dub_path and dub_path.exists() else None)

    def _on_generate_dub_clicked(self) -> None:
        """Startet die ElevenLabs-Generierung in einem Hintergrund-Thread."""

        if not self._current_asset:
            return

        text = self._translation_input.toPlainText().strip()
        if not text:
            self._audio_status_label.setText("Kein Übersetzungstext vorhanden.")
            return

        voice_id = os.getenv("ELEVENLABS_VOICE_ID", "").strip()
        if not voice_id:
            self._audio_status_label.setText("Voice-ID ist nicht konfiguriert.")
            return

        output_path = self._project.get_target_audio_path(self._current_asset)
        if not output_path:
            self._audio_status_label.setText("Zielordner für Audio fehlt.")
            return
        self._set_audio_busy_state(True, "Audio wird generiert…")

        worker = DubWorker(self._audio_engine, text, voice_id, str(output_path))
        thread = QThread(self)
        worker.moveToThread(thread)

        thread.started.connect(worker.run)
        worker.finished.connect(self._on_dub_ready)
        worker.failed.connect(self._on_dub_failed)
        worker.finished.connect(thread.quit)
        worker.failed.connect(thread.quit)
        thread.finished.connect(worker.deleteLater)
        thread.finished.connect(thread.deleteLater)

        self._dub_thread = thread
        thread.start()

    def _on_dub_ready(self, path: str) -> None:
        """Aktualisiert den Player nach erfolgreicher Generierung."""

        self._set_audio_busy_state(False, "Audio bereit.")
        self._dub_audio_player.load_file(path)

    def _on_dub_failed(self, message: str) -> None:
        """Zeigt Fehler für die Dubbing-Generierung an."""

        self._set_audio_busy_state(False, f"Fehler: {message}")

    def _set_audio_busy_state(self, busy: bool, message: str) -> None:
        """Aktualisiert den Ladezustand der Audio-Generierung."""

        self._audio_status_label.setText(message)
        self._generate_audio_button.setEnabled(not busy and self._current_asset is not None)

    def _on_save_clicked(self) -> None:
        """Schreibt die Übersetzung in das Projekt zurück."""

        if not self._current_asset:
            return

        new_translation = self._translation_input.toPlainText().strip()
        new_original = self._original_input.toPlainText().strip()
        self._project.update_asset_text(self._current_asset, new_original, new_translation)
        self._status_label.setText("Änderungen gespeichert.")
        self.dataChanged.emit(self._current_row)
