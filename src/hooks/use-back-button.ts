import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

/**
 * Hook to handle Android back button - navigates to home screen
 */
export function useBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener: { remove?: () => void | Promise<void> } | null = null;

    try {
      // Add a small delay to ensure Capacitor bridge is ready
      const setupListener = setTimeout(() => {
        try {
          if (typeof App.addListener === "function") {
            App.addListener("backButton", () => {
              try {
                if (location.pathname !== "/home" && location.pathname !== "/" && location.pathname !== "/welcome") {
                  navigate("/home", { replace: true });
                } else {
                  App.exitApp();
                }
              } catch (error) {
                console.error("Error handling back button:", error);
              }
            })
              .then((h) => { listener = h; })
              .catch((error) => {
                console.error("Error adding back button listener:", error);
              });
          }
        } catch (error) {
          console.error("Error setting up back button listener:", error);
        }
      }, 1000); // 1 second delay

      return () => { 
        clearTimeout(setupListener);
        listener?.remove?.(); 
      };
    } catch (error) {
      console.error("Error in useBackButton:", error);
      return () => {};
    }
  }, [navigate, location.pathname]);
}

