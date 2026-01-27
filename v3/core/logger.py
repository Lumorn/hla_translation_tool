from __future__ import annotations

import logging
import sys
from pathlib import Path


def setup_logging() -> None:
    """Initialisiert Logging für Konsole und Datei."""

    log_dir = Path(__file__).resolve().parents[1] / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_path = log_dir / "app.log"

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    formatter = logging.Formatter(
        "%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )

    file_handler = logging.FileHandler(log_path, encoding="utf-8")
    file_handler.setFormatter(formatter)

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)

    # Vorhandene Handler ersetzen, damit keine Duplikate entstehen.
    root_logger.handlers = [file_handler, stream_handler]

    def handle_exception(exc_type, exc_value, exc_traceback) -> None:
        """Fängt ungefangene Ausnahmen ab und schreibt sie ins Log."""

        if issubclass(exc_type, KeyboardInterrupt):
            sys.__excepthook__(exc_type, exc_value, exc_traceback)
            return

        root_logger.critical(
            "Unbehandelte Ausnahme",
            exc_info=(exc_type, exc_value, exc_traceback),
        )

    sys.excepthook = handle_exception
    root_logger.info("Logging wurde initialisiert.")
