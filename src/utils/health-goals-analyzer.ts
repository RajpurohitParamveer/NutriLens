import { HealthGoals } from "@/hooks/use-health-goals";

export interface NutritionData {
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
}

export interface GoalBasedRecommendation {
  message: string;
  type: "positive" | "warning" | "info";
  icon: string;
}

/**
 * Analyze nutrition data against user's health goals
 */
export function analyzeForHealthGoals(
  nutritionData: NutritionData,
  goals: HealthGoals | null
): GoalBasedRecommendation[] {
  if (!goals) return [];

  const recommendations: GoalBasedRecommendation[] = [];

  // Analyze based on weight goal
  if (goals.goal === "lose") {
    if (nutritionData.calories > 300) {
      recommendations.push({
        message: "High calories for weight loss. Consider a lighter option.",
        type: "warning",
        icon: "⚠️",
      });
    } else if (nutritionData.calories < 150) {
      recommendations.push({
        message: "Great low-calorie choice for weight loss!",
        type: "positive",
        icon: "✅",
      });
    }

    if (nutritionData.sugar > 15) {
      recommendations.push({
        message: "High sugar content may hinder weight loss goals.",
        type: "warning",
        icon: "⚠️",
      });
    }

    if (nutritionData.fiber > 5) {
      recommendations.push({
        message: "High fiber content helps with weight loss and satiety.",
        type: "positive",
        icon: "✅",
      });
    }
  } else if (goals.goal === "gain") {
    if (nutritionData.calories < 200) {
      recommendations.push({
        message: "Low calories. You may need more for weight gain goals.",
        type: "warning",
        icon: "⚠️",
      });
    } else if (nutritionData.calories > 400 && nutritionData.protein > 15) {
      recommendations.push({
        message: "Good calorie and protein content for muscle gain!",
        type: "positive",
        icon: "✅",
      });
    }

    if (nutritionData.protein < 10) {
      recommendations.push({
        message: "Low protein. Aim for 15g+ per serving for muscle building.",
        type: "info",
        icon: "ℹ️",
      });
    }
  } else if (goals.goal === "maintain") {
    if (nutritionData.calories > 400) {
      recommendations.push({
        message: "Moderate portions recommended for weight maintenance.",
        type: "info",
        icon: "ℹ️",
      });
    }
  }

  // Analyze based on daily calorie target
  if (goals.dailyCalories) {
    const percentage = (nutritionData.calories / goals.dailyCalories) * 100;
    if (percentage > 25) {
      recommendations.push({
        message: `This item is ${Math.round(percentage)}% of your daily calorie target.`,
        type: "info",
        icon: "ℹ️",
      });
    }
  }

  // Check for allergies
  if (goals.allergies.length > 0) {
    const productText = JSON.stringify(nutritionData).toLowerCase();
    const allergyWarnings = goals.allergies.filter((allergy) => {
      const allergyLower = allergy.toLowerCase();
      return productText.includes(allergyLower);
    });

    if (allergyWarnings.length > 0) {
      recommendations.push({
        message: `⚠️ Warning: May contain ${allergyWarnings.join(", ")}`,
        type: "warning",
        icon: "🚫",
      });
    }
  }

  // Analyze based on diet type
  if (goals.dietType.includes("keto")) {
    if (nutritionData.carbohydrates > 10) {
      recommendations.push({
        message: "High carbs for keto diet. Limit intake.",
        type: "warning",
        icon: "⚠️",
      });
    } else if (nutritionData.carbohydrates < 5) {
      recommendations.push({
        message: "Keto-friendly! Low carb content.",
        type: "positive",
        icon: "✅",
      });
    }
  }

  if (goals.dietType.includes("vegan") || goals.dietType.includes("vegetarian")) {
    // Check for animal products (basic check - would need ingredient analysis for full accuracy)
    if (nutritionData.cholesterol > 0) {
      recommendations.push({
        message: "Contains cholesterol - may not be vegan/vegetarian friendly.",
        type: "warning",
        icon: "⚠️",
      });
    }
  }

  return recommendations;
}

/**
 * Get personalized health score adjustment based on goals
 */
export function adjustHealthScoreForGoals(
  baseScore: number,
  nutritionData: NutritionData,
  goals: HealthGoals | null
): number {
  if (!goals) return baseScore;

  let adjustedScore = baseScore;

  // Adjust based on weight goal
  if (goals.goal === "lose") {
    // Penalize high calories more
    if (nutritionData.calories > 300) adjustedScore -= 5;
    if (nutritionData.calories < 150) adjustedScore += 5;
    // Reward high fiber
    if (nutritionData.fiber > 5) adjustedScore += 3;
  } else if (goals.goal === "gain") {
    // Reward high calories and protein
    if (nutritionData.calories > 300 && nutritionData.protein > 15) adjustedScore += 5;
    if (nutritionData.protein < 10) adjustedScore -= 3;
  }

  // Penalize if contains allergens
  if (goals.allergies.length > 0) {
    const productText = JSON.stringify(nutritionData).toLowerCase();
    const hasAllergen = goals.allergies.some((allergy) =>
      productText.includes(allergy.toLowerCase())
    );
    if (hasAllergen) adjustedScore -= 10;
  }

  // Adjust for diet type
  if (goals.dietType.includes("keto") && nutritionData.carbohydrates > 10) {
    adjustedScore -= 5;
  }

  return Math.max(0, Math.min(100, adjustedScore));
}

/**
 * Get goal-based daily calorie recommendation
 */
export function getRecommendedDailyCalories(goal: "lose" | "maintain" | "gain" | null): number {
  switch (goal) {
    case "lose":
      return 1500; // Average for weight loss
    case "gain":
      return 2500; // Average for weight gain
    case "maintain":
      return 2000; // Average maintenance
    default:
      return 2000;
  }
}
