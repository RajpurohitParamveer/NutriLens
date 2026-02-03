/**
 * OCR Service for NutriLens
 * Handles text extraction from nutrition label images
 */

import { preprocessForOCR } from "./image-processing";

export interface OCRResult {
  text: string;
  confidence: number;
  success: boolean;
  error?: string;
}

export interface NutritionData {
  servingSize?: string;
  calories?: number;
  totalFat?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  sodium?: number;
  totalCarbohydrates?: number;
  dietaryFiber?: number;
  sugars?: number;
  addedSugars?: number;
  protein?: number;
  vitaminD?: number;
  calcium?: number;
  iron?: number;
  potassium?: number;
  rawText?: string;
}

/**
 * Parse extracted text to find nutrition information
 * This uses pattern matching to find common nutrition label formats
 */
export function parseNutritionText(text: string): NutritionData {
  const normalizedText = text.toLowerCase().replace(/\s+/g, " ");
  
  const extractNumber = (pattern: RegExp): number | undefined => {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      const num = parseFloat(match[1].replace(/,/g, ""));
      return isNaN(num) ? undefined : num;
    }
    return undefined;
  };
  
  const extractString = (pattern: RegExp): string | undefined => {
    const match = normalizedText.match(pattern);
    return match?.[1]?.trim();
  };
  
  return {
    servingSize: extractString(/serving size[:\s]+([^\n]+)/i),
    calories: extractNumber(/calories[:\s]*(\d+)/i),
    totalFat: extractNumber(/total fat[:\s]*(\d+\.?\d*)\s*g/i),
    saturatedFat: extractNumber(/saturated fat[:\s]*(\d+\.?\d*)\s*g/i),
    transFat: extractNumber(/trans fat[:\s]*(\d+\.?\d*)\s*g/i),
    cholesterol: extractNumber(/cholesterol[:\s]*(\d+\.?\d*)\s*mg/i),
    sodium: extractNumber(/sodium[:\s]*(\d+\.?\d*)\s*mg/i),
    totalCarbohydrates: extractNumber(/total carbohydr?a?t?e?s?[:\s]*(\d+\.?\d*)\s*g/i),
    dietaryFiber: extractNumber(/dietary fiber[:\s]*(\d+\.?\d*)\s*g/i),
    sugars: extractNumber(/(?:total )?sugars?[:\s]*(\d+\.?\d*)\s*g/i),
    addedSugars: extractNumber(/added sugars?[:\s]*(\d+\.?\d*)\s*g/i),
    protein: extractNumber(/protein[:\s]*(\d+\.?\d*)\s*g/i),
    vitaminD: extractNumber(/vitamin d[:\s]*(\d+\.?\d*)\s*(?:mcg|μg)/i),
    calcium: extractNumber(/calcium[:\s]*(\d+\.?\d*)\s*mg/i),
    iron: extractNumber(/iron[:\s]*(\d+\.?\d*)\s*mg/i),
    potassium: extractNumber(/potassium[:\s]*(\d+\.?\d*)\s*mg/i),
    rawText: text,
  };
}

/**
 * Calculate health score based on nutrition data
 * Score ranges from 0-100 where higher is healthier
 */
export function calculateHealthScore(data: NutritionData): number {
  let score = 50; // Base score
  
  // Deduct points for unhealthy nutrients
  if (data.calories !== undefined) {
    if (data.calories > 400) score -= 10;
    else if (data.calories > 250) score -= 5;
    else if (data.calories < 150) score += 5;
  }
  
  if (data.saturatedFat !== undefined) {
    if (data.saturatedFat > 5) score -= 15;
    else if (data.saturatedFat > 3) score -= 8;
    else if (data.saturatedFat < 1) score += 5;
  }
  
  if (data.transFat !== undefined && data.transFat > 0) {
    score -= 20; // Trans fat is particularly bad
  }
  
  if (data.sodium !== undefined) {
    if (data.sodium > 600) score -= 15;
    else if (data.sodium > 400) score -= 8;
    else if (data.sodium < 150) score += 5;
  }
  
  if (data.sugars !== undefined) {
    if (data.sugars > 15) score -= 15;
    else if (data.sugars > 8) score -= 8;
    else if (data.sugars < 3) score += 5;
  }
  
  if (data.addedSugars !== undefined) {
    if (data.addedSugars > 10) score -= 15;
    else if (data.addedSugars > 5) score -= 8;
  }
  
  // Add points for healthy nutrients
  if (data.dietaryFiber !== undefined) {
    if (data.dietaryFiber > 5) score += 15;
    else if (data.dietaryFiber > 3) score += 8;
  }
  
  if (data.protein !== undefined) {
    if (data.protein > 15) score += 10;
    else if (data.protein > 8) score += 5;
  }
  
  // Clamp score between 0 and 100
  return Math.max(0, Math.min(100, score));
}

/**
 * Get health rating based on score
 */
export function getHealthRating(score: number): "healthy" | "moderate" | "unhealthy" {
  if (score >= 65) return "healthy";
  if (score >= 40) return "moderate";
  return "unhealthy";
}

/**
 * Mock OCR function - in production, integrate with Tesseract.js or cloud OCR
 * For now, returns sample data for demonstration
 */
export async function extractTextFromImage(imageDataUrl: string): Promise<OCRResult> {
  try {
    // Preprocess image for better OCR
    await preprocessForOCR(imageDataUrl);
    
    // Simulate OCR processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    // For demo purposes, return mock nutrition data
    // In production, integrate with Tesseract.js or cloud OCR service
    const mockText = `
      Nutrition Facts
      Serving Size 1 cup (240ml)
      Calories 150
      Total Fat 8g
      Saturated Fat 3g
      Trans Fat 0g
      Cholesterol 25mg
      Sodium 180mg
      Total Carbohydrate 18g
      Dietary Fiber 2g
      Total Sugars 12g
      Added Sugars 8g
      Protein 6g
      Vitamin D 2mcg
      Calcium 280mg
      Iron 1mg
      Potassium 350mg
    `;
    
    return {
      text: mockText.trim(),
      confidence: 0.92,
      success: true,
    };
  } catch (error) {
    return {
      text: "",
      confidence: 0,
      success: false,
      error: error instanceof Error ? error.message : "OCR failed",
    };
  }
}

/**
 * Full analysis pipeline: extract text, parse nutrition, calculate score
 */
export async function analyzeNutritionLabel(imageDataUrl: string): Promise<{
  ocrResult: OCRResult;
  nutritionData: NutritionData;
  healthScore: number;
  healthRating: "healthy" | "moderate" | "unhealthy";
}> {
  const ocrResult = await extractTextFromImage(imageDataUrl);
  
  if (!ocrResult.success) {
    throw new Error(ocrResult.error || "Failed to extract text from image");
  }
  
  const nutritionData = parseNutritionText(ocrResult.text);
  const healthScore = calculateHealthScore(nutritionData);
  const healthRating = getHealthRating(healthScore);
  
  return {
    ocrResult,
    nutritionData,
    healthScore,
    healthRating,
  };
}
