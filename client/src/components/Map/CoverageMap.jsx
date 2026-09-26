import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Radio, Users, CloudRain, ShieldCheck, MapPin } from 'lucide-react';

// Custom Leaflet DivIcons for seamless rendering in design system
const createTowerIcon = (isActive, hasActiveAlert) => {
  return L.divIcon({
    className: 'custom-tower-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-7 h-7 ${hasActiveAlert ? 'bg-[#9C3B2E]/30 animate-ping' : 'bg-[#2C1B3F]/15'} flex items-center justify-center"></div>
        <div class="absolute w-5 h-5 ${hasActiveAlert ? 'bg-[#9C3B2E] text-white' : 'bg-[#2C1B3F] text-white'} border border-white flex items-center justify-center text-[10px]">
          📡
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const createFarmerIcon = (risk) => {
  let color = 'bg-[#4B7A63]'; // sage
  let emoji = '🌾';
  if (risk === 'CRITICAL') {
    color = 'bg-[#9C3B2E]'; // brick
    emoji = '🚨';
  } else if (risk === 'HIGH') {
    color = 'bg-[#B8860B]'; // gold
    emoji = '⚠️';
  }

  return L.divIcon({
    className: 'custom-farmer-marker',
    html: `
      <div class="flex items-center justify-center w-5 h-5 ${color} text-[10px] text-white border border-white cursor-pointer">
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
    <div className="bg-white border border-[#E4DDCC] rounded-none shadow-none p-4 flex flex-col h-[520px] relative overflow-hidden">
      {/* Top Map Controls */}
      <div className="flex items-center justify-between mb-3 z-10">
        <div className="flex items-center space-x-2 text-xs">
          <span className="font-serif font-semibold text-sm text-[#2C1B3F]">Agricultural Radar Map</span>
          <div className="flex bg-[#F3EEE4] border border-[#E4DDCC] rounded-none p-0.5">
            <button
              onClick={() => handleRegionChange('MH')}
              className={`px-2.5 py-1 text-xs transition rounded-none ${
                currentRegion === 'MH' ? 'bg-[#2C1B3F] text-white font-medium' : 'text-[#2C1B3F] hover:bg-white'
              }`}
            >
              Maharashtra (Nashik/Yeola)
            </button>
            <button
              onClick={() => handleRegionChange('PB')}
              className={`px-2.5 py-1 text-xs transition rounded-none ${
                currentRegion === 'PB' ? 'bg-[#2C1B3F] text-white font-medium' : 'text-[#2C1B3F] hover:bg-white'
              }`}
            >
              Punjab (Khanna Belt)
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden lg:flex items-center space-x-3 text-[11px] text-[#2C1B3F] bg-[#F3EEE4] px-2.5 py-1 border border-[#E4DDCC] rounded-none">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#9C3B2E]"></span> Critical / Harvested
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#B8860B]"></span> High Sensitivity
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-[#4B7A63]"></span> Safe / Vegetative
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 border border-[#2C1B3F] bg-[#2C1B3F]/10"></span> 10km Geofence
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full rounded-none overflow-hidden border border-[#E4DDCC] relative">
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          <MapCenterController center={mapCenter} zoom={mapZoom} />

          {/* Clean OpenStreetMap TileLayer without watermarks */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Render Towers with Geofence Circles */}
          {towers.map((tower) => {
            const hasAlert = activeAlertTowerId === tower.id;
            return (
              <React.Fragment key={`tower-${tower.id}`}>
                {/* 10km Circular Broadcast Geofence */}
                <Circle
                  center={[tower.latitude, tower.longitude]}
                  radius={tower.radius_km * 1000} // in meters
                  pathOptions={{
                    color: hasAlert ? '#9C3B2E' : '#2C1B3F',
                    fillColor: hasAlert ? '#9C3B2E' : '#2C1B3F',
                    fillOpacity: hasAlert ? 0.22 : 0.06,
                    weight: hasAlert ? 2 : 1.2,
                    dashArray: hasAlert ? '5, 5' : undefined,
                  }}
                />

                {/* Broadcast Tower Marker */}
                <Marker
                  position={[tower.latitude, tower.longitude]}
                  icon={createTowerIcon(tower.is_active, hasAlert)}
                >
                  <Popup className="custom-popup">
                    <div className="text-[#2C1B3F] text-xs p-1 font-sans">
                      <p className="font-serif font-semibold text-sm text-[#2C1B3F]">{tower.name}</p>
                      <p className="text-[#8A8071]">Code: {tower.code} • {tower.district}, {tower.state}</p>
                      <p className="text-[#2C1B3F] font-medium mt-1">
                        Coverage: {tower.radius_km} km radius ({tower.covered_farmers_count} registered farmers)
                      </p>
                      {hasAlert && (
                        <p className="text-[#9C3B2E] font-bold mt-1">
                          AMBER BROADCAST ACTIVE
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
                  <div className="text-[#2C1B3F] text-xs p-1 font-sans">
                    <p className="font-serif font-semibold text-sm text-[#2C1B3F]">{farmer.name}</p>
                    <p className="text-[#8A8071]">{farmer.village} • {farmer.phone}</p>
                    <div className="mt-1 pt-1 border-t border-[#E4DDCC]">
                      <p>
                        Crop: <strong className="text-[#2C1B3F]">{farmer.crop}</strong> ({farmer.crop_stage})
                      </p>
                      <p>
                        Risk Level: <strong className={risk === 'CRITICAL' ? 'text-[#9C3B2E] font-bold' : risk === 'HIGH' ? 'text-[#B8860B] font-bold' : 'text-[#4B7A63]'}>{risk}</strong>
                      </p>
                      <p className="text-[#8A8071] text-[10px]">Nearest Tower: {farmer.nearest_tower} ({farmer.distance_to_nearest_tower_km?.toFixed(1)} km)</p>
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
