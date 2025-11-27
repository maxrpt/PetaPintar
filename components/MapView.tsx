import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, ZoomControl, AttributionControl, useMap, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { PinLocation, LocationCategory, OperationStatus, LocationReport } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS, DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants';
import { MapPin, Navigation, ExternalLink, User, MessageCircle, Clock, ArrowRight, Network, Flag, Send, X, Edit2, Loader2, CheckCircle } from 'lucide-react';
import { addReport } from '../services/storageService'; // Now an async function

// Fix for default Leaflet icons in React
const createCustomIcon = (icon: string) => {
  const bgColor = 'bg-white border-indigo-600';
  const textColor = '';
  return L.divIcon({
    html: `<div class="flex items-center justify-center w-9 h-9 ${bgColor} rounded-full shadow-lg border-2 ${textColor} text-xl transform hover:scale-110 transition-transform duration-200 cursor-pointer">${icon}</div>`,
    className: 'custom-div-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
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
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4">
                <div className="bg-white rounded-xl shadow-2xl p-8 text-center max-w-sm w-full animate-fade-in-up">
                    <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4"/>
                    <h3 className="text-xl font-bold text-slate-800">Laporan Terkirim!</h3>
                    <p className="text-slate-500 text-sm mt-2">
                        Terima kasih atas kontribusi Anda. Laporan akan ditinjau oleh Admin.
                    </p>
                    <button onClick={onClose} className="mt-6 w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-indigo-700">
                        Tutup
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full flex flex-col max-h-[90vh] animate-fade-in-up">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white rounded-t-xl">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Edit2 className="w-5 h-5 text-indigo-600"/>
                        Lapor / Perbarui Data
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-500"/></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                     <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                       Anda sedang menyarankan perubahan untuk: <strong className="text-slate-700">{pin.name}</strong>.
                       Ubah data yang tidak akurat, lalu kirim laporan.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs font-medium text-slate-600">Nama Lokasi</label>
                            <input name="name" value={formData.name || ''} onChange={handleChange} className="w-full text-sm border-slate-300 rounded-md mt-1 bg-transparent"/>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600">Status</label>
                            <select name="status" value={formData.status || ''} onChange={handleChange} className="w-full text-sm border-slate-300 rounded-md mt-1 bg-transparent">
                                <option>Buka</option>
                                <option>Tutup</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-600">Jam Operasional</label>
                        <input name="operatingHours" value={formData.operatingHours || ''} onChange={handleChange} className="w-full text-sm border-slate-300 rounded-md mt-1 bg-transparent" placeholder="cth: 08:00 - 17:00"/>
                    </div>
                     <div>
                        <label className="text-xs font-medium text-slate-600">Alamat</label>
                        <textarea name="address" value={formData.address || ''} onChange={handleChange} rows={2} className="w-full text-sm border-slate-300 rounded-md mt-1 bg-transparent"/>
                    </div>
                     <div>
                        <label className="text-xs font-medium text-slate-600">Kontak (Pemilik)</label>
                        <input name="ownerName" value={formData.ownerName || ''} onChange={handleChange} className="w-full text-sm border-slate-300 rounded-md mt-1 bg-transparent"/>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-medium text-slate-600">Telepon</label>
                            <input name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full text-sm border-slate-300 rounded-md mt-1 bg-transparent"/>
                        </div>
                         <div>
                            <label className="text-xs font-medium text-slate-600">WhatsApp</label>
                            <input name="whatsapp" value={formData.whatsapp || ''} onChange={handleChange} className="w-full text-sm border-slate-300 rounded-md mt-1 bg-transparent"/>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-200 sticky bottom-0 bg-white rounded-b-xl">
                    <button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50">
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

  if (!isMounted) return <div className="w-full h-full bg-slate-200 animate-pulse flex items-center justify-center text-slate-500 font-medium">Memuat Peta...</div>;

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
                <div className="flex flex-col items-center justify-center bg-pink-700 text-white px-3 py-1.5 rounded-lg shadow-xl border-2 border-white transform hover:scale-110 transition-transform">
                  <div className="text-sm font-bold flex items-center gap-1"><Navigation className="w-3.5 h-3.5" />{routeDistance} km</div>
                </div>
              </Tooltip>
            </Polyline>
          </>
        )}
        {pins.map((pin) => (
          <Marker key={pin.id} position={[pin.lat, pin.lng]} icon={createCustomIcon(CATEGORY_ICONS[pin.category])} eventHandlers={{ click: () => handlePinClick(pin) }}>
            <Popup className="custom-popup" closeButton={true}>
              <div className="flex flex-col w-full font-sans bg-white shadow-sm overflow-hidden rounded-t-xl rounded-b-xl select-none">
                <div className="relative h-40 w-full bg-slate-200 group">
                  {pin.imageUrl ? <img src={pin.imageUrl} alt={pin.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }} /> : null}
                  <div className={`absolute inset-0 flex items-center justify-center ${pin.imageUrl ? 'hidden' : 'flex'} bg-gradient-to-br from-slate-100 to-slate-200`}>
                      <div className="text-6xl opacity-10 filter grayscale scale-150 transform rotate-12">{CATEGORY_ICONS[pin.category]}</div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-90"></div>
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md ${CATEGORY_COLORS[pin.category]} bg-opacity-95 border border-white/10`}><span>{CATEGORY_ICONS[pin.category]}</span>{pin.category}</span>
                    {pin.status && <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md border border-white/20 ${pin.status === 'Buka' ? 'bg-emerald-500/90' : 'bg-rose-500/90'}`}><div className={`w-1.5 h-1.5 rounded-full ${pin.status === 'Buka' ? 'bg-white animate-pulse' : 'bg-white/50'}`}></div>{pin.status}</span>}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 pb-4 text-white">
                       <h3 className="font-bold text-lg leading-tight drop-shadow-md line-clamp-2 mb-1">{pin.name}</h3>
                       <div className="flex items-start gap-1.5 text-slate-200/90"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" /><p className="text-[11px] font-medium leading-snug line-clamp-1">{pin.address || "Alamat belum tersedia"}</p></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-px bg-slate-100 border-b border-slate-100">
                  <div className="bg-white p-3 flex flex-col justify-center"><div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mb-1"><Clock className="w-3 h-3 text-indigo-500" />Jam Buka</div><p className="text-xs font-bold text-slate-700">{pin.operatingHours || "-"}</p></div>
                  <div className="bg-white p-3 flex flex-col justify-center border-l border-slate-50"><div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase mb-1"><User className="w-3 h-3 text-emerald-500" />Kontak</div><p className="text-xs font-bold text-slate-700 truncate">{pin.ownerName || "-"}</p></div>
                </div>
                {activePinId === pin.id && nearbyList.length > 0 && (
                    <div className="bg-slate-50 border-b border-slate-100">
                      <div className="px-3 py-2 border-b border-slate-200/50 bg-slate-100/50 flex items-center gap-1.5"><Network className="w-3.5 h-3.5 text-slate-500" /><h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Koneksi Terdekat</h4></div>
                      <div className="flex flex-col">
                        {nearbyList.map((item, index) => (
                          <div key={item.pin.id} className={`flex items-center justify-between px-3 py-2.5 ${index !== nearbyList.length - 1 ? 'border-b border-slate-100' : ''} hover:bg-white transition-colors`}>
                             <div className="flex items-center gap-2.5 overflow-hidden">
                                <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white shrink-0 ${index === 0 ? 'bg-pink-500 shadow-sm' : 'bg-slate-300'}`}>{index + 1}</div>
                                <div className="flex flex-col min-w-0"><span className="text-xs font-bold text-slate-700 truncate">{item.pin.name}</span><span className="text-[10px] text-slate-500 flex items-center gap-1 truncate">{CATEGORY_ICONS[item.pin.category]} {item.pin.category}</span></div>
                             </div>
                             <div className="flex items-center gap-1 pl-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">{item.distance.toFixed(1)} km</div>
                          </div>
                        ))}
                      </div>
                    </div>
                )}
                <div className="p-3 bg-white grid grid-cols-4 gap-2">
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}`} target="_blank" rel="noopener noreferrer" className="col-span-2 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold py-2.5 px-3 rounded-lg transition-all shadow-sm hover:shadow-md group"><Navigation className="w-3.5 h-3.5 group-hover:-rotate-45 transition-transform duration-300" />Rute</a>
                  {pin.whatsapp ? <a href={`https://wa.me/${pin.whatsapp.replace(/^0/, '62').replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="col-span-1 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-all shadow-sm hover:shadow-md" title="WhatsApp"><MessageCircle className="w-4 h-4" /></a> : <div className="col-span-1 flex items-center justify-center bg-slate-50 text-slate-300 rounded-lg cursor-not-allowed border border-slate-100"><MessageCircle className="w-4 h-4" /></div>}
                  <a href={`https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}`} target="_blank" rel="noopener noreferrer" className="col-span-1 flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-all hover:border-indigo-200 hover:shadow-sm" title="Lihat di Google Maps"><ExternalLink className="w-4 h-4" /></a>
                </div>
                {allowReporting && (
                  <div className="px-3 pb-3 bg-white">
                      <button onClick={() => setReportingPin(pin)} className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 rounded-md py-1.5 transition-colors flex items-center justify-center gap-1">
                          <Flag className="w-3 h-3"/>
                          Data tidak akurat? Lapor / Sunting
                      </button>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </>
  );
};

export default MapView;