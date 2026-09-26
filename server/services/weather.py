import httpx
from typing import Dict, Any

async def get_live_weather(latitude: float, longitude: float) -> Dict[str, Any]:
    """
    Fetches real-time weather & rain forecast strictly from Open-Meteo API.
    Zero mock/simulated data. Returns real parsed API data or an explicit 'weather_unavailable' status.
    """
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={latitude}&longitude={longitude}"
        f"&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m"
        f"&hourly=precipitation_probability,precipitation"
        f"&forecast_days=1"
    )
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url)
            
            if resp.status_code != 200:
                return {
                    "status": "weather_unavailable",
                    "source": "open-meteo",
                    "error": f"Open-Meteo API returned HTTP {resp.status_code}",
                    "latitude": latitude,
                    "longitude": longitude
                }
                
            data = resp.json()
            current = data.get("current")
            hourly = data.get("hourly")
            
            if not current:
                return {
                    "status": "weather_unavailable",
                    "source": "open-meteo",
                    "error": "Open-Meteo API response missing 'current' weather block",
                    "latitude": latitude,
                    "longitude": longitude
                }
                
            return {
                "status": "ok",
                "source": "open-meteo",
                "latitude": data.get("latitude", latitude),
                "longitude": data.get("longitude", longitude),
                "elevation_m": data.get("elevation"),
                "timezone": data.get("timezone"),
                "time": current.get("time"),
                "temperature_c": current.get("temperature_2m"),
                "humidity_percent": current.get("relative_humidity_2m"),
                "precipitation_mm": current.get("precipitation"),
                "rain_mm": current.get("rain"),
                "weather_code": current.get("weather_code"),
                "wind_speed_kmh": current.get("wind_speed_10m"),
                "hourly_forecast": {
                    "time": (hourly.get("time") or [])[:6],
                    "precipitation_probability_percent": (hourly.get("precipitation_probability") or [])[:6],
                    "precipitation_mm": (hourly.get("precipitation") or [])[:6],
                }
            }
    except Exception as exc:
        return {
            "status": "weather_unavailable",
            "source": "open-meteo",
            "error": f"Failed to connect to Open-Meteo API: {str(exc)}",
            "latitude": latitude,
            "longitude": longitude
        }

