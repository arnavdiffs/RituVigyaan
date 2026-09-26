import React from 'react';
import { Radio, ShieldAlert, Users, Antenna, PlusCircle, HelpCircle } from 'lucide-react';

export default function Navbar({ stats, onOpenFarmerModal, onOpenMatrixModal }) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Krishi Alert <span className="text-amber-400 text-sm font-medium px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">कृषि सचेत</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">Hyperlocal Fire-and-Forget Amber Warning for Rain-Sensitive Crops</p>
          </div>
        </div>

        {/* Live Counters */}
        <div className="hidden md:flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <Antenna className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400">Active Towers:</span>
            <span className="font-semibold text-emerald-400">{stats.towersCount || 5}</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-slate-400">Protected Farmers:</span>
            <span className="font-semibold text-blue-400">{stats.farmersCount || 19}</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="text-slate-400">Broadcast Radius:</span>
            <span className="font-semibold text-amber-300">10 km Geofence</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenMatrixModal}
            className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition border border-slate-700"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Crop Risk Matrix</span>
          </button>
          <button
            onClick={onOpenFarmerModal}
            className="flex items-center space-x-1.5 text-xs font-medium text-emerald-950 bg-emerald-400 hover:bg-emerald-300 px-3.5 py-2 rounded-lg transition shadow-sm hover:shadow-emerald-500/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Opt-in Farmer</span>
          </button>
        </div>
      </div>
    </header>
  );
}
