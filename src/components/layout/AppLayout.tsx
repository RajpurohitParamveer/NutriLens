import { ReactNode, useEffect } from "react";
import { BottomNavigation } from "./BottomNavigation";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { useScreenSize } from "@/hooks/use-screen-size";

interface AppLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export function AppLayout({ children, showNav = true }: AppLayoutProps) {
  const screenSize = useScreenSize();

  useEffect(() => {
    // Update CSS variables based on screen size
    document.documentElement.style.setProperty("--screen-width", `${screenSize.width}px`);
    document.documentElement.style.setProperty("--screen-height", `${screenSize.height}px`);
    document.documentElement.style.setProperty("--is-mobile", screenSize.isMobile ? "1" : "0");
    document.documentElement.style.setProperty("--is-tablet", screenSize.isTablet ? "1" : "0");
    document.documentElement.style.setProperty("--is-desktop", screenSize.isDesktop ? "1" : "0");
  }, [screenSize]);

  return (
    <div className="min-h-screen bg-background w-full max-w-full overflow-x-hidden px-3">
      <main className={showNav ? "pb-20" : ""}>{children}</main>
      {showNav && (
        <>
          <PWAInstallPrompt />
          <BottomNavigation />
        </>
      )}
    </div>
  );
}
