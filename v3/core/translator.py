from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from openai import OpenAI


class Translator:
    """Kapselt den OpenAI-Aufruf für Übersetzungen."""

    def __init__(self, model: Optional[str] = None, system_prompt_path: Optional[Path] = None) -> None:
        load_dotenv()

        api_key = os.getenv("OPENAI_API_KEY", "").strip()
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY fehlt in der .env-Datei.")

        self._client = OpenAI(api_key=api_key)
        self._model = model or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        self._system_prompt = self._load_system_prompt(system_prompt_path)

    def generate_translation(self, original_text: str, context: str = "") -> str:
        """Erzeugt eine Übersetzung für den gegebenen Text."""

        user_prompt = self._build_user_prompt(original_text, context)
        response = self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": self._system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )
        content = response.choices[0].message.content if response.choices else ""
        return (content or "").strip()

    def _build_user_prompt(self, original_text: str, context: str) -> str:
        """Baut die User-Nachricht aus Originaltext und optionalem Kontext zusammen."""

        context_block = context.strip()
        if context_block:
            return f"Original:\n{original_text.strip()}\n\nKontext:\n{context_block}"
        return f"Original:\n{original_text.strip()}"

    def _load_system_prompt(self, system_prompt_path: Optional[Path]) -> str:
        """Lädt den System-Prompt aus der Datei oder liefert einen Fallback."""

        root_path = Path(__file__).resolve().parents[2]
        prompt_path = system_prompt_path or root_path / "prompts" / "gpt_score_german.txt"
        if prompt_path.is_file():
            return prompt_path.read_text(encoding="utf-8")

        return (
            "Du bist ein professioneller Übersetzer für deutsche Untertitel. "
            "Übersetze den Nutzertext präzise, natürlich und im passenden Tonfall. "
            "Liefere ausschließlich die deutsche Übersetzung ohne zusätzliche Erklärungen."
        )
