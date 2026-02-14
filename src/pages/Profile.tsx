import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { LanguageSelector } from "@/components/LanguageSelector";
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
  Globe,
} from "lucide-react";

export default function Profile() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border safe-top">
        <div className="flex items-center h-14 px-4">
          <h1 className="text-lg font-semibold text-foreground">{t('settings.title')}</h1>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Settings Sections */}
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
            {t('settings.preferences')}
          </h3>
          <Card className="bg-card border-border divide-y divide-border">
            <SettingsItem
              icon={Target}
              label={t('settings.healthGoals')}
              description={t('settings.healthGoalsDesc')}
              onClick={() => navigate("/health-goals")}
            />
            <SettingsItem
              icon={Flag}
              label={t('settings.dailyStepGoal')}
              description={t('settings.dailyStepGoalDesc')}
              onClick={() => navigate("/step-goal")}
            />
            <SettingsItem
              icon={Globe}
              label={t('settings.language')}
              description={t('settings.languageDesc')}
              rightElement={<LanguageSelector />}
            />
            <SettingsItem
              icon={Moon}
              label={t('settings.darkMode')}
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
            {t('settings.activity')}
          </h3>
          <Card className="bg-card border-border divide-y divide-border">
            <SettingsItem
              icon={Footprints}
              label={t('settings.stepsCounter')}
              description={t('settings.stepsCounterDesc')}
              onClick={() => navigate("/steps")}
            />
            <SettingsItem
              icon={Award}
              label={t('settings.achievements')}
              description={t('settings.achievementsDesc')}
              onClick={() => navigate("/achievements")}
            />
          </Card>
        </section>

        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
            {t('settings.support')}
          </h3>
          <Card className="bg-card border-border divide-y divide-border">
            <SettingsItem
              icon={Shield}
              label={t('settings.privacyPolicy')}
              onClick={() => {}}
            />
            <SettingsItem
              icon={HelpCircle}
              label={t('settings.helpSupport')}
              onClick={() => {}}
            />
          </Card>
        </section>

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          {t('app.name')} v1.0.0
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
