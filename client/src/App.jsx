import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CoverageMap from './components/Map/CoverageMap';
import StormSimulator from './components/StormControl/StormSimulator';
import PhoneMockup from './components/PhoneSimulator/PhoneMockup';
import LiveAlertFeed from './components/AlertLogs/LiveAlertFeed';
import FarmerModal from './components/FarmerRegistration/FarmerModal';
import VulnerabilityMatrixModal from './components/CropMatrix/VulnerabilityMatrixModal';

export default function App() {
  const [towers, setTowers] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [latestDispatchSummary, setLatestDispatchSummary] = useState(null);
  const [activeAlertTowerId, setActiveAlertTowerId] = useState(null);
  const [activePhoneDelivery, setActivePhoneDelivery] = useState(null);
  const [isTriggering, setIsTriggering] = useState(false);

  // Modals
  const [isFarmerModalOpen, setIsFarmerModalOpen] = useState(false);
  const [isMatrixModalOpen, setIsMatrixModalOpen] = useState(false);

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [tRes, fRes, hRes] = await Promise.all([
        fetch('/api/towers'),
        fetch('/api/farmers'),
        fetch('/api/alerts/history')
      ]);

      if (tRes.ok) setTowers(await tRes.json());
      if (fRes.ok) setFarmers(await fRes.json());
      if (hRes.ok) {
        const hist = await hRes.json();
        setAlertHistory(hist);
        if (hist.length > 0 && !activePhoneDelivery) {
          const firstDelivery = hist[0]?.deliveries?.[0];
          if (firstDelivery) setActivePhoneDelivery(firstDelivery);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll alerts every 10 seconds for real-time sync
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerAlert = async (params) => {
    setIsTriggering(true);
    setActiveAlertTowerId(params.tower_id);

    try {
      const res = await fetch('/api/alerts/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (res.ok) {
        const data = await res.json();
        setLatestDispatchSummary(data.summary);
        
        // Select the first delivery to show on the farmer phone simulator
        if (data.summary.deliveries && data.summary.deliveries.length > 0) {
          setActivePhoneDelivery(data.summary.deliveries[0]);
        }
        
        // Refresh alert history
        fetchData();
      }
    } catch (err) {
      console.error('Alert trigger failed:', err);
    } finally {
      setIsTriggering(false);
    }
  };

  const handleSelectFarmer = (farmer) => {
    // Find if this farmer has an alert or generate preview
    const matchingDelivery = alertHistory
      .flatMap(a => a.deliveries || [])
      .find(d => d.farmer_id === farmer.id);

    if (matchingDelivery) {
      setActivePhoneDelivery(matchingDelivery);
    } else {
      setActivePhoneDelivery({
        farmer_id: farmer.id,
        farmer_name: farmer.name,
        phone: farmer.phone,
        village: farmer.village,
        crop: farmer.crop,
        crop_stage: farmer.crop_stage,
        channel: 'FLASH_SMS_CLASS_0',
        message: `कृषि सचेत | किसान ${farmer.name} जी, आपकी ${farmer.crop} फसल (${farmer.crop_stage}) के लिए आगामी मौसम निगरानी सक्रिय है।`,
        urgency: farmer.crop_stage === 'harvested_open' ? 'CRITICAL' : 'STANDBY',
        distance_km: farmer.distance_to_nearest_tower_km?.toFixed(1) || 3.2
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar
        stats={{
          towersCount: towers.length,
          farmersCount: farmers.length,
        }}
        onOpenFarmerModal={() => setIsFarmerModalOpen(true)}
        onOpenMatrixModal={() => setIsMatrixModalOpen(true)}
      />

      {/* Main Command Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col space-y-5">
        {/* Banner Alert Explanation */}
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border-l-4 border-amber-500 p-3.5 rounded-r-xl flex items-center justify-between">
          <div className="text-xs space-y-0.5">
            <p className="font-bold text-amber-300 flex items-center gap-1.5">
              <span>🌾 Hyperlocal Rain Amber Alert System for Rural Farmers</span>
            </p>
            <p className="text-slate-300 text-[11px]">
              If rain or storm clouds approach within <strong>10 km</strong> of a cell tower, the system identifies farmers with <strong>rain-sensitive crops</strong> (such as harvested wheat drying in open yards or mature cotton) and fires an immediate <strong>Class 0 Flash SMS & Voice Alert</strong> directly to their handsets.
            </p>
          </div>
          <div className="hidden sm:block text-right">
            <span className="text-[10px] text-amber-400 font-mono block">Zero Farmer Expense</span>
            <span className="text-[10px] text-slate-400">Govt Public Utility Service</span>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column: Storm Controls (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <StormSimulator
              towers={towers}
              onTriggerAlert={handleTriggerAlert}
              isTriggering={isTriggering}
              lastDispatchSummary={latestDispatchSummary}
            />
          </div>

          {/* Center Column: Interactive Map (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <CoverageMap
              towers={towers}
              farmers={farmers}
              activeAlertTowerId={activeAlertTowerId}
              onSelectFarmer={handleSelectFarmer}
            />
          </div>

          {/* Right Column: Farmer Phone Simulator (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <PhoneMockup
              latestAlert={latestDispatchSummary}
              activePhoneDelivery={activePhoneDelivery}
            />
          </div>
        </div>

        {/* Dispatched Broadcast Logs Table */}
        <div className="w-full">
          <LiveAlertFeed
            alertHistory={alertHistory}
            onSelectDeliveryForPhone={(del) => setActivePhoneDelivery(del)}
          />
        </div>
      </main>

      {/* Modals */}
      <FarmerModal
        isOpen={isFarmerModalOpen}
        onClose={() => setIsFarmerModalOpen(false)}
        towers={towers}
        onFarmerAdded={fetchData}
      />

      <VulnerabilityMatrixModal
        isOpen={isMatrixModalOpen}
        onClose={() => setIsMatrixModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3 text-center text-xs text-slate-500">
        Krishi Alert (कृषि सचेत) • Public Good Architecture for Small-Scale Rural Farmers • Built for Government Disaster Response Integration
      </footer>
    </div>
  );
}
