import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDailyNutrition } from "@/hooks/use-daily-nutrition";
import { useHealthGoals } from "@/hooks/use-health-goals";
import { Flame, Wheat, Droplets, Cookie, Target, TrendingUp } from "lucide-react";

export default function NutritionSummary() {
  const navigate = useNavigate();
  const { dailyNutrition, calorieProgress, recommendedValues } = useDailyNutrition();
  const { goals } = useHealthGoals();

  const nutritionItems = [
    {
      label: "Calories",
      value: Math.round(dailyNutrition.calories),
      target: recommendedValues.calories,
      unit: "kcal",
      icon: Flame,
      color: "text-orange-500",
    },
    {
      label: "Protein",
      value: Math.round(dailyNutrition.protein),
      target: recommendedValues.protein,
      unit: "g",
      icon: Wheat,
      color: "text-blue-500",
    },
    {
      label: "Carbs",
      value: Math.round(dailyNutrition.carbohydrates),
      target: recommendedValues.carbohydrates,
      unit: "g",
      icon: Cookie,
      color: "text-yellow-500",
    },
    {
      label: "Fat",
      value: Math.round(dailyNutrition.fat),
      target: recommendedValues.fat,
      unit: "g",
      icon: Droplets,
      color: "text-red-500",
    },
  ];

  return (
    <AppLayout showNav={false}>
      <Header title="Daily Nutrition" showBack />

      <div className="p-4 space-y-6 pb-32">
        {/* Summary Card */}
        <Card className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">Today's Total</p>
            <p className="text-4xl font-bold text-foreground">
              {Math.round(dailyNutrition.calories)}
              <span className="text-lg text-muted-foreground ml-1">kcal</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              From {dailyNutrition.scansCount} scanned {dailyNutrition.scansCount === 1 ? "item" : "items"}
            </p>
          </div>

          {calorieProgress && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Daily Goal</span>
                <span className="text-xs font-semibold text-foreground">
                  {calorieProgress.current} / {calorieProgress.target} kcal
                </span>
              </div>
              <Progress value={calorieProgress.percentage} className="h-2" />
              <p className="text-xs text-center text-muted-foreground mt-2">
                {calorieProgress.percentage < 100
                  ? `${calorieProgress.target - calorieProgress.current} kcal remaining`
                  : "Goal achieved! 🎉"}
              </p>
            </div>
          )}
        </Card>

        {/* Macros Breakdown */}
        <section>
          <h2 className="font-semibold text-foreground mb-3">Macronutrients</h2>
          <div className="space-y-3">
            {nutritionItems.map((item) => {
              const Icon = item.icon;
              const percentage = item.target > 0
                ? Math.min(100, Math.round((item.value / item.target) * 100))
                : 0;

              return (
                <Card key={item.label} className="p-4 bg-card border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center ${item.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.value} {item.unit} / {item.target} {item.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.unit}</p>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-1.5" />
                </Card>
              );
            })}
          </div>
        </section>

        {/* Additional Nutrients */}
        <section>
          <h2 className="font-semibold text-foreground mb-3">Other Nutrients</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 bg-card border-border">
              <p className="text-xs text-muted-foreground mb-1">Fiber</p>
              <p className="text-xl font-bold text-foreground">
                {Math.round(dailyNutrition.fiber)}g
              </p>
              <p className="text-xs text-muted-foreground mt-1">Target: 25g</p>
            </Card>
            <Card className="p-4 bg-card border-border">
              <p className="text-xs text-muted-foreground mb-1">Sugar</p>
              <p className="text-xl font-bold text-foreground">
                {Math.round(dailyNutrition.sugar)}g
              </p>
              <p className="text-xs text-muted-foreground mt-1">Target: &lt;50g</p>
            </Card>
            <Card className="p-4 bg-card border-border">
              <p className="text-xs text-muted-foreground mb-1">Sodium</p>
              <p className="text-xl font-bold text-foreground">
                {Math.round(dailyNutrition.sodium)}mg
              </p>
              <p className="text-xs text-muted-foreground mt-1">Target: &lt;2300mg</p>
            </Card>
            <Card className="p-4 bg-card border-border">
              <p className="text-xs text-muted-foreground mb-1">Scans</p>
              <p className="text-xl font-bold text-foreground">
                {dailyNutrition.scansCount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {dailyNutrition.healthyScans} healthy
              </p>
            </Card>
          </div>
        </section>

        {/* Health Goals Reminder */}
        {!goals && (
          <Card className="p-4 bg-accent/10 border-accent/20">
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-accent" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">
                  Set Your Health Goals
                </p>
                <p className="text-xs text-muted-foreground">
                  Get personalized daily targets based on your goals
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/health-goals")}
              >
                Set Goals
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
