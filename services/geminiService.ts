import { GoogleGenAI } from "@google/genai";
import { MarketData, AnalysisResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We cannot use JSON schema with Google Search tool, so we rely on prompt engineering and regex parsing.
export const fetchLivePrices = async (): Promise<MarketData | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Find the current live spot price of Gold (XAU) and Silver (XAG) per ounce in USD. Return the output strictly in this format: 'Gold: <price_number>, Silver: <price_number>'. Do not include any other text or currency symbols like $.",
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // Low temperature for consistent formatting
      },
    });

    const text = response.text || "";
    
    // Regex to extract numbers, handling potential commas in numbers (e.g., 2,500.00)
    // Matches "Gold: 2500.50, Silver: 29.10"
    const goldMatch = text.match(/Gold:\s*([\d,.]+)/i);
    const silverMatch = text.match(/Silver:\s*([\d,.]+)/i);

    if (goldMatch && silverMatch) {
      // Remove commas before parsing float
      const goldPrice = parseFloat(goldMatch[1].replace(/,/g, ''));
      const silverPrice = parseFloat(silverMatch[1].replace(/,/g, ''));

      if (!isNaN(goldPrice) && !isNaN(silverPrice) && silverPrice !== 0) {
        return {
          timestamp: Date.now(),
          goldPrice,
          silverPrice,
          ratio: goldPrice / silverPrice,
        };
      }
    }
    
    console.warn("Failed to parse market data from Gemini response:", text);
    return null;

  } catch (error) {
    console.error("Error fetching market data:", error);
    return null;
  }
};

export const fetchMarketAnalysis = async (ratio: number): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `The current Gold/Silver ratio is ${ratio.toFixed(2)}. Briefly analyze what this level implies historically (e.g., is silver undervalued relative to gold?). Keep it under 100 words. Search for "current historical context gold silver ratio".`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "No analysis available.";
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
      ?.map((chunk: any) => chunk.web)
      .filter((web: any) => web && web.uri && web.title) || [];

    return {
      text,
      sources,
    };
  } catch (error) {
    console.error("Error fetching analysis:", error);
    return { text: "Analysis currently unavailable.", sources: [] };
  }
};
