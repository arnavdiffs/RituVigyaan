import asyncio
import sys
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
from server.database import init_db, get_connection
from server.services.dispatcher import dispatch_fire_and_forget_alert

async def run_test():
    init_db()
    print("Testing dispatch for Tower 1 (Niphad Mandi Tower, 10km radius)...")
    
    # Niphad Mandi Central Tower ID is 1
    summary = await dispatch_fire_and_forget_alert(
        tower_id=1,
        center_lat=20.0766,
        center_lon=74.1085,
        rain_intensity_mm=35.0, # Heavy storm
        storm_radius_km=10.0,
        severity="severe",
        notes="Automated radar test verification"
    )

    print(f"Total farmers evaluated: {summary['total_farmers_evaluated']}")
    print(f"High risk farmers alerted: {summary['high_risk_farmers_alerted']}")
    print(f"Moderate risk farmers alerted: {summary['moderate_risk_farmers_alerted']}")
    print(f"Total deliveries sent: {summary['total_deliveries_sent']}")
    
    print("\nSample Alert Deliveries:")
    for d in summary["deliveries"][:4]:
        print(f"-> Farmer: {d['farmer_name']} ({d['village']}) | Crop: {d['crop']} [{d['crop_stage']}] | Dist: {d['distance_km']}km | Channel: {d['channel']}")
        print(f"   Message: {d['message'][:80]}...\n")

    # Assertions
    assert summary["high_risk_farmers_alerted"] > 0, "Should alert at least 1 high-risk farmer"
    print("All backend logic assertions passed successfully!")

if __name__ == "__main__":
    asyncio.run(run_test())
