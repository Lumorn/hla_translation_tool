import os
import sys
# Root-Verzeichnis zum Pfad hinzufügen, falls es fehlt.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from pathlib import Path

from PySide6.QtGui import QIcon
from PySide6.QtWidgets import QApplication

from v3.core.logger import setup_logging
from v3.ui.main_window import MainWindow


def main() -> int:
    setup_logging()

    app = QApplication(sys.argv)

    styles_path = Path(__file__).resolve().parent / "assets" / "styles.qss"
    if styles_path.exists():
        app.setStyleSheet(styles_path.read_text(encoding="utf-8"))
    else:
        logging.warning("Stylesheet nicht gefunden: %s", styles_path)

    icon_path = Path(__file__).resolve().parent / "assets" / "app-icon.png"
    if icon_path.exists():
        app.setWindowIcon(QIcon(str(icon_path)))
    else:
        logging.info("Kein App-Icon gefunden, Standard-Icon wird verwendet.")

    window = MainWindow()
    window.show()

    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())
