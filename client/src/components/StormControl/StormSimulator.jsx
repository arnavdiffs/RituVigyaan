import React, { useState } from 'react';
import { CloudRain, Zap, Radio, AlertOctagon, Sparkles, Activity } from 'lucide-react';

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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Radar & Storm Simulator</h2>
            <p className="text-[11px] text-slate-400">Trigger Fire-and-Forget Amber Broadcasts</p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          RADAR ACTIVE
        </span>
      </div>

      {/* Target Tower Selection */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          Select Target Broadcast Tower:
        </label>
        <select
          value={selectedTowerId}
          onChange={(e) => setSelectedTowerId(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
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
        <label className="block text-[11px] font-medium text-slate-400 mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Quick Test Scenarios:
        </label>
        <div className="grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => handleQuickPreset(40, 'severe', 'Sudden cloudburst over open mandi fields')}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white py-1.5 px-2 rounded border border-slate-700 transition"
          >
            ⛈️ Cloudburst (40mm)
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(25, 'moderate', 'Unseasonal monsoon rain front')}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white py-1.5 px-2 rounded border border-slate-700 transition"
          >
            🌧️ Rain Front (25mm)
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset(55, 'hail', 'Severe hailstorm and high wind gusts')}
            className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white py-1.5 px-2 rounded border border-slate-700 transition"
          >
            🌨️ Hailstorm (55mm)
          </button>
        </div>
      </div>

      {/* Rain Intensity & Radius Sliders */}
      <div className="space-y-3 bg-slate-800/40 p-3 rounded-lg border border-slate-800">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300 flex items-center gap-1">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" /> Rain Intensity:
            </span>
            <span className={`font-mono font-bold ${rainIntensity >= 35 ? 'text-red-400' : 'text-amber-400'}`}>
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
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-300">Broadcast Radius:</span>
            <span className="font-mono text-amber-300 font-bold">{stormRadius} km Geofence</span>
          </div>
          <input
            type="range"
            min="5"
            max="20"
            step="1"
            value={stormRadius}
            onChange={(e) => setStormRadius(e.target.value)}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
          />
        </div>
      </div>

      {/* Broadcast Button */}
      <button
        onClick={handleBroadcast}
        disabled={isTriggering}
        className="w-full relative overflow-hidden bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-red-500 text-slate-950 font-bold text-sm py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 transition transform active:scale-98 disabled:opacity-50 flex items-center justify-center space-x-2"
      >
        <Zap className="w-4 h-4 animate-bounce" />
        <span>{isTriggering ? 'DISPATCHING AMBER BROADCAST...' : '⚡ FIRE & FORGET AMBER BROADCAST'}</span>
      </button>

      {/* Live Dispatch Output Summary */}
      {lastDispatchSummary && (
        <div className="bg-slate-800/90 border border-amber-500/40 rounded-xl p-3.5 text-xs space-y-2.5 animate-fadeIn shadow-lg">
          <div className="flex items-center justify-between font-semibold text-amber-400 border-b border-slate-700/80 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Broadcast Pipeline Dispatched</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">{lastDispatchSummary.timestamp.slice(11, 19)}</span>
          </div>

          <p className="text-slate-300 flex justify-between">
            <span>Tower: <strong className="text-white">{lastDispatchSummary.tower_name}</strong></span>
            {lastDispatchSummary.mandi_cell_broadcast_active && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white font-bold animate-pulse">
                TIER 2: MANDI CB ACTIVE
              </span>
            )}
          </p>

          {/* Key Metric: Noise Suppression */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2 flex items-center justify-between">
            <div>
              <span className="text-emerald-400 font-bold block text-[11px]">
                🛡️ {lastDispatchSummary.suppression_rate_percent}% False-Alarm Noise Suppressed
              </span>
              <span className="text-slate-400 text-[10px]">
                {lastDispatchSummary.suppressed_safe_farmers} safe-crop farmers skipped (anti-fatigue)
              </span>
            </div>
            <span className="text-emerald-300 font-mono font-bold text-xs bg-emerald-500/20 px-2 py-0.5 rounded">
              Gated
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
              <span className="text-red-400 block font-bold">🚨 {lastDispatchSummary.high_risk_farmers_alerted} Farmers</span>
              <span className="text-slate-400 text-[10px]">Tier 1: Flash SMS + Voice IVR</span>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg">
              <span className="text-blue-400 block font-bold">📡 {lastDispatchSummary.total_deliveries_sent} Deliveries</span>
              <span className="text-slate-400 text-[10px]">AgriStack Synced</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
