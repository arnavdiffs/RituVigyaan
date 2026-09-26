import React, { useState, useEffect } from 'react';
import CoverageMap from './components/Map/CoverageMap';
import StormSimulator from './components/StormControl/StormSimulator';
import PhoneMockup from './components/PhoneSimulator/PhoneMockup';
import LiveAlertFeed from './components/AlertLogs/LiveAlertFeed';
import FarmerModal from './components/FarmerRegistration/FarmerModal';
import VulnerabilityMatrixModal from './components/CropMatrix/VulnerabilityMatrixModal';
import { Radio, Activity, HelpCircle, UserPlus, PlusCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-[#F3EEE4] text-[#2C1B3F] flex">
      {/* Fixed Left Sidebar Navigation */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-[#E4DDCC] flex flex-col justify-between p-4 min-h-screen sticky top-0 h-screen">
        <div className="space-y-5">
          {/* Brand mark: render "RituVigyaan" in Fraunces 600 with soft radial-gradient blur */}
          <div className="relative overflow-hidden border border-[#E4DDCC] bg-white p-4 rounded-none">
            {/* Contained soft radial-gradient blur (overlapping #F2A65A, #EF6C93, #C13FA0 blurred ~28px, opacity ~0.55) */}
            <div
              className="absolute inset-0 pointer-events-none filter blur-[28px] opacity-55"
              style={{
                background: 'radial-gradient(circle at 20% 35%, #F2A65A 0%, transparent 55%), radial-gradient(circle at 75% 30%, #EF6C93 0%, transparent 50%), radial-gradient(circle at 50% 80%, #C13FA0 0%, transparent 60%)'
              }}
            />
            <div className="relative z-10">
              <div className="flex items-center space-x-2">
                <Radio className="w-5 h-5 text-[#2C1B3F]" />
                <h1 className="font-serif font-semibold text-xl text-[#2C1B3F] tracking-tight">
                  RituVigyaan
                </h1>
              </div>
              <p className="text-[11px] text-[#8A8071] mt-1 font-sans">
                ऋतुविज्ञान • Hyperlocal Amber Warning
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1 text-xs font-sans">
            <a
              href="#command"
              className="flex items-center space-x-2 border-l-4 border-[#B8860B] bg-[#F3EEE4] text-[#2C1B3F] font-medium pl-3 py-2.5 rounded-none"
            >
              <Activity className="w-4 h-4 text-[#B8860B]" />
              <span>Radar & Command</span>
            </a>
            <button
              onClick={() => setIsMatrixModalOpen(true)}
              className="w-full text-left flex items-center space-x-2 border-l-4 border-transparent hover:bg-[#F3EEE4] text-[#8A8071] hover:text-[#2C1B3F] pl-3 py-2.5 transition rounded-none"
            >
              <HelpCircle className="w-4 h-4 text-[#8A8071]" />
              <span>Crop Risk Matrix</span>
            </button>
            <button
              onClick={() => setIsFarmerModalOpen(true)}
              className="w-full text-left flex items-center space-x-2 border-l-4 border-transparent hover:bg-[#F3EEE4] text-[#8A8071] hover:text-[#2C1B3F] pl-3 py-2.5 transition rounded-none"
            >
              <UserPlus className="w-4 h-4 text-[#8A8071]" />
              <span>Enroll Farmer</span>
            </button>
          </nav>

          {/* Quick Action Button */}
          <div className="pt-4 border-t border-[#E4DDCC]">
            <button
              onClick={() => setIsFarmerModalOpen(true)}
              className="w-full bg-[#2C1B3F] hover:bg-[#1F122D] text-white font-sans font-medium text-xs py-2 px-3 border border-[#2C1B3F] rounded-none flex items-center justify-center space-x-1.5 transition"
            >
              <PlusCircle className="w-3.5 h-3.5 text-white" />
              <span>+ Opt-in Farmer</span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-[#E4DDCC] text-[11px] text-[#8A8071] font-sans">
          <p className="text-[#2C1B3F] font-medium">Public Utility Service</p>
          <p className="text-[10px] text-[#8A8071] mt-0.5">Govt Disaster Response</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 space-y-5 overflow-y-auto">
        {/* Stat Numbers (Rule: Serif 28px, 12px grey label below) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E4DDCC] p-4 rounded-none shadow-none">
            <div className="font-serif font-semibold text-[28px] text-[#2C1B3F] leading-none">
              {towers.length || 5}
            </div>
            <div className="text-[12px] text-[#8A8071] mt-1.5 font-sans">
              Active Radar Towers
            </div>
          </div>
          <div className="bg-white border border-[#E4DDCC] p-4 rounded-none shadow-none">
            <div className="font-serif font-semibold text-[28px] text-[#2C1B3F] leading-none">
              {farmers.length || 19}
            </div>
            <div className="text-[12px] text-[#8A8071] mt-1.5 font-sans">
              Protected Farmers
            </div>
          </div>
          <div className="bg-white border border-[#E4DDCC] p-4 rounded-none shadow-none">
            <div className="font-serif font-semibold text-[28px] text-[#2C1B3F] leading-none">
              10 km
            </div>
            <div className="text-[12px] text-[#8A8071] mt-1.5 font-sans">
              Broadcast Geofence Radius
            </div>
          </div>
          <div className="bg-white border border-[#E4DDCC] p-4 rounded-none shadow-none">
            <div className="font-serif font-semibold text-[28px] text-[#2C1B3F] leading-none">
              0 ₹
            </div>
            <div className="text-[12px] text-[#8A8071] mt-1.5 font-sans">
              Farmer Expense (Public Good)
            </div>
          </div>
        </div>

        {/* Flat Explanation Panel */}
        <div className="bg-white border border-[#E4DDCC] p-4 rounded-none shadow-none flex items-center justify-between">
          <div className="text-xs space-y-1">
            <h2 className="font-serif font-semibold text-sm text-[#2C1B3F]">
              Hyperlocal Rain Amber Alert System for Rural Farmers
            </h2>
            <p className="text-[#8A8071] text-[11px] font-sans">
              If rain or storm clouds approach within <strong>10 km</strong> of a cell tower, the system identifies farmers with <strong>rain-sensitive crops</strong> (such as harvested wheat drying in open yards or mature cotton) and fires an immediate <strong>Class 0 Flash SMS & Voice Alert</strong> directly to their handsets.
            </p>
          </div>
        </div>

        {/* Dashboard 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" id="command">
          {/* Left Column: Storm Controls (3 cols) */}
          <div className="lg:col-span-3">
            <StormSimulator
              towers={towers}
              onTriggerAlert={handleTriggerAlert}
              isTriggering={isTriggering}
              lastDispatchSummary={latestDispatchSummary}
            />
          </div>

          {/* Center Column: Interactive Map (5 cols) */}
          <div className="lg:col-span-5">
            <CoverageMap
              towers={towers}
              farmers={farmers}
              activeAlertTowerId={activeAlertTowerId}
              onSelectFarmer={handleSelectFarmer}
            />
          </div>

          {/* Right Column: Farmer Phone Simulator (4 cols) */}
          <div className="lg:col-span-4">
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

        {/* Footer */}
        <footer className="pt-2 text-center text-xs text-[#8A8071] font-sans border-t border-[#E4DDCC]">
          RituVigyaan (ऋतुविज्ञान) • Public Good Architecture for Small-Scale Rural Farmers • Built for Government Disaster Response Integration
        </footer>
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
    </div>
  );
}
