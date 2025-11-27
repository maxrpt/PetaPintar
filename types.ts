
export enum LocationCategory {
  DROP_POINT = 'Drop Point',
  TRANSIT_CENTER = 'Transit Center',
  GATEWAY = 'Gateway'
}

export type OperationStatus = 'Buka' | 'Tutup';

export interface PinLocation {
  id: string;
  name: string;
  description: string;
  category: LocationCategory;
  lat: number;
  lng: number;
  imageUrl?: string;
  address?: string;
  phone?: string; // Digunakan sebagai No HP/Telepon utama
  ownerName?: string;
  email?: string;
  whatsapp?: string;
  operatingHours?: string;
  status?: OperationStatus;
  createdAt: string; // Changed from number to string for Supabase timestamp
}

export interface MapClickEvent {
  latlng: {
    lat: number;
    lng: number;
  };
}

// Interface baru untuk Laporan Perubahan Data
export interface LocationReport {
  reportId: string;
  pinId: string;
  pinName: string; // Nama pin saat laporan dibuat, untuk kemudahan display
  changes: Record<string, any>; // Changed from Partial<PinLocation> to Record<string, any> for JSONB flexibility
  reportedAt: string; // Changed from number to string for Supabase timestamp
}