import React from 'react';
import { ShieldAlert, MapPin, CheckCircle2, ChevronRight, Clock } from 'lucide-react';

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
    <div className="bg-white border border-[#E4DDCC] rounded-none shadow-none p-4 flex flex-col h-[520px]">
      <div className="flex items-center justify-between border-b border-[#E4DDCC] pb-2 mb-3">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-[#2C1B3F]" />
          <h2 className="font-serif font-semibold text-sm text-[#2C1B3F]">Dispatched Broadcast Logs</h2>
        </div>
        <span className="text-[10px] text-[#2C1B3F] bg-[#F3EEE4] px-2 py-0.5 border border-[#E4DDCC] rounded-none font-mono">
          Govt Emergency Service • Zero Cost to Farmers
        </span>
      </div>

      {allDeliveries.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#8A8071]">
          <ShieldAlert className="w-8 h-8 mb-2 opacity-30 text-[#2C1B3F]" />
          <p className="text-xs font-serif font-semibold text-[#2C1B3F]">No storm alerts broadcast yet</p>
          <p className="text-[11px] text-[#8A8071] mt-1 max-w-xs font-sans">
            Trigger a storm simulation above or wait for radar rain detection to see real-time fire-and-forget dispatches.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
          {allDeliveries.map((item, idx) => (
            <div
              key={`${item.id || idx}-${item.channel}`}
              onClick={() => onSelectDeliveryForPhone && onSelectDeliveryForPhone(item)}
              className="bg-white hover:bg-[#F3EEE4] border border-[#E4DDCC] p-3 rounded-none transition cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center space-x-2">
                  <span className="font-serif font-semibold text-sm text-[#2C1B3F]">
                    {item.farmer_name}
                  </span>
                  <span className="text-[10px] text-[#8A8071] font-sans">({item.village})</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] px-1.5 py-0.5 font-mono border border-[#E4DDCC] bg-[#F3EEE4] text-[#2C1B3F] rounded-none">
                    {item.channel === 'FLASH_SMS_CLASS_0' ? 'FLASH SMS' : 'VOICE IVR'}
                  </span>
                  <span className="text-[10px] text-[#4B7A63] flex items-center gap-0.5 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> Sent
                  </span>
                </div>
              </div>

              {/* Crop & Distance row */}
              <div className="flex items-center space-x-3 text-[11px] text-[#8A8071] mb-1.5 font-sans">
                <span>
                  Crop: <strong className="text-[#2C1B3F]">{item.crop}</strong> ({item.crop_stage})
                </span>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-3 h-3 text-[#8A8071]" /> {item.distance_km} km from tower
                </span>
                <span>•</span>
                <span className={`font-bold ${item.urgency === 'CRITICAL' ? 'text-[#9C3B2E]' : 'text-[#B8860B]'}`}>
                  {item.urgency}
                </span>
              </div>

              {/* Message snippet */}
              <div className="bg-[#F3EEE4] p-2 border border-[#E4DDCC] text-[11px] text-[#2C1B3F] font-sans leading-relaxed rounded-none">
                {item.message}
              </div>

              <div className="flex justify-between items-center mt-1.5 text-[10px] text-[#8A8071] font-sans">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#8A8071]" /> Dispatched: {item.delivered_at?.slice(11, 19) || 'Just now'}
                </span>
                <span className="text-[#2C1B3F] group-hover:underline flex items-center gap-0.5 font-medium">
                  Simulate on Phone <ChevronRight className="w-3 h-3 text-[#8A8071]" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
