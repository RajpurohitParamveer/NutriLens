import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Camera, Search, TrendingUp, CheckCircle2, XCircle, Sparkles, ChevronRight, Trash2, Target, ArrowRight, Heart, Dumbbell, Footprints, Award } from "lucide-react";

import { NutriLensLogo } from "@/components/NutriLensLogo";
import { useState, useEffect, useMemo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useHealthGoals } from "@/hooks/use-health-goals";
import { useDailyNutrition } from "@/hooks/use-daily-nutrition";
import { useSteps } from "@/hooks/use-steps";
import { useAchievements } from "@/hooks/use-achievements";

interface StoredScan {
  id: string;
  productName: string;
  healthScore: number;
  healthRating: string;
  createdAt: string;
  imageUrl?: string;
}

const SCANS_STORAGE_KEY = "nutrilens-scans";

function getStoredScans(): StoredScan[] {
  try {
    const stored = localStorage.getItem(SCANS_STORAGE_KEY);
    const scans = stored ? JSON.parse(stored) : [];
    // Convert from Scan format to StoredScan format for Home page
    return scans.map((scan: any) => ({
      id: scan.id,
      productName: scan.product_name || scan.productName || "Unknown Product",
      healthScore: scan.health_score || scan.healthScore || 0,
      healthRating: scan.health_rating || scan.healthRating || "moderate",
      createdAt: scan.created_at || scan.createdAt || new Date().toISOString(),
      imageUrl: scan.image_url || scan.imageUrl,
    }));
  } catch {
    return [];
  }
}

function formatScanDate(dateString: string): string {
  const date = new Date(dateString);
  if (isToday(date)) {
    return `Today, ${format(date, "h:mm a")}`;
  } else if (isYesterday(date)) {
    return `Yesterday, ${format(date, "h:mm a")}`;
  }
  return format(date, "MMM d, h:mm a");
}

function getProductEmoji(productName: string): string {
  const name = productName.toLowerCase();
  if (name.includes("yogurt") || name.includes("milk") || name.includes("dairy")) return "🥛";
  if (name.includes("granola") || name.includes("bar") || name.includes("cereal")) return "🥜";
  if (name.includes("cookie") || name.includes("chocolate") || name.includes("candy")) return "🍪";
  if (name.includes("fruit") || name.includes("apple") || name.includes("banana")) return "🍎";
  if (name.includes("vegetable") || name.includes("salad")) return "🥗";
  if (name.includes("bread") || name.includes("toast")) return "🍞";
  if (name.includes("juice") || name.includes("drink") || name.includes("soda")) return "🥤";
  if (name.includes("chip") || name.includes("snack")) return "🍟";
  return "🥗";
}

export default function Home() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { goals } = useHealthGoals();
  const { dailyNutrition, calorieProgress, recommendedValues } = useDailyNutrition();
  const { todaySteps, dailyStepGoal, isTracking, startTracking, stopTracking, addSteps, getTotalWeeklySteps } = useSteps();
  const { achievements, unlockedCount, totalCount, progress: achievementProgress } = useAchievements();
  const [searchQuery, setSearchQuery] = useState("");
  const [scans, setScans] = useState<StoredScan[]>([]);

  useEffect(() => {
    setScans(getStoredScans());
  }, []);

  const handleDeleteScan = (scanId: string) => {
    const storedScans = getStoredScans();
    const updatedScans = storedScans.filter((scan) => scan.id !== scanId);
    localStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(updatedScans));
    setScans(updatedScans);
    toast({
      title: "Scan deleted",
      description: "The scan has been removed from your history.",
    });
  };

  const recentScans = useMemo(() => {
    return scans.map(scan => ({
      id: scan.id,
      name: scan.productName,
      emoji: getProductEmoji(scan.productName),
      healthScore: scan.healthScore,
      date: formatScanDate(scan.createdAt),
    }));
  }, [scans]);

  const todayScans = useMemo(() => {
    return scans.filter(scan => isToday(new Date(scan.createdAt))).length;
  }, [scans]);

  const healthyCount = useMemo(() => {
    return scans.filter(scan => 
      isToday(new Date(scan.createdAt)) && scan.healthScore >= 60
    ).length;
  }, [scans]);

  const unhealthyCount = useMemo(() => {
    return scans.filter(scan => 
      isToday(new Date(scan.createdAt)) && scan.healthScore < 60
    ).length;
  }, [scans]);

  const filteredScans = recentScans.filter(scan =>
    scan.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border/50 safe-top w-full">
        <div className="flex items-center justify-center h-14 sm:h-16 px-4 safe-left safe-right">
          <NutriLensLogo size="md" />
        </div>
      </header>

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-2xl mx-auto safe-left safe-right">
        {/* Welcome Message */}
        <div className="animate-fade-in">
          <h1 className="text-responsive-xl font-bold text-foreground">Welcome Buddy! 👋</h1>
          <p className="text-responsive text-muted-foreground mt-1">Ready to make healthier choices today?</p>
        </div>

        {/* Search Bar */}
        <div className="relative animate-fade-in" style={{ animationDelay: "0.05s" }}>
          <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
          <Input
            placeholder="Search scan history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 sm:pl-11 h-11 sm:h-12 bg-card border-border rounded-xl text-sm sm:text-base focus-visible:ring-primary/50"
          />
        </div>

        {/* Daily Stats Card */}
        <Card className="p-4 sm:p-5 bg-card border-border overflow-hidden relative animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Today's Scans</p>
                <p className="text-3xl sm:text-4xl font-bold text-foreground">{todayScans}</p>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
              </div>
            </div>
            
            <div className="flex gap-2 sm:gap-3">
              <StatBadge
                icon={CheckCircle2}
                label="Healthy"
                count={healthyCount}
                color="text-healthy"
                bgColor="bg-healthy/10"
              />
              <StatBadge
                icon={XCircle}
                label="Unhealthy"
                count={unhealthyCount}
                color="text-unhealthy"
                bgColor="bg-unhealthy/10"
              />
            </div>
          </div>
        </Card>

        {/* Steps Counter Card */}
        <Card className="p-4 sm:p-5 bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20 animate-fade-in" style={{ animationDelay: "0.11s" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <Footprints className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm sm:text-base">Steps Today</h3>
                <p className="text-xs text-muted-foreground">
                  {Math.round((todaySteps / 1300) * 100) / 100} km • {Math.round(todaySteps * 0.04)} cal
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl sm:text-3xl font-bold text-foreground">{todaySteps.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">of {dailyStepGoal.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${Math.min(100, (todaySteps / dailyStepGoal) * 100)}%` }}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-accent hover:bg-accent/10"
              onClick={() => navigate("/steps")}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        {/* Daily Nutrition Summary Card */}
        {dailyNutrition.scansCount > 0 && (
          <Card className="p-4 sm:p-5 bg-card border-border animate-fade-in" style={{ animationDelay: "0.12s" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Today's Nutrition</h3>
                  <p className="text-xs text-muted-foreground">{dailyNutrition.scansCount} items scanned</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => navigate("/nutrition-summary")}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Calories</p>
                <p className="text-lg font-bold text-foreground">
                  {Math.round(dailyNutrition.calories)}
                  {calorieProgress && (
                    <span className="text-xs font-normal text-muted-foreground ml-1">
                      / {calorieProgress.target}
                    </span>
                  )}
                </p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Protein</p>
                <p className="text-lg font-bold text-foreground">
                  {Math.round(dailyNutrition.protein)}g
                </p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Carbs</p>
                <p className="text-lg font-bold text-foreground">
                  {Math.round(dailyNutrition.carbohydrates)}g
                </p>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Fat</p>
                <p className="text-lg font-bold text-foreground">
                  {Math.round(dailyNutrition.fat)}g
                </p>
              </div>
            </div>

            {calorieProgress && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Daily Goal Progress</span>
                  <span className="text-xs font-semibold text-foreground">{calorieProgress.percentage}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${calorieProgress.percentage}%` }}
                  />
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Achievements Preview */}
        <Card className="p-4 sm:p-5 bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20 cursor-pointer hover:border-warning/40 transition-all animate-fade-in" style={{ animationDelay: "0.13s" }} onClick={() => navigate("/achievements")}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm sm:text-base">Achievements</h3>
                <p className="text-xs text-muted-foreground">
                  {unlockedCount} of {totalCount} unlocked
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-16 h-16 relative">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-warning/20"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${totalCount > 0 ? (achievementProgress / 100) * 175.9 : 0} 175.9`}
                    className="text-warning transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-foreground">{achievementProgress}%</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-warning" />
            </div>
          </div>
        </Card>

        {/* Health Goals Card */}
        {goals ? (
          <Card className="p-4 sm:p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 animate-fade-in" style={{ animationDelay: "0.14s" }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Your Health Goals</h3>
                  <p className="text-xs text-muted-foreground">
                    {goals.goal === "lose" && "Lose Weight"}
                    {goals.goal === "maintain" && "Maintain Weight"}
                    {goals.goal === "gain" && "Gain Weight"}
                    {!goals.goal && "Not set"}
                    {goals.dietType.length > 0 && ` • ${goals.dietType.length} diet${goals.dietType.length > 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:text-primary hover:bg-primary/10"
                onClick={() => navigate("/health-goals")}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
            {goals.dailyCalories && (
              <div className="mt-2 pt-3 border-t border-primary/20">
                <p className="text-xs text-muted-foreground">
                  Daily Target: <span className="font-semibold text-foreground">{goals.dailyCalories} calories</span>
                </p>
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-4 sm:p-5 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 cursor-pointer hover:border-primary/40 transition-all animate-fade-in" style={{ animationDelay: "0.14s" }} onClick={() => navigate("/health-goals")}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-sm sm:text-base mb-1">Set Your Health Goals</h3>
                <p className="text-xs text-muted-foreground">
                  Get personalized recommendations based on your goals
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-primary flex-shrink-0" />
            </div>
          </Card>
        )}

        {/* Scan CTA */}
        <Button
          size="lg"
          className="w-full h-14 sm:h-16 text-base sm:text-lg font-semibold gradient-primary shadow-primary hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] animate-fade-in"
          style={{ animationDelay: "0.15s" }}
          onClick={() => navigate("/scan")}
        >
          <Camera className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
          Scan Nutrition Label
        </Button>

        {/* Recent Scans Section */}
        <section className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="font-semibold text-foreground text-base sm:text-lg">Recent Scans</h2>
            {filteredScans.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary font-medium gap-1"
                onClick={() => navigate("/history")}
              >
                View All
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>

          {filteredScans.length === 0 ? (
            <EmptyState searchQuery={searchQuery} />
          ) : (
            <div className="space-y-3">
              {filteredScans.map((scan, index) => (
                <ScanCard 
                  key={scan.id} 
                  scan={scan} 
                  onClick={() => navigate(`/results/${scan.id}`)}
                  onDelete={() => handleDeleteScan(scan.id)}
                  style={{ animationDelay: `${0.25 + index * 0.05}s` }}
                />
              ))}
            </div>
          )}
        </section>

        {/* Quick Tips */}
        <section className="animate-fade-in" style={{ animationDelay: "0.35s" }}>
          <Card className="p-4 bg-accent/10 border-accent/20">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">💡</span>
              </div>
              <div>
                <p className="font-medium text-foreground text-sm mb-1">Quick Tip</p>
                <p className="text-sm text-muted-foreground">
                  For best results, ensure the nutrition label is well-lit and fully visible in the frame.
                </p>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}

function StatBadge({
  icon: Icon,
  label,
  count,
  color,
  bgColor,
}: {
  icon: typeof CheckCircle2;
  label: string;
  count: number;
  color: string;
  bgColor: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${bgColor} rounded-xl px-4 py-2.5 flex-1`}>
      <Icon className={`w-5 h-5 ${color}`} />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-bold text-foreground">{count}</p>
      </div>
    </div>
  );
}

function EmptyState({ searchQuery }: { searchQuery?: string }) {
  const navigate = useNavigate();
  
  return (
    <Card className="p-8 bg-card border-border border-dashed flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
        <TrendingUp className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground mb-2">
        {searchQuery ? "No results found" : "No scans yet"}
      </h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-[200px]">
        {searchQuery 
          ? `No scans matching "${searchQuery}"`
          : "Start scanning nutrition labels to track your food choices"
        }
      </p>
      {!searchQuery && (
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => navigate("/scan")}
        >
          <Camera className="w-4 h-4" />
          Start Scanning
        </Button>
      )}
    </Card>
  );
}

interface ScanCardProps {
  scan: {
    id: string;
    name: string;
    emoji: string;
    healthScore: number;
    date: string;
  };
  onClick: () => void;
  onDelete: () => void;
  style?: React.CSSProperties;
}

function ScanCard({ scan, onClick, onDelete, style }: ScanCardProps) {
  const isHealthy = scan.healthScore >= 60;
  
  return (
    <Card
      className="p-4 bg-card border-border cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all animate-fade-in group relative"
      onClick={onClick}
      style={style}
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">{scan.emoji || "🥗"}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{scan.name}</p>
          <p className="text-sm text-muted-foreground">{scan.date}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
          isHealthy
            ? "bg-healthy/10 text-healthy"
            : "bg-unhealthy/10 text-unhealthy"
        }`}>
          {scan.healthScore}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={(e) => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this scan?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{scan.name}" from your history. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}
