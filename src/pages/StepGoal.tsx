import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSteps } from "@/hooks/use-steps";
import { useToast } from "@/hooks/use-toast";
import { Flag } from "lucide-react";

export default function StepGoal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { dailyStepGoal, setDailyStepGoal } = useSteps();
  const [value, setValue] = useState(String(dailyStepGoal));

  useEffect(() => {
    setValue(String(dailyStepGoal));
  }, [dailyStepGoal]);

  const handleSave = () => {
    const n = parseInt(value.replace(/\D/g, ""), 10);
    if (isNaN(n) || n < 1) {
      toast({
        title: "Invalid goal",
        description: "Please enter a valid step goal (1–200,000).",
        variant: "destructive",
      });
      return;
    }
    setDailyStepGoal(n);
    toast({
      title: "Step goal saved",
      description: `Daily goal set to ${n.toLocaleString()} steps.`,
    });
    navigate("/profile");
  };

  return (
    <AppLayout showNav={false}>
      <Header title="Daily Step Goal" showBack />

      <div className="p-4 space-y-6">
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
              <Flag className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Set your daily target</h2>
              <p className="text-sm text-muted-foreground">
                Typical goals: 5,000 – 10,000 steps
              </p>
            </div>
          </div>
          <Label htmlFor="step-goal" className="text-sm font-medium text-foreground">
            Steps per day
          </Label>
          <Input
            id="step-goal"
            type="number"
            min={1}
            max={200000}
            placeholder="e.g., 10000"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mt-2 bg-background border-border text-lg"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Enter a value between 1 and 200,000
          </p>
        </Card>

        <Button
          className="w-full h-12 gradient-primary shadow-primary"
          onClick={handleSave}
        >
          Save Step Goal
        </Button>
      </div>
    </AppLayout>
  );
}
