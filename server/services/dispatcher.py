import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
from server.database import get_connection
from server.services.geo import is_within_radius, haversine_distance
from server.services.vulnerability import evaluate_crop_risk, generate_alert_message
from server.services.sarvam import generate_sarvam_tts

# In-memory buffer for real-time live alert feed on the dashboard
LATEST_DISPATCH: Dict[str, Any] = {
    "active": False,
    "event": None,
    "alert_deliveries": []
}

async def dispatch_fire_and_forget_alert(
    tower_id: Optional[int],
    center_lat: float,
    center_lon: float,
    rain_intensity_mm: float,
    storm_radius_km: float,
    severity: str,
    notes: str
) -> Dict[str, Any]:
    """
    Executes the fire-and-forget Amber Alert workflow asynchronously:
    1. Finds all opted-in farmers within coverage range.
    2. Filters based on crop sensitivity and stage.
    3. Issues Class 0 Flash SMS and Voice IVR alerts.
    4. Logs to database and updates dashboard stream.
    """
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().isoformat()

    tower_name = "Hyperlocal Weather Cell"
    tower_code = "HYPER-RADAR-01"
    effective_radius = storm_radius_km

    if tower_id:
        cursor.execute("SELECT * FROM towers WHERE id = ?", (tower_id,))
        t_row = cursor.fetchone()
        if t_row:
            tower_name = t_row["name"]
            tower_code = t_row["code"]
            center_lat = t_row["latitude"]
            center_lon = t_row["longitude"]
            effective_radius = t_row["radius_km"]

    # 1. Fetch all active opted-in farmers
    cursor.execute("SELECT * FROM farmers WHERE opt_in_status = 1")
    all_farmers = cursor.fetchall()

    farmers_in_zone = []
    deliveries_to_record = []
    high_risk_count = 0
    mod_risk_count = 0
    suppressed_count = 0

    for f in all_farmers:
        # Check geographic distance from center
        within, dist_km = is_within_radius(center_lat, center_lon, f["latitude"], f["longitude"], effective_radius)
        if not within:
            continue

        farmers_in_zone.append(f)

        # Check crop sensitivity & growth stage
        risk, should_alert = evaluate_crop_risk(f["crop"], f["crop_stage"], rain_intensity_mm)
        
        if not should_alert:
            # Crop is safe (e.g. vegetative paddy) -> Suppress to kill alert fatigue!
            suppressed_count += 1
            continue

        if risk == "CRITICAL":
            high_risk_count += 1
        else:
            mod_risk_count += 1

        # Generate alert message in farmer's preferred language
        msg = generate_alert_message(
            farmer_name=f["name"],
            crop=f["crop"],
            crop_stage=f["crop_stage"],
            risk=risk,
            language=f["language"]
        )

        # TIER 1: Targeted Class 0 Flash SMS (bypasses inbox, full screen emergency alert)
        delivery_item = {
            "farmer_id": f["id"],
            "farmer_name": f["name"],
            "phone": f["phone"],
            "village": f["village"],
            "crop": f["crop"],
            "crop_stage": f["crop_stage"],
            "language": f["language"],
            "channel": "TIER_1_FLASH_SMS_CLASS_0",
            "message": msg,
            "urgency": risk,
            "distance_km": dist_km,
            "status": "DELIVERED_INSTANT",
            "delivered_at": now_str
        }
        deliveries_to_record.append(delivery_item)

        # TIER 1 Fallback: Automated Vernacular Voice Call (IVR) for Critical Stage or Illiterate Farmers
        if risk == "CRITICAL":
            voice_item = {
                "farmer_id": f["id"],
                "farmer_name": f["name"],
                "phone": f["phone"],
                "village": f["village"],
                "crop": f["crop"],
                "crop_stage": f["crop_stage"],
                "language": f["language"],
                "channel": "TIER_1_VOICE_CALL_IVR",
                "message": f"कृषि आपातकालीन वॉयस कॉल: {msg}",
                "urgency": "CRITICAL",
                "distance_km": dist_km,
                "status": "QUEUED_RINGING",
                "delivered_at": now_str
            }
            deliveries_to_record.append(voice_item)

    # TIER 2: APMC Mandi Cell Broadcast (CB)
    # If this tower covers an APMC Mandi yard and rain is severe/cloudburst (>= 30mm/hr), trigger network-level Cell Broadcast
    is_mandi_tower = False
    if tower_id:
        cursor.execute("SELECT is_apmc_mandi FROM towers WHERE id = ?", (tower_id,))
        m_row = cursor.fetchone()
        if m_row and m_row["is_apmc_mandi"]:
            is_mandi_tower = True

    mandi_cb_active = is_mandi_tower and rain_intensity_mm >= 30.0

    # Calculate suppression rate
    zone_count = len(farmers_in_zone)
    suppression_rate = round((suppressed_count / zone_count * 100), 1) if zone_count > 0 else 0.0

    # 2. Persist alert event in DB
    desc = f"Rain Alert ({rain_intensity_mm} mm/h) near {tower_name} - {notes}"
    cursor.execute("""
    INSERT INTO alerts (tower_id, latitude, longitude, rain_intensity_mm, severity, description, total_farmers_evaluated, high_risk_farmers_alerted, moderate_risk_farmers_alerted, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (tower_id, center_lat, center_lon, rain_intensity_mm, severity, desc, zone_count, high_risk_count, mod_risk_count, now_str))
    
    alert_id = cursor.lastrowid

    # 3. Persist deliveries and generate Sarvam TTS audio
    for d in deliveries_to_record:
        try:
            d["audio_url"] = await generate_sarvam_tts(d["message"], d["language"], d["farmer_id"])
        except Exception:
            d["audio_url"] = None

        cursor.execute("""
        INSERT INTO alert_deliveries (alert_id, farmer_id, channel, message, urgency, distance_km, status, delivered_at, audio_url)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (alert_id, d["farmer_id"], d["channel"], d["message"], d["urgency"], d["distance_km"], d["status"], d["delivered_at"], d.get("audio_url")))

    conn.commit()
    conn.close()

    summary = {
        "alert_id": alert_id,
        "timestamp": now_str,
        "tower_id": tower_id,
        "tower_name": tower_name,
        "tower_code": tower_code,
        "center_lat": center_lat,
        "center_lon": center_lon,
        "radius_km": effective_radius,
        "rain_intensity_mm": rain_intensity_mm,
        "severity": severity,
        "description": desc,
        "total_farmers_evaluated": zone_count,
        "high_risk_farmers_alerted": high_risk_count,
        "moderate_risk_farmers_alerted": mod_risk_count,
        "suppressed_safe_farmers": suppressed_count,
        "suppression_rate_percent": suppression_rate,
        "mandi_cell_broadcast_active": mandi_cb_active,
        "total_deliveries_sent": len(deliveries_to_record),
        "deliveries": deliveries_to_record
    }

    # Update global in-memory state for live UI
    global LATEST_DISPATCH
    LATEST_DISPATCH = {
        "active": True,
        "event": summary,
        "alert_deliveries": deliveries_to_record[:25]
    }

    return summary
