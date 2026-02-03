import { useState, useEffect, useMemo } from "react";
import { isToday } from "date-fns";
import { useHealthGoals } from "./use-health-goals";

export interface DailyNutrition {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  scansCount: number;
  healthyScans: number;
  unhealthyScans: number;
}

const SCANS_STORAGE_KEY = "nutrilens-scans";

/**
 * Hook to calculate daily nutrition summary from scans
 */
export function useDailyNutrition() {
  const { goals } = useHealthGoals();
  const [dailyNutrition, setDailyNutrition] = useState<DailyNutrition>({
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    scansCount: 0,
    healthyScans: 0,
    unhealthyScans: 0,
  });

  const [refreshKey, setRefreshKey] = useState(0);

  const scans = useMemo(() => {
    try {
      const stored = localStorage.getItem(SCANS_STORAGE_KEY);
      if (!stored) return [];
      
      const allScans = JSON.parse(stored);
      // Filter today's scans
      return allScans.filter((scan: any) => {
        const scanDate = new Date(scan.created_at || scan.createdAt);
        return isToday(scanDate);
      });
    } catch {
      return [];
    }
  }, [refreshKey]);

  // Refresh when localStorage changes (listen to storage events)
  useEffect(() => {
    const handleStorageChange = () => {
      setRefreshKey((prev) => prev + 1);
    };

    // Listen for custom scans updated event
    const handleScansUpdated = () => {
      setRefreshKey((prev) => prev + 1);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("scansUpdated", handleScansUpdated);
    
    // Also check periodically for same-tab updates
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 5000); // Check every 5 seconds

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("scansUpdated", handleScansUpdated);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const calculateDailyNutrition = () => {
      const summary: DailyNutrition = {
        calories: 0,
        protein: 0,
        carbohydrates: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        scansCount: scans.length,
        healthyScans: 0,
        unhealthyScans: 0,
      };

      scans.forEach((scan: any) => {
        // Add nutrition values
        summary.calories += scan.calories || 0;
        summary.protein += scan.protein || 0;
        summary.carbohydrates += scan.carbohydrates || 0;
        summary.fat += scan.fat || 0;
        summary.fiber += scan.fiber || 0;
        summary.sugar += scan.sugar || 0;
        summary.sodium += scan.sodium || 0;

        // Count healthy/unhealthy
        const rating = scan.health_rating || scan.healthRating;
        if (rating === "healthy") {
          summary.healthyScans++;
        } else if (rating === "unhealthy") {
          summary.unhealthyScans++;
        }
      });

      setDailyNutrition(summary);
    };

    calculateDailyNutrition();
  }, [scans]);

  // Calculate progress towards daily calorie goal
  const calorieProgress = useMemo(() => {
    if (!goals?.dailyCalories) return null;
    return {
      current: dailyNutrition.calories,
      target: goals.dailyCalories,
      percentage: Math.min(100, Math.round((dailyNutrition.calories / goals.dailyCalories) * 100)),
    };
  }, [dailyNutrition.calories, goals?.dailyCalories]);

  // Get recommended daily values based on goal
  const recommendedValues = useMemo(() => {
    if (!goals?.goal) {
      // Default recommendations
      return {
        calories: 2000,
        protein: 50,
        carbohydrates: 300,
        fat: 65,
      };
    }

    switch (goals.goal) {
      case "lose":
        return {
          calories: goals.dailyCalories || 1500,
          protein: 60,
          carbohydrates: 150,
          fat: 50,
        };
      case "gain":
        return {
          calories: goals.dailyCalories || 2500,
          protein: 100,
          carbohydrates: 350,
          fat: 80,
        };
      case "maintain":
        return {
          calories: goals.dailyCalories || 2000,
          protein: 50,
          carbohydrates: 300,
          fat: 65,
        };
      default:
        return {
          calories: 2000,
          protein: 50,
          carbohydrates: 300,
          fat: 65,
        };
    }
  }, [goals]);

  return {
    dailyNutrition,
    calorieProgress,
    recommendedValues,
    scans,
  };
}
