import { PinLocation, LocationCategory, LocationReport } from '../types';
import { supabase } from '../lib/supabaseClient'; // Import Supabase client

// --- PINS CRUD ---

export const getPins = async (): Promise<PinLocation[]> => {
  try {
    const { data, error } = await supabase.from('locations').select('*');
    if (error) throw error;
    // Sort by createdAt descending
    return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error: any) {
    console.error("Failed to load pins from Supabase", error.message);
    return [];
  }
};

export const addPin = async (pin: PinLocation): Promise<void> => {
  try {
    const { error } = await supabase.from('locations').insert([pin]);
    if (error) throw error;
  } catch (error: any) {
    console.error("Failed to add pin to Supabase", error.message);
    alert(`Gagal menambahkan lokasi: ${error.message}`);
  }
};

export const importPins = async (newPins: PinLocation[]): Promise<void> => {
  try {
    const { error } = await supabase.from('locations').insert(newPins);
    if (error) throw error;
  } catch (error: any) {
    console.error("Failed to import pins to Supabase", error.message);
    alert(`Gagal mengimpor lokasi: ${error.message}`);
  }
};

export const updatePin = async (updatedPin: PinLocation): Promise<void> => {
  try {
    const { error } = await supabase.from('locations').update(updatedPin).eq('id', updatedPin.id);
    if (error) throw error;
  } catch (error: any) {
    console.error("Failed to update pin in Supabase", error.message);
    alert(`Gagal memperbarui lokasi: ${error.message}`);
  }
};

export const deletePin = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from('locations').delete().eq('id', id);
    if (error) throw error;
  } catch (error: any) {
    console.error("Failed to delete pin from Supabase", error.message);
    alert(`Gagal menghapus lokasi: ${error.message}`);
  }
};

// --- REPORTS CRUD ---

export const getReports = async (): Promise<LocationReport[]> => {
  try {
    const { data, error } = await supabase.from('reports').select('*');
    if (error) throw error;
    return data.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
  } catch (error: any) {
    console.error("Failed to load reports from Supabase", error.message);
    return [];
  }
};

export const addReport = async (report: LocationReport): Promise<void> => {
  try {
    const { error } = await supabase.from('reports').insert([report]);
    if (error) throw error;
  } catch (error: any) {
    console.error("Failed to add report to Supabase", error.message);
    alert(`Gagal mengirim laporan: ${error.message}`);
  }
};

export const deleteReport = async (reportId: string): Promise<void> => {
  try {
    const { error } = await supabase.from('reports').delete().eq('report_id', reportId);
    if (error) throw error;
  } catch (error: any) {
    console.error("Failed to delete report from Supabase", error.message);
    alert(`Gagal menghapus laporan: ${error.message}`);
  }
};

// --- IMAGE UPLOAD ---
export const uploadImage = async (file: File): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `public/${fileName}`; // Path inside the 'location-images' bucket

    const { error: uploadError } = await supabase.storage
      .from('location-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('location-images')
      .getPublicUrl(filePath);
    
    return data.publicUrl;

  } catch (error: any) {
    console.error("Failed to upload image to Supabase Storage:", error.message);
    alert(`Gagal mengunggah gambar: ${error.message}`);
    return null;
  }
};