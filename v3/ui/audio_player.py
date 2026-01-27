from __future__ import annotations

from pathlib import Path
from typing import Optional

from PySide6.QtCore import Qt, QUrl
from PySide6.QtMultimedia import QAudioOutput, QMediaPlayer
from PySide6.QtWidgets import (
    QFrame,
    QHBoxLayout,
    QLabel,
    QPushButton,
    QVBoxLayout,
    QWidget,
)


class AudioPlayer(QWidget):
    """Ein kleines Audio-Widget mit Play/Stop und Statusanzeige."""

    def __init__(self, title: str = "") -> None:
        super().__init__()
        self._title = title
        self._current_path: Optional[Path] = None
        self._duration_ms: int = 0

        self._player = QMediaPlayer(self)
        self._audio_output = QAudioOutput(self)
        self._player.setAudioOutput(self._audio_output)

        self._play_button = QPushButton("▶️ Play")
        self._play_button.setEnabled(False)
        self._play_button.clicked.connect(self._toggle_playback)

        self._waveform_placeholder = QFrame()
        self._waveform_placeholder.setFixedHeight(18)
        self._waveform_placeholder.setStyleSheet(
            "background-color: #e0e0e0; border-radius: 6px;"
        )

        self._info_label = QLabel("Keine Datei geladen")
        self._info_label.setAlignment(Qt.AlignLeft | Qt.AlignVCenter)

        self._build_layout()

        self._player.durationChanged.connect(self._on_duration_changed)
        self._player.playbackStateChanged.connect(self._on_playback_state_changed)

    def _build_layout(self) -> None:
        """Baut das Layout des Players."""

        wrapper = QVBoxLayout()
        if self._title:
            title_label = QLabel(self._title)
            title_label.setStyleSheet("font-weight: bold;")
            wrapper.addWidget(title_label)

        row = QHBoxLayout()
        row.addWidget(self._play_button)
        row.addWidget(self._waveform_placeholder, stretch=1)
        wrapper.addLayout(row)
        wrapper.addWidget(self._info_label)
        wrapper.setContentsMargins(0, 0, 0, 0)

        self.setLayout(wrapper)

    def load_file(self, filepath: Optional[str]) -> None:
        """Lädt eine Audiodatei in den Player."""

        if not filepath:
            self._player.stop()
            self._player.setSource(QUrl())
            self._current_path = None
            self._duration_ms = 0
            self._play_button.setEnabled(False)
            self._info_label.setText("Keine Datei geladen")
            return

        path = Path(filepath)
        if not path.exists():
            self._player.stop()
            self._player.setSource(QUrl())
            self._current_path = None
            self._duration_ms = 0
            self._play_button.setEnabled(False)
            self._info_label.setText("Datei nicht gefunden")
            return

        self._current_path = path
        self._player.setSource(QUrl.fromLocalFile(str(path)))
        self._player.stop()
        self._play_button.setEnabled(True)
        self._info_label.setText(self._format_info())

    def play(self) -> None:
        """Startet die Wiedergabe, sofern eine Datei geladen ist."""

        if self._current_path is None:
            return
        self._player.play()

    def stop(self) -> None:
        """Stoppt die Wiedergabe."""

        self._player.stop()

    def _toggle_playback(self) -> None:
        """Schaltet zwischen Wiedergabe und Stopp um."""

        if self._player.playbackState() == QMediaPlayer.PlaybackState.PlayingState:
            self._player.stop()
        else:
            self.play()

    def _on_duration_changed(self, duration_ms: int) -> None:
        """Aktualisiert die Daueranzeige."""

        self._duration_ms = duration_ms
        if self._current_path is not None:
            self._info_label.setText(self._format_info())

    def _on_playback_state_changed(self, state: QMediaPlayer.PlaybackState) -> None:
        """Passt den Button an den Playback-Status an."""

        if state == QMediaPlayer.PlaybackState.PlayingState:
            self._play_button.setText("⏹️ Stop")
        else:
            self._play_button.setText("▶️ Play")

    def _format_info(self) -> str:
        """Erzeugt die Anzeige für Dateiname und Dauer."""

        if self._current_path is None:
            return "Keine Datei geladen"
        duration = self._format_duration(self._duration_ms)
        return f"{self._current_path.name} • {duration}"

    @staticmethod
    def _format_duration(duration_ms: int) -> str:
        """Formatiert die Dauer in mm:ss."""

        if duration_ms <= 0:
            return "--:--"
        total_seconds = int(duration_ms / 1000)
        minutes = total_seconds // 60
        seconds = total_seconds % 60
        return f"{minutes:02d}:{seconds:02d}"
