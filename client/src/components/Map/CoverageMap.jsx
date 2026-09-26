import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Radio, Users, CloudRain, ShieldCheck, MapPin } from 'lucide-react';

// Custom Leaflet DivIcons for seamless rendering without asset issues
const createTowerIcon = (isActive, hasActiveAlert) => {
  return L.divIcon({
    className: 'custom-tower-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-8 h-8 rounded-full ${hasActiveAlert ? 'bg-red-500 animate-ping' : 'bg-emerald-500/30'} flex items-center justify-center"></div>
        <div class="absolute w-6 h-6 rounded-full ${hasActiveAlert ? 'bg-red-600' : 'bg-slate-900 border-2 border-emerald-400'} flex items-center justify-center shadow-lg text-white text-xs">
          📡
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createFarmerIcon = (risk) => {
  let color = 'bg-emerald-500';
  let emoji = '🌾';
  if (risk === 'CRITICAL') {
    color = 'bg-red-500 ring-2 ring-red-300 animate-pulse';
    emoji = '🚨';
  } else if (risk === 'HIGH') {
    color = 'bg-amber-500';
    emoji = '⚠️';
  }

  return L.divIcon({
    className: 'custom-farmer-marker',
    html: `
      <div class="flex items-center justify-center w-5 h-5 rounded-full ${color} text-[10px] text-white shadow-md cursor-pointer">
        ${emoji}
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

// Component to handle pan/zoom transitions
function MapCenterController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);
  return null;
}

export default function CoverageMap({ towers, farmers, activeAlertTowerId, onSelectFarmer }) {
  const [currentRegion, setCurrentRegion] = useState('MH');
  const [mapCenter, setMapCenter] = useState([20.08, 74.15]); // Nashik belt center
  const [mapZoom, setMapZoom] = useState(11);

  const handleRegionChange = (region) => {
    setCurrentRegion(region);
    if (region === 'MH') {
      setMapCenter([20.08, 74.15]);
      setMapZoom(11);
    } else if (region === 'PB') {
      setMapCenter([30.70, 76.22]);
      setMapZoom(12);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col h-[520px] relative overflow-hidden">
      {/* Top Map Controls */}
      <div className="flex items-center justify-between mb-2 z-10">
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-semibold text-slate-200">Agricultural Radar Map:</span>
          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => handleRegionChange('MH')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                currentRegion === 'MH' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Maharashtra (Nashik/Yeola Belt)
            </button>
            <button
              onClick={() => handleRegionChange('PB')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                currentRegion === 'PB' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Punjab (Khanna Grain Belt)
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center space-x-3 text-[11px] text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span> Critical / Harvested Crop
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> High Sensitivity
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Vegetative / Safe
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full border border-blue-400 bg-blue-500/20"></span> 10km Broadcast Geofence
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full rounded-lg overflow-hidden border border-slate-800 relative">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <MapCenterController center={mapCenter} zoom={mapZoom} />

          {/* Dark themed map tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Render Towers with Geofence Circles */}
          {towers.map((tower) => {
            const hasAlert = activeAlertTowerId === tower.id;
            return (
              <React.Fragment key={`tower-${tower.id}`}>
                {/* 10km (or configured) Circular Broadcast Geofence */}
                <Circle
                  center={[tower.latitude, tower.longitude]}
                  radius={tower.radius_km * 1000} // in meters
                  pathOptions={{
                    color: hasAlert ? '#ef4444' : '#3b82f6',
                    fillColor: hasAlert ? '#ef4444' : '#1d4ed8',
                    fillOpacity: hasAlert ? 0.35 : 0.12,
                    weight: hasAlert ? 3 : 1.5,
                    dashArray: hasAlert ? '6, 6' : undefined,
                  }}
                />

                {/* Broadcast Tower Marker */}
                <Marker
                  position={[tower.latitude, tower.longitude]}
                  icon={createTowerIcon(tower.is_active, hasAlert)}
                >
                  <Popup className="custom-popup">
                    <div className="text-slate-900 text-xs p-1 font-sans">
                      <p className="font-bold text-sm text-indigo-900">{tower.name}</p>
                      <p className="text-slate-600">Code: {tower.code} • {tower.district}, {tower.state}</p>
                      <p className="text-blue-700 font-semibold mt-1">
                        Coverage: {tower.radius_km} km radius ({tower.covered_farmers_count} registered farmers)
                      </p>
                      {hasAlert && (
                        <p className="text-red-600 font-bold mt-1 animate-pulse">
                          ⚡ ACTIVE AMBER BROADCAST IN PROGRESS!
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}

          {/* Render Registered Farmers */}
          {farmers.map((farmer) => {
            let risk = 'LOW';
            if (farmer.crop_stage === 'harvested_open' || (farmer.crop === 'Cotton' && farmer.crop_stage === 'mature_pre_harvest')) {
              risk = 'CRITICAL';
            } else if (farmer.crop_stage === 'mature_pre_harvest' || farmer.crop_stage === 'fruiting' || farmer.crop_stage === 'flowering') {
              risk = 'HIGH';
            }

            return (
              <Marker
                key={`farmer-${farmer.id}`}
                position={[farmer.latitude, farmer.longitude]}
                icon={createFarmerIcon(risk)}
                eventHandlers={{
                  click: () => onSelectFarmer && onSelectFarmer(farmer),
                }}
              >
                <Popup className="custom-popup">
                  <div className="text-slate-900 text-xs p-1 font-sans">
                    <p className="font-bold text-emerald-800 text-sm">{farmer.name}</p>
                    <p className="text-slate-600">{farmer.village} • {farmer.phone}</p>
                    <div className="mt-1 pt-1 border-t border-slate-200">
                      <p>
                        Crop: <strong className="text-amber-800">{farmer.crop}</strong> ({farmer.crop_stage})
                      </p>
                      <p>
                        Risk Level: <strong className={risk === 'CRITICAL' ? 'text-red-600 font-bold' : 'text-slate-700'}>{risk}</strong>
                      </p>
                      <p className="text-slate-500 text-[10px]">Nearest Tower: {farmer.nearest_tower} ({farmer.distance_to_nearest_tower_km?.toFixed(1)} km)</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
