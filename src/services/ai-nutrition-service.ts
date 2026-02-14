/**
 * AI Nutrition Analysis Service
 * Uses Lovable AI Gateway (Gemini models) via Supabase Edge Function for nutrition label analysis
 */

import { supabase, supabaseClient } from "@/integrations/supabase/client";

export interface AIAnalysisResult {
  productName: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  saturatedFat: number;
  transFat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number;
  healthScore: number;
  healthRating: "healthy" | "moderate" | "unhealthy";
  insights: string[];
  warnings: string[];
  rawOcrText: string;
  responseLanguage?: string; // Track what language the AI responded in
  localizedRecommendations?: string[]; // Language-specific recommendations
}

/**
 * Analyze a nutrition label image using AI
 */
export async function analyzeNutritionWithAI(
  imageDataUrl: string,
  language?: string
): Promise<AIAnalysisResult> {
  console.log("Sending image to AI for analysis...", { language });

  // Language-specific prompts for better AI responses
  const languagePrompts = {
    'en': 'Please respond in English.',
    'hi': 'कृपया हिंदी में उत्तर दें। सभी सुझाव, चेतावनी और अंतर्दृष्टि हिंदी में प्रदान करें।'
  };

  const selectedLanguage = language || 'en';
  const languagePrompt = languagePrompts[selectedLanguage as keyof typeof languagePrompts] || languagePrompts.en;

  const client = supabase || supabaseClient;
  const { data, error } = await client.functions.invoke("analyze-nutrition-ai", {
    body: { 
      imageBase64: imageDataUrl,
      language: selectedLanguage,
      languagePrompt: languagePrompt,
      responseLanguage: selectedLanguage // Explicitly tell AI what language to respond in
    },
  });

  if (error) {
    console.error("Edge function error:", error);
    // supabase-js attaches response body under error.context.body for non-2xx
    const body = (error as unknown as { context?: { body?: unknown } })?.context?.body;
    if (typeof body === "string") {
      try {
        const parsed = JSON.parse(body) as { error?: string };
        if (parsed?.error) throw new Error(parsed.error);
      } catch {
        // ignore parse failure; fall back to generic message
      }
    }
    throw new Error(error.message || "Failed to analyze nutrition label");
  }

  if (data?.error) {
    console.error("Analysis error:", data.error);
    throw new Error(data.error);
  }

  console.log("AI analysis complete:", data);
  return data as AIAnalysisResult;
}

/**
 * Save scan result to database
 */
export async function saveScanToDatabase(
  userId: string,
  analysis: AIAnalysisResult,
  imageUrl?: string
): Promise<string> {
  const client = supabase || supabaseClient;
  const { data, error } = await client
    .from("scans")
    .insert({
      user_id: userId,
      product_name: analysis.productName,
      calories: analysis.calories,
      protein: analysis.protein,
      carbohydrates: analysis.carbohydrates,
      fat: analysis.fat,
      fiber: analysis.fiber,
      sugar: analysis.sugar,
      sodium: analysis.sodium,
      health_score: analysis.healthScore,
      health_rating: analysis.healthRating,
      raw_ocr_text: analysis.rawOcrText,
      image_url: imageUrl,
      ai_analysis: {
        servingSize: analysis.servingSize,
        saturatedFat: analysis.saturatedFat,
        transFat: analysis.transFat,
        cholesterol: analysis.cholesterol,
        insights: analysis.insights,
        warnings: analysis.warnings,
      },
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error saving scan:", error);
    throw new Error("Failed to save scan result");
  }

  return data.id;
}
