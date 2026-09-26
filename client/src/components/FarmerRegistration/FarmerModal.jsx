import React, { useState } from 'react';
import { X, UserPlus, ShieldCheck } from 'lucide-react';

export default function FarmerModal({ isOpen, onClose, towers, onFarmerAdded }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [village, setVillage] = useState('');
  const [crop, setCrop] = useState('Onion');
  const [cropStage, setCropStage] = useState('harvested_open');
  const [language, setLanguage] = useState('hi');
  const [towerId, setTowerId] = useState(towers[0]?.id || 1);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Pick coordinates near selected tower with small offset
    const selectedTower = towers.find(t => t.id === Number(towerId)) || towers[0];
    const latOffset = (Math.random() - 0.5) * 0.05;
    const lonOffset = (Math.random() - 0.5) * 0.05;

    const payload = {
      name,
      phone,
      village,
      crop,
      crop_stage: cropStage,
      language,
      latitude: selectedTower.latitude + latOffset,
      longitude: selectedTower.longitude + lonOffset,
      opt_in_status: true
    };

    try {
      const resp = await fetch('/api/farmers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (resp.ok) {
        onFarmerAdded();
        onClose();
      }
    } catch (err) {
      console.error('Failed to register farmer:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2C1B3F]/60 p-4">
      <div className="bg-white border border-[#E4DDCC] rounded-none w-full max-w-md p-5 shadow-none relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8A8071] hover:text-[#2C1B3F]"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 mb-4">
          <div className="p-2 border border-[#E4DDCC] bg-[#F3EEE4] text-[#2C1B3F]">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-semibold text-base text-[#2C1B3F]">Farmer Opt-in Registration</h3>
            <p className="text-xs text-[#8A8071] font-sans">Enroll farmer to receive hyperlocal tower amber alerts</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-sans">
          <div>
            <label className="block text-[#2C1B3F] font-medium mb-1">Farmer Full Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Rameshwar Shinde"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-[#E4DDCC] rounded-none px-3 py-2 text-[#2C1B3F] focus:ring-1 focus:ring-[#2C1B3F] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#2C1B3F] font-medium mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-white border border-[#E4DDCC] rounded-none px-3 py-2 text-[#2C1B3F] focus:ring-1 focus:ring-[#2C1B3F] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[#2C1B3F] font-medium mb-1">Village / Town</label>
              <input
                type="text"
                required
                placeholder="e.g. Pimpalgaon"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full bg-white border border-[#E4DDCC] rounded-none px-3 py-2 text-[#2C1B3F] focus:ring-1 focus:ring-[#2C1B3F] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#2C1B3F] font-medium mb-1">Crop Grown</label>
              <select
                value={crop}
                onChange={(e) => setCrop(e.target.value)}
                className="w-full bg-white border border-[#E4DDCC] rounded-none px-3 py-2 text-[#2C1B3F] focus:ring-1 focus:ring-[#2C1B3F] focus:outline-none"
              >
                <option value="Onion">Onion (प्याज़/कांदा)</option>
                <option value="Wheat">Wheat (गेहूं/गहू)</option>
                <option value="Cotton">Cotton (कपास/कापूस)</option>
                <option value="Mustard">Mustard (सरसों)</option>
                <option value="Tomato">Tomato (टमाटर)</option>
                <option value="Grapes">Grapes (अंगूर)</option>
                <option value="Paddy">Paddy (धान)</option>
                <option value="Cumin">Cumin (जीरा)</option>
              </select>
            </div>
            <div>
              <label className="block text-[#2C1B3F] font-medium mb-1">Current Crop Stage</label>
              <select
                value={cropStage}
                onChange={(e) => setCropStage(e.target.value)}
                className="w-full bg-white border border-[#E4DDCC] rounded-none px-3 py-2 text-[#2C1B3F] focus:ring-1 focus:ring-[#2C1B3F] focus:outline-none"
              >
                <option value="harvested_open">Harvested (Open Drying) [CRITICAL]</option>
                <option value="mature_pre_harvest">Mature (Ready to Harvest) [HIGH]</option>
                <option value="flowering">Flowering Stage</option>
                <option value="fruiting">Fruiting / Pod Stage</option>
                <option value="vegetative">Vegetative Growth [SAFE]</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[#2C1B3F] font-medium mb-1">Alert Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-white border border-[#E4DDCC] rounded-none px-3 py-2 text-[#2C1B3F] focus:ring-1 focus:ring-[#2C1B3F] focus:outline-none"
              >
                <option value="hi">Hindi (हिंदी)</option>
                <option value="mr">Marathi (मराठी)</option>
                <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-[#2C1B3F] font-medium mb-1">Nearest Broadcast Tower</label>
              <select
                value={towerId}
                onChange={(e) => setTowerId(e.target.value)}
                className="w-full bg-white border border-[#E4DDCC] rounded-none px-3 py-2 text-[#2C1B3F] focus:ring-1 focus:ring-[#2C1B3F] focus:outline-none"
              >
                {towers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-[#F3EEE4] border border-[#E4DDCC] p-2.5 rounded-none flex items-start space-x-2 text-[11px] text-[#2C1B3F]">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#4B7A63]" />
            <span>
              Zero cost to farmer. This opt-in hooks into public telecom broadcast infrastructure without consuming farmer balance.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2C1B3F] hover:bg-[#1f132c] text-[#F3EEE4] font-medium py-2.5 px-4 rounded-none transition uppercase text-xs tracking-wider disabled:opacity-50"
          >
            {loading ? 'Registering...' : 'Confirm Farmer Opt-in'}
          </button>
        </form>
      </div>
    </div>
  );
}
