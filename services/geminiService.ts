
import { GoogleGenAI, Type } from "@google/genai";
import { PwaMetadata } from "../types";

// Helper to get domain name as fallback
const getDomainName = (url: string) => {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace('www.', '').split('.')[0];
  } catch {
    return 'app';
  }
};

// Sanitize package name to be Android-compatible
// Package names can only contain lowercase letters, numbers, and underscores
const sanitizePackageName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_') // Replace invalid chars with underscore
    .replace(/_{2,}/g, '_')      // Replace multiple underscores with single
    .replace(/^_|_$/g, '');       // Remove leading/trailing underscores
};

const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (e) {
    console.warn("Failed to initialize Google GenAI", e);
  }
}

export const analyzePwaUrl = async (url: string): Promise<PwaMetadata> => {
  if (!ai) {
    console.warn("Gemini API Key missing. Using fallback metadata.");
    const domain = getDomainName(url);
    const sanitizedDomain = sanitizePackageName(domain);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 1500));

    return {
      name: domain.charAt(0).toUpperCase() + domain.slice(1) + " App",
      shortName: domain,
      description: `Native Android application for ${url}`,
      themeColor: "#4f46e5",
      backgroundColor: "#ffffff",
      display: "standalone",
      orientation: "portrait",
      version: "1.0.0",
      packageName: `com.${sanitizedDomain}.app`
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", // Updated to latest stable flash model
      contents: `Analyze this PWA URL: ${url}.
        Based on standard web practices for this specific site, generate metadata for a TWA (Trusted Web Activity) Android application.
        IMPORTANT: The packageName must be a valid Android package name (only lowercase letters, numbers, and underscores - NO hyphens or special characters).
        Provide a realistic package name based on the domain, replacing any hyphens or special characters with underscores.`,
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

    const result = JSON.parse(response.text() || "{}");
    // Sanitize the package name from Gemini to ensure it's valid
    if (result.packageName) {
      result.packageName = sanitizePackageName(result.packageName);
    }
    return result;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback on error too
    const domain = getDomainName(url);
    const sanitizedDomain = sanitizePackageName(domain);
    return {
      name: domain.charAt(0).toUpperCase() + domain.slice(1) + " App",
      shortName: domain,
      description: `Native Android application for ${url}`,
      themeColor: "#4f46e5",
      backgroundColor: "#ffffff",
      display: "standalone",
      orientation: "portrait",
      version: "1.0.0",
      packageName: `com.${sanitizedDomain}.app`
    };
  }
};

export const generateBuildLogs = async (metadata: PwaMetadata): Promise<string[]> => {
  // We don't really use this anymore as we switched to GitHub Actions real logs
  // But keeping it for backward compat or preview simulations
  return [
    "Initializing Gradle...",
    "Resolving dependencies...",
    "Compiling resources...",
    "Linking assets...",
    "Signing package...",
    "Build complete."
  ];
};
