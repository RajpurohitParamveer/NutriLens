import { useState, useEffect, useCallback } from "react";

export interface Scan {
  id: string;
  product_name: string | null;
  image_url: string | null;
  health_score: number | null;
  health_rating: "healthy" | "moderate" | "unhealthy" | null;
  calories: number | null;
  protein: number | null;
  carbohydrates: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  raw_ocr_text: string | null;
  ai_analysis: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export type SortOption = "date-desc" | "date-asc" | "score-desc" | "score-asc" | "name-asc" | "name-desc";
export type FilterOption = "all" | "healthy" | "moderate" | "unhealthy";

interface UseScansOptions {
  searchQuery?: string;
  sortBy?: SortOption;
  filterBy?: FilterOption;
  startDate?: Date | null;
  endDate?: Date | null;
}

const STORAGE_KEY = "nutrilens-scans";

// Helper to get scans from localStorage
function getStoredScans(): Scan[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Helper to save scans to localStorage
function saveStoredScans(scans: Scan[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scans));
}

export function useScans(options: UseScansOptions = {}) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { searchQuery = "", sortBy = "date-desc", filterBy = "all", startDate, endDate } = options;

  const fetchScans = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let data = getStoredScans();

      // Apply health rating filter
      if (filterBy !== "all") {
        data = data.filter((scan) => scan.health_rating === filterBy);
      }

      // Apply date range filter
      if (startDate) {
        data = data.filter((scan) => new Date(scan.created_at) >= startDate);
      }
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        data = data.filter((scan) => new Date(scan.created_at) <= endOfDay);
      }

      // Apply sorting
      data.sort((a, b) => {
        switch (sortBy) {
          case "date-desc":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case "date-asc":
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case "score-desc":
            return (b.health_score ?? 0) - (a.health_score ?? 0);
          case "score-asc":
            return (a.health_score ?? 0) - (b.health_score ?? 0);
          case "name-asc":
            return (a.product_name ?? "").localeCompare(b.product_name ?? "");
          case "name-desc":
            return (b.product_name ?? "").localeCompare(a.product_name ?? "");
          default:
            return 0;
        }
      });

      // Apply client-side search filter
      if (searchQuery.trim()) {
        const search = searchQuery.toLowerCase();
        data = data.filter(
          (scan) =>
            scan.product_name?.toLowerCase().includes(search) ||
            scan.raw_ocr_text?.toLowerCase().includes(search)
        );
      }

      setScans(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch scans"));
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy, filterBy, startDate, endDate]);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  const deleteScan = async (scanId: string) => {
    const storedScans = getStoredScans();
    const updatedScans = storedScans.filter((scan) => scan.id !== scanId);
    saveStoredScans(updatedScans);
    setScans((prev) => prev.filter((scan) => scan.id !== scanId));
    
    // Trigger custom event to notify other components
    window.dispatchEvent(new CustomEvent('scansUpdated', { detail: { scans: updatedScans } }));
    
    return { error: null };
  };

  const clearHistory = async () => {
    saveStoredScans([]);
    setScans([]);
    
    // Trigger custom event to notify other components
    window.dispatchEvent(new CustomEvent('scansUpdated', { detail: { scans: [] } }));
    
    return { error: null };
  };

  const addScan = (scan: Scan) => {
    const storedScans = getStoredScans();
    const updatedScans = [scan, ...storedScans];
    saveStoredScans(updatedScans);
    setScans(updatedScans);
  };

  return {
    scans,
    loading,
    error,
    refetch: fetchScans,
    deleteScan,
    clearHistory,
    addScan,
  };
}
