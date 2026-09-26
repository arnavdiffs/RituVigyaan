import os
import base64
import httpx
from pathlib import Path
from typing import Optional, Tuple

AUDIO_CACHE_DIR = Path(__file__).resolve().parent.parent / "audio_cache"
AUDIO_CACHE_DIR.mkdir(parents=True, exist_ok=True)

ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"
if ENV_FILE.exists():
    with open(ENV_FILE, "r", encoding="utf-8-sig") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                k = k.replace("\ufeff", "").strip()
                os.environ[k] = v.strip().strip('"').strip("'")

LANG_MAP = {
    "hi": "hi-IN",
    "mr": "mr-IN",
    "pa": "pa-IN",
    "en": "en-IN"
}

async def generate_sarvam_tts(text: str, language: str = "hi", delivery_id: Optional[int] = None) -> Tuple[Optional[str], Optional[str]]:
    """
    Returns (audio_url, error_message).
    audio_url is present if Sarvam succeeds, error_message is present if it fails.
    """
    api_key = os.getenv("SARVAM_API_KEY", "").replace("\ufeff", "").strip()
    if not api_key:
        msg = "SARVAM_API_KEY is missing or empty in .env"
        print(f"[Sarvam TTS] {msg}")
        return None, msg

    target_lang = LANG_MAP.get(language, "hi-IN")
    filename = f"delivery_{delivery_id or 'temp'}_{language}.wav"
    filepath = AUDIO_CACHE_DIR / filename

    if filepath.exists() and filepath.stat().st_size > 0:
        print(f"[Sarvam TTS] Cached audio hit: /api/audio/{filename}")
        return f"/api/audio/{filename}", None

    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }

    payload = {
        "inputs": [text[:500]],
        "target_language_code": target_lang,
        "speaker": "aditya",
        "pitch": 0,
        "pace": 1.0,
        "loudness": 1.5,
        "speech_sample_rate": 8000,
        "enable_preprocessing": True,
        "model": "bulbul:v3"
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.post("https://api.sarvam.ai/text-to-speech", json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                audios = data.get("audios", [])
                if audios and audios[0]:
                    audio_bytes = base64.b64decode(audios[0])
                    with open(filepath, "wb") as f:
                        f.write(audio_bytes)
                    print(f"[Sarvam TTS] Audio generated successfully ({len(audio_bytes)} bytes) -> /api/audio/{filename}")
                    return f"/api/audio/{filename}", None
                else:
                    err = "Sarvam returned 200 OK but audios array was empty"
                    print(f"[Sarvam TTS] {err}")
                    return None, err
            else:
                err = f"Sarvam API {resp.status_code} Error: {resp.text}"
                print(f"[Sarvam TTS] {err}")
                return None, err
    except Exception as e:
        err = f"Sarvam network exception: {str(e)}"
        print(f"[Sarvam TTS] {err}")
        return None, err
