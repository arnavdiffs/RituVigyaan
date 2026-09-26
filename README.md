# Krishi (कृषि) 🌾📡
> *Focused on the wellbeing and growth of rural small scale farmers.*

## 🎯 Target #1: Hyperlocal Fire-and-Forget Rain Amber Alert System
Create a Fire and Forget Amber Alert system for farmers where crops are Rain-Sensitive and damage to crops can be done. 
The radio/telecom broadcast tower has a specific radius (e.g., 10km). If rain is detected within 10km of a tower, it issues an immediate warning to specific farmer phones who have opted for this service.
- **Revenue Model**: Public Good / Wellbeing. Government disaster response service where the government funds the infrastructure and the service is completely free to farmers.

---

# Krishi Alert (कृषि सचेत) - System Overview
### Hyperlocal Fire-and-Forget Amber Alert System for Rain-Sensitive Crops

> **Mission**: Protecting the wellbeing and livelihoods of rural small-scale farmers through targeted, zero-cost emergency alerts when sudden unseasonal rains threaten vulnerable crops.

---

## 💡 The Problem & The Solution

### Why Generic Weather Forecasts Fail Small Farmers:
- Standard forecast apps say *"30% chance of rain in district"*. Farmers ignore this or experience alert fatigue.
- When unseasonal rains or sudden cloudbursts strike, small farmers who have **harvested grain drying in open yards/mandis**, **mature cotton ready for harvest**, or **flowering horticulture** face complete financial ruin within hours.

### The Krishi Alert Solution:
1. **Hyperlocal Geofencing (10km Tower Broadcast)**: Every rural cell/radio tower monitors incoming precipitation. If rain is detected within its coverage radius (e.g. 10 km), the alert pipeline activates.
2. **Crop Vulnerability Matrix**: Instead of spamming everyone, the system checks:
   - *Is the crop at a rain-sensitive stage?* (e.g., Harvested open wheat vs vegetative paddy).
   - Only high-risk and critical farmers receive emergency broadcasts; safe crops are suppressed.
3. **Fire-and-Forget Architecture**:
   - High-throughput asynchronous queuing ensures broadcasts are dispatched instantaneously without pipeline bottlenecks.
4. **Rural Channel Simulation**:
   - **Class 0 Flash SMS**: Overrides the screen on basic feature phones (JioBharat, Nokia) like an emergency Amber Alert.
   - **Automated Vernacular Voice IVR**: Speaks actionable instructions in local dialects (Hindi, Marathi, Punjabi) for illiterate farmers.
5. **Government Public Utility Model**:
   - **Zero cost to the farmer**: Intended as a government-subsidized disaster mitigation service integrated with national telecom infrastructure.

---

## 🏛️ Crop Vulnerability Matrix

| Crop | High-Risk Stage | Rain Sensitivity | Automated Advisory Dispatched |
| :--- | :--- | :--- | :--- |
| **Onion (कांदा)** | Harvested / Drying in Mandi | **CRITICAL** | *"Cover produce with tarpaulin immediately; rot risk high!"* |
| **Wheat (गेहूं)** | Threshing Yard / Open Field | **CRITICAL** | *"Move grains to covered sheds; avoid grain discoloration/mold."* |
| **Cotton (कपास)** | Mature Open Bolls | **CRITICAL** | *"Open bolls will be discolored and ruined; harvest/shield now."* |
| **Grapes (द्राक्षे)** | Fruiting Stage | **CRITICAL** | *"Berry cracking risk; clear drainage channels to prevent waterlogging."* |
| **Mustard (सरसों)**| Flowering / Mature Pods | **HIGH** | *"Rain shatter risk; suspend pesticide sprays until clear."* |
| **Paddy (धान)** | Vegetative Growth | **SAFE** | *(Alert suppressed to avoid spamming the farmer)* |

---

## 🚀 Getting Started

### Prerequisites:
- Python 3.10+
- Node.js 18+ (already bundled & built in `client/dist`)

### Quick Start (One Command):
Simply double-click `run.bat` or run:
```bash
server\venv\Scripts\python.exe -m uvicorn server.main:app --host 127.0.0.1 --port 8000
```
Then open your browser at **[http://127.0.0.1:8000](http://127.0.0.1:8000)**.

---

## 🛠️ System Architecture

- **Backend**: Python (FastAPI, SQLite, Asyncio Dispatcher, Open-Meteo Weather API integration).
- **Frontend**: React + Vite + Tailwind CSS + Leaflet Maps + Lucide Icons.
- **Simulator**:
  - Interactive weather radar controller (drag rain intensity from 10mm to 60mm cloudburst).
  - Virtual Rural Phone simulator displaying Class 0 Flash SMS pop-ups and text-to-speech voice call playback.
  - Farmer registration and opt-in modal.
