import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAchievements } from "@/hooks/use-achievements";
import { Award, Lock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

export default function Achievements() {
  const navigate = useNavigate();
  const { achievements, unlockedCount, totalCount, progress } = useAchievements();
  const { t } = useTranslation();

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  return (
    <AppLayout showNav={false}>
      <Header title={t('achievements.title')} showBack />

      <div className="p-4 space-y-6 pb-32">
        {/* Progress Summary */}
        <Card className="p-5 bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
          <div className="text-center mb-4">
            <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-warning/20 flex items-center justify-center">
              <Award className="w-10 h-10 text-warning" />
            </div>
            <p className="text-2xl font-bold text-foreground mb-1">
              {unlockedCount} / {totalCount}
            </p>
            <p className="text-sm text-muted-foreground">{t('achievements.achievementsUnlocked')}</p>
          </div>
          <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-warning transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            {progress}% {t('achievements.complete')}
          </p>
        </Card>

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <section>
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-healthy" />
              {t('achievements.unlocked')} ({unlockedAchievements.length})
            </h2>
            <div className="space-y-3">
              {unlockedAchievements.map((achievement) => (
                <Card
                  key={achievement.id}
                  className="p-4 bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-warning/20 flex items-center justify-center text-2xl flex-shrink-0">
                      {achievement.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{achievement.title}</h3>
                        <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 text-xs">
                          {t('achievements.unlocked')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {achievement.description}
                      </p>
                      {achievement.unlockedAt && (
                        <p className="text-xs text-muted-foreground">
                          {t('achievements.unlockedLabel', { date: format(new Date(achievement.unlockedAt), "MMM d, yyyy") })}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <section>
            <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-muted-foreground" />
              {t('achievements.locked')} ({lockedAchievements.length})
            </h2>
            <div className="space-y-3">
              {lockedAchievements.map((achievement) => {
                const progressPercentage = Math.round(
                  (achievement.progress / achievement.target) * 100
                );

                return (
                  <Card
                    key={achievement.id}
                    className="p-4 bg-card border-border opacity-75"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center text-2xl flex-shrink-0 grayscale">
                        {achievement.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-foreground">{achievement.title}</h3>
                          <Badge variant="outline" className="text-xs">
                            {t('achievements.locked')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {achievement.description}
                        </p>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{t('achievements.progress')}</span>
                            <span className="font-semibold text-foreground">
                              {achievement.progress} / {achievement.target}
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-500"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty State */}
        {achievements.length === 0 && (
          <Card className="p-8 bg-card border-border flex flex-col items-center text-center">
            <Award className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-foreground mb-2">{t('achievements.noAchievementsYet')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('achievements.startScanningToUnlock')}
            </p>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
