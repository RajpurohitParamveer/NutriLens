import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  ChevronRight,
  User,
  Target,
  Moon,
  Shield,
  HelpCircle,
  Flag,
  Footprints,
  Award,
} from "lucide-react";

export default function Profile() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border safe-top">
        <div className="flex items-center h-14 px-4">
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Settings Sections */}
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
            Preferences
          </h3>
          <Card className="bg-card border-border divide-y divide-border">
            <SettingsItem
              icon={Target}
              label="Health Goals"
              description="Set your dietary preferences"
              onClick={() => navigate("/health-goals")}
            />
            <SettingsItem
              icon={Flag}
              label="Daily Step Goal"
              description="Set your daily step target"
              onClick={() => navigate("/step-goal")}
            />
            <SettingsItem
              icon={Moon}
              label="Dark Mode"
              rightElement={
                <Switch 
                  checked={theme === "dark"} 
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
                />
              }
            />
          </Card>
        </section>

        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
            Activity
          </h3>
          <Card className="bg-card border-border divide-y divide-border">
            <SettingsItem
              icon={Footprints}
              label="Steps Counter"
              description="Track daily steps"
              onClick={() => navigate("/steps")}
            />
            <SettingsItem
              icon={Award}
              label="Achievements"
              description="View your badges"
              onClick={() => navigate("/achievements")}
            />
          </Card>
        </section>

        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
            Support
          </h3>
          <Card className="bg-card border-border divide-y divide-border">
            <SettingsItem
              icon={Shield}
              label="Privacy Policy"
              onClick={() => {}}
            />
            <SettingsItem
              icon={HelpCircle}
              label="Help & Support"
              onClick={() => {}}
            />
          </Card>
        </section>

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          NutriLens v1.0.0
        </p>
      </div>
    </AppLayout>
  );
}

function SettingsItem({
  icon: Icon,
  label,
  description,
  rightElement,
  danger = false,
  onClick,
}: {
  icon: typeof User;
  label: string;
  description?: string;
  rightElement?: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
}) {
  const Wrapper = onClick ? "button" : "div";

  return (
    <Wrapper
      className={`w-full flex items-center gap-3 p-4 text-left ${
        onClick ? "hover:bg-muted/50 transition-colors" : ""
      }`}
      onClick={onClick}
    >
      <Icon
        className={`w-5 h-5 ${
          danger ? "text-destructive" : "text-muted-foreground"
        }`}
      />
      <div className="flex-1">
        <p
          className={`font-medium ${
            danger ? "text-destructive" : "text-foreground"
          }`}
        >
          {label}
        </p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {rightElement || (onClick && <ChevronRight className="w-5 h-5 text-muted-foreground" />)}
    </Wrapper>
  );
}
