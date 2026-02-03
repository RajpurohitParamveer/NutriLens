import { useState, useEffect } from "react";

export interface ScreenSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  orientation: "portrait" | "landscape";
  safeAreaTop: number;
  safeAreaBottom: number;
  safeAreaLeft: number;
  safeAreaRight: number;
}

/**
 * Hook to detect and track screen size and device type
 */
export function useScreenSize(): ScreenSize {
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    const width = typeof window !== "undefined" ? window.innerWidth : 0;
    const height = typeof window !== "undefined" ? window.innerHeight : 0;
    
    return {
      width,
      height,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 1024,
      isDesktop: width >= 1024,
      orientation: width > height ? "landscape" : "portrait",
      safeAreaTop: typeof window !== "undefined" 
        ? parseInt(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-top") || "0", 10) || 0
        : 0,
      safeAreaBottom: typeof window !== "undefined"
        ? parseInt(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-bottom") || "0", 10) || 0
        : 0,
      safeAreaLeft: typeof window !== "undefined"
        ? parseInt(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-left") || "0", 10) || 0
        : 0,
      safeAreaRight: typeof window !== "undefined"
        ? parseInt(getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-right") || "0", 10) || 0
        : 0,
    };
  });

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      // Get safe area insets
      const safeAreaTop = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-top") || "0",
        10
      ) || 0;
      const safeAreaBottom = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-bottom") || "0",
        10
      ) || 0;
      const safeAreaLeft = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-left") || "0",
        10
      ) || 0;
      const safeAreaRight = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue("--safe-area-inset-right") || "0",
        10
      ) || 0;

      setScreenSize({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        orientation: width > height ? "landscape" : "portrait",
        safeAreaTop,
        safeAreaBottom,
        safeAreaLeft,
        safeAreaRight,
      });
    };

    // Initial update
    updateScreenSize();

    // Listen for resize and orientation changes
    window.addEventListener("resize", updateScreenSize);
    window.addEventListener("orientationchange", updateScreenSize);
    
    // Listen for visual viewport changes (for mobile browsers)
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateScreenSize);
    }

    return () => {
      window.removeEventListener("resize", updateScreenSize);
      window.removeEventListener("orientationchange", updateScreenSize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateScreenSize);
      }
    };
  }, []);

  return screenSize;
}

