
import React, { useEffect, useState, useRef } from 'react';
import MapView from '../components/MapView';
import { getPins, addPin, updatePin, deletePin, importPins, getReports, addReport, deleteReport, uploadImage } from '../services/storageService'; // All are now async
import { generatePlaceDescription } from '../services/geminiService';
import { PinLocation, LocationCategory, OperationStatus, LocationReport } from '../types';
import { CATEGORY_ICONS } from '../constants';
import { Plus, Trash2, Wand2, MapPin, Save, Loader2, Image as ImageIcon, Phone, Home, LogOut, Upload, X, Crosshair, Edit3, User, Briefcase, MessageCircle, Clock, FileSpreadsheet, Search, LayoutList, Map as MapIcon, Download, Inbox, Check, GitMerge, AlertCircle, Eye, CheckSquare, Square } from 'lucide-react';
import ConfirmationModal from '../components/ConfirmationModal';
import NotificationToast from '../components/NotificationToast'; // Import toast component

interface AdminDashboardProps {
  onLogout: () => void;
}

const ReportsModal = ({ reports, pins, onVerify, onClose }: {
    reports: LocationReport[],
    pins: PinLocation[],
    onVerify: (action: 'approve' | 'reject' | 'approve_and_edit', report: LocationReport) => void,
    onClose: () => void
}) => {
    const getPinById = (id: string) => pins.find(p => p.id === id);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1002] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] animate-fade-in-up">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Inbox className="w-5 h-5 text-indigo-600"/>Verifikasi Laporan ({reports.length})</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-500"/></button>
                </div>
                <div className="p-4 overflow-y-auto space-y-3 bg-slate-50">
                    {reports.length === 0 ? (
                        <div className="text-center text-slate-400 py-12">
                            <Check className="w-12 h-12 mx-auto mb-2 opacity-50"/>
                            <p>Tidak ada laporan baru.</p>
                        </div>
                    ) : (
                        reports.map(report => {
                            const originalPin = getPinById(report.pinId);
                            if (!originalPin) return null;

                            return (
                                <div key={report.reportId} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                    <div className="flex justify-between items-start mb-3 pb-3 border-b border-slate-100">
                                        <div>
                                            <p className="text-xs text-slate-500">Laporan untuk:</p>
                                            <p className="font-bold text-slate-800">{report.pinName}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{new Date(report.reportedAt).toLocaleString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => onVerify('reject', report)} className="px-3 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-md hover:bg-rose-200 transition">TOLAK</button>
                                            <button onClick={() => onVerify('approve', report)} className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-md hover:bg-emerald-200 transition">TERIMA</button>
                                            <button onClick={() => onVerify('approve_and_edit', report)} className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md hover:bg-indigo-200 transition">TERIMA & EDIT</button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><GitMerge className="w-3 h-3"/>Detail Perubahan:</p>
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-slate-50">
                                                    <th className="p-2 text-left font-medium text-slate-600 w-1/3">Field</th>
                                                    <th className="p-2 text-left font-medium text-slate-600 w-1/3">Data Lama</th>
                                                    <th className="p-2 text-left font-medium text-slate-600 w-1/3">Data Baru</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Object.keys(report.changes).map(key => {
                                                    const k = key as keyof PinLocation;
                                                    const oldValue = originalPin[k]?.toString() || <i className="text-slate-400">Kosong</i>;
                                                    const newValue = report.changes[k]?.toString() || <i className="text-slate-400">Kosong</i>;
                                                    return (
                                                        <tr key={k} className="border-t border-slate-100">
                                                            <td className="p-2 font-semibold text-slate-700 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</td>
                                                            <td className="p-2 text-slate-500"><span className="line-through">{oldValue}</span></td>
                                                            <td className="p-2 text-emerald-600 font-bold">{newValue}</td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [pins, setPins] = useState<PinLocation[]>([]);
  const [reports, setReports] = useState<LocationReport[]>([]);
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState<LocationCategory>(LocationCategory.DROP_POINT);
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  // Replaced email with partnershipStatus
  const [partnershipStatus, setPartnershipStatus] = useState<'AGENT' | 'MITRA'>('AGENT');
  const [operatingHours, setOperatingHours] = useState('');
  const [status, setStatus] = useState<OperationStatus>('Buka');
  const [selectedCoord, setSelectedCoord] = useState<{lat: number; lng: number} | null>(null);
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCreatedAt, setEditingCreatedAt] = useState<string | null>(null); // Changed to string
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // New state for notifications & bulk delete
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pinToDelete, setPinToDelete] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]); // For bulk selection
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const excelInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
  };

  const refreshData = async () => {
      setPins(await getPins());
      setReports(await getReports());
      setSelectedIds([]); // Reset selection on refresh
  };

  useEffect(() => {
    refreshData();
  }, []);
  
  const handleVerifyReport = async (action: 'approve' | 'reject' | 'approve_and_edit', report: LocationReport) => {
    if (action === 'approve' || action === 'approve_and_edit') {
        const originalPin = pins.find(p => p.id === report.pinId);
        if (originalPin) {
            const updatedPin = { ...originalPin, ...report.changes };
            await updatePin(updatedPin);
            showToast('Laporan diterima dan data telah diperbarui.');
            if (action === 'approve_and_edit') {
                handleEdit(updatedPin);
                setIsReportsModalOpen(false);
            }
        }
    }
    await deleteReport(report.reportId);
    if(action === 'reject') showToast('Laporan ditolak dan telah dihapus.', 'error');
    refreshData();
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedCoord({ lat, lng });
    setLatInput(lat.toFixed(6));
    setLngInput(lng.toFixed(6));
  };
  const handleLatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setLatInput(val);
    const latNum = parseFloat(val); const lngNum = parseFloat(lngInput);
    if (!isNaN(latNum) && !isNaN(lngNum)) setSelectedCoord({ lat: latNum, lng: lngNum });
  };
  const handleLngChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; setLngInput(val);
    const latNum = parseFloat(latInput); const lngNum = parseFloat(val);
    if (!isNaN(latNum) && !isNaN(lngNum)) setSelectedCoord({ lat: latNum, lng: lngNum });
  };

  const handleGenerateDescription = async () => {
    if (!name) { showToast("Mohon isi nama tempat terlebih dahulu.", "error"); return; }
    setIsGenerating(true);
    try {
      const generated = await generatePlaceDescription(name, category);
      setDescription(generated);
      showToast("Deskripsi berhasil dibuat oleh AI.");
    } catch (e) { showToast("Gagal menggunakan AI. Coba lagi.", "error"); }
    finally { setIsGenerating(false); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { showToast("Ukuran file terlalu besar. Maksimal 1MB.", "error"); return; }
      
      const uploadedUrl = await uploadImage(file);
      if (uploadedUrl) {
        setImageUrl(uploadedUrl);
        showToast("Gambar berhasil diunggah.");
      } else {
        showToast("Gagal mengunggah gambar.", "error");
      }
    }
  };

  const handleExportExcel = () => {
    try {
        const XLSX = (window as any).XLSX;
        if (!XLSX) {
            showToast("Library Excel belum dimuat.", "error");
            return;
        }

        const dataToExport = pins.map(pin => ({
            "Nama Lokasi": pin.name,
            "Kategori": pin.category,
            "Latitude": pin.lat,
            "Longitude": pin.lng,
            "Deskripsi": pin.description,
            "Alamat": pin.address,
            "Telepon": pin.phone,
            "Pemilik": pin.ownerName,
            "WhatsApp": pin.whatsapp,
            "Status Kemitraan": pin.partnershipStatus || 'AGENT',
            "Jam Operasional": pin.operatingHours,
            "Status": pin.status
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data Lokasi");
        
        const max_width = dataToExport.reduce((w, r) => Math.max(w, r["Nama Lokasi"]?.length || 10), 10);
        worksheet["!cols"] = [ { wch: max_width } ];

        XLSX.writeFile(workbook, `Data_PetaPintar_${new Date().toISOString().slice(0,10)}.xlsx`);
        showToast("File Excel berhasil diunduh!");
    } catch (error) {
        console.error("Export Error:", error);
        showToast("Gagal mengexport Excel.", "error");
    }
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    
    try {
        const XLSX = (window as any).XLSX;
        if (!XLSX) {
            showToast("Library Excel belum dimuat.", "error");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            const newPins: PinLocation[] = [];
            let successCount = 0;

            for (const row of jsonData as any[]) {
                const name = row['Nama Lokasi'] || row['name'] || row['Name'];
                const lat = row['Latitude'] || row['lat'] || row['Lat'];
                const lng = row['Longitude'] || row['lng'] || row['Lng'];

                if (name && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
                     let cat = row['Kategori'] || row['category'];
                     if (!Object.values(LocationCategory).includes(cat)) {
                         cat = LocationCategory.DROP_POINT; // Default
                     }

                     let pStatus = row['Status Kemitraan'] || row['partnershipStatus'] || 'AGENT';
                     if (pStatus !== 'AGENT' && pStatus !== 'MITRA') pStatus = 'AGENT';

                     newPins.push({
                         id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                         name: String(name),
                         category: cat,
                         lat: parseFloat(lat),
                         lng: parseFloat(lng),
                         description: String(row['Deskripsi'] || row['description'] || ''),
                         address: String(row['Alamat'] || row['address'] || ''),
                         phone: String(row['Telepon'] || row['phone'] || ''),
                         ownerName: String(row['Pemilik'] || row['ownerName'] || ''),
                         whatsapp: String(row['WhatsApp'] || row['whatsapp'] || ''),
                         partnershipStatus: pStatus,
                         operatingHours: String(row['Jam Operasional'] || row['operatingHours'] || ''),
                         status: (row['Status'] === 'Tutup' || row['status'] === 'Tutup') ? 'Tutup' : 'Buka',
                         createdAt: new Date().toISOString(),
                         imageUrl: undefined
                     });
                     successCount++;
                }
            }

            if (newPins.length > 0) { 
                await importPins(newPins); 
                await refreshData(); 
                showToast(`Berhasil mengimpor ${successCount} lokasi dari Excel!`); 
            } else { 
                showToast("Tidak ada data valid yang ditemukan dalam file Excel.", "error"); 
            }
        };
        reader.readAsArrayBuffer(file);

    } catch (err) { 
        console.error(err); 
        showToast("Gagal membaca file Excel.", "error"); 
    }
    
    if (excelInputRef.current) excelInputRef.current.value = '';
  };

  const triggerFileInput = () => fileInputRef.current?.click();
  const triggerExcelInput = () => excelInputRef.current?.click();

  const handleEdit = (pin: PinLocation) => {
    setEditingId(pin.id); 
    setEditingCreatedAt(pin.createdAt); 
    setName(pin.name); 
    setCategory(pin.category); 
    setDescription(pin.description); 
    setAddress(pin.address || ''); 
    setImageUrl(pin.imageUrl || ''); 
    setPhone(pin.phone || ''); 
    setOwnerName(pin.ownerName || ''); 
    setWhatsapp(pin.whatsapp || ''); 
    setPartnershipStatus(pin.partnershipStatus || 'AGENT'); 
    setOperatingHours(pin.operatingHours || ''); 
    setStatus(pin.status || 'Buka'); 
    setSelectedCoord({ lat: pin.lat, lng: pin.lng }); 
    setLatInput(pin.lat.toString()); 
    setLngInput(pin.lng.toString());
  };

  const resetForm = () => {
    setEditingId(null); 
    setEditingCreatedAt(null); 
    setName(''); 
    setDescription(''); 
    setAddress(''); 
    setImageUrl(''); 
    setPhone(''); 
    setOwnerName(''); 
    setWhatsapp(''); 
    setPartnershipStatus('AGENT'); 
    setOperatingHours(''); 
    setStatus('Buka'); 
    setSelectedCoord(null); 
    setLatInput(''); 
    setLngInput(''); 
    setCategory(LocationCategory.DROP_POINT); 
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: string[] = [];
    if (!name.trim()) errors.push("• Nama tempat wajib diisi");
    const latNum = parseFloat(latInput); const lngNum = parseFloat(lngInput);
    if (!latInput || !lngInput) errors.push("• Koordinat wajib diisi.");
    else if (isNaN(latNum) || isNaN(lngNum)) errors.push("• Format koordinat salah.");
    else {
      if (latNum < -90 || latNum > 90) errors.push("• Latitude tidak valid.");
      if (lngNum < -180 || lngNum > 180) errors.push("• Longitude tidak valid.");
    }
    if (!description.trim()) errors.push("• Deskripsi wajib diisi.");
    if (errors.length > 0) { showToast("Mohon perbaiki kesalahan:\n" + errors.join("\n"), "error"); return; }
    setIsSaving(true);

    const pinData: PinLocation = { 
        id: editingId || Date.now().toString(), 
        name: name.trim(), 
        category, 
        description: description.trim(), 
        address: address.trim(), 
        phone: phone.trim(), 
        ownerName: ownerName.trim(), 
        whatsapp: whatsapp.trim(), 
        partnershipStatus: partnershipStatus, 
        imageUrl: imageUrl.trim() || undefined, 
        operatingHours: operatingHours.trim(), 
        status, 
        lat: latNum, 
        lng: lngNum, 
        createdAt: editingCreatedAt || new Date().toISOString() 
    };

    try {
      if (editingId) { await updatePin(pinData); showToast("Lokasi berhasil diperbarui!"); }
      else { await addPin(pinData); showToast("Lokasi berhasil ditambahkan!"); }
      await refreshData();
      resetForm();
    } catch (error) { console.error("Save error:", error); showToast("Terjadi kesalahan saat menyimpan data.", "error"); }
    finally { setIsSaving(false); }
  };

  // Single Delete
  const handleDelete = (id: string) => {
    setPinToDelete(id);
    setShowDeleteModal(true);
  };
  
  // Bulk Selection Logic
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        setSelectedIds(tablePins.map(p => p.id));
    } else {
        setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
        setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = () => {
    setPinToDelete(null); // Ensure not single delete mode
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    // Bulk Delete
    if (selectedIds.length > 0 && !pinToDelete) {
        try {
            await Promise.all(selectedIds.map(id => deletePin(id)));
            showToast(`Berhasil menghapus ${selectedIds.length} lokasi.`);
            setSelectedIds([]); // Reset selection
        } catch (error) {
            console.error("Bulk delete error:", error);
            showToast("Gagal menghapus beberapa data.", "error");
        }
    } 
    // Single Delete
    else if (pinToDelete) {
        await deletePin(pinToDelete);
        showToast("Lokasi berhasil dihapus.");
        if (editingId === pinToDelete) resetForm();
    }
    
    await refreshData();
    setPinToDelete(null);
  };

  const confirmLogout = () => {
    onLogout(); 
  }

  const tablePins = pins.filter(p => p.name.toLowerCase().includes(tableSearch.toLowerCase()) || p.address?.toLowerCase().includes(tableSearch.toLowerCase()) || p.category.toLowerCase().includes(tableSearch.toLowerCase()));

  const isAllSelected = tablePins.length > 0 && selectedIds.length === tablePins.length;
  const isBulkDeleteMode = selectedIds.length > 0 && !pinToDelete;

  return (
    <>
      <NotificationToast 
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ ...notification, show: false })}
      />

      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar? Pastikan seluruh data telah disimpan sebelum melanjutkan."
        type="logout"
        confirmText="Ya, Keluar"
        cancelText="Batal"
      />

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title={isBulkDeleteMode ? `Hapus ${selectedIds.length} Lokasi?` : "Hapus Lokasi"}
        message={isBulkDeleteMode 
            ? `Anda yakin ingin menghapus ${selectedIds.length} lokasi yang ditandai? Aksi ini tidak dapat dibatalkan.` 
            : "Anda yakin ingin menghapus lokasi ini secara permanen? Aksi ini tidak dapat dibatalkan."}
        type="danger"
        confirmText="Ya, Hapus"
        cancelText="Batal"
      />

      {isReportsModalOpen && <ReportsModal reports={reports} pins={pins} onVerify={handleVerifyReport} onClose={() => setIsReportsModalOpen(false)} />}
      <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] bg-slate-100 overflow-hidden">
        <div className="w-full md:w-[420px] flex flex-col bg-white h-full border-r border-slate-200 z-20 shadow-xl">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {editingId ? <Edit3 className="w-5 h-5 text-orange-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                {editingId ? 'Edit Data' : 'Tambah Baru'}
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsReportsModalOpen(true)} className="relative text-xs flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 hover:text-indigo-600 transition-colors font-medium" title="Kotak Masuk Laporan">
                  <Inbox className="w-3.5 h-3.5" />
                  {reports.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white">{reports.length}</span>
                  )}
                </button>
                <button onClick={() => setShowLogoutModal(true)} className="text-xs flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 hover:text-red-600 transition-colors font-medium">
                  <LogOut className="w-3.5 h-3.5" /> Keluar
                </button>
              </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className={`p-4 rounded-xl border transition-all ${selectedCoord ? 'bg-indigo-50/50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-200 border-dashed'}`}>
                <div className="flex items-center gap-2 text-sm text-slate-800 font-bold mb-3"><Crosshair className={`w-4 h-4 ${selectedCoord ? 'text-indigo-600' : 'text-slate-400'}`} />Lokasi & Koordinat</div>
                <div className="flex items-center bg-white border border-slate-300 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 overflow-hidden">
                  <div className="flex-1 relative border-r border-slate-200 group focus-within:bg-indigo-50/30 transition-colors"><label className="absolute top-1 left-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider z-10">Latitude</label><input type="number" step="any" value={latInput} onChange={handleLatChange} placeholder="-6.175..." className="w-full px-3 pb-1.5 pt-5 text-xs border-0 focus:ring-0 bg-transparent font-mono text-slate-700 placeholder-slate-300 outline-none relative z-0" /></div>
                  <div className="flex-1 relative group focus-within:bg-indigo-50/30 transition-colors"><label className="absolute top-1 left-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider z-10">Longitude</label><input type="number" step="any" value={lngInput} onChange={handleLngChange} placeholder="106.827..." className="w-full px-3 pb-1.5 pt-5 text-xs border-0 focus:ring-0 bg-transparent font-mono text-slate-700 placeholder-slate-300 outline-none relative z-0" /></div>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 italic">*Klik peta di sebelah kanan untuk mengisi otomatis.</p>
              </div>
              <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2"><LayoutList className="w-4 h-4 text-slate-400" /><h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Info Utama</h3></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Nama Lokasi <span className="text-red-500">*</span></label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-transparent" placeholder="Contoh: Drop Point Sudirman" /></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Kategori</label><select value={category} onChange={(e) => setCategory(e.target.value as LocationCategory)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-white">{Object.values(LocationCategory).map((cat) => (<option key={cat} value={cat}>{cat}</option>))}</select></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Alamat Lengkap</label><textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-transparent" placeholder="Jl. Raya No. 123..." /></div>
              </div>
              <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2"><Clock className="w-4 h-4 text-slate-400" /><h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operasional</h3></div>
                  <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label><select value={status} onChange={(e) => setStatus(e.target.value as OperationStatus)} className={`w-full px-3 py-2 border rounded-lg text-sm font-medium ${status === 'Buka' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}><option value="Buka">BUKA</option><option value="Tutup">TUTUP</option></select></div>
                      <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Jam Kerja</label><input type="text" value={operatingHours} onChange={(e) => setOperatingHours(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-transparent" placeholder="08:00 - 17:00" /></div>
                  </div>
              </div>
              <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2"><User className="w-4 h-4 text-slate-400" /><h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kontak & Pemilik</h3></div>
                  <div><label className="block text-xs font-medium text-slate-600 mb-1.5">Nama Pemilik</label><input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-transparent" placeholder="Nama Lengkap" /></div>
                  <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-xs font-medium text-slate-600 mb-1.5">No. Telepon</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-transparent" placeholder="021-xxxx" /></div>
                      <div><label className="block text-xs font-medium text-slate-600 mb-1.5">WhatsApp</label><input type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-transparent" placeholder="0812xxxx" /></div>
                  </div>
                   <div>
                       <label className="block text-xs font-medium text-slate-600 mb-1.5">Status Kemitraan</label>
                       <select value={partnershipStatus} onChange={(e) => setPartnershipStatus(e.target.value as 'AGENT' | 'MITRA')} className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold ${partnershipStatus === 'AGENT' ? 'text-cyan-700 bg-cyan-50' : 'text-amber-700 bg-amber-50'}`}>
                           <option value="AGENT">AGENT</option>
                           <option value="MITRA">MITRA</option>
                       </select>
                   </div>
              </div>
              <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2"><ImageIcon className="w-4 h-4 text-slate-400" /><h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Media & Deskripsi</h3></div>
                   {imageUrl && (<div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 group bg-slate-50"><img src={imageUrl} alt="Preview" className="w-full h-full object-cover" /><button type="button" onClick={() => setImageUrl('')} className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-lg opacity-90 hover:opacity-100 transition shadow-lg"><X className="w-4 h-4" /></button></div>)}
                  <div className="flex gap-2"><div className="relative flex-1"><input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full pl-3 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-transparent" placeholder="URL Gambar..." /></div><input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} /><button type="button" onClick={triggerFileInput} className="flex items-center justify-center w-10 h-10 bg-slate-100 text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-200 transition-colors" title="Upload dari Komputer"><Upload className="w-4 h-4" /></button></div>
                  <div><div className="flex justify-between items-center mb-1.5"><label className="block text-xs font-medium text-slate-600">Deskripsi</label><button type="button" onClick={handleGenerateDescription} disabled={isGenerating || !name} className="text-[10px] flex items-center gap-1 text-indigo-600 hover:text-indigo-800 disabled:opacity-50 font-bold bg-indigo-50 px-2 py-0.5 rounded-full transition-colors">{isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}GENERATE AI</button></div><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm bg-transparent" placeholder="Tulis deskripsi singkat..." /></div>
              </div>
              <div className="sticky bottom-0 pt-4 pb-0 bg-white border-t border-slate-100 flex gap-3">
                  {editingId && (<button type="button" onClick={resetForm} className="flex-1 py-2.5 px-4 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">BATAL</button>)}
                  <button type="submit" disabled={isSaving} className="flex-1 py-2.5 px-4 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-md shadow-indigo-200 transition-all flex justify-center items-center gap-2">{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{editingId ? 'UPDATE LOKASI' : 'SIMPAN LOKASI'}</button>
              </div>
            </form>
          </div>
        </div>
        <div className="flex-1 flex flex-col h-full relative">
          <div className="h-[55%] relative w-full border-b border-slate-200">
             <MapView pins={pins} onMapClick={handleMapClick} selectedLocation={selectedCoord} focusLocation={selectedCoord} />
             <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
                <div className="bg-white/90 backdrop-blur rounded-lg shadow-lg border border-slate-200 p-2 flex flex-col gap-2">
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">Import / Export</div>
                   <div className="flex gap-2">
                      <button onClick={triggerExcelInput} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors shadow-sm"><FileSpreadsheet className="w-3.5 h-3.5" />Import Excel</button>
                      <input type="file" ref={excelInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleExcelImport} />
                      <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-bold transition-colors shadow-sm"><Download className="w-3.5 h-3.5" />Export Excel</button>
                   </div>
                </div>
             </div>
          </div>
          <div className="flex-1 bg-slate-50 flex flex-col min-h-0">
             <div className="px-5 py-3 bg-white border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <LayoutList className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-800">
                        {selectedIds.length > 0 ? (
                            <span className="text-indigo-600">{selectedIds.length} Dipilih</span>
                        ) : (
                            `Daftar Lokasi (${pins.length})`
                        )}
                    </h3>
                </div>
                <div className="flex items-center gap-3">
                    {selectedIds.length > 0 && (
                        <button 
                            onClick={handleBulkDelete}
                            className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-md text-xs font-bold hover:bg-rose-100 transition-colors animate-fade-in-up"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus ({selectedIds.length})
                        </button>
                    )}
                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input type="text" placeholder="Cari lokasi..." value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white" />
                    </div>
                </div>
             </div>
             <div className="flex-1 overflow-auto">
                <table className="w-full text-left border-collapse">
                   <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                       <tr>
                           <th className="px-5 py-3 border-b border-slate-200 w-10">
                               <div className="flex items-center justify-center">
                                    <input 
                                        type="checkbox" 
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500"
                                    />
                               </div>
                           </th>
                           <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">No</th>
                           <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Nama Lokasi</th>
                           <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Kategori</th>
                           <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Alamat</th>
                           <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">Status Kemitraan</th>
                           <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Aksi</th>
                       </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-slate-100">
                      {tablePins.length === 0 ? (<tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400 text-sm italic">Tidak ada data lokasi yang ditemukan.</td></tr>) : (
                         tablePins.map((pin, index) => (
                            <tr key={pin.id} className={`hover:bg-slate-50 transition-colors group ${editingId === pin.id ? 'bg-indigo-50/60' : ''} ${selectedIds.includes(pin.id) ? 'bg-indigo-50/30' : ''}`}>
                               <td className="px-5 py-3 w-10">
                                   <div className="flex items-center justify-center">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(pin.id)}
                                            onChange={() => handleSelectRow(pin.id)}
                                            className="w-4 h-4 text-indigo-600 bg-white border-slate-300 rounded focus:ring-indigo-500"
                                        />
                                   </div>
                               </td>
                               <td className="px-5 py-3 text-xs text-slate-500 w-12">{index + 1}</td>
                               <td className="px-5 py-3"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg bg-slate-100 border border-slate-200`}>{CATEGORY_ICONS[pin.category]}</div><div><div className="text-xs font-bold text-slate-700">{pin.name}</div><div className="text-[10px] text-slate-400 font-mono">{pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</div></div></div></td>
                               <td className="px-5 py-3"><span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">{pin.category}</span></td>
                               <td className="px-5 py-3"><div className="max-w-xs text-xs text-slate-600 truncate" title={pin.address}>{pin.address || '-'}</div></td>
                               <td className="px-5 py-3">
                                   <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${pin.partnershipStatus === 'MITRA' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-cyan-50 text-cyan-600 border-cyan-200'}`}>
                                       {pin.partnershipStatus || 'AGENT'}
                                   </span>
                               </td>
                               <td className="px-5 py-3 text-right"><div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEdit(pin)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button><button onClick={() => handleDelete(pin.id)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button></div></td>
                            </tr>
                         ))
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
