import React, { useState, useEffect } from 'react';
import { Smartphone, Volume2, AlertTriangle } from 'lucide-react';

export default function PhoneMockup({ latestAlert, activePhoneDelivery }) {
  const [deviceType, setDeviceType] = useState('feature'); // 'feature' or 'smart'
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [audioSource, setAudioSource] = useState(null); // 'SARVAM' or 'BROWSER_FALLBACK'
  const [sarvamError, setSarvamError] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setSpeechSupported(true);
    }
  }, []);

  const fallbackSpeech = (text, lang, errorDetail = null) => {
    setAudioSource('BROWSER_FALLBACK');
    if (errorDetail) {
      setSarvamError(errorDetail);
      console.warn('[TTS Mode: BROWSER_FALLBACK] Reason:', errorDetail);
    } else {
      console.log('[TTS Mode: BROWSER_FALLBACK] Browser SpeechSynthesis active');
    }
    if (!speechSupported || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.lang = lang === 'mr' ? 'mr-IN' : (lang === 'pa' ? 'pa-IN' : 'hi-IN');
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeak = async (delivery) => {
    if (!delivery) return;
    const text = delivery.message;
    const lang = delivery.language || 'mr';
    let audioUrl = delivery.audio_url;
    setSarvamError(null);

    // 1. Fetch from Sarvam TTS API if not pre-generated
    if (!audioUrl) {
      try {
        console.log(`[TTS] Requesting Sarvam Bulbul:v3 synthesis (${lang})...`);
        const resp = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: text,
            language: lang,
            delivery_id: delivery.farmer_id || delivery.id
          })
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data.source === 'SARVAM' && data.audio_url) {
            audioUrl = data.audio_url;
            delivery.audio_url = audioUrl;
            console.log('[TTS Mode: SARVAM] Audio successfully generated:', audioUrl);
          } else {
            console.error('[TTS Mode: SARVAM Failed]', data.error);
            fallbackSpeech(text, lang, data.error);
            return;
          }
        } else {
          const errText = await resp.text();
          console.error('[TTS Mode: /api/tts HTTP Error]', errText);
          fallbackSpeech(text, lang, `HTTP ${resp.status}: ${errText}`);
          return;
        }
      } catch (err) {
        console.error('[TTS Mode: Network Error]', err);
        fallbackSpeech(text, lang, err.message);
        return;
      }
    }

    // 2. Play real Sarvam audio stream
    if (audioUrl) {
      try {
        setAudioSource('SARVAM');
        setIsSpeaking(true);
        console.log('[TTS Mode: SARVAM] Playing audio via HTML5 Audio element:', audioUrl);
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = (e) => {
          setIsSpeaking(false);
          console.error('[TTS Mode: Audio Element Error]', e);
          fallbackSpeech(text, lang, 'Audio stream failed to decode in browser');
        };
        await audio.play();
        return;
      } catch (playErr) {
        console.error('[TTS Mode: Play Exception]', playErr);
        setIsSpeaking(false);
        fallbackSpeech(text, lang, playErr.message);
        return;
      }
    }

    // 3. Fallback
    fallbackSpeech(text, lang);
  };

  const currentDelivery = activePhoneDelivery || (latestAlert?.deliveries && latestAlert.deliveries[0]);

  return (
    <div className="bg-white border border-[#E4DDCC] rounded-none shadow-none p-4 flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-3 border-b border-[#E4DDCC] pb-2">
        <div className="flex items-center space-x-2">
          <Smartphone className="w-4 h-4 text-[#2C1B3F]" />
          <h2 className="font-serif font-semibold text-sm text-[#2C1B3F]">Farmer Phone Simulator</h2>
          {audioSource && (
            <span className={`text-[9px] font-mono px-1.5 py-0.5 border ${audioSource === 'SARVAM' ? 'bg-[#4B7A63] text-white border-[#4B7A63]' : 'bg-[#9C3B2E] text-white border-[#9C3B2E]'}`}>
              {audioSource === 'SARVAM' ? '● SARVAM (BULBUL-V3)' : '● BROWSER_FALLBACK'}
            </span>
          )}
        </div>
        <div className="flex items-center bg-[#F3EEE4] border border-[#E4DDCC] rounded-none p-0.5 text-xs">
          <button
            onClick={() => setDeviceType('feature')}
            className={`px-2 py-1 rounded-none text-xs transition ${deviceType === 'feature' ? 'bg-[#2C1B3F] text-[#F3EEE4] font-medium' : 'text-[#2C1B3F] hover:bg-white'}`}
          >
            Feature Phone (Class 0)
          </button>
          <button
            onClick={() => setDeviceType('smart')}
            className={`px-2 py-1 rounded-none text-xs transition ${deviceType === 'smart' ? 'bg-[#2C1B3F] text-[#F3EEE4] font-medium' : 'text-[#2C1B3F] hover:bg-white'}`}
          >
            Smartphone
          </button>
        </div>
      </div>

      {sarvamError && (
        <div className="w-full bg-[#F3EEE4] border border-[#9C3B2E] text-[#9C3B2E] text-[10px] p-2 font-mono mb-2">
          <strong>Sarvam Error:</strong> {sarvamError}
        </div>
      )}

      {deviceType === 'feature' ? (
        /* Flat Rural Feature Phone (JioBharat / Nokia style) */
        <div className="relative w-64 bg-[#2C1B3F] border border-[#1f132c] rounded-none p-3 shadow-none flex flex-col items-center">
          {/* Earpiece slot */}
          <div className="w-12 h-1 bg-[#1f132c] mb-3"></div>

          {/* Screen */}
          <div className="w-full h-64 bg-[#1a1025] border border-[#3c2854] rounded-none p-2.5 flex flex-col justify-between font-mono text-xs text-[#F3EEE4] relative overflow-hidden shadow-none">
            {/* Status bar */}
            <div className="flex justify-between items-center text-[10px] text-[#F3EEE4] border-b border-[#3c2854] pb-1">
              <span className="font-bold flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 bg-[#9C3B2E]"></span>
                TOWER 4G
              </span>
              <span>100% 🔋</span>
            </div>

            {/* Content Area */}
            {currentDelivery ? (
              <div className="my-auto bg-[#2C1B3F] border border-[#E4DDCC] p-2 rounded-none">
                <div className="flex items-center justify-between text-[#F3EEE4] font-bold text-[10px] mb-1">
                  <span className="bg-[#9C3B2E] text-white px-1 py-0.5 rounded-none font-sans font-bold">
                    AMBER ALERT
                  </span>
                  <span className="text-[9px] text-[#E4DDCC]">
                    {currentDelivery.channel.includes('MANDI') ? 'CELL BROADCAST' : 'FLASH SMS'}
                  </span>
                </div>
                <div className="text-[11px] font-sans font-medium text-white leading-tight mb-2">
                  {currentDelivery.message}
                </div>
                <div className="text-[9px] text-[#F3EEE4] flex justify-between border-t border-[#3c2854] pt-1 font-sans">
                  <span>To: {currentDelivery.farmer_name}</span>
                  <span>{currentDelivery.crop} ({currentDelivery.crop_stage})</span>
                </div>
              </div>
            ) : (
              <div className="text-center my-auto text-[#F3EEE4] text-[11px] font-sans">
                <p>No active storm alert.</p>
                <p className="text-[9px] mt-1 text-[#8A8071]">Standby for tower broadcast...</p>
              </div>
            )}

            {/* Softkeys */}
            <div className="flex justify-between text-[10px] text-[#F3EEE4] border-t border-[#3c2854] pt-1">
              {currentDelivery ? (
                <>
                  <button
                    onClick={() => handleSpeak(currentDelivery)}
                    disabled={isSpeaking}
                    className="hover:underline flex items-center gap-0.5 text-white font-medium"
                  >
                    <Volume2 className={`w-3 h-3 ${isSpeaking ? 'text-[#B8860B] animate-pulse' : 'text-[#F3EEE4]'}`} /> {isSpeaking ? 'Playing Audio...' : 'Voice IVR'}
                  </button>
                  <span className="text-[#8A8071] font-medium">DISMISS</span>
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
            <div className="w-10 h-10 mx-auto rounded-none bg-[#1a1025] border border-[#3c2854] flex items-center justify-center mb-2">
              <div className="w-5 h-5 bg-[#2C1B3F] border border-[#3c2854]"></div>
            </div>
            {/* 12 Keypad Grid */}
            <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-bold text-[#F3EEE4]">
              <div className="bg-[#1a1025] border border-[#3c2854] py-1 rounded-none">1</div>
              <div className="bg-[#1a1025] border border-[#3c2854] py-1 rounded-none">2</div>
              <div className="bg-[#1a1025] border border-[#3c2854] py-1 rounded-none">3</div>
              <div className="bg-[#1a1025] border border-[#3c2854] py-1 rounded-none">4</div>
              <div className="bg-[#1a1025] border border-[#3c2854] py-1 rounded-none">5</div>
              <div className="bg-[#1a1025] border border-[#3c2854] py-1 rounded-none">6</div>
              <div className="bg-[#1a1025] border border-[#3c2854] py-1 rounded-none">7</div>
              <div className="bg-[#1a1025] border border-[#3c2854] py-1 rounded-none">8</div>
              <div className="bg-[#1a1025] border border-[#3c2854] py-1 rounded-none">9</div>
              <div className="bg-[#1a1025] border border-[#3c2854] py-1 rounded-none">*</div>
              <div className="bg-[#1a1025] border border-[#3c2854] py-1 rounded-none">0</div>
              <div className="bg-[#1a1025] border border-[#3c2854] py-1 rounded-none">#</div>
            </div>
          </div>
        </div>
      ) : (
        /* Modern Flat Smartphone View */
        <div className="relative w-64 h-[440px] bg-[#2C1B3F] border border-[#1f132c] rounded-none p-2 shadow-none flex flex-col justify-between overflow-hidden">
          {/* Top Notch slot */}
          <div className="w-16 h-1 bg-[#1f132c] mx-auto mb-1"></div>

          {/* Screen Content */}
          <div className="flex-1 bg-white border border-[#E4DDCC] rounded-none p-3 flex flex-col justify-between relative text-[#2C1B3F]">
            <div className="flex justify-between text-[10px] text-[#8A8071] font-mono">
              <span>Jio / Airtel 4G</span>
              <span>12:00</span>
            </div>

            {currentDelivery ? (
              <div className="border-l-4 border-[#9C3B2E] bg-[#F3EEE4] border-t border-r border-b border-[#E4DDCC] rounded-none p-3 my-auto">
                <div className="flex items-center space-x-1.5 text-[#9C3B2E] text-xs font-bold mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>EMERGENCY BROADCAST</span>
                </div>
                <div className="text-xs font-medium text-[#2C1B3F] mb-2 leading-snug">
                  {currentDelivery.message}
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#8A8071] border-t border-[#E4DDCC] pt-1.5">
                  <span className="font-medium text-[#9C3B2E]">Urgency: {currentDelivery.urgency}</span>
                  <button
                    onClick={() => handleSpeak(currentDelivery)}
                    disabled={isSpeaking}
                    className="flex items-center gap-1 bg-[#2C1B3F] text-[#F3EEE4] hover:bg-[#1f132c] px-2 py-0.5 rounded-none font-medium"
                  >
                    <Volume2 className={`w-3 h-3 ${isSpeaking ? 'text-[#B8860B] animate-pulse' : 'text-[#F3EEE4]'}`} /> {isSpeaking ? 'Playing...' : 'Speak'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center my-auto text-[#8A8071] text-xs">
                <p className="font-serif text-[#2C1B3F]">Cell Broadcast Active</p>
                <p className="text-[10px] text-[#8A8071] mt-1">Channel 919 Standby...</p>
              </div>
            )}

            {/* Bottom Indicator */}
            <div className="w-20 h-1 bg-[#E4DDCC] mx-auto mt-2"></div>
          </div>
        </div>
      )}

      {currentDelivery && (
        <div className="mt-3 text-center text-xs text-[#8A8071]">
          <p className="text-[#2C1B3F] font-medium">Viewing Alert for: <strong className="text-[#2C1B3F]">{currentDelivery.farmer_name}</strong></p>
          <p className="text-[11px] text-[#8A8071]">{currentDelivery.village} • {currentDelivery.distance_km} km from tower</p>
        </div>
      )}
    </div>
  );
}
