import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { useSteps } from "@/hooks/use-steps";
import { Footprints, TrendingUp, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";

export default function Steps() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    todaySteps,
    weeklySteps,
    monthlySteps,
    isSupported,
    getTotalWeeklySteps,
    getTotalMonthlySteps,
    getAverageDailySteps,
    dailyStepGoal,
  } = useSteps();

  const distance = Math.round((todaySteps / 1300) * 100) / 100; // km
  const calories = Math.round(todaySteps * 0.04);

  return (
    <AppLayout showNav={false}>
      <Header title={t('steps.title')} showBack />

      <div className="p-4 space-y-6 pb-32">
        {/* Today's Steps - Large Display */}
        <Card className="p-6 sm:p-8 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
              <Footprints className="w-10 h-10 text-accent" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">{t('steps.todaysSteps')}</p>
            <p className="text-5xl sm:text-6xl font-bold text-foreground mb-2">
              {todaySteps.toLocaleString()}
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span>{distance} {t('steps.km')}</span>
              <span>•</span>
              <span>{calories} {t('steps.calories')}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{t('steps.dailyGoal')}: {dailyStepGoal.toLocaleString()} {t('steps.steps')}</span>
              <span className="text-xs font-semibold text-foreground">
                {Math.round((todaySteps / dailyStepGoal) * 100)}%
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${Math.min(100, (todaySteps / dailyStepGoal) * 100)}%` }}
              />
            </div>
          </div>
        </Card>

        {/* Weekly Summary */}
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">{t('steps.thisWeek')}</h3>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">{t('steps.total')}: {getTotalWeeklySteps().toLocaleString()}</span>
            </div>
          </div>
          <div className="space-y-2">
            {weeklySteps.map((day, index) => {
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
              const isToday = date.toDateString() === new Date().toDateString();
              
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-12 text-xs text-muted-foreground">
                    {isToday ? t('steps.today') : dayName}
                  </div>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-500"
                      style={{ width: `${Math.min(100, (day.steps / dailyStepGoal) * 100)}%` }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-semibold text-foreground">
                    {day.steps.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t('steps.averageDaily')}</span>
              <span className="font-semibold text-foreground">
                {getAverageDailySteps().toLocaleString()} {t('steps.steps')}
              </span>
            </div>
          </div>
        </Card>

        {/* Monthly Chart */}
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              {t('steps.thisMonth')}
            </h3>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">{t('steps.total')}: {getTotalMonthlySteps().toLocaleString()}</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySteps}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).getDate().toString()}
                  interval={Math.floor(monthlySteps.length / 7)} // Show ~7 ticks
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  formatter={(value) => [value, t('steps.stepsLabel')]}
                />
                <Bar dataKey="steps" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Info Card */}
        {!isSupported && (
          <Card className="p-4 bg-muted/50 border-border">
            <p className="text-sm text-muted-foreground text-center">
              {t('steps.stepTrackingInfo')}
            </p>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
