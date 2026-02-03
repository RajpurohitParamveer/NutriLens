import { Home, Clock, Settings, Camera } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function BottomNavigation() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-3 right-3 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-bottom rounded-t-xl">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2 safe-left safe-right">
        {/* Home */}
        <NavItem
          icon={Home}
          label="Home"
          path="/home"
          isActive={location.pathname === "/home"}
        />

        {/* Scan Button - Center elevated */}
        <NavLink
          to="/scan"
          className="relative -mt-6 flex flex-col items-center group"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full gradient-primary shadow-primary flex items-center justify-center transition-transform group-hover:scale-105 group-active:scale-95">
            <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
          </div>
          <span className="text-[10px] sm:text-xs text-muted-foreground mt-1 font-medium">Scan</span>
        </NavLink>

        {/* History */}
        <NavItem
          icon={Clock}
          label="History"
          path="/history"
          isActive={location.pathname === "/history"}
        />

        {/* Settings */}
        <NavItem
          icon={Settings}
          label="Settings"
          path="/profile"
          isActive={location.pathname === "/profile"}
        />
      </div>
    </nav>
  );
}

function NavItem({
  icon: Icon,
  label,
  path,
  isActive,
}: {
  icon: typeof Home;
  label: string;
  path: string;
  isActive: boolean;
}) {
  return (
    <NavLink
      to={path}
      className={cn(
        "flex flex-col items-center gap-1 py-2 px-4 transition-all rounded-xl",
        isActive 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div className={cn(
        "p-2 rounded-xl transition-colors",
        isActive && "bg-primary/10"
      )}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <span className="text-[10px] sm:text-xs font-medium">{label}</span>
    </NavLink>
  );
}
