
import { GoogleGenAI, Type } from "@google/genai";
import { PwaMetadata } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzePwaUrl = async (url: string): Promise<PwaMetadata> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this PWA URL: ${url}. 
    Based on standard web practices for this specific site, generate metadata for a TWA (Trusted Web Activity) Android application. 
    Provide a realistic package name based on the domain.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          shortName: { type: Type.STRING },
          description: { type: Type.STRING },
          themeColor: { type: Type.STRING },
          backgroundColor: { type: Type.STRING },
          display: { type: Type.STRING },
          orientation: { type: Type.STRING },
          version: { type: Type.STRING },
          packageName: { type: Type.STRING },
        },
        required: ["name", "shortName", "description", "themeColor", "backgroundColor", "display", "orientation", "version", "packageName"],
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateBuildLogs = async (metadata: PwaMetadata): Promise<string[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate 15 realistic Android build log lines for a PWA to APK conversion project named ${metadata.name} (Package: ${metadata.packageName}). 
    Include steps like 'Checking JDK', 'Initializing Gradle', 'Merging manifests', 'Compiling resources', 'Generating signing key', and 'Zipaligning APK'.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });

  return JSON.parse(response.text);
};
