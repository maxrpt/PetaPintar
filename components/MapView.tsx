
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, ZoomControl, AttributionControl, useMap, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { PinLocation, LocationCategory, OperationStatus, LocationReport } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS, DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants';
import { MapPin, Navigation, ExternalLink, User, MessageCircle, Clock, ArrowRight, Network, Flag, Send, X, Edit2, Loader2, CheckCircle, Phone, Briefcase } from 'lucide-react';
import { addReport } from '../services/storageService'; // Now an async function

// --- KONFIGURASI ICON PIN ALA GOOGLE MAPS ---

// Mapping warna Hex untuk SVG (karena Tailwind class tidak bisa dipakai langsung di dalam string SVG)
const PIN_COLORS: Record<string, string> = {
  [LocationCategory.DROP_POINT]: '#3b82f6',    // Blue-500 (Softer)
  [LocationCategory.TRANSIT_CENTER]: '#f97316', // Orange-500
  [LocationCategory.GATEWAY]: '#a855f7',        // Purple-500 (Softer)
  [LocationCategory.MINI_DROP_POINT]: '#14b8a6', // Teal-500 (New for Mini Drop Point)
};

const createCustomIcon = (category: LocationCategory, iconChar: string) => {
  const color = PIN_COLORS[category] || '#ea4335'; // Default red if not found
  
  // SVG Path untuk bentuk Pin Map standar (Teardrop shape)
  const pinSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="38" height="48">
      <!-- Shadow Filter -->
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="rgba(0,0,0,0.3)"/>
        </filter>
      </defs>
      
      <!-- Main Pin Shape -->
      <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z" fill="${color}" filter="url(#shadow)" stroke="white" stroke-width="8"/>
      
      <!-- White Circle Container -->
      <circle cx="192" cy="192" r="80" fill="white"/>
      
      <!-- Icon/Emoji Centered -->
      <text x="50%" y="42%" dominant-baseline="middle" text-anchor="middle" font-size="90" font-family="Arial, sans-serif">${iconChar}</text>
    </svg>
  `;

  return L.divIcon({
    html: `<div class="transform hover:-translate-y-2 transition-transform duration-200 drop-shadow-sm origin-bottom">${pinSvg}</div>`,
    className: 'custom-google-pin', // Class kosong agar tidak ada style bawaan Leaflet box
    iconSize: [38, 48],
    iconAnchor: [19, 48], // Ujung lancip bawah ada di tengah-bawah (x=width/2, y=height)
    popupAnchor: [0, -50] // Popup muncul di atas pin
  });
};

interface MapViewProps {
  pins: PinLocation[];
  onMapClick?: (lat: number, lng: number) => void;
  selectedLocation?: { lat: number; lng: number } | null;
  focusLocation?: { lat: number; lng: number } | null;
  interactive?: boolean;
  allowReporting?: boolean; // New prop to control report button
}

interface NearbyPinInfo {
  pin: PinLocation;
  distance: number; // in km
}

// --- Report Modal Component ---
const ReportModal = ({ pin, onClose }: { pin: PinLocation; onClose: () => void }) => {
    const [formData, setFormData] = useState<Partial<PinLocation>>(pin);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => { // Made async
        e.preventDefault();
        
        const changes: Record<string, any> = {}; // Use Record<string, any>
        Object.keys(formData).forEach(key => {
            const k = key as keyof PinLocation;
            if (formData[k] !== pin[k]) {
                changes[k] = formData[k];
            }
        });

        if (Object.keys(changes).length === 0) {
            alert("Anda belum membuat perubahan apapun.");
            return;
        }

        setIsSubmitting(true);

        const report: LocationReport = {
            reportId: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            pinId: pin.id,
            pinName: pin.name,
            changes,
            reportedAt: new Date().toISOString(), // Use ISO string for Supabase
        };

        try {
            await addReport(report); // Await the async call
            setIsSubmitted(true);
        } catch (error) {
            console.error("Error submitting report:", error);
            alert("Gagal mengirim laporan. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isSubmitted) {
        return (
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[1001] p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-sm w-full animate-fade-in-up border border-slate-100">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-500"/>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Laporan Terkirim!</h3>
                    <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                        Terima kasih. Kontribusi Anda membantu kami menjaga data tetap akurat.
                    </p>
                    <button onClick={onClose} className="mt-6 w-full bg-slate-900 text-white py-3 rounded-xl font-medium text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                        Tutup
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[1001] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full flex flex-col max-h-[90vh] animate-fade-in-up overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Edit2 className="w-5 h-5 text-indigo-500"/>
                        Lapor Data
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 transition-colors"><X className="w-5 h-5 text-slate-400"/></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4 bg-slate-50/50">
                     <p className="text-xs text-slate-500 bg-blue-50/50 p-3 rounded-xl border border-blue-100/50 leading-relaxed">
                       Saran perubahan untuk: <strong className="text-slate-700">{pin.name}</strong>.
                       Data akan diverifikasi oleh Admin.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nama Lokasi</label>
                            <input name="name" value={formData.name || ''} onChange={handleChange} className="w-full text-sm border-slate-200 rounded-lg mt-1.5 focus:ring-indigo-500 focus:border-indigo-500 bg-white"/>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</label>
                            <select name="status" value={formData.status || ''} onChange={handleChange} className="w-full text-sm border-slate-200 rounded-lg mt-1.5 focus:ring-indigo-500 focus:border-indigo-500 bg-white">
                                <option>Buka</option>
                                <option>Tutup</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Jam Operasional</label>
                        <input name="operatingHours" value={formData.operatingHours || ''} onChange={handleChange} className="w-full text-sm border-slate-200 rounded-lg mt-1.5 focus:ring-indigo-500 focus:border-indigo-500 bg-white" placeholder="cth: 08:00 - 17:00"/>
                    </div>
                     <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Alamat</label>
                        <textarea name="address" value={formData.address || ''} onChange={handleChange} rows={2} className="w-full text-sm border-slate-200 rounded-lg mt-1.5 focus:ring-indigo-500 focus:border-indigo-500 bg-white"/>
                    </div>
                     <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kontak (Pemilik)</label>
                        <input name="ownerName" value={formData.ownerName || ''} onChange={handleChange} className="w-full text-sm border-slate-200 rounded-lg mt-1.5 focus:ring-indigo-500 focus:border-indigo-500 bg-white"/>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Telepon</label>
                            <input name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full text-sm border-slate-200 rounded-lg mt-1.5 focus:ring-indigo-500 focus:border-indigo-500 bg-white"/>
                        </div>
                         <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">WhatsApp</label>
                            <input name="whatsapp" value={formData.whatsapp || ''} onChange={handleChange} className="w-full text-sm border-slate-200 rounded-lg mt-1.5 focus:ring-indigo-500 focus:border-indigo-500 bg-white"/>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-100 bg-white">
                    <button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-indigo-200">
                         {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4"/>}
                        Kirim Laporan
                    </button>
                </div>
            </div>
        </div>
    );
};

const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);

const fetchRoadRoute = async (start: {lat: number, lng: number}, end: {lat: number, lng: number}) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.code === 'Ok' && data.routes.length > 0) {
      const route = data.routes[0];
      const coordinates = route.geometry.coordinates.map((coord: number[]) => [coord[1], coord[0]]);
      const distanceKm = (route.distance / 1000).toFixed(2);
      return { coordinates, distanceKm };
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch route", error);
    return null;
  }
};

const MapEffect = ({ location }: { location: { lat: number; lng: number } | null }) => {
  const map = useMap();
  useEffect(() => {
    if (location) map.flyTo([location.lat, location.lng], 16, { animate: true, duration: 1.5 });
  }, [location, map]);
  return null;
};

const LocationMarker = ({ onMapClick, selectedLocation }: { onMapClick?: (lat: number, lng: number) => void, selectedLocation?: { lat: number; lng: number } | null }) => {
  useMapEvents({
    click(e) { if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng); },
  });
  const customIcon = L.divIcon({
    html: `<div class="flex items-center justify-center w-9 h-9 bg-white border-orange-500 rounded-full shadow-lg border-2 text-xl transform scale-110 transition-transform duration-200 cursor-pointer animate-pulse">🎯</div>`,
    className: 'custom-div-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
  return selectedLocation ? <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={customIcon} /> : null;
};

// Pastel styling helpers
const getPastelCategoryStyle = (category: LocationCategory) => {
    switch (category) {
        case LocationCategory.DROP_POINT: return 'bg-blue-50 text-blue-600 border-blue-100';
        case LocationCategory.TRANSIT_CENTER: return 'bg-orange-50 text-orange-600 border-orange-100';
        case LocationCategory.GATEWAY: return 'bg-purple-50 text-purple-600 border-purple-100';
        case LocationCategory.MINI_DROP_POINT: return 'bg-teal-50 text-teal-600 border-teal-100';
        default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
};

const MapView: React.FC<MapViewProps> = ({ pins, onMapClick, selectedLocation, focusLocation, interactive = true, allowReporting = false }) => {
  const [isMounted, setIsMounted] = useState(false);
  const [routePath, setRoutePath] = useState<[number, number][] | null>(null);
  const [routeDistance, setRouteDistance] = useState<string | null>(null);
  const [nearbyList, setNearbyList] = useState<NearbyPinInfo[]>([]);
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [reportingPin, setReportingPin] = useState<PinLocation | null>(null);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (focusLocation) {
        setRoutePath(null);
        setRouteDistance(null);
        setNearbyList([]);
        setActivePinId(null);
    }
  }, [focusLocation]);

  const handlePinClick = async (clickedPin: PinLocation) => {
    setActivePinId(clickedPin.id);
    setRoutePath(null);
    const candidates: NearbyPinInfo[] = pins
      .filter(p => p.id !== clickedPin.id)
      .map(p => ({ pin: p, distance: getDistanceFromLatLonInKm(clickedPin.lat, clickedPin.lng, p.lat, p.lng) }))
      .sort((a, b) => a.distance - b.distance);
    const top3 = candidates.slice(0, 3);
    setNearbyList(top3);

    if (top3.length > 0) {
      const nearest = top3[0];
      const roadData = await fetchRoadRoute({ lat: clickedPin.lat, lng: clickedPin.lng }, { lat: nearest.pin.lat, lng: nearest.pin.lng });
      if (roadData) {
        setRoutePath(roadData.coordinates as [number, number][]);
        setRouteDistance(roadData.distanceKm);
      } else {
        setRoutePath([[clickedPin.lat, clickedPin.lng], [nearest.pin.lat, nearest.pin.lng]]);
        setRouteDistance(nearest.distance.toFixed(2));
      }
    }
  };

  const handleMapBackgroundClick = () => {
    if (onMapClick) return; 
    setRoutePath(null);
    setRouteDistance(null);
    setNearbyList([]);
    setActivePinId(null);
  };
  
  const TILE_LAYER_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  if (!isMounted) return <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 font-medium tracking-wide">Memuat Peta...</div>;

  return (
    <>
      {reportingPin && <ReportModal pin={reportingPin} onClose={() => setReportingPin(null)} />}
      <MapContainer 
        center={DEFAULT_CENTER} 
        zoom={DEFAULT_ZOOM} 
        style={{ height: '100%', width: '100%' }}
        className="z-0 outline-none"
        zoomControl={false}
        attributionControl={false}
      >
        <AttributionControl position="bottomleft" prefix={false} />
        <ZoomControl position="bottomright" />
        <TileLayer url={TILE_LAYER_URL} />
        
        {/* Credit Badge */}
        <div className="absolute bottom-8 left-2 z-[400] pointer-events-none select-none">
          <div className="bg-white/80 backdrop-blur-md border border-slate-200/50 px-3 py-1.5 rounded-xl shadow-sm transition-opacity hover:opacity-100 opacity-90">
            <p className="text-[10px] leading-none text-slate-500 font-medium">
              Created by <span className="font-bold text-slate-800 tracking-wide">TIM NM RANTAU</span>
            </p>
          </div>
        </div>

        <MapEffect location={focusLocation || null} />
        <LocationMarker 
          onMapClick={(lat, lng) => { handleMapBackgroundClick(); if (onMapClick) onMapClick(lat, lng); }} 
          selectedLocation={selectedLocation}
        />
        {routePath && routeDistance && nearbyList.length > 0 && (
          <>
            <Polyline positions={routePath} pathOptions={{ color: 'white', weight: 8, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} interactive={false} />
            <Polyline positions={routePath} pathOptions={{ color: '#db2777', weight: 4, opacity: 1, dashArray: '10, 10', lineCap: 'round', lineJoin: 'round' }}>
              <Tooltip permanent direction="center" offset={[0, 0]} opacity={1}>
                <div className="flex flex-col items-center justify-center bg-pink-600 text-white px-3 py-1 rounded-lg shadow-lg border-2 border-white transform hover:scale-105 transition-transform">
                  <div className="text-xs font-bold flex items-center gap-1"><Navigation className="w-3 h-3" />{routeDistance} km</div>
                </div>
              </Tooltip>
            </Polyline>
          </>
        )}
        {pins.map((pin) => (
          <Marker 
            key={pin.id} 
            position={[pin.lat, pin.lng]} 
            icon={createCustomIcon(pin.category, CATEGORY_ICONS[pin.category])} 
            eventHandlers={{ click: () => handlePinClick(pin) }}
          >
            <Popup className="custom-popup" closeButton={true}>
              {/* --- MODERN PASTEL POPUP --- */}
              <div className="flex flex-col w-full font-sans bg-white shadow-none overflow-hidden rounded-2xl select-none">
                
                {/* Header Image Area */}
                <div className="relative h-44 w-full bg-slate-100 group">
                   {pin.imageUrl ? (
                     <img src={pin.imageUrl} alt={pin.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} />
                   ) : null}
                   
                   {/* Fallback pattern if no image */}
                   <div className={`absolute inset-0 flex items-center justify-center ${pin.imageUrl ? 'hidden' : 'flex'} bg-slate-50 opacity-50`}>
                      <div className="text-5xl opacity-[0.07] grayscale">{CATEGORY_ICONS[pin.category]}</div>
                   </div>

                   {/* Floating Badges */}
                   <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
                     <div className="flex flex-col items-start gap-1">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm border ${getPastelCategoryStyle(pin.category)} bg-opacity-95 backdrop-blur-sm`}>
                            <span>{CATEGORY_ICONS[pin.category]}</span>{pin.category}
                        </span>
                        {/* PARTNERSHIP STATUS BADGE (Replaces Email) */}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm border bg-opacity-95 backdrop-blur-sm ${
                            pin.partnershipStatus === 'MITRA' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-cyan-50 text-cyan-700 border-cyan-200'
                        }`}>
                            <Briefcase className="w-3 h-3"/>
                            {pin.partnershipStatus || 'AGENT'}
                        </span>
                     </div>
                     
                     {pin.status && (
                       <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm border ${pin.status === 'Buka' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${pin.status === 'Buka' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                         {pin.status}
                       </span>
                     )}
                   </div>
                </div>

                {/* Main Content */}
                <div className="p-4 bg-white relative -mt-4 rounded-t-2xl">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-slate-800 leading-tight pr-4">{pin.name}</h3>
                    </div>
                    
                    <div className="flex items-start gap-2 text-slate-500 mb-4">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                        <p className="text-xs leading-relaxed">{pin.address || "Alamat belum tersedia"}</p>
                    </div>

                    {/* Pastel Info Grid */}
                    <div className="flex gap-3 mb-4">
                        <div className="flex-1 bg-indigo-50/50 rounded-xl p-3 border border-indigo-50">
                            <div className="flex items-center gap-1.5 mb-1">
                                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-[10px] font-bold text-indigo-300 uppercase">Jam Operasional</span>
                            </div>
                            <p className="text-xs font-semibold text-indigo-900">{pin.operatingHours || "-"}</p>
                        </div>
                        <div className="flex-1 bg-emerald-50/50 rounded-xl p-3 border border-emerald-50">
                            <div className="flex items-center gap-1.5 mb-1">
                                <User className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[10px] font-bold text-emerald-300 uppercase">Pemilik</span>
                            </div>
                            <p className="text-xs font-semibold text-emerald-900 truncate">{pin.ownerName || "-"}</p>
                        </div>
                    </div>

                    {/* Connection List (Clean) */}
                    {activePinId === pin.id && nearbyList.length > 0 && (
                        <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
                          <div className="flex items-center gap-1.5 mb-2">
                              <Network className="w-3.5 h-3.5 text-slate-400" />
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Koneksi Terdekat</h4>
                          </div>
                          <div className="space-y-1.5">
                            {nearbyList.map((item, index) => (
                              <div key={item.pin.id} className="flex items-center justify-between bg-white rounded-lg px-2.5 py-2 shadow-sm border border-slate-100">
                                 <div className="flex items-center gap-2 overflow-hidden">
                                    <div className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold text-white shrink-0 ${index === 0 ? 'bg-pink-400' : 'bg-slate-300'}`}>{index + 1}</div>
                                    <span className="text-xs font-medium text-slate-600 truncate">{item.pin.name}</span>
                                 </div>
                                 <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">{item.distance.toFixed(1)} km</span>
                              </div>
                            ))}
                          </div>
                        </div>
                    )}

                    {/* Action Buttons (Modern Soft UI) */}
                    <div className="grid grid-cols-4 gap-2">
                      <a href={`https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`} target="_blank" rel="noopener noreferrer" 
                         className="col-span-2 flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-extrabold py-2.5 px-3 rounded-xl transition-all shadow-md shadow-indigo-100 active:scale-95 group">
                         <Navigation className="w-4 h-4 group-hover:-rotate-45 transition-transform" />
                         Rute
                      </a>
                      
                      {pin.whatsapp ? (
                          <a href={`https://wa.me/${pin.whatsapp}`} target="_blank" rel="noopener noreferrer" 
                             className="flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 text-emerald-600 p-2.5 rounded-xl transition-colors active:scale-95" title="WhatsApp">
                             <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.232-.298.347-.497.116-.198.058-.371-.029-.544-.087-.174-.787-1.984-1.077-2.718-.283-.714-.575-.617-.79-.628-.198-.01-.424-.01-.649-.01-.225 0-.591.085-.9.421-.309.336-1.18 1.153-1.18 2.812 0 1.659 1.209 3.262 1.378 3.487.169.225 2.379 3.633 5.764 5.094 2.228.961 2.678.961 3.167.893.755-.104 1.758-.718 2.006-1.411.248-.694.248-1.289.173-1.413-.074-.124-.272-.199-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                          </a>
                      ) : (
                          <button disabled className="flex items-center justify-center bg-slate-50 text-slate-300 p-2.5 rounded-xl cursor-not-allowed">
                             <MessageCircle className="w-5 h-5" />
                          </button>
                      )}

                      {allowReporting && (
                          <button onClick={() => setReportingPin(pin)} 
                                  className="flex items-center justify-center bg-amber-50 hover:bg-amber-100 text-amber-500 p-2.5 rounded-xl transition-colors active:scale-95" 
                                  title="Lapor Data">
                              <Flag className="w-5 h-5" />
                          </button>
                      )}
                    </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
};

export default MapView;
