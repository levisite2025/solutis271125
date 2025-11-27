import { GoogleGenAI, Type } from "@google/genai";
import { SportsMatch } from "../types";

// Note: In a real production app, you would fetch these via a backend proxy to hide the key.
// Since this is a client-side demo, we assume the environment variable is present or we handle the error gracefully.

const apiKey = process.env.API_KEY || '';

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface NewsItem {
  source: string;
  headline: string;
  category: string;
}

export interface WeatherInfo {
  city: string;
  temp: number;
  condition: string;
  forecast: string;
}

export const fetchSimulatedNews = async (): Promise<NewsItem[]> => {
  if (!ai) {
    // Fallback if no API key
    return [
      { source: 'Sistema', headline: 'Configure sua chave API para notícias reais.', category: 'Aviso' },
      { source: 'Demo', headline: 'O sistema de mídia indoor mais completo do mercado.', category: 'Marketing' }
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Gere 5 manchetes de notícias fictícias mas realistas para o Brasil (estilo G1, UOL, Economia, Esporte). Retorne apenas JSON.',
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              source: { type: Type.STRING },
              headline: { type: Type.STRING },
              category: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as NewsItem[];
    }
    return [];
  } catch (error) {
    console.error("Gemini News Error:", error);
    return [{ source: 'Erro', headline: 'Não foi possível atualizar as notícias.', category: 'Sistema' }];
  }
};

export const fetchSimulatedWeather = async (city: string): Promise<WeatherInfo | null> => {
  if (!ai) return { city, temp: 25, condition: 'Ensolarado (Demo)', forecast: 'Dia claro' };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Gere dados fictícios de clima atual para a cidade de ${city}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            city: { type: Type.STRING },
            temp: { type: Type.NUMBER },
            condition: { type: Type.STRING },
            forecast: { type: Type.STRING }
          }
        }
      }
    });
    
    const text = response.text;
    if(text) return JSON.parse(text) as WeatherInfo;
    return null;
  } catch (error) {
    console.error("Gemini Weather Error:", error);
    return null;
  }
};

export const fetchSimulatedSports = async (): Promise<SportsMatch[]> => {
  if (!ai) {
    return [
       { homeTeam: 'Flamengo', awayTeam: 'Vasco', homeScore: 2, awayScore: 1, status: 'LIVE', league: 'Brasileirão' },
       { homeTeam: 'São Paulo', awayTeam: 'Palmeiras', homeScore: 0, awayScore: 0, status: 'FINISHED', league: 'Brasileirão' },
       { homeTeam: 'Grêmio', awayTeam: 'Inter', homeScore: 1, awayScore: 1, status: 'LIVE', league: 'Brasileirão' },
       { homeTeam: 'Santos', awayTeam: 'Bahia', homeScore: 3, awayScore: 0, status: 'FINISHED', league: 'Brasileirão' }
    ];
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Gere 4 resultados de jogos de futebol fictícios do Brasileirão Série A. Status deve ser LIVE, FINISHED ou SCHEDULED. Retorne apenas JSON.',
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              homeTeam: { type: Type.STRING },
              awayTeam: { type: Type.STRING },
              homeScore: { type: Type.INTEGER },
              awayScore: { type: Type.INTEGER },
              status: { type: Type.STRING },
              league: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as SportsMatch[];
    }
    return [];
  } catch (error) {
    console.error("Gemini Sports Error:", error);
    return [];
  }
};