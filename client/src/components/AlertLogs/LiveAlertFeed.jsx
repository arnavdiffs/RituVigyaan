import React from 'react';
import { ShieldAlert, PhoneCall, MessageSquare, Clock, MapPin, CheckCircle2, ChevronRight } from 'lucide-react';

export default function LiveAlertFeed({ alertHistory, onSelectDeliveryForPhone }) {
  const allDeliveries = alertHistory.flatMap(a => 
    (a.deliveries || []).map(d => ({
      ...d,
      tower_name: a.tower_name,
      rain_intensity_mm: a.rain_intensity_mm,
      created_at: a.created_at
    }))
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-[520px]">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-slate-200">Dispatched Broadcast Logs</h2>
        </div>
        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
          Govt Emergency Service • Zero Cost to Farmers
        </span>
      </div>

      {allDeliveries.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
          <ShieldAlert className="w-8 h-8 mb-2 opacity-40 text-amber-400" />
          <p className="text-xs font-medium text-slate-400">No storm alerts broadcast yet</p>
          <p className="text-[11px] text-slate-600 mt-1 max-w-xs">
            Trigger a storm simulation above or wait for radar rain detection to see real-time fire-and-forget dispatches.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
          {allDeliveries.map((item, idx) => (
            <div
              key={`${item.id || idx}-${item.channel}`}
              onClick={() => onSelectDeliveryForPhone && onSelectDeliveryForPhone(item)}
              className="bg-slate-850 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 p-3 rounded-lg transition cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-100 group-hover:text-amber-300 transition">
                    {item.farmer_name}
                  </span>
                  <span className="text-[10px] text-slate-400">({item.village})</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    item.channel === 'FLASH_SMS_CLASS_0'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}>
                    {item.channel === 'FLASH_SMS_CLASS_0' ? '⚡ FLASH SMS' : '📞 VOICE IVR'}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Sent
                  </span>
                </div>
              </div>

              {/* Crop & Distance row */}
              <div className="flex items-center space-x-3 text-[11px] text-slate-400 mb-1.5">
                <span>
                  Crop: <strong className="text-slate-200">{item.crop}</strong> ({item.crop_stage})
                </span>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-slate-400">
                  <MapPin className="w-3 h-3 text-red-400" /> {item.distance_km} km from tower
                </span>
                <span>•</span>
                <span className="font-bold text-red-400">{item.urgency}</span>
              </div>

              {/* Message snippet */}
              <div className="bg-slate-900/90 p-2 rounded border border-slate-800 text-[11px] text-slate-300 font-sans leading-relaxed">
                {item.message}
              </div>

              <div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Dispatched: {item.delivered_at?.slice(11, 19) || 'Just now'}
                </span>
                <span className="text-amber-400 group-hover:underline flex items-center gap-0.5">
                  Simulate on Phone <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
