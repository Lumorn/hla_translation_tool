from __future__ import annotations

from pathlib import Path

from PySide6.QtWidgets import (
    QAbstractItemView,
    QFileDialog,
    QLineEdit,
    QMainWindow,
    QMenu,
    QTableView,
    QVBoxLayout,
    QWidget,
)

from v3.core.project import Project
from v3.ui.caption_model import CaptionTableModel


class MainWindow(QMainWindow):
    """Hauptfenster der V3-GUI."""

    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("HLA Translation Tool V3 (Alpha)")
        self.resize(1200, 800)

        self._project = Project()
        self._model = CaptionTableModel()

        self._search_input = QLineEdit()
        self._search_input.setPlaceholderText("Suchen...")
        self._search_input.textChanged.connect(self._on_filter_changed)

        self._table_view = QTableView()
        self._table_view.setModel(self._model)
        self._table_view.setSortingEnabled(True)
        self._table_view.setAlternatingRowColors(True)
        self._table_view.setSelectionBehavior(QAbstractItemView.SelectRows)

        layout = QVBoxLayout()
        layout.addWidget(self._search_input)
        layout.addWidget(self._table_view)

        container = QWidget()
        container.setLayout(layout)
        self.setCentralWidget(container)

        self._setup_menu()

    def _setup_menu(self) -> None:
        """Erzeugt die Menüleiste inklusive Datei-Öffnen."""

        file_menu = QMenu("File", self)
        open_action = file_menu.addAction("Open")
        open_action.triggered.connect(self._open_file_dialog)
        self.menuBar().addMenu(file_menu)

    def _open_file_dialog(self) -> None:
        """Öffnet einen Datei-Dialog und lädt die ausgewählte Datei."""

        filepath, _ = QFileDialog.getOpenFileName(
            self,
            "Closecaption-Datei öffnen",
            str(Path.cwd()),
            "Closecaption-Dateien (*.txt)",
        )
        if not filepath:
            return

        self._project.load_from_file(filepath)
        self._model.set_captions(self._project.captions)

    def _on_filter_changed(self, text: str) -> None:
        """Reicht Filtertexte an das Tabellenmodell weiter."""

        self._model.set_filter_text(text)
