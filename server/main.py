import asyncio
from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import List, Optional, Dict, Any

from server.database import init_db, get_connection
from server.models import Tower, TowerCreate, Farmer, FarmerCreate, StormEventRequest
from server.services.dispatcher import dispatch_fire_and_forget_alert, LATEST_DISPATCH
from server.services.weather import get_live_weather
from server.services.vulnerability import CROP_VULNERABILITY_MATRIX, ACTIONABLE_ADVICE
from server.services.geo import haversine_distance

app = FastAPI(
    title="Krishi Alert API",
    description="Hyperlocal Amber Alert system for rain-sensitive crops and small-scale farmers",
    version="1.0.0"
)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Enable CORS for frontend dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "client", "dist"))
if os.path.exists(DIST_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/")
def serve_index():
    index_file = os.path.join(DIST_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Krishi Alert API is running. Frontend build not found."}

@app.get("/api/health")
def health():
    return {"status": "healthy", "service": "Krishi Alert System", "timestamp": datetime.now().isoformat()}

# --- Towers API ---
@app.get("/api/towers")
def list_towers():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM towers WHERE is_active = 1")
    rows = cursor.fetchall()
    
    result = []
    for r in rows:
        # Count farmers covered by this tower
        cursor.execute("SELECT COUNT(*) as cnt FROM farmers WHERE opt_in_status = 1")
        # Compute covered farmers
        cursor.execute("SELECT latitude, longitude FROM farmers WHERE opt_in_status = 1")
        farmer_coords = cursor.fetchall()
        covered_cnt = 0
        for f in farmer_coords:
            dist = haversine_distance(r["latitude"], r["longitude"], f["latitude"], f["longitude"])
            if dist <= r["radius_km"]:
                covered_cnt += 1

        result.append({
            "id": r["id"],
            "name": r["name"],
            "code": r["code"],
            "latitude": r["latitude"],
            "longitude": r["longitude"],
            "radius_km": r["radius_km"],
            "state": r["state"],
            "district": r["district"],
            "is_apmc_mandi": bool(r["is_apmc_mandi"]) if "is_apmc_mandi" in r.keys() else False,
            "is_active": bool(r["is_active"]),
            "covered_farmers_count": covered_cnt,
            "created_at": r["created_at"]
        })
    conn.close()
    return result

@app.post("/api/towers")
def create_tower(tower: TowerCreate):
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().isoformat()
    try:
        cursor.execute("""
        INSERT INTO towers (name, code, latitude, longitude, radius_km, state, district, is_apmc_mandi, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (tower.name, tower.code, tower.latitude, tower.longitude, tower.radius_km, tower.state, tower.district, int(tower.is_apmc_mandi), int(tower.is_active), now_str))
        conn.commit()
        new_id = cursor.lastrowid
    except Exception as e:
        conn.close()
        raise HTTPException(status_code=400, detail=str(e))
    conn.close()
    return {"id": new_id, "message": "Tower registered successfully"}

# --- Farmers API ---
@app.get("/api/farmers")
def list_farmers():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM farmers ORDER BY id DESC")
    rows = cursor.fetchall()
    
    # Also fetch towers to determine nearest tower
    cursor.execute("SELECT * FROM towers WHERE is_active = 1")
    towers = cursor.fetchall()

    result = []
    for r in rows:
        nearest_tower = None
        min_dist = 9999.0
        for t in towers:
            d = haversine_distance(t["latitude"], t["longitude"], r["latitude"], r["longitude"])
            if d < min_dist:
                min_dist = d
                nearest_tower = t["name"]

        result.append({
            "id": r["id"],
            "name": r["name"],
            "phone": r["phone"],
            "village": r["village"],
            "latitude": r["latitude"],
            "longitude": r["longitude"],
            "crop": r["crop"],
            "crop_stage": r["crop_stage"],
            "language": r["language"],
            "agristack_id": r["agristack_id"] if "agristack_id" in r.keys() else None,
            "plot_survey_no": r["plot_survey_no"] if "plot_survey_no" in r.keys() else None,
            "opt_in_status": bool(r["opt_in_status"]),
            "nearest_tower": nearest_tower,
            "distance_to_nearest_tower_km": min_dist if nearest_tower else None,
            "created_at": r["created_at"]
        })
    conn.close()
    return result

@app.post("/api/farmers")
def register_farmer(farmer: FarmerCreate):
    conn = get_connection()
    cursor = conn.cursor()
    now_str = datetime.now().isoformat()
    cursor.execute("""
    INSERT INTO farmers (name, phone, village, latitude, longitude, crop, crop_stage, language, opt_in_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (farmer.name, farmer.phone, farmer.village, farmer.latitude, farmer.longitude, farmer.crop, farmer.crop_stage, farmer.language, int(farmer.opt_in_status), now_str))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return {"id": new_id, "message": "Farmer opted-in to Krishi Alert successfully"}

# --- Crop Sensitivity Information ---
@app.get("/api/crops")
def get_crop_matrix():
    return {
        "matrix": CROP_VULNERABILITY_MATRIX,
        "stages": [
            {"id": "harvested_open", "label": "Harvested / Drying in Open Threshing Area", "default_risk": "CRITICAL"},
            {"id": "mature_pre_harvest", "label": "Mature (Standing Ready to Harvest)", "default_risk": "HIGH"},
            {"id": "flowering", "label": "Flowering Stage (Sensitive Pollen)", "default_risk": "HIGH"},
            {"id": "fruiting", "label": "Fruiting / Pod Formation", "default_risk": "HIGH"},
            {"id": "vegetative", "label": "Vegetative / Growth Stage", "default_risk": "LOW"},
            {"id": "seedling", "label": "Seedling / Germination Stage", "default_risk": "MODERATE"}
        ]
    }

# --- Storm & Alert Ingestion (Fire and Forget) ---
@app.post("/api/alerts/trigger")
async def trigger_storm_alert(req: StormEventRequest, background_tasks: BackgroundTasks):
    """
    Trigger a storm weather event. The alert process runs in background as 'Fire and Forget'.
    """
    conn = get_connection()
    cursor = conn.cursor()

    if req.tower_id:
        cursor.execute("SELECT * FROM towers WHERE id = ?", (req.tower_id,))
        t = cursor.fetchone()
        if not t:
            conn.close()
            raise HTTPException(status_code=404, detail="Tower not found")
        c_lat = t["latitude"]
        c_lon = t["longitude"]
        r_km = t["radius_km"]
    elif req.latitude is not None and req.longitude is not None:
        c_lat = req.latitude
        c_lon = req.longitude
        r_km = req.storm_radius_km
    else:
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="Must specify either a valid tower_id or both latitude and longitude."
        )
    conn.close()

    # Fire and Forget: execute alert dispatch
    # We call it directly and return summary, while async task handles simulation queues
    summary = await dispatch_fire_and_forget_alert(
        tower_id=req.tower_id,
        center_lat=c_lat,
        center_lon=c_lon,
        rain_intensity_mm=req.rain_intensity_mm,
        storm_radius_km=r_km,
        severity=req.severity,
        notes=req.notes or "Localized Storm Front"
    )

    return {
        "status": "DISPATCHED_FIRE_AND_FORGET",
        "message": f"Amber Alert broadcast issued for {summary['high_risk_farmers_alerted']} high-risk farmers within {r_km}km radius.",
        "summary": summary
    }

@app.get("/api/alerts/latest")
def get_latest_alert():
    return LATEST_DISPATCH

@app.get("/api/alerts/history")
def get_alert_history():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT a.*, t.name as tower_name, t.code as tower_code
    FROM alerts a
    LEFT JOIN towers t ON a.tower_id = t.id
    ORDER BY a.id DESC LIMIT 20
    """)
    alerts = cursor.fetchall()
    
    result = []
    for a in alerts:
        cursor.execute("""
        SELECT ad.*, f.name as farmer_name, f.phone, f.crop, f.crop_stage, f.village
        FROM alert_deliveries ad
        JOIN farmers f ON ad.farmer_id = f.id
        WHERE ad.alert_id = ?
        ORDER BY ad.id ASC
        """, (a["id"],))
        deliveries = cursor.fetchall()

        result.append({
            "id": a["id"],
            "tower_id": a["tower_id"],
            "tower_name": a["tower_name"],
            "tower_code": a["tower_code"],
            "latitude": a["latitude"],
            "longitude": a["longitude"],
            "rain_intensity_mm": a["rain_intensity_mm"],
            "severity": a["severity"],
            "description": a["description"],
            "total_farmers_evaluated": a["total_farmers_evaluated"],
            "high_risk_farmers_alerted": a["high_risk_farmers_alerted"],
            "moderate_risk_farmers_alerted": a["moderate_risk_farmers_alerted"],
            "created_at": a["created_at"],
            "deliveries": [dict(d) for d in deliveries]
        })
    conn.close()
    return result

@app.get("/api/weather/live/{tower_id}")
async def get_tower_live_weather(tower_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM towers WHERE id = ?", (tower_id,))
    t = cursor.fetchone()
    conn.close()
    if not t:
        raise HTTPException(status_code=404, detail="Tower not found")
    
    weather = await get_live_weather(t["latitude"], t["longitude"])
    return {
        "tower_id": t["id"],
        "tower_name": t["name"],
        "radius_km": t["radius_km"],
        "weather": weather
    }
