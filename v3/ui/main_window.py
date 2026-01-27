from __future__ import annotations

import os
from pathlib import Path

from PySide6.QtCore import Qt, QTimer
from PySide6.QtWidgets import (
    QAbstractItemView,
    QDialog,
    QFileDialog,
    QLabel,
    QLineEdit,
    QMainWindow,
    QMenu,
    QMessageBox,
    QProgressDialog,
    QPushButton,
    QSplitter,
    QTableView,
    QVBoxLayout,
    QWidget,
)

from v3.core.audio import AudioEngine
from v3.core.audio_scanner import AudioScanner
from v3.core.exporter import GameExporter
from v3.core.project import Project
from v3.core.translator import Translator
from v3.core.workers import BatchDubber, BatchTranslator
from v3.ui.caption_model import CaptionTableModel
from v3.ui.editor_widget import EditorWidget
from v3.ui.project_tree import ProjectTree
from v3.ui.project_wizard import ProjectWizard


class MainWindow(QMainWindow):
    """Hauptfenster der V3-GUI."""

    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("HLA Translation Tool V3 (Alpha)")
        self.resize(1200, 800)

        self._project = Project()
        self._model = CaptionTableModel()
        self._batch_worker = None
        self._progress_dialog: QProgressDialog | None = None
        self._batch_failed = False
        self._batch_total = 0
        self._current_filter_label = "Alle"

        self._status_bar = self.statusBar()
        self._status_bar.showMessage("Bereit.")

        self._tree_view = ProjectTree()
        self._tree_view.selection_changed.connect(self._on_tree_filter_requested)

        self._search_input = QLineEdit()
        self._search_input.setPlaceholderText("Suchen...")
        self._search_input.textChanged.connect(self._on_filter_changed)

        self._refresh_button = QPushButton("Refresh Audio Files")
        self._refresh_button.clicked.connect(self._refresh_audio_files)

        self._filter_label = QLabel()
        self._update_filter_label()

        self._table_view = QTableView()
        self._table_view.setModel(self._model)
        self._table_view.setSortingEnabled(True)
        self._table_view.setAlternatingRowColors(True)
        self._table_view.setSelectionBehavior(QAbstractItemView.SelectRows)

        self._editor = EditorWidget(self._project)
        self._editor.dataChanged.connect(self._on_editor_data_changed)

        self._table_view.selectionModel().currentRowChanged.connect(self._on_row_changed)

        left_layout = QVBoxLayout()
        left_layout.addWidget(self._search_input)
        left_layout.addWidget(self._refresh_button)
        left_layout.addWidget(self._filter_label)
        left_layout.addWidget(self._table_view)

        left_container = QWidget()
        left_container.setLayout(left_layout)

        splitter = QSplitter(Qt.Horizontal)
        splitter.addWidget(self._tree_view)
        splitter.addWidget(left_container)
        splitter.addWidget(self._editor)
        splitter.setStretchFactor(0, 1)
        splitter.setStretchFactor(1, 3)
        splitter.setStretchFactor(2, 2)

        main_layout = QVBoxLayout()
        main_layout.addWidget(splitter)

        container = QWidget()
        container.setLayout(main_layout)
        self.setCentralWidget(container)

        self._setup_menu()
        QTimer.singleShot(0, self._show_project_wizard)

    def _setup_menu(self) -> None:
        """Erzeugt die Menüleiste inklusive Datei-Öffnen."""

        file_menu = QMenu("File", self)
        new_action = file_menu.addAction("New Project")
        new_action.triggered.connect(self._show_project_wizard)
        open_action = file_menu.addAction("Open Project Folder")
        open_action.triggered.connect(self._open_project_dialog)
        export_action = file_menu.addAction("Export Mod...")
        export_action.triggered.connect(self._export_mod)
        self.menuBar().addMenu(file_menu)

        tools_menu = QMenu("Tools", self)
        translate_action = tools_menu.addAction("Alle fehlenden übersetzen")
        translate_action.triggered.connect(self._start_batch_translation)
        dub_action = tools_menu.addAction("Alle fehlenden vertonen")
        dub_action.triggered.connect(self._start_batch_dubbing)
        self.menuBar().addMenu(tools_menu)

    def _open_project_dialog(self) -> None:
        """Öffnet einen Ordner-Dialog und lädt ein Projekt."""

        folder = QFileDialog.getExistingDirectory(
            self,
            "Projektordner öffnen",
            str(Path.cwd()),
        )
        if not folder:
            return

        try:
            self._project.load_project(folder)
        except Exception as exc:  # noqa: BLE001 - GUI soll Fehlermeldungen anzeigen
            QMessageBox.critical(self, "Projekt laden fehlgeschlagen", str(exc))
            return

        self._model.set_assets(self._project.assets)
        self._tree_view.populate_from_project(self._project)
        self._apply_filter("", "Alle")

        if self._model.rowCount() > 0:
            first_index = self._model.index(0, 0)
            self._table_view.setCurrentIndex(first_index)
            self._table_view.selectRow(0)
        else:
            self._editor.load_asset(None)

    def _show_project_wizard(self) -> None:
        """Öffnet den Projekt-Wizard zum Erstellen eines neuen Projekts."""

        wizard = ProjectWizard(self)
        if wizard.exec() != QDialog.DialogCode.Accepted:
            return

        project_root = wizard.created_project_path
        if not project_root:
            return

        try:
            self._project.load_project(str(project_root))
        except Exception as exc:  # noqa: BLE001 - GUI soll Fehlermeldungen anzeigen
            QMessageBox.critical(self, "Projekt laden fehlgeschlagen", str(exc))
            return

        self._model.set_assets(self._project.assets)
        self._tree_view.populate_from_project(self._project)
        self._apply_filter("", "Alle")
        self._editor.load_asset(None)

    def _export_mod(self) -> None:
        """Exportiert Untertitel und Audio für die Mod-Struktur."""

        if not self._project.assets:
            QMessageBox.information(self, "Export", "Bitte zuerst ein Projekt laden.")
            return

        output_dir = QFileDialog.getExistingDirectory(self, "Export-Zielordner wählen")
        if not output_dir:
            return

        exporter = GameExporter()
        try:
            caption_path = exporter.export_to_game(self._project, output_dir)
        except Exception as exc:  # noqa: BLE001 - GUI soll Fehlermeldungen anzeigen
            QMessageBox.critical(self, "Export fehlgeschlagen", str(exc))
            return

        QMessageBox.information(
            self,
            "Export abgeschlossen",
            f"Export abgeschlossen. Untertitel-Datei: {caption_path}",
        )

    def _on_filter_changed(self, text: str) -> None:
        """Reicht Filtertexte an das Tabellenmodell weiter."""

        self._model.set_filter_text(text)
        self._update_filter_label()
        if self._model.rowCount() == 0:
            self._editor.load_asset(None)

    def _on_tree_filter_requested(self, relative_path: str) -> None:
        """Filtert die Tabelle anhand des ausgewählten Ordners oder der Datei."""

        self._apply_filter(relative_path)

    def _on_row_changed(self, current, previous) -> None:
        """Lädt die ausgewählte Zeile in den Editor."""

        if not current.isValid():
            self._editor.load_asset(None)
            return

        asset = self._model.asset_for_row(current.row())
        self._editor.load_asset(asset, current.row())

    def _on_editor_data_changed(self, row: int) -> None:
        """Aktualisiert das Tabellenmodell nach Speichern im Editor."""

        if row < 0:
            return

        if self._model.has_active_filter():
            self._model.refresh()
            return

        top_left = self._model.index(row, 2)
        bottom_right = self._model.index(row, 4)
        self._model.dataChanged.emit(top_left, bottom_right)

    def _start_batch_translation(self) -> None:
        """Startet die Stapelübersetzung fehlender Assets."""

        if not self._project.assets:
            QMessageBox.information(self, "Übersetzung", "Bitte zuerst ein Projekt laden.")
            return

        try:
            translator = Translator()
        except Exception as exc:  # noqa: BLE001 - GUI soll Fehlermeldungen anzeigen
            QMessageBox.critical(self, "Übersetzung fehlgeschlagen", str(exc))
            return

        worker = BatchTranslator(self._project.assets, translator)
        self._start_batch_worker(worker, "Übersetzung läuft", len(self._project.assets))

    def _start_batch_dubbing(self) -> None:
        """Startet das Stapel-Dubbing für fehlende Audios."""

        if not self._project.assets:
            QMessageBox.information(self, "Dubbing", "Bitte zuerst ein Projekt laden.")
            return

        voice_id = os.getenv("ELEVENLABS_VOICE_ID", "").strip()
        if not voice_id:
            QMessageBox.warning(
                self,
                "Dubbing",
                "Bitte eine gültige ElevenLabs-Voice-ID in den Settings setzen.",
            )
            return

        assets_to_dub = []
        for asset in self._project.assets:
            if not asset.translated_text:
                continue
            target_path = self._project.get_target_audio_path(asset)
            if target_path is None:
                continue
            if target_path.exists():
                continue
            assets_to_dub.append(asset)

        if not assets_to_dub:
            QMessageBox.information(self, "Dubbing", "Es gibt keine fehlenden Audios.")
            return

        worker = BatchDubber(assets_to_dub, AudioEngine(), voice_id)
        worker.configure_output_resolver(self._project.get_target_audio_path)
        self._start_batch_worker(worker, "Dubbing läuft", len(assets_to_dub))

    def _refresh_audio_files(self) -> None:
        """Aktualisiert die Audio-Dateien aus dem source_audio-Ordner."""

        if not self._project.source_audio_path:
            QMessageBox.information(self, "Refresh", "Bitte zuerst ein Projekt laden.")
            return

        scanner = AudioScanner()
        try:
            audio_files = scanner.scan_source_folder(str(self._project.source_audio_path))
        except Exception as exc:  # noqa: BLE001 - GUI soll Fehlermeldungen anzeigen
            QMessageBox.critical(self, "Refresh fehlgeschlagen", str(exc))
            return

        new_assets = self._project.update_assets_from_scan(audio_files)
        self._model.set_assets(self._project.assets)
        self._tree_view.populate_from_project(self._project)
        self._apply_filter(self._model.current_filter_path(), self._current_filter_label)

        if new_assets:
            self._status_bar.showMessage(f"{len(new_assets)} neue Audio-Dateien hinzugefügt.")
        else:
            self._status_bar.showMessage("Keine neuen Audio-Dateien gefunden.")

    def _apply_filter(self, relative_path: str, label: str | None = None) -> None:
        """Setzt den Pfadfilter und aktualisiert die Anzeige."""

        self._model.filter_by_path(relative_path)
        if label is not None:
            self._current_filter_label = label
        elif not relative_path:
            self._current_filter_label = "Alle"
        else:
            self._current_filter_label = relative_path
        self._update_filter_label()

        if self._model.rowCount() > 0:
            first_index = self._model.index(0, 0)
            self._table_view.setCurrentIndex(first_index)
            self._table_view.selectRow(0)
        else:
            self._editor.load_asset(None)

    def _update_filter_label(self) -> None:
        """Aktualisiert den Anzeige-Text über der Tabelle."""

        count = self._model.rowCount()
        label = self._current_filter_label or "Alle"
        self._filter_label.setText(f"Pfad: {label} - {count} Zeilen gefunden")

    def _start_batch_worker(self, worker, title: str, total: int) -> None:
        """Startet einen Batch-Worker und zeigt den Fortschrittsdialog."""

        if self._batch_worker is not None and self._batch_worker.isRunning():
            QMessageBox.warning(
                self,
                "Batch läuft",
                "Es läuft bereits ein Batch-Prozess. Bitte warten.",
            )
            return

        self._batch_failed = False
        self._batch_total = total
        self._batch_worker = worker
        self._progress_dialog = QProgressDialog(title, "", 0, total, self)
        self._progress_dialog.setWindowTitle(title)
        self._progress_dialog.setWindowModality(Qt.WindowModal)
        self._progress_dialog.setAutoClose(False)
        self._progress_dialog.setAutoReset(False)
        self._progress_dialog.setValue(0)
        self._progress_dialog.show()

        self._status_bar.showMessage("Batch-Verarbeitung läuft...")

        worker.progress_update.connect(self._on_batch_progress)
        worker.error.connect(self._on_batch_failed)
        worker.finished.connect(self._on_batch_finished)
        worker.start()

    def _on_batch_progress(self, current: int, total: int) -> None:
        """Aktualisiert den Fortschrittsdialog."""

        if not self._progress_dialog:
            return

        if self._progress_dialog.maximum() != total:
            self._progress_dialog.setMaximum(total)
        self._progress_dialog.setValue(current)

    def _on_batch_failed(self, message: str) -> None:
        """Zeigt Fehler im Batch-Prozess an."""

        self._batch_failed = True
        self._status_bar.showMessage("Batch fehlgeschlagen.")
        if self._progress_dialog:
            self._progress_dialog.close()
        QMessageBox.critical(self, "Batch fehlgeschlagen", message)

    def _on_batch_finished(self) -> None:
        """Schließt den Fortschrittsdialog und aktualisiert die UI."""

        if self._progress_dialog:
            self._progress_dialog.close()

        self._batch_worker = None

        if self._batch_failed:
            return

        self._project.refresh_asset_statuses()
        self._status_bar.showMessage(
            f"Fertig. {self._batch_total} Assets verarbeitet.",
        )

        if self._model.has_active_filter():
            self._model.refresh()
        else:
            self._model.layoutChanged.emit()

        current = self._table_view.currentIndex()
        if current.isValid():
            asset = self._model.asset_for_row(current.row())
            self._editor.load_asset(asset, current.row())
