import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Target,
  CheckCircle2,
  X,
  Apple,
  Dumbbell,
  Heart,
  Leaf,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface HealthGoals {
  goal: "lose" | "maintain" | "gain" | null;
  dietType: string[];
  dailyCalories: number | null;
  allergies: string[];
}

const STORAGE_KEY = "nutrilens-health-goals";

export default function HealthGoals() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [goals, setGoals] = useState<HealthGoals>({
    goal: null,
    dietType: [],
    dailyCalories: null,
    allergies: [],
  });
  const { t } = useTranslation();

  const dietTypes = [
    { id: "vegetarian", label: t('healthGoals.vegetarian'), icon: Leaf },
    { id: "vegan", label: t('healthGoals.vegan'), icon: Leaf },
    { id: "keto", label: t('healthGoals.keto'), icon: Apple },
    { id: "paleo", label: t('healthGoals.paleo'), icon: Apple },
    { id: "mediterranean", label: t('healthGoals.mediterranean'), icon: Heart },
  ];

  const commonAllergies = [
    t('healthGoals.gluten'),
    t('healthGoals.dairy'),
    t('healthGoals.nuts'),
    t('healthGoals.soy'),
    t('healthGoals.eggs'),
    t('healthGoals.shellfish'),
    t('healthGoals.fish'),
  ];

  useEffect(() => {
    // Load saved goals
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setGoals(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
      toast({
        title: t('healthGoals.healthGoalsSaved'),
        description: t('healthGoals.preferencesUpdated'),
      });
    navigate("/profile");
  };

  const toggleDietType = (dietId: string) => {
    setGoals((prev) => ({
      ...prev,
      dietType: prev.dietType.includes(dietId)
        ? prev.dietType.filter((d) => d !== dietId)
        : [...prev.dietType, dietId],
    }));
  };

  const toggleAllergy = (allergy: string) => {
    setGoals((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter((a) => a !== allergy)
        : [...prev.allergies, allergy],
    }));
  };

  return (
    <AppLayout showNav={false}>
      <Header title={t('healthGoals.title')} showBack />

      <div className="p-4 space-y-6 pb-32">
        {/* Health Goal Selection */}
        <section>
          <Label className="text-base font-semibold mb-3 block">
            {t('healthGoals.whatsYourHealthGoal')}
          </Label>
          <RadioGroup
            value={goals.goal || ""}
            onValueChange={(value) =>
              setGoals((prev) => ({ ...prev, goal: value as any }))
            }
            className="space-y-3"
          >
            <Card className="p-4 bg-card border-border cursor-pointer hover:border-primary/50 transition-colors">
              <label className="flex items-center gap-3 cursor-pointer">
                <RadioGroupItem value="lose" id="lose" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">{t('healthGoals.loseWeight')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('healthGoals.loseWeightDesc')}
                  </p>
                </div>
              </label>
            </Card>

            <Card className="p-4 bg-card border-border cursor-pointer hover:border-primary/50 transition-colors">
              <label className="flex items-center gap-3 cursor-pointer">
                <RadioGroupItem value="maintain" id="maintain" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">{t('healthGoals.maintainWeight')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('healthGoals.maintainWeightDesc')}
                  </p>
                </div>
              </label>
            </Card>

            <Card className="p-4 bg-card border-border cursor-pointer hover:border-primary/50 transition-colors">
              <label className="flex items-center gap-3 cursor-pointer">
                <RadioGroupItem value="gain" id="gain" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">{t('healthGoals.gainWeight')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('healthGoals.gainWeightDesc')}
                  </p>
                </div>
              </label>
            </Card>
          </RadioGroup>
        </section>

        {/* Dietary Preferences */}
        <section>
          <Label className="text-base font-semibold mb-3 block">
            {t('healthGoals.dietaryPreferences')}
          </Label>
          <div className="grid grid-cols-2 gap-3">
            {dietTypes.map((diet) => {
              const Icon = diet.icon;
              const isSelected = goals.dietType.includes(diet.id);
              return (
                <Card
                  key={diet.id}
                  className={`p-4 bg-card border-border cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => toggleDietType(diet.id)}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isSelected ? "bg-primary/10" : "bg-muted"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          isSelected ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-sm font-medium text-center ${
                        isSelected ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {diet.label}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Daily Calorie Target */}
        <section>
          <Label htmlFor="calories" className="text-base font-semibold mb-3 block">
            {t('healthGoals.dailyCalorieTarget')}
          </Label>
          <Input
            id="calories"
            type="number"
            placeholder={t('healthGoals.caloriePlaceholder')}
            value={goals.dailyCalories || ""}
            onChange={(e) =>
              setGoals((prev) => ({
                ...prev,
                dailyCalories: e.target.value ? parseInt(e.target.value) : null,
              }))
            }
            className="bg-card border-border"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {t('healthGoals.calorieHelper')}
          </p>
        </section>

        {/* Allergies & Intolerances */}
        <section>
          <Label className="text-base font-semibold mb-3 block">
            {t('healthGoals.allergiesIntolerances')}
          </Label>
          <div className="flex flex-wrap gap-2">
            {commonAllergies.map((allergy) => {
              const isSelected = goals.allergies.includes(allergy);
              return (
                <Badge
                  key={allergy}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer px-3 py-1.5 ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => toggleAllergy(allergy)}
                >
                  {allergy}
                  {isSelected && (
                    <X className="w-3 h-3 ml-1.5" />
                  )}
                </Badge>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t('healthGoals.allergyHelper')}
          </p>
        </section>

        {/* Save Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 safe-bottom">
          <Button
            className="w-full h-12 gradient-primary shadow-primary"
            onClick={handleSave}
          >
            {t('healthGoals.saveHealthGoals')}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

