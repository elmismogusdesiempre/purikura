import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GeminiModel } from "../types";

// Helper to init AI. strict usage of process.env.API_KEY
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Fast text generation using Gemini 2.5 Flash Lite (Low latency)
 * This is the only AI feature kept to ensure minimal API usage.
 */
export const getFastCaption = async (imageB64: string): Promise<string> => {
  const ai = getAI();
  const prompt = "Escribe una frase muy corta, divertida y eufórica sobre esta foto de fiesta. Máximo 10 palabras.";
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GeminiModel.FLASH_LITE,
      contents: {
        parts: [
            { inlineData: { mimeType: 'image/png', data: imageB64 } },
            { text: prompt }
        ]
      },
    });
    return response.text || "¡Fiesta increíble!";
  } catch (error) {
    console.error("Error generating caption:", error);
    return "¡Foto genial!";
  }
};

/**
 * Transforms an image using Gemini Image model based on a prompt.
 * Used for applying themes/filters to the photo strip.
 */
export const transformImage = async (imageB64: string, stylePrompt: string): Promise<string | null> => {
  if (!stylePrompt) return null;
  
  const ai = getAI();
  // Using Flash Image for image editing/generation as per guidelines
  const model = GeminiModel.FLASH_IMAGE; 
  
  const prompt = `Apply the following artistic style to this image: ${stylePrompt}. Return the transformed image.`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: imageB64 } },
          { text: prompt }
        ]
      },
    });

    // Iterate through parts to find the image part
    if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                const mimeType = part.inlineData.mimeType || 'image/png';
                return `data:${mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    
    return null;
  } catch (error) {
    console.error("Error transforming image:", error);
    return null;
  }
};