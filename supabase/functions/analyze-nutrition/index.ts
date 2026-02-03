import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NutritionAnalysis {
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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      throw new Error("No image provided");
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    console.log("Analyzing nutrition label with Google Gemini...");

    // Extract base64 data (remove data URL prefix if present)
    const base64Data = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    // Call Google Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an expert nutritionist AI that analyzes nutrition labels from food products. 
Your task is to:
1. Extract all nutritional information from the image
2. Identify the product name if visible
3. Calculate a health score from 0-100 based on the nutritional content
4. Provide health insights and warnings

Health Score Guidelines:
- Start at 50 points
- Deduct points for: high calories (>400: -10), saturated fat (>5g: -15), trans fat (any: -20), sodium (>600mg: -15), sugar (>15g: -15), added sugars (>10g: -15)
- Add points for: fiber (>5g: +15, >3g: +8), protein (>15g: +10, >8g: +5), low sugar (<3g: +5), low sodium (<150mg: +5)

Health Rating:
- 65-100: "healthy"
- 40-64: "moderate"  
- 0-39: "unhealthy"

Analyze this nutrition label image and extract all nutritional information. Return a JSON object with this exact structure (no markdown, just raw JSON):
{
  "productName": "Product name if visible, otherwise 'Unknown Product'",
  "servingSize": "serving size as shown",
  "calories": number,
  "protein": number in grams,
  "carbohydrates": number in grams,
  "fat": number in grams,
  "saturatedFat": number in grams,
  "transFat": number in grams,
  "fiber": number in grams,
  "sugar": number in grams,
  "sodium": number in milligrams,
  "cholesterol": number in milligrams,
  "healthScore": calculated score 0-100,
  "healthRating": "healthy" or "moderate" or "unhealthy",
  "insights": ["array of positive health insights"],
  "warnings": ["array of health warnings or concerns"],
  "rawOcrText": "extracted text from the label"
}

If any value is not visible or unclear, use 0 for numbers and empty string for text. Always return valid JSON only, no markdown.`,
                },
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("No response from Gemini");
    }

    console.log("Raw Gemini response:", content);

    // Parse the JSON response
    let analysis: NutritionAnalysis;
    try {
      // Clean the response - remove markdown code blocks if present
      let cleanedContent = content.trim();
      if (cleanedContent.startsWith("```json")) {
        cleanedContent = cleanedContent.slice(7);
      }
      if (cleanedContent.startsWith("```")) {
        cleanedContent = cleanedContent.slice(3);
      }
      if (cleanedContent.endsWith("```")) {
        cleanedContent = cleanedContent.slice(0, -3);
      }
      cleanedContent = cleanedContent.trim();

      analysis = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError, content);
      throw new Error("Failed to parse nutrition analysis");
    }

    // Validate and ensure all required fields exist
    const validatedAnalysis: NutritionAnalysis = {
      productName: analysis.productName || "Unknown Product",
      servingSize: analysis.servingSize || "1 serving",
      calories: Number(analysis.calories) || 0,
      protein: Number(analysis.protein) || 0,
      carbohydrates: Number(analysis.carbohydrates) || 0,
      fat: Number(analysis.fat) || 0,
      saturatedFat: Number(analysis.saturatedFat) || 0,
      transFat: Number(analysis.transFat) || 0,
      fiber: Number(analysis.fiber) || 0,
      sugar: Number(analysis.sugar) || 0,
      sodium: Number(analysis.sodium) || 0,
      cholesterol: Number(analysis.cholesterol) || 0,
      healthScore: Math.max(0, Math.min(100, Number(analysis.healthScore) || 50)),
      healthRating: analysis.healthRating || "moderate",
      insights: Array.isArray(analysis.insights) ? analysis.insights : [],
      warnings: Array.isArray(analysis.warnings) ? analysis.warnings : [],
      rawOcrText: analysis.rawOcrText || "",
    };

    console.log("Analysis complete:", validatedAnalysis.productName, "Score:", validatedAnalysis.healthScore);

    return new Response(JSON.stringify(validatedAnalysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-nutrition function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});