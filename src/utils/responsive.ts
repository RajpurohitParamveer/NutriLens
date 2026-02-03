/**
 * Utility functions for responsive design
 */

/**
 * Get responsive font size using clamp
 */
export function responsiveFontSize(min: number, preferred: number, max: number): string {
  return `clamp(${min}px, ${preferred}vw, ${max}px)`;
}

/**
 * Get responsive spacing using clamp
 */
export function responsiveSpacing(min: number, preferred: number, max: number): string {
  return `clamp(${min}px, ${preferred}vw, ${max}px)`;
}

/**
 * Check if device is mobile
 */
export function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768;
}

/**
 * Check if device is tablet
 */
export function isTablet(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}

/**
 * Check if device is desktop
 */
export function isDesktop(): boolean {
  if (typeof window === "undefined") return false;
  return window.innerWidth >= 1024;
}

/**
 * Get safe area insets
 */
export function getSafeAreaInsets() {
  if (typeof window === "undefined") {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);

  return {
    top: parseInt(computedStyle.getPropertyValue("--safe-area-inset-top") || "0", 10) || 0,
    bottom: parseInt(computedStyle.getPropertyValue("--safe-area-inset-bottom") || "0", 10) || 0,
    left: parseInt(computedStyle.getPropertyValue("--safe-area-inset-left") || "0", 10) || 0,
    right: parseInt(computedStyle.getPropertyValue("--safe-area-inset-right") || "0", 10) || 0,
  };
}

