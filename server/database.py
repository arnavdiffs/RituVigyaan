import sqlite3
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

DB_FILE = os.path.join(os.path.dirname(__file__), "krishi.db")

def get_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Towers table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS towers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        radius_km REAL DEFAULT 10.0,
        state TEXT NOT NULL,
        district TEXT NOT NULL,
        is_apmc_mandi INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
    )
    """)

    # Farmers table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS farmers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        village TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        crop TEXT NOT NULL,
        crop_stage TEXT NOT NULL,
        language TEXT DEFAULT 'hi',
        agristack_id TEXT,
        plot_survey_no TEXT,
        opt_in_status INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
    )
    """)

    # Safe column migrations if database already existed
    try:
        cursor.execute("ALTER TABLE towers ADD COLUMN is_apmc_mandi INTEGER DEFAULT 0")
    except Exception:
        pass

    try:
        cursor.execute("ALTER TABLE farmers ADD COLUMN agristack_id TEXT")
        cursor.execute("ALTER TABLE farmers ADD COLUMN plot_survey_no TEXT")
    except Exception:
        pass

    # Alert Events table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tower_id INTEGER,
        latitude REAL,
        longitude REAL,
        rain_intensity_mm REAL NOT NULL,
        severity TEXT NOT NULL,
        description TEXT NOT NULL,
        total_farmers_evaluated INTEGER DEFAULT 0,
        high_risk_farmers_alerted INTEGER DEFAULT 0,
        moderate_risk_farmers_alerted INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (tower_id) REFERENCES towers(id)
    )
    """)

    # Alert Delivery logs table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alert_deliveries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alert_id INTEGER NOT NULL,
        farmer_id INTEGER NOT NULL,
        channel TEXT NOT NULL,
        message TEXT NOT NULL,
        urgency TEXT NOT NULL,
        distance_km REAL NOT NULL,
        status TEXT NOT NULL,
        delivered_at TEXT NOT NULL,
        FOREIGN KEY (alert_id) REFERENCES alerts(id),
        FOREIGN KEY (farmer_id) REFERENCES farmers(id)
    )
    """)

    conn.commit()

    # Seed initial data if empty
    cursor.execute("SELECT COUNT(*) as count FROM towers")
    if cursor.fetchone()["count"] == 0:
        seed_data(conn)

    conn.close()

def seed_data(conn):
    cursor = conn.cursor()
    now = datetime.now().isoformat()

    # Seed towers around agricultural hubs (Nashik/Maharashtra onion-grape-cotton belt & Punjab wheat belt)
    towers = [
        ("Niphad Mandi Central Tower", "MH-NIPH-01", 20.0766, 74.1085, 10.0, "Maharashtra", "Nashik", 1, now),
        ("Lasalgaon APMC Market Tower", "MH-LASL-02", 20.1472, 74.2268, 10.0, "Maharashtra", "Nashik", 1, now),
        ("Yeola Agro & Cotton Tower", "MH-YEOL-03", 20.0433, 74.4891, 12.0, "Maharashtra", "Nashik", 0, now),
        ("Sinnar Horticulture Tower", "MH-SINN-04", 19.8458, 73.9961, 10.0, "Maharashtra", "Nashik", 0, now),
        ("Khanna Grain Terminal Tower", "PB-KHAN-05", 30.7068, 76.2197, 15.0, "Punjab", "Ludhiana", 1, now)
    ]
    cursor.executemany("""
    INSERT INTO towers (name, code, latitude, longitude, radius_km, state, district, is_apmc_mandi, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, towers)

    # Seed farmers located within and slightly outside these tower radii
    farmers = [
        # Near Niphad (20.0766, 74.1085)
        ("Ramesh Patil", "+91 98220 11234", "Pimpalgaon Baswant", 20.0820, 74.1120, "Onion", "harvested_open", "mr", 1, now),
        ("Sunita Dnyaneshwar Jadhav", "+91 98221 22345", "Ozar Rural", 20.0650, 74.0890, "Grapes", "fruiting", "mr", 1, now),
        ("Tukaram Khairnar", "+91 98222 33456", "Vinchur", 20.1010, 74.1450, "Wheat", "harvested_open", "mr", 1, now),
        ("Santosh Bhalerao", "+91 98223 44567", "Niphad West", 20.0700, 74.0950, "Paddy", "vegetative", "mr", 1, now), # Should NOT alert (low risk)
        ("Anand Shinde", "+91 98224 55678", "Niphad South", 20.0520, 74.1200, "Tomato", "flowering", "mr", 1, now),

        # Near Lasalgaon (20.1472, 74.2268)
        ("Dattatray Sanap", "+91 98225 66789", "Lasalgaon Mandi Yard", 20.1485, 74.2250, "Onion", "harvested_open", "mr", 1, now),
        ("Kailas Borse", "+91 98226 77890", "Kotamgaon", 20.1600, 74.2400, "Onion", "mature_pre_harvest", "mr", 1, now),
        ("Eknath Aher", "+91 98227 88901", "Andarsul", 20.1250, 74.2100, "Mustard", "harvested_open", "hi", 1, now),
        ("Vikas Pawar", "+91 98228 99012", "Bharwas", 20.1380, 74.2600, "Wheat", "vegetative", "mr", 1, now), # Should NOT alert

        # Near Yeola (20.0433, 74.4891)
        ("Baburao More", "+91 98230 12345", "Pategaon", 20.0510, 74.4750, "Cotton", "mature_pre_harvest", "mr", 1, now),
        ("Ganesh Wagh", "+91 98231 23456", "Nagarsul", 20.0320, 74.5100, "Cotton", "flowering", "mr", 1, now),
        ("Popat Sonawane", "+91 98232 34567", "Mukhed", 20.0650, 74.4920, "Onion", "harvested_open", "mr", 1, now),

        # Near Sinnar (19.8458, 73.9961)
        ("Suresh Gaikwad", "+91 98233 45678", "Musalgaon", 19.8510, 73.9850, "Tomato", "fruiting", "hi", 1, now),
        ("Pandurang Gite", "+91 98234 56789", "Wavi", 19.8320, 74.0200, "Wheat", "mature_pre_harvest", "hi", 1, now),
        ("Mangala Tai Deshmukh", "+91 98235 67890", "Dodi Budruk", 19.8150, 74.0450, "Onion", "harvested_open", "mr", 1, now),

        # Near Khanna / Punjab (30.7068, 76.2197)
        ("Gurpreet Singh Brar", "+91 98140 12345", "Daha", 30.7120, 76.2250, "Wheat", "harvested_open", "pa", 1, now),
        ("Harinder Singh Dhillon", "+91 98141 23456", "Samrala Kalan", 30.7250, 76.2400, "Mustard", "mature_pre_harvest", "pa", 1, now),
        ("Balwinder Kaur", "+91 98142 34567", "Lalheri", 30.6950, 76.2050, "Wheat", "mature_pre_harvest", "pa", 1, now),
        ("Jaswant Singh", "+91 98143 45678", "Alour", 30.6800, 76.2100, "Paddy", "vegetative", "pa", 1, now) # Should NOT alert
    ]
    cursor.executemany("""
    INSERT INTO farmers (name, phone, village, latitude, longitude, crop, crop_stage, language, opt_in_status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, farmers)

    conn.commit()
