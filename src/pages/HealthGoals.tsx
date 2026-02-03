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

interface HealthGoals {
  goal: "lose" | "maintain" | "gain" | null;
  dietType: string[];
  dailyCalories: number | null;
  allergies: string[];
}

const STORAGE_KEY = "nutrilens-health-goals";

const dietTypes = [
  { id: "vegetarian", label: "Vegetarian", icon: Leaf },
  { id: "vegan", label: "Vegan", icon: Leaf },
  { id: "keto", label: "Keto", icon: Apple },
  { id: "paleo", label: "Paleo", icon: Apple },
  { id: "mediterranean", label: "Mediterranean", icon: Heart },
];

const commonAllergies = [
  "Gluten",
  "Dairy",
  "Nuts",
  "Soy",
  "Eggs",
  "Shellfish",
  "Fish",
];

export default function HealthGoals() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [goals, setGoals] = useState<HealthGoals>({
    goal: null,
    dietType: [],
    dailyCalories: null,
    allergies: [],
  });

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
      title: "Health goals saved",
      description: "Your preferences have been updated.",
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
      <Header title="Health Goals" showBack />

      <div className="p-4 space-y-6 pb-32">
        {/* Health Goal Selection */}
        <section>
          <Label className="text-base font-semibold mb-3 block">
            What's your health goal?
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
                    <span className="font-medium text-foreground">Lose Weight</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Reduce calorie intake and increase activity
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
                    <span className="font-medium text-foreground">Maintain Weight</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Keep current weight and health
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
                    <span className="font-medium text-foreground">Gain Weight</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Build muscle and increase calorie intake
                  </p>
                </div>
              </label>
            </Card>
          </RadioGroup>
        </section>

        {/* Dietary Preferences */}
        <section>
          <Label className="text-base font-semibold mb-3 block">
            Dietary Preferences
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
            Daily Calorie Target (Optional)
          </Label>
          <Input
            id="calories"
            type="number"
            placeholder="e.g., 2000"
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
            Leave empty to use default recommendations based on your goal
          </p>
        </section>

        {/* Allergies & Intolerances */}
        <section>
          <Label className="text-base font-semibold mb-3 block">
            Allergies & Intolerances
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
            Tap to add or remove allergies
          </p>
        </section>

        {/* Save Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 safe-bottom">
          <Button
            className="w-full h-12 gradient-primary shadow-primary"
            onClick={handleSave}
          >
            Save Health Goals
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

