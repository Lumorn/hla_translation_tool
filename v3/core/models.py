from typing import Optional

from pydantic import BaseModel


class CaptionLine(BaseModel):
    """Repräsentiert eine einzelne Zeile aus einer Closecaption-Datei."""

    key: str
    original_text: str
    translated_text: Optional[str] = None
    line_number: int
