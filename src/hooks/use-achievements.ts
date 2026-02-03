import { useState, useEffect, useMemo, useCallback } from "react";
import { useScans } from "./use-scans";
import { useDailyNutrition } from "./use-daily-nutrition";
import { useSteps } from "./use-steps";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  target: number;
  category: "scans" | "health" | "streak" | "steps";
}

const ACHIEVEMENTS_STORAGE_KEY = "nutrilens-achievements";

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, "unlocked" | "unlockedAt" | "progress">[] = [
  {
    id: "first-scan",
    title: "First Scan",
    description: "Scan your first nutrition label",
    icon: "🎯",
    target: 1,
    category: "scans",
  },
  {
    id: "scanner-10",
    title: "Scanner",
    description: "Scan 10 products",
    icon: "📸",
    target: 10,
    category: "scans",
  },
  {
    id: "scanner-50",
    title: "Expert Scanner",
    description: "Scan 50 products",
    icon: "🏆",
    target: 50,
    category: "scans",
  },
  {
    id: "scanner-100",
    title: "Master Scanner",
    description: "Scan 100 products",
    icon: "👑",
    target: 100,
    category: "scans",
  },
  {
    id: "healthy-10",
    title: "Health Conscious",
    description: "Scan 10 healthy products",
    icon: "💚",
    target: 10,
    category: "health",
  },
  {
    id: "healthy-50",
    title: "Health Enthusiast",
    description: "Scan 50 healthy products",
    icon: "🌱",
    target: 50,
    category: "health",
  },
  {
    id: "streak-3",
    title: "Getting Started",
    description: "Scan for 3 consecutive days",
    icon: "🔥",
    target: 3,
    category: "streak",
  },
  {
    id: "streak-7",
    title: "Week Warrior",
    description: "Scan for 7 consecutive days",
    icon: "⚡",
    target: 7,
    category: "streak",
  },
  {
    id: "streak-30",
    title: "Monthly Champion",
    description: "Scan for 30 consecutive days",
    icon: "🌟",
    target: 30,
    category: "streak",
  },
  {
    id: "steps-5000",
    title: "Active Walker",
    description: "Walk 5,000 steps in a day",
    icon: "🚶",
    target: 5000,
    category: "steps",
  },
  {
    id: "steps-10000",
    title: "Power Walker",
    description: "Walk 10,000 steps in a day",
    icon: "🏃",
    target: 10000,
    category: "steps",
  },
  {
    id: "steps-week-50000",
    title: "Week Warrior",
    description: "Walk 50,000 steps in a week",
    icon: "💪",
    target: 50000,
    category: "steps",
  },
];

/**
 * Hook to track and manage achievements
 */
export function useAchievements() {
  const { scans } = useScans();
  const { dailyNutrition } = useDailyNutrition();
  const { todaySteps, getTotalWeeklySteps } = useSteps();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentUnlocks, setRecentUnlocks] = useState<Achievement[]>([]);

  const calculateStreak = useCallback((): number => {
    if (scans.length === 0) return 0;

    const sortedScans = [...scans].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < sortedScans.length; i++) {
      const scanDate = new Date(sortedScans[i].created_at);
      scanDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - streak);

      if (
        scanDate.getTime() === expectedDate.getTime() ||
        (streak === 0 && scanDate.getTime() === today.getTime())
      ) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }, [scans]);

  const saveAchievements = useCallback((updated: Achievement[]) => {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const checkAchievements = useCallback(() => {
    setAchievements((currentAchievements) => {
      if (currentAchievements.length === 0) return currentAchievements;

      const updated = currentAchievements.map((achievement) => {
        if (achievement.unlocked) return achievement;

        let progress = 0;

        switch (achievement.category) {
          case "scans":
            if (achievement.id === "first-scan") {
              progress = scans.length >= 1 ? 1 : 0;
            } else if (achievement.id.startsWith("scanner-")) {
              progress = scans.length;
            } else if (achievement.id.startsWith("healthy-")) {
              progress = scans.filter((s) => s.health_rating === "healthy").length;
            }
            break;

          case "streak":
            progress = calculateStreak();
            break;

          case "steps":
            if (achievement.id === "steps-week-50000") {
              progress = getTotalWeeklySteps();
            } else {
              progress = todaySteps;
            }
            break;
        }

        const unlocked = progress >= achievement.target;
        const wasUnlocked = achievement.unlocked;

        if (unlocked && !wasUnlocked) {
          // New unlock!
          const unlockedAchievement = {
            ...achievement,
            unlocked: true,
            progress,
            unlockedAt: new Date().toISOString(),
          };
          
          setRecentUnlocks((prev) => [unlockedAchievement, ...prev.slice(0, 4)]);
          
          return unlockedAchievement;
        }

        return {
          ...achievement,
          progress: Math.min(progress, achievement.target),
        };
      });

      saveAchievements(updated);
      return updated;
    });
  }, [scans, todaySteps, getTotalWeeklySteps, calculateStreak, saveAchievements]);

  const loadAchievements = useCallback(() => {
    try {
      const stored = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
      if (stored) {
        const saved = JSON.parse(stored);
        setAchievements(saved);
      } else {
        // Initialize with all achievements locked
        const initial = ACHIEVEMENT_DEFINITIONS.map((def) => ({
          ...def,
          unlocked: false,
          progress: 0,
        }));
        setAchievements(initial);
        saveAchievements(initial);
      }
    } catch {
      const initial = ACHIEVEMENT_DEFINITIONS.map((def) => ({
        ...def,
        unlocked: false,
        progress: 0,
      }));
      setAchievements(initial);
      saveAchievements(initial);
    }
  }, [saveAchievements]);

  // Load saved achievements
  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  // Check achievements when data changes (only after initial load)
  useEffect(() => {
    if (achievements.length > 0) {
      const timer = setTimeout(() => {
        checkAchievements();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [scans.length, dailyNutrition.scansCount, todaySteps, achievements.length, checkAchievements]);

  const unlockedCount = useMemo(() => {
    return achievements.filter((a) => a.unlocked).length;
  }, [achievements]);

  const totalCount = achievements.length;

  return {
    achievements,
    recentUnlocks,
    unlockedCount,
    totalCount,
    progress: totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0,
  };
}
