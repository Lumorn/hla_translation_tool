import sys

from PySide6.QtCore import Qt
from PySide6.QtWidgets import QApplication, QLabel, QMainWindow


def main() -> int:
    app = QApplication(sys.argv)

    window = QMainWindow()
    window.setWindowTitle("HLA Translation Tool V3 (Alpha)")
    window.resize(1200, 800)

    label = QLabel("V3 Backend Initialized")
    label.setAlignment(Qt.AlignCenter)
    window.setCentralWidget(label)

    window.show()
    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())
