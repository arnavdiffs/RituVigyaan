import os
import base64
import httpx
from pathlib import Path
from typing import Optional

AUDIO_CACHE_DIR = Path(__file__).resolve().parent.parent / "audio_cache"
AUDIO_CACHE_DIR.mkdir(parents=True, exist_ok=True)

ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"
if ENV_FILE.exists():
    with open(ENV_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

LANG_MAP = {
    "hi": "hi-IN",
    "mr": "mr-IN",
    "pa": "pa-IN",
    "en": "en-IN"
}

async def generate_sarvam_tts(text: str, language: str = "hi", delivery_id: Optional[int] = None) -> Optional[str]:
    api_key = os.getenv("SARVAM_API_KEY", "").strip()
    if not api_key:
        return None

    target_lang = LANG_MAP.get(language, "hi-IN")
    filename = f"delivery_{delivery_id or 'temp'}_{language}.wav"
    filepath = AUDIO_CACHE_DIR / filename

    if filepath.exists() and filepath.stat().st_size > 0:
        return f"/api/audio/{filename}"

    headers = {
        "api-subscription-key": api_key,
        "Content-Type": "application/json"
    }

    payload = {
        "inputs": [text[:500]],
        "target_language_code": target_lang,
        "speaker": "meera",
        "pitch": 0,
        "pace": 1.0,
        "loudness": 1.5,
        "speech_sample_rate": 8000,
        "enable_preprocessing": True,
        "model": "bulbul:v1"
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post("https://api.sarvam.ai/text-to-speech", json=payload, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                audios = data.get("audios", [])
                if audios and audios[0]:
                    audio_bytes = base64.b64decode(audios[0])
                    with open(filepath, "wb") as f:
                        f.write(audio_bytes)
                    return f"/api/audio/{filename}"
            else:
                print(f"[Sarvam TTS] API error {resp.status_code}: {resp.text}")
                return None
    except Exception as e:
        print(f"[Sarvam TTS] Exception: {e}")
        return None
