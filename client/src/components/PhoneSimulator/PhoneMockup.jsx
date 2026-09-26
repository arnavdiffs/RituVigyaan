import React, { useState, useEffect } from 'react';
import { Smartphone, Volume2, VolumeX, AlertTriangle, CheckCircle, BellRing, PhoneCall } from 'lucide-react';

export default function PhoneMockup({ latestAlert, activePhoneDelivery }) {
  const [deviceType, setDeviceType] = useState('feature'); // 'feature' or 'smart'
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSupported(true);
    }
  }, []);

  const handleSpeak = (text) => {
    if (!speechSupported || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    // Choose appropriate lang if available
    utterance.lang = 'hi-IN';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const currentDelivery = activePhoneDelivery || (latestAlert?.deliveries && latestAlert.deliveries[0]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <Smartphone className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-slate-200">Live Farmer Phone Simulator</h2>
        </div>
        <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setDeviceType('feature')}
            className={`px-2 py-1 rounded ${deviceType === 'feature' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Feature Phone (Class 0)
          </button>
          <button
            onClick={() => setDeviceType('smart')}
            className={`px-2 py-1 rounded ${deviceType === 'smart' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
          >
            Smartphone
          </button>
        </div>
      </div>

      {deviceType === 'feature' ? (
        /* Classic Rural Feature Phone (JioBharat / Nokia style) */
        <div className="relative w-64 bg-slate-800 rounded-3xl p-3 shadow-2xl border-4 border-slate-700 flex flex-col items-center">
          {/* Earpiece speaker */}
          <div className="w-12 h-1.5 bg-slate-600 rounded-full mb-3"></div>

          {/* Screen */}
          <div className="w-full h-64 bg-[#2b3a2a] rounded-lg border-2 border-slate-600 p-2.5 flex flex-col justify-between font-mono text-xs text-white relative overflow-hidden shadow-inner">
            {/* Status bar */}
            <div className="flex justify-between items-center text-[10px] text-[#9df28f] border-b border-[#3e563d] pb-1">
              <span className="font-bold flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
                TOWER 4G
              </span>
              <span>100% 🔋</span>
            </div>

            {/* Content Area */}
            {currentDelivery ? (
              <div className="my-auto bg-amber-500/20 border border-amber-400/50 p-2 rounded animate-pulse-fast">
                <div className="flex items-center justify-between text-amber-300 font-bold text-[10px] mb-1">
                  <span className="bg-red-600 text-white px-1 rounded animate-bounce">⚡ AMBER ALERT</span>
                  <span className="text-[9px] text-amber-200">
                    {currentDelivery.channel.includes('MANDI') ? 'TIER 2: CELL BROADCAST' : 'TIER 1: FLASH SMS'}
                  </span>
                </div>
                <div className="text-[11px] font-sans font-semibold text-white leading-tight mb-2">
                  {currentDelivery.message}
                </div>
                <div className="text-[9px] text-[#9df28f] flex justify-between border-t border-[#3e563d] pt-1">
                  <span>To: {currentDelivery.farmer_name}</span>
                  <span>Crop: {currentDelivery.crop} ({currentDelivery.crop_stage})</span>
                </div>
              </div>
            ) : (
              <div className="text-center my-auto text-[#7da678] text-[11px]">
                <p>No active storm alert.</p>
                <p className="text-[9px] mt-1 text-[#5c8058]">Standby for tower broadcast...</p>
              </div>
            )}

            {/* Softkeys */}
            <div className="flex justify-between text-[10px] text-[#9df28f] border-t border-[#3e563d] pt-1">
              {currentDelivery ? (
                <>
                  <button
                    onClick={() => handleSpeak(currentDelivery.message)}
                    className="hover:underline flex items-center gap-0.5 text-amber-300"
                  >
                    <Volume2 className="w-3 h-3" /> Voice IVR
                  </button>
                  <span className="text-slate-400 font-bold">DISMISS</span>
                </>
              ) : (
                <>
                  <span>Menu</span>
                  <span>Contacts</span>
                </>
              )}
            </div>
          </div>

          {/* D-Pad & Keypad */}
          <div className="w-full mt-3 px-2">
            {/* D-pad */}
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center mb-2">
              <div className="w-6 h-6 rounded-full bg-slate-600 border border-slate-500"></div>
            </div>
            {/* 12 Keypad Grid */}
            <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-bold text-slate-300">
              <div className="bg-slate-700/80 py-1 rounded">1</div>
              <div className="bg-slate-700/80 py-1 rounded">2</div>
              <div className="bg-slate-700/80 py-1 rounded">3</div>
              <div className="bg-slate-700/80 py-1 rounded">4</div>
              <div className="bg-slate-700/80 py-1 rounded">5</div>
              <div className="bg-slate-700/80 py-1 rounded">6</div>
              <div className="bg-slate-700/80 py-1 rounded">7</div>
              <div className="bg-slate-700/80 py-1 rounded">8</div>
              <div className="bg-slate-700/80 py-1 rounded">9</div>
              <div className="bg-slate-700/80 py-1 rounded">*</div>
              <div className="bg-slate-700/80 py-1 rounded">0</div>
              <div className="bg-slate-700/80 py-1 rounded">#</div>
            </div>
          </div>
        </div>
      ) : (
        /* Modern Smartphone View */
        <div className="relative w-64 h-[440px] bg-slate-950 rounded-[36px] p-2.5 shadow-2xl border-4 border-slate-700 flex flex-col justify-between overflow-hidden">
          {/* Notch */}
          <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto mb-1"></div>

          {/* Screen Content */}
          <div className="flex-1 bg-slate-900 rounded-2xl p-3 flex flex-col justify-between border border-slate-800 relative">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>Jio / Airtel 5G</span>
              <span>12:00</span>
            </div>

            {currentDelivery ? (
              <div className="bg-red-950/80 border-2 border-red-500 rounded-xl p-3 shadow-lg my-auto animate-pulse">
                <div className="flex items-center space-x-1.5 text-red-400 text-xs font-bold mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" />
                  <span>EMERGENCY BROADCAST</span>
                </div>
                <div className="text-xs font-medium text-white mb-2 leading-snug">
                  {currentDelivery.message}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-300 border-t border-red-800/60 pt-1.5">
                  <span>Urgency: {currentDelivery.urgency}</span>
                  <button
                    onClick={() => handleSpeak(currentDelivery.message)}
                    className="flex items-center gap-1 bg-red-800/80 hover:bg-red-700 text-white px-2 py-0.5 rounded"
                  >
                    <Volume2 className="w-3 h-3" /> Speak
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center my-auto text-slate-500 text-xs">
                <p>Cell Broadcast Active</p>
                <p className="text-[10px] text-slate-600 mt-1">Listening on Channel 919...</p>
              </div>
            )}

            {/* Bottom Bar */}
            <div className="w-24 h-1 bg-slate-600 rounded-full mx-auto mt-2"></div>
          </div>
        </div>
      )}

      {currentDelivery && (
        <div className="mt-3 text-center text-xs text-slate-400">
          <p className="text-slate-300 font-medium">Viewing Alert for: <span className="text-amber-400">{currentDelivery.farmer_name}</span></p>
          <p className="text-[11px] text-slate-500">{currentDelivery.village} • {currentDelivery.distance_km} km from tower</p>
        </div>
      )}
    </div>
  );
}
