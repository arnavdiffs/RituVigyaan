import math
from typing import Tuple

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on the earth in kilometers.
    """
    # Earth radius in kilometers
    R = 6371.0

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return round(distance, 2)

def is_within_radius(center_lat: float, center_lon: float, point_lat: float, point_lon: float, radius_km: float) -> Tuple[bool, float]:
    """
    Returns (True, distance_km) if point is within radius_km of center, else (False, distance_km).
    """
    dist = haversine_distance(center_lat, center_lon, point_lat, point_lon)
    return (dist <= radius_km, dist)
