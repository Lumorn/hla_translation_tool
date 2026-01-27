from __future__ import annotations

from pathlib import Path
from typing import Optional

from PySide6.QtWidgets import (
    QDialog,
    QFileDialog,
    QFormLayout,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QMessageBox,
    QPushButton,
    QVBoxLayout,
    QWidget,
)

from v3.core.project_manager import ProjectManager


class ProjectWizard(QDialog):
    """Dialog zum Erstellen eines neuen Projekts."""

    def __init__(self, parent: Optional[QWidget] = None) -> None:
        super().__init__(parent)
        self.setWindowTitle("Neues Projekt erstellen")
        self.setModal(True)

        self.created_project_path: Optional[Path] = None

        self._name_input = QLineEdit()
        self._base_path_input = QLineEdit()
        self._browse_button = QPushButton("Browse")
        self._browse_button.clicked.connect(self._on_browse_clicked)

        self._create_button = QPushButton("Projekt erstellen")
        self._create_button.clicked.connect(self._on_create_clicked)

        self._build_layout()

    def _build_layout(self) -> None:
        """Erstellt das Layout des Wizards."""

        form_layout = QFormLayout()
        form_layout.addRow("Projekt Name", self._name_input)

        path_row = QHBoxLayout()
        path_row.addWidget(self._base_path_input, stretch=1)
        path_row.addWidget(self._browse_button)
        path_container = QWidget()
        path_container.setLayout(path_row)
        form_layout.addRow("Speicherort", path_container)

        button_layout = QHBoxLayout()
        button_layout.addStretch(1)
        button_layout.addWidget(self._create_button)

        root_layout = QVBoxLayout()
        root_layout.addLayout(form_layout)
        root_layout.addLayout(button_layout)
        self.setLayout(root_layout)

    def _on_browse_clicked(self) -> None:
        """Öffnet den Dialog zur Ordnerauswahl."""

        folder = QFileDialog.getExistingDirectory(self, "Speicherort wählen")
        if folder:
            self._base_path_input.setText(folder)

    def _on_create_clicked(self) -> None:
        """Legt das Projekt an und speichert den Pfad."""

        name = self._name_input.text().strip()
        base_path = self._base_path_input.text().strip()

        if not name:
            QMessageBox.warning(self, "Fehlende Daten", "Bitte einen Projektnamen eingeben.")
            return
        if not base_path:
            QMessageBox.warning(self, "Fehlende Daten", "Bitte einen Speicherort auswählen.")
            return

        manager = ProjectManager()
        try:
            project_root = manager.create_project(base_path, name)
        except Exception as exc:  # noqa: BLE001 - GUI soll Fehlermeldungen anzeigen
            QMessageBox.critical(self, "Projektanlage fehlgeschlagen", str(exc))
            return

        self.created_project_path = project_root
        QMessageBox.information(
            self,
            "Projekt erstellt",
            "Projekt erstellt. Bitte kopiere deine englischen Audiodateien in den Ordner "
            "'source_audio' und klicke dann auf 'Refresh'.",
        )
        self.accept()
