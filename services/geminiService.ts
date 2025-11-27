import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generatePlaceDescription = async (placeName: string, category: string): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `Buatkan deskripsi singkat, menarik, dan informatif (maksimal 2 kalimat) untuk lokasi "${placeName}" yang berkategori "${category}" di Indonesia. Bahasa Indonesia yang santai tapi profesional.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || "Deskripsi tidak tersedia.";
  } catch (error) {
    console.error("Error generating description:", error);
    return "Gagal membuat deskripsi otomatis. Silakan isi manual.";
  }
};