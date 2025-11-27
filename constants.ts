
import { LocationCategory } from './types';

// Default center (Sumatera Utara - Area Medan)
// Koordinat Medan: 3.5952, 98.6722
export const DEFAULT_CENTER: [number, number] = [3.5952, 98.6722];
// Zoom level disesuaikan ke 9 agar terlihat area provinsi, bukan hanya jalan kota
export const DEFAULT_ZOOM = 9;

export const CATEGORY_COLORS: Record<LocationCategory, string> = {
  [LocationCategory.DROP_POINT]: 'bg-blue-600',
  [LocationCategory.TRANSIT_CENTER]: 'bg-orange-500',
  [LocationCategory.GATEWAY]: 'bg-purple-600',
};

export const CATEGORY_ICONS: Record<LocationCategory, string> = {
  [LocationCategory.DROP_POINT]: '📍',
  [LocationCategory.TRANSIT_CENTER]: '🏢',
  [LocationCategory.GATEWAY]: '🌐',
};
