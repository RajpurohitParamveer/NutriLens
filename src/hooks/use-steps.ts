import { useState, useEffect, useCallback, useRef } from "react";
import { useWidget } from "./use-widget";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";

export interface StepsData {
  steps: number;
  date: string;
  distance?: number; // in meters
  calories?: number; // estimated
}

const STORAGE_KEY = "nutrilens-steps";
const STEP_GOAL_KEY = "nutrilens-step-goal";
const DEFAULT_STEP_GOAL = 8000;
const STEPS_PER_KM = 1400; // Average steps per kilometer
const CALORIES_PER_STEP = 0.05; // Rough estimate

/**
 * Hook to track and manage step count
 * Uses localStorage fallback when native plugins aren't available
 */
export function useSteps() {
  const { updateWidget } = useWidget();
  
  const [todaySteps, setTodaySteps] = useState<number>(0);
  const [isSupported, setIsSupported] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  const [weeklySteps, setWeeklySteps] = useState<StepsData[]>([]);
  const [monthlySteps, setMonthlySteps] = useState<StepsData[]>([]);
  const [dailyStepGoal, setDailyStepGoalState] = useState<number>(DEFAULT_STEP_GOAL);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);
  const lastCheckedDateRef = useRef<string>("");

  // Load today's steps and step goal
  useEffect(() => {
    loadTodaySteps();
    loadWeeklySteps();
    loadMonthlySteps();
    loadStepGoal();
    checkSupport();
  }, []);

  // Sync steps to Android home screen widget (native only)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      try {
        updateWidget(todaySteps, dailyStepGoal);
      } catch (error) {
        console.log('Widget update failed, using fallback');
      }
    }
  }, [todaySteps, dailyStepGoal, updateWidget]);

  const checkSupport = async () => {
    // Check if we're on a native platform with step counter support
    const isNative = Capacitor.isNativePlatform();

    if (isNative) {
      // On Android with Activity Recognition permission, we should support step tracking
      setIsSupported(true);

      // Start tracking (this will now use the native service)
      if (!isInitializedRef.current) {
        isInitializedRef.current = true;
        startTracking();
      }
      
      // Load steps from native service periodically
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      
      updateIntervalRef.current = setInterval(() => {
        loadTodaySteps();
      }, 3000); // Update every 3 seconds from native service for responsive charts
    } else {
      // For web, step counter not available
      setIsSupported(false);
    }
  };

  const loadStepGoal = () => {
    try {
      const stored = localStorage.getItem(STEP_GOAL_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (!isNaN(n) && n > 0) {
          setDailyStepGoalState(n);
          
          // Sync to native service for widget
          if (Capacitor.isNativePlatform()) {
            try {
              const androidWidget = (window as any).AndroidWidget;
              if (androidWidget && androidWidget.updateGoal) {
                androidWidget.updateGoal(n);
                console.log(`Step goal synced to native service on load: ${n}`);
              }
            } catch (error) {
              console.log('Failed to sync goal to native service on load:', error);
            }
          }
        }
      } else {
        // No goal set, use default 8000 and sync to native
        setDailyStepGoalState(DEFAULT_STEP_GOAL);
        if (Capacitor.isNativePlatform()) {
          try {
            const androidWidget = (window as any).AndroidWidget;
            if (androidWidget && androidWidget.updateGoal) {
              androidWidget.updateGoal(DEFAULT_STEP_GOAL);
              console.log(`Default step goal synced to native service: ${DEFAULT_STEP_GOAL}`);
            }
          } catch (error) {
            console.log('Failed to sync default goal to native service:', error);
          }
        }
      }
    } catch {
      // keep default
      setDailyStepGoalState(DEFAULT_STEP_GOAL);
    }
  };

  const setDailyStepGoal = useCallback((goal: number) => {
    const v = Math.max(1, Math.min(200000, goal));
    setDailyStepGoalState(v);
    localStorage.setItem(STEP_GOAL_KEY, String(v));
    
    // Sync goal to native service for widget
    if (Capacitor.isNativePlatform()) {
      try {
        const androidWidget = (window as any).AndroidWidget;
        if (androidWidget && androidWidget.updateGoal) {
          androidWidget.updateGoal(v);
          console.log(`Step goal synced to native service: ${v}`);
        }
      } catch (error) {
        console.log('Failed to sync goal to native service:', error);
      }
    }
  }, []);

  const loadTodaySteps = () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Try to get steps from native service
        try {
          const androidWidget = (window as any).AndroidWidget;
          if (androidWidget && androidWidget.getCurrentSteps) {
            // If native method is available, use it
            const steps = androidWidget.getCurrentSteps();
            setTodaySteps(steps);
            setIsTracking(true);
            
            // Trigger chart updates with current steps directly
            loadWeeklySteps(steps);
            loadMonthlySteps(steps);
            
            return;
          }
        } catch (error) {
          console.log('Native step reading not available, using fallback');
        }
      }
      
      // Fallback to localStorage
      const today = new Date().toISOString().split("T")[0];
      const stored = localStorage.getItem(`${STORAGE_KEY}-${today}`);
      if (stored) {
        const data = JSON.parse(stored);
        setTodaySteps(data.steps || 0);
        setIsTracking(data.isTracking || false);
        
        // Trigger chart updates with current steps directly
        loadWeeklySteps(data.steps || 0);
        loadMonthlySteps(data.steps || 0);
      }
    } catch {
      setTodaySteps(0);
      // Trigger chart updates with 0 steps
      loadWeeklySteps(0);
      loadMonthlySteps(0);
    }
  };

  const loadWeeklySteps = useCallback((currentSteps: number = todaySteps) => {
    try {
      const today = new Date();
      const week: StepsData[] = [];
      
      // Get Monday of current week
      const monday = new Date(today);
      const day = monday.getDay();
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday (0)
      monday.setDate(diff);
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        
        if (dateStr === today.toISOString().split('T')[0]) {
          // For today, use current steps from parameter
          week.push({ 
            steps: currentSteps, 
            date: dateStr,
            distance: Math.round((currentSteps / STEPS_PER_KM) * 100) / 100,
            calories: Math.round(currentSteps * CALORIES_PER_STEP)
          });
        } else {
          // For other days, use 0 steps (we don't have historical data from native service yet)
          week.push({ 
            steps: 0, 
            date: dateStr,
            distance: 0,
            calories: 0
          });
        }
      }
      setWeeklySteps(week);
    } catch (error) {
      console.error('Error loading weekly steps:', error);
      setWeeklySteps([]);
    }
  }, [todaySteps]);

  const loadMonthlySteps = useCallback((currentSteps: number = todaySteps) => {
    try {
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      const monthData: StepsData[] = [];
      
      // Generate data for each day of the current month
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = date.toISOString().split('T')[0];
        
        if (day === today.getDate()) {
          // For today, use current steps from parameter
          monthData.push({
            date: dateStr,
            steps: currentSteps,
            distance: Math.round((currentSteps / STEPS_PER_KM) * 100) / 100,
            calories: Math.round(currentSteps * CALORIES_PER_STEP)
          });
        } else {
          // For other days, use 0 steps (we don't have historical data from native service yet)
          monthData.push({
            date: dateStr,
            steps: 0,
            distance: 0,
            calories: 0
          });
        }
      }
      
      setMonthlySteps(monthData);
    } catch (error) {
      console.error('Error loading monthly steps:', error);
      setMonthlySteps([]);
    }
  }, [todaySteps]);

  const saveTodaySteps = (steps: number, isTracking: boolean = false) => {
    const today = new Date().toISOString().split("T")[0];
    const data: StepsData = {
      steps,
      date: today,
      distance: Math.round((steps / STEPS_PER_KM) * 100) / 100, // km
      calories: Math.round(steps * CALORIES_PER_STEP),
    };
    
    localStorage.setItem(`${STORAGE_KEY}-${today}`, JSON.stringify({ ...data, isTracking }));
    setTodaySteps(steps);
    setIsTracking(isTracking);
    
    // Update weekly and monthly data
    updateWeeklyData(data);
    updateMonthlyData(steps, today);
  };

  const updateWeeklyData = (todayData: StepsData) => {
    const updated = [...weeklySteps];
    const today = new Date().toISOString().split("T")[0];
    const index = updated.findIndex((d) => d.date === today);
    
    if (index >= 0) {
      updated[index] = todayData;
    } else {
      updated.push(todayData);
      // Keep only last 7 days
      if (updated.length > 7) updated.shift();
    }
    
    setWeeklySteps(updated);
    localStorage.setItem(`${STORAGE_KEY}-weekly`, JSON.stringify(updated));
  };

  const updateMonthlyData = (steps: number, dateStr: string) => {
    const today = new Date(dateStr);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    setMonthlySteps(prev => {
      const updated = [...prev];
      const existingIndex = updated.findIndex(d => d.date === dateStr);
      
      if (existingIndex >= 0) {
        updated[existingIndex] = { 
          ...updated[existingIndex], 
          steps,
          distance: Math.round((steps / STEPS_PER_KM) * 100) / 100,
          calories: Math.round(steps * CALORIES_PER_STEP)
        };
      } else {
        updated.push({ 
          date: dateStr, 
          steps,
          distance: Math.round((steps / STEPS_PER_KM) * 100) / 100,
          calories: Math.round(steps * CALORIES_PER_STEP)
        });
        // Sort by date
        updated.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
      
      // Filter to only include current month
      const currentMonthData = updated.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear;
      });
      
      localStorage.setItem(`${STORAGE_KEY}-monthly`, JSON.stringify(currentMonthData));
      return currentMonthData;
    });
  };

  const startFallbackTracking = useCallback(() => {
    // Don't simulate steps - only track real steps from device sensors
    // This fallback will only store steps when they're manually added
    console.log('Step tracking started - waiting for real device sensor data');
    setIsTracking(true);
  }, []);

  const startTracking = useCallback(async () => {
    if (Capacitor.isNativePlatform()) {
      // Use fallback tracking for now
      startFallbackTracking();
    }
  }, [startFallbackTracking]);

  const stopTracking = useCallback(async () => {
    // Clear update interval
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    
    setIsTracking(false);
    saveTodaySteps(todaySteps, false);
  }, [todaySteps]);

  const addSteps = useCallback((steps: number) => {
    const newTotal = todaySteps + steps;
    saveTodaySteps(newTotal, false);
  }, [todaySteps]);

  const resetTodaySteps = useCallback(() => {
    saveTodaySteps(0, false);
  }, []);

  const getTotalWeeklySteps = useCallback(() => {
    return weeklySteps.reduce((sum, day) => sum + day.steps, 0);
  }, [weeklySteps]);

  const getTotalMonthlySteps = useCallback(() => {
    return monthlySteps.reduce((sum, day) => sum + day.steps, 0);
  }, [monthlySteps]);

  const getAverageDailySteps = useCallback(() => {
    if (weeklySteps.length === 0) return 0;
    return Math.round(getTotalWeeklySteps() / weeklySteps.length);
  }, [weeklySteps, getTotalWeeklySteps]);

  // Handle app state changes - restart tracking when app resumes
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener: { remove: () => Promise<void> } | null = null;

    const handleAppStateChange = async (state: { isActive: boolean }) => {
      if (state.isActive && isSupported && !isTracking) {
        // App became active, restart tracking if it was stopped
        try {
          await startTracking();
        } catch (error) {
          console.error("Error restarting step counter on resume:", error);
        }
      }
    };

    try {
      if (typeof App.addListener === "function") {
        App.addListener("appStateChange", handleAppStateChange)
          .then((h) => {
            listener = h;
          })
          .catch(() => {
            // ignore errors if Capacitor bridge not ready
          });
      }
    } catch {
      // avoid crash if Capacitor bridge not ready
    }

    return () => {
      listener?.remove?.();
    };
  }, [isSupported, isTracking]); // Removed startTracking from deps to avoid circular updates

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      // Don't stop tracking on unmount - keep it running in background
      // The plugin will handle cleanup when app is destroyed
    };
  }, []);

  // Check for midnight transitions every minute
  useEffect(() => {
    const checkMidnightTransition = () => {
      const today = new Date().toISOString().split("T")[0];
      if (lastCheckedDateRef.current && today !== lastCheckedDateRef.current) {
        // Date has changed, it's a new day - reset and reload
        console.log("Midnight transition detected, resetting steps for new day");
        // Reset today's steps to 0
        const newSteps = 0;
        setTodaySteps(newSteps);
        saveTodaySteps(newSteps, false);
        // Reload weekly and monthly data to update the charts
        loadWeeklySteps();
        loadMonthlySteps();
      }
      lastCheckedDateRef.current = today;
    };

    // Check immediately
    checkMidnightTransition();

    // Set up periodic checking every minute
    const interval = setInterval(checkMidnightTransition, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [saveTodaySteps, loadWeeklySteps, loadMonthlySteps]);

  return {
    todaySteps,
    weeklySteps,
    monthlySteps,
    isSupported,
    isTracking,
    startTracking,
    stopTracking,
    addSteps,
    resetTodaySteps,
    getTotalWeeklySteps,
    getTotalMonthlySteps,
    getAverageDailySteps,
    dailyStepGoal,
    setDailyStepGoal,
  };
}
