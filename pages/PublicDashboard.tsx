import React, { useEffect, useState } from 'react';
import MapView from '../components/MapView';
import { getPins } from '../services/storageService'; // Now an async function
import { PinLocation, LocationCategory } from '../types';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../constants';
import { Search, Filter, MapPin, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const PublicDashboard: React.FC = () => {
  const [pins, setPins] = useState<PinLocation[]>([]);
  const [filteredPins, setFilteredPins] = useState<PinLocation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<LocationCategory | 'All'>('All');
  const [focusedLocation, setFocusedLocation] = useState<{lat: number; lng: number} | null>(null);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const fetchPins = async () => {
      const data = await getPins(); // Await the async call
      setPins(data);
      setFilteredPins(data);
    };
    fetchPins();
  }, []);

  useEffect(() => {
    let result = pins;

    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lower) || 
        p.description.toLowerCase().includes(lower)
      );
    }

    setFilteredPins(result);
  }, [searchTerm, selectedCategory, pins]);

  const handleLocationClick = (pin: PinLocation) => {
    setFocusedLocation({ lat: pin.lat, lng: pin.lng });
    if (window.innerWidth < 768) {
       setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:flex-row bg-slate-50 relative overflow-hidden">
      
      <div 
        className={`
          flex flex-col border-r border-slate-200 bg-white shadow-xl z-20 
          transition-all duration-300 ease-in-out
          order-2 md:order-1
          ${isSidebarOpen 
            ? 'w-full md:w-96 h-[45%] md:h-full' 
            : 'w-full md:w-0 h-14 md:h-full overflow-hidden'
          }
        `}
      >
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white relative shrink-0">
          <div className="flex justify-between items-center">
            <h2 className={`text-xl font-bold text-slate-800 transition-opacity duration-200 ${!isSidebarOpen && 'md:opacity-0'}`}>
              Cari Lokasi
            </h2>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
              title={isSidebarOpen ? "Sembunyikan Sidebar" : "Tampilkan Sidebar"}
            >
              <div className="md:hidden">
                {isSidebarOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </div>
              <div className="hidden md:block">
                <PanelLeftClose className="w-5 h-5" />
              </div>
            </button>
          </div>
          
          <div className={`space-y-3 transition-opacity duration-200 ${!isSidebarOpen ? 'opacity-0 pointer-events-none hidden md:block' : 'opacity-100'}`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari nama tempat..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'All' 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua
              </button>
              {Object.values(LocationCategory).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                    selectedCategory === cat 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{CATEGORY_ICONS[cat]}</span>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={`flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 ${!isSidebarOpen && 'hidden'}`}>
          {filteredPins.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <Filter className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Tidak ada lokasi ditemukan.</p>
            </div>
          ) : (
            filteredPins.map(pin => (
              <div 
                key={pin.id} 
                onClick={() => handleLocationClick(pin)}
                className="bg-white border border-slate-100 rounded-lg p-3 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer group active:scale-[0.98]"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{CATEGORY_ICONS[pin.category]}</span>
                    <div>
                      <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors text-sm">{pin.name}</h3>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span>{pin.category}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[pin.category]}`}></span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2 pl-1 border-l-2 border-slate-100">{pin.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="flex-1 h-full order-1 md:order-2 relative transition-all duration-300">
         {!isSidebarOpen && (
            <div className="absolute top-4 left-4 z-[400] hidden md:block">
               <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="bg-white hover:bg-slate-50 text-slate-600 p-2.5 rounded-lg shadow-lg border border-slate-200 flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group"
                  title="Buka Pencarian"
               >
                  <PanelLeftOpen className="w-5 h-5 text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider pr-1">Cari Lokasi</span>
               </button>
            </div>
         )}
         <MapView 
            pins={filteredPins} 
            interactive={false} 
            focusLocation={focusedLocation}
            allowReporting={true}
         />
         <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-slate-200 text-xs font-medium text-slate-600 hidden md:block">
            Menampilkan {filteredPins.length} Lokasi
         </div>
      </div>
    </div>
  );
};

export default PublicDashboard;