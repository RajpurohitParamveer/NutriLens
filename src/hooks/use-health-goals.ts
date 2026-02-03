import { useState, useEffect } from "react";

export interface HealthGoals {
  goal: "lose" | "maintain" | "gain" | null;
  dietType: string[];
  dailyCalories: number | null;
  allergies: string[];
}

const STORAGE_KEY = "nutrilens-health-goals";

/**
 * Hook to get and manage health goals
 */
export function useHealthGoals() {
  const [goals, setGoals] = useState<HealthGoals | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setGoals(JSON.parse(saved));
      } catch {
        setGoals(null);
      }
    }
    setLoading(false);
  }, []);

  const updateGoals = (newGoals: HealthGoals) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newGoals));
    setGoals(newGoals);
  };

  return { goals, loading, updateGoals };
}

/**
 * Get health goals directly (for non-hook usage)
 */
export function getHealthGoals(): HealthGoals | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}
