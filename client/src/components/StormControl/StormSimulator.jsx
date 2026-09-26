import React, { useState } from 'react';
import { CloudRain, Zap, Radio, Sparkles, Activity } from 'lucide-react';

export default function StormSimulator({ towers, onTriggerAlert, isTriggering, lastDispatchSummary }) {
  const [selectedTowerId, setSelectedTowerId] = useState(towers[0]?.id || 1);
  const [rainIntensity, setRainIntensity] = useState(35);
  const [stormRadius, setStormRadius] = useState(10);
  const [severity, setSeverity] = useState('severe');
  const [notes, setNotes] = useState('Approaching localized storm front detected on radar');

  const handleQuickPreset = (intensity, sev, note) => {
    setRainIntensity(intensity);
    setSeverity(sev);
    setNotes(note);
  };

  const handleBroadcast = () => {
    onTriggerAlert({
      tower_id: Number(selectedTowerId),
      rain_intensity_mm: Number(rainIntensity),
      storm_radius_km: Number(stormRadius),
      severity: severity,
      notes: notes
    });
  };

  const selectedTower = towers.find(t => t.id === Number(selectedTowerId)) || towers[0];

  return (
    <div className="bg-white border border-[#E4DDCC] rounded-none shadow-none p-4 flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E4DDCC] pb-2">
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-[#2C1B3F]" />
          <div>
            <h2 className="font-serif font-semibold text-sm text-[#2C1B3F]">Radar & Storm Simulator</h2>
            <p className="text-[11px] text-[#8A8071]">Trigger Fire-and-Forget Amber Broadcasts</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 border border-[#E4DDCC] bg-[#F3EEE4] text-[#2C1B3F]">
          RADAR ACTIVE
        </span>
      </div>

      {/* Target Tower Selection */}
      <div>
        <label className="block text-xs font-medium text-[#2C1B3F] mb-1 flex items-center gap-1">
          <Radio className="w-3.5 h-3.5 text-[#2C1B3F]" />
          Select Target Broadcast Tower:
        </label>
        <select
          value={selectedTowerId}
          onChange={(e) => setSelectedTowerId(e.target.value)}
          className="w-full bg-white border border-[#E4DDCC] text-[#2C1B3F] text-xs rounded-none px-3 py-2 focus:ring-1 focus:ring-[#2C1B3F] focus:outline-none"
        >
          {towers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.district}, {t.state}) - {t.covered_farmers_count} farmers in {t.radius_km}km
            </option>
          ))}
        </select>
      </div>

      {/* Quick Scenarios */}
      <div>
        <label className="block text-[11px] font-medium text-[#8A8071] mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#8A8071]" />
          Quick Test Scenarios:
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickPreset(40, 'severe', 'Sudden cloudburst over open mandi fields')}
            className="text-[10px] bg-[#F3EEE4] hover:bg-white text-[#2C1B3F] py-1.5 px-2 rounded-none border border-[#E4DDCC] transition font-medium"
          >
            Cloudburst (40mm)
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(25, 'moderate', 'Unseasonal monsoon rain front')}
            className="text-[10px] bg-[#F3EEE4] hover:bg-white text-[#2C1B3F] py-1.5 px-2 rounded-none border border-[#E4DDCC] transition font-medium"
          >
            Rain Front (25mm)
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(55, 'hail', 'Severe hailstorm and high wind gusts')}
            className="text-[10px] bg-[#F3EEE4] hover:bg-white text-[#2C1B3F] py-1.5 px-2 rounded-none border border-[#E4DDCC] transition font-medium"
          >
            Hailstorm (55mm)
          </button>
        </div>
      </div>

      {/* Rain Intensity & Radius Sliders */}
      <div className="space-y-3 bg-[#F3EEE4] p-3 rounded-none border border-[#E4DDCC]">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#2C1B3F] flex items-center gap-1">
              <CloudRain className="w-3.5 h-3.5 text-[#8A8071]" /> Rain Intensity:
            </span>
            <span className={`font-mono font-bold ${rainIntensity >= 35 ? 'text-[#9C3B2E]' : 'text-[#B8860B]'}`}>
              {rainIntensity} mm/hr ({rainIntensity >= 35 ? 'High Risk' : 'Moderate'})
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="60"
            step="5"
            value={rainIntensity}
            onChange={(e) => setRainIntensity(e.target.value)}
            className="w-full accent-[#2C1B3F] cursor-pointer h-1.5 bg-[#E4DDCC] appearance-none rounded-none"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[#2C1B3F]">Broadcast Radius:</span>
            <span className="font-mono text-[#2C1B3F] font-bold">{stormRadius} km Geofence</span>
          </div>
          <input
            type="range"
            min="5"
            max="20"
            step="1"
            value={stormRadius}
            onChange={(e) => setStormRadius(e.target.value)}
            className="w-full accent-[#2C1B3F] cursor-pointer h-1.5 bg-[#E4DDCC] appearance-none rounded-none"
          />
        </div>
      </div>

      {/* Broadcast Button */}
      <button
        onClick={handleBroadcast}
        disabled={isTriggering}
        className="w-full bg-[#2C1B3F] hover:bg-[#1f132c] text-[#F3EEE4] font-medium text-xs tracking-wider uppercase py-3 px-4 rounded-none shadow-none transition disabled:opacity-50 flex items-center justify-center space-x-2"
      >
        <Zap className="w-4 h-4 text-[#F3EEE4]" />
        <span>{isTriggering ? 'DISPATCHING AMBER BROADCAST...' : 'FIRE & FORGET AMBER BROADCAST'}</span>
      </button>

      {/* Live Dispatch Output Summary */}
      {lastDispatchSummary && (
        <div className="bg-white border border-[#E4DDCC] rounded-none shadow-none p-3.5 text-xs space-y-2.5">
          <div className="flex items-center justify-between font-serif font-semibold text-[#2C1B3F] border-b border-[#E4DDCC] pb-1.5">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#4B7A63]" />
              <span>Broadcast Dispatched</span>
            </span>
            <span className="text-[10px] text-[#8A8071] font-mono">{lastDispatchSummary.timestamp.slice(11, 19)}</span>
          </div>

          <p className="text-[#2C1B3F] flex justify-between">
            <span>Tower: <strong className="text-[#2C1B3F]">{lastDispatchSummary.tower_name}</strong></span>
            {lastDispatchSummary.mandi_cell_broadcast_active && (
              <span className="text-[10px] px-1.5 py-0.5 bg-[#9C3B2E] text-white font-bold rounded-none">
                TIER 2: MANDI CB ACTIVE
              </span>
            )}
          </p>

          {/* Key Metric: Noise Suppression */}
          <div className="bg-[#F3EEE4] border border-[#E4DDCC] rounded-none p-2 flex items-center justify-between">
            <div>
              <span className="text-[#4B7A63] font-bold block text-[11px]">
                {lastDispatchSummary.suppression_rate_percent}% False-Alarm Noise Suppressed
              </span>
              <span className="text-[#8A8071] text-[10px]">
                {lastDispatchSummary.suppressed_safe_farmers} safe-crop farmers skipped (anti-fatigue)
              </span>
            </div>
            <span className="text-[#4B7A63] font-mono font-bold text-xs bg-white border border-[#E4DDCC] px-2 py-0.5 rounded-none">
              Gated
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white border-l-2 border-[#9C3B2E] border-t border-r border-b border-[#E4DDCC] p-2 rounded-none">
              <span className="text-[#9C3B2E] block font-bold">{lastDispatchSummary.high_risk_farmers_alerted} Farmers</span>
              <span className="text-[#8A8071] text-[10px]">Tier 1: Flash SMS + IVR</span>
            </div>
            <div className="bg-white border border-[#E4DDCC] p-2 rounded-none">
              <span className="text-[#2C1B3F] block font-bold">{lastDispatchSummary.total_deliveries_sent} Deliveries</span>
              <span className="text-[#8A8071] text-[10px]">AgriStack Synced</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
