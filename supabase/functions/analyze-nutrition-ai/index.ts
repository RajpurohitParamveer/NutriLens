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

function cleanJson(content: string): string {
  let cleaned = content.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return cleaned.trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    if (!imageBase64) throw new Error("No image provided");

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const dataUrl = imageBase64.startsWith("data:")
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;

    const systemPrompt = `You are an expert nutritionist AI that analyzes nutrition labels from food products.
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

Always respond with valid JSON matching this exact structure.`;

    const userPrompt = `Analyze this nutrition label image and extract all nutritional information. Return a JSON object with this exact structure:
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

If any value is not visible or unclear, use 0 for numbers and empty string for text. Always return valid JSON only, no markdown.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 1500,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Lovable AI gateway error:", resp.status, text);
      if (resp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a minute." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (resp.status === 402) {
        return new Response(
          JSON.stringify({
            error:
              "AI credits required. Please add Lovable AI credits in Workspace → Usage.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      return new Response(JSON.stringify({ error: "AI request failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await resp.json();
    const content = payload.choices?.[0]?.message?.content as string | undefined;
    if (!content) throw new Error("No response from AI");

    let analysis: NutritionAnalysis;
    try {
      analysis = JSON.parse(cleanJson(content));
    } catch (e) {
      console.error("Failed to parse AI response:", e, content);
      throw new Error("Failed to parse nutrition analysis");
    }

    const validated: NutritionAnalysis = {
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

    return new Response(JSON.stringify(validated), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-nutrition-ai function:", error);
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
