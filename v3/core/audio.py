from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

import requests
from dotenv import load_dotenv
from pydub import AudioSegment
from pydub.playback import play


class AudioEngine:
    """Backend für Audio-Wiedergabe und ElevenLabs-Dubbing."""

    def __init__(self) -> None:
        load_dotenv()
        self._api_key = self._load_api_key()

    def _load_api_key(self) -> Optional[str]:
        """Liest den ElevenLabs-API-Key aus der Umgebung."""

        key = os.getenv("ELEVENLABS_API_KEY", "").strip()
        return key or None

    def play_audio(self, filepath: str) -> None:
        """Spielt eine Audio-Datei ab."""

        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Audio-Datei nicht gefunden: {filepath}")

        audio = AudioSegment.from_file(path)
        play(audio)

    def generate_dub(self, text: str, voice_id: str, output_path: str) -> str:
        """Sendet den Text an ElevenLabs und speichert die Audiodatei."""

        if not self._api_key:
            raise RuntimeError("ELEVENLABS_API_KEY fehlt. Bitte in der .env setzen.")
        if not text.strip():
            raise ValueError("Der Text für das Dubbing ist leer.")
        if not voice_id.strip():
            raise ValueError("Die Voice-ID ist leer oder nicht konfiguriert.")

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        payload = {"text": text, "model_id": "eleven_multilingual_v2"}
        headers = {
            "xi-api-key": self._api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }

        response = requests.post(url, json=payload, headers=headers, timeout=120)
        if not response.ok:
            detail = response.text.strip()
            if response.status_code in {401, 403}:
                raise RuntimeError("ElevenLabs API-Key fehlt oder ist ungültig.")
            if response.status_code == 429 or "quota" in detail.lower():
                raise RuntimeError("ElevenLabs-Quote ist leer oder das Limit ist erreicht.")
            raise RuntimeError(f"ElevenLabs-Fehler ({response.status_code}): {detail}")

        if not response.content:
            raise RuntimeError("Die ElevenLabs-Antwort enthält keine Audio-Daten.")

        target = Path(output_path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(response.content)
        return str(target)
