import OpenAI from 'openai';
import { GoogleGenAI, Type } from '@google/genai';

export interface ScamAnalysisResult {
  trustScore: number;
  redFlags: string[];
  greenFlags: string[];
  idType?: string;
  reasoning?: string;
}

export const analyzeQuery = async (idType: string, language: string = 'English', frontImageBase64?: string, backImageBase64?: string): Promise<ScamAnalysisResult> => {
  const selectedApi = localStorage.getItem('selected_ai_api') || 'gemini';

  const systemInstruction = `You are "Ali", an elite AI fraud detection expert for the Philippines. You are powered by advanced vision capabilities. Your primary role is to determine the exact legitimacy of an ID by performing deep, pixel-level visual analysis.

Analyze the provided ID images for signs of forgery, digital tampering, or physical alterations. If both front and back of an ID are provided, cross-reference them for consistency (e.g., barcodes, holograms, matching info).

Rigorously verify that the ID matches the official format for the claimed ID type (e.g., PhilHealth ID, Driver's License, UMID). Check for exact logo placements, correct identification number formats, and the presence of required member photos and signatures.

Leverage your advanced vision capabilities to detect and analyze the following:
1. Visual Anomalies: Look for digital splicing, inconsistent lighting/shadows on the face vs. the card, edge tampering around the photo, and pixelation artifacts that suggest photoshopping.
2. Hologram Analysis: Examine the reflectivity, depth, and placement of holograms (e.g., photopolymer or embossed). Fake holograms often appear flat, printed, or lack the correct color-shifting properties.
3. Microprint Clarity: Evaluate the crispness of microprinting and fine lines. Counterfeit IDs often suffer from ink bleeding, blurry micro-text, or dot-matrix printing patterns visible under high resolution.
4. Typography & Layout: Detect font mismatches, incorrect kerning, inconsistent weight, or misaligned data fields compared to official templates.

Provide a "Trust Score" (1-10, where 1 means lowest trust/highly likely fake, and 10 means highest trust/legit), a brief list of "Red Flags" or "Green Flags", and the detected "ID Type".

Crucially, provide detailed "Reasoning" explaining exactly what visual evidence led to your conclusion based on the advanced vision checks above.

IMPORTANT: You MUST provide the "Red Flags", "Green Flags", and "Reasoning" in ${language || 'English'}. The "idType" should remain in English.`;

  if (selectedApi === 'openai') {
    const apiKey = localStorage.getItem('openai_api_key') || import.meta.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OpenAI API Key is missing. Please add it in the Settings panel.");
    }

    const openai = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true
    });

    const content: any[] = [];
    
    if (idType) {
      content.push({ type: "text", text: `The user claims this ID is a: ${idType}. Please verify if the uploaded image matches this ID type and check for authenticity.` });
    } else {
      content.push({ type: "text", text: `Analyze the provided ID image(s) for authenticity and potential scam flags.` });
    }

    if (frontImageBase64) {
      const url = frontImageBase64.startsWith('data:') ? frontImageBase64 : `data:image/jpeg;base64,${frontImageBase64}`;
      content.push({
        type: "image_url",
        image_url: { url }
      });
    }

    if (backImageBase64) {
      const url = backImageBase64.startsWith('data:') ? backImageBase64 : `data:image/jpeg;base64,${backImageBase64}`;
      content.push({
        type: "image_url",
        image_url: { url }
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemInstruction + `\n\nYou must respond in JSON format matching this schema:\n{\n  "trustScore": number,\n  "redFlags": string[],\n  "greenFlags": string[],\n  "idType": string,\n  "reasoning": string\n}` },
        { role: "user", content }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
    });

    const resultText = response.choices[0].message.content;
    if (!resultText) {
      throw new Error("No response from OpenAI");
    }

    return JSON.parse(resultText) as ScamAnalysisResult;
  } else {
    // Gemini fallback
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const parts: any[] = [];
    
    if (idType) {
      parts.push({ text: `The user claims this ID is a: ${idType}. Please verify if the uploaded image matches this ID type and check for authenticity.` });
    } else {
      parts.push({ text: `Analyze the provided ID image(s) for authenticity and potential scam flags.` });
    }

    if (frontImageBase64) {
      const base64Data = frontImageBase64.includes(',') ? frontImageBase64.split(',')[1] : frontImageBase64;
      const mimeType = frontImageBase64.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    if (backImageBase64) {
      const base64Data = backImageBase64.includes(',') ? backImageBase64.split(',')[1] : backImageBase64;
      const mimeType = backImageBase64.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trustScore: { type: Type.NUMBER, description: "1-10 score" },
            redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
            greenFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
            idType: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          },
          required: ["trustScore", "redFlags", "greenFlags", "idType", "reasoning"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from Gemini");
    }

    return JSON.parse(response.text) as ScamAnalysisResult;
  }
};
