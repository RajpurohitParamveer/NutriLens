import { useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { HealthScoreRing } from "@/components/ui/health-score-ring";
import { MacroChart } from "@/components/ui/macro-chart";
import { useShare } from "@/hooks/use-share";
import { useToast } from "@/hooks/use-toast";
import { useHealthGoals } from "@/hooks/use-health-goals";
import { analyzeForHealthGoals, adjustHealthScoreForGoals } from "@/utils/health-goals-analyzer";
import {
  Share2,
  Camera,
  ChevronRight,
  Flame,
  Droplets,
  Wheat,
  Cookie,
  Check,
  AlertTriangle,
  Loader2,
  Pencil,
  X,
  Trash2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase, supabaseClient } from "@/integrations/supabase/client";

// Helper function to safely format nutritional values
const formatNutrientValue = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value) || !isFinite(value)) {
    return "0";
  }
  return value.toString();
};

// Helper function to sanitize scan data and prevent NaN values
const sanitizeScanData = (scan: any) => {
  // Get AI analysis data if available
  const aiAnalysis = scan.ai_analysis as Record<string, unknown> | null;
  
  return {
    ...scan,
    product_name: scan.product_name || "Unknown Product",
    health_score: Number(scan.health_score) || 0,
    health_rating: scan.health_rating || "moderate",
    calories: Number(scan.calories) || 0,
    protein: Number(scan.protein) || 0,
    carbohydrates: Number(scan.carbohydrates) || 0,
    fat: Number(scan.fat) || 0,
    fiber: Number(scan.fiber) || 0,
    sugar: Number(scan.sugar) || 0,
    sodium: Number(scan.sodium) || 0,
    nutritionData: {
      calories: Number(scan.calories) || 0,
      protein: Number(scan.protein) || 0,
      carbohydrates: Number(scan.carbohydrates) || 0,
      fat: Number(scan.fat) || 0,
      saturatedFat: Number(aiAnalysis?.saturatedFat) || 0,
      transFat: Number(aiAnalysis?.transFat) || 0,
      fiber: Number(scan.fiber) || 0,
      sugar: Number(scan.sugar) || 0,
      sodium: Number(scan.sodium) || 0,
      cholesterol: Number(aiAnalysis?.cholesterol) || 0,
    },
    servingSize: aiAnalysis?.servingSize || "1 serving",
    insights: (aiAnalysis?.insights as string[]) || [],
    warnings: (aiAnalysis?.warnings as string[]) || [],
    raw_ocr_text: scan.raw_ocr_text || "",
    created_at: scan.created_at || new Date().toISOString(),
  };
};

interface ScanResult {
  scanId?: string;
  productName: string;
  servingSize: string;
  nutritionData: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    saturatedFat: number;
    transFat: number;
    fiber: number;
    sugar: number;
    sodium: number;
    cholesterol: number;
  };
  healthScore: number;
  healthRating: "healthy" | "moderate" | "unhealthy";
  insights: string[];
  warnings: string[];
  rawOcrText: string;
  timestamp: string;
}

const SCANS_STORAGE_KEY = "nutrilens-scans";

function saveToLocalStorage(result: ScanResult) {
  try {
    const stored = localStorage.getItem(SCANS_STORAGE_KEY);
    const scans = stored ? JSON.parse(stored) : [];
    
    // Check if already saved - if exists, update it
    const existingIndex = scans.findIndex((s: { id: string }) => s.id === result.scanId);
    
    // Convert to Scan format (snake_case) that useScans expects
    const scanData = {
      id: result.scanId || `local-${Date.now()}`,
      product_name: result.productName,
      image_url: null,
      health_score: result.healthScore,
      health_rating: result.healthRating,
      calories: result.nutritionData.calories,
      protein: result.nutritionData.protein,
      carbohydrates: result.nutritionData.carbohydrates,
      fat: result.nutritionData.fat,
      fiber: result.nutritionData.fiber,
      sugar: result.nutritionData.sugar,
      sodium: result.nutritionData.sodium,
      raw_ocr_text: result.rawOcrText || null,
      ai_analysis: {
        servingSize: result.servingSize,
        saturatedFat: result.nutritionData.saturatedFat,
        transFat: result.nutritionData.transFat,
        cholesterol: result.nutritionData.cholesterol,
        insights: result.insights,
        warnings: result.warnings,
      },
      created_at: result.timestamp || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    if (existingIndex >= 0) {
      // Update existing scan
      scans[existingIndex] = { ...scans[existingIndex], ...scanData };
    } else {
      // Add to beginning of array
      scans.unshift(scanData);
      // Keep only last 50 scans
      if (scans.length > 50) scans.pop();
    }
    
    localStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(scans));
  } catch (err) {
    console.error("Failed to save scan to localStorage:", err);
  }
}

export default function Results() {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const { shareAsImage } = useShare();
  const { toast } = useToast();
  const { goals } = useHealthGoals();
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadResult = async () => {
      try {
        // First try to get from sessionStorage (for fresh scans)
        const sessionResult = sessionStorage.getItem("scan-result");
        if (sessionResult) {
          const parsed = JSON.parse(sessionResult);
          setResult(parsed);
          setLoading(false);
          // Save to localStorage for history
          saveToLocalStorage(parsed);
          // Clear after loading
          sessionStorage.removeItem("scan-result");
          return;
        }

        // Try to get from localStorage history
        const storedScans = localStorage.getItem(SCANS_STORAGE_KEY);
        if (storedScans && scanId && scanId !== "latest") {
          const scans = JSON.parse(storedScans);
          const scan = scans.find((s: { id: string }) => s.id === scanId);
          if (scan) {
            // Sanitize the scan data to prevent NaN values
            const sanitizedScan = sanitizeScanData(scan);
            setResult({
              scanId: sanitizedScan.id,
              productName: sanitizedScan.product_name || "Unknown Product",
              servingSize: sanitizedScan.servingSize || "1 serving",
              nutritionData: sanitizedScan.nutritionData || {
                calories: 0,
                protein: 0,
                carbohydrates: 0,
                fat: 0,
                saturatedFat: 0,
                transFat: 0,
                fiber: 0,
                sugar: 0,
                sodium: 0,
                cholesterol: 0,
              },
              healthScore: sanitizedScan.health_score || 0,
              healthRating: sanitizedScan.health_rating || "moderate",
              insights: sanitizedScan.insights || [],
              warnings: sanitizedScan.warnings || [],
              rawOcrText: sanitizedScan.raw_ocr_text || "",
              timestamp: sanitizedScan.created_at || new Date().toISOString(),
            });
            setLoading(false);
            return;
          }
        }

        // If scanId is provided and not "latest", fetch from database
        if (scanId && scanId !== "latest") {
          const client = supabase || supabaseClient;
          const { data, error: dbError } = await client
            .from("scans")
            .select("*")
            .eq("id", scanId)
            .single();

          if (dbError) throw dbError;

          if (data) {
            const aiAnalysis = data.ai_analysis as Record<string, unknown> | null;
            const loadedResult: ScanResult = {
              scanId: data.id,
              productName: data.product_name || "Unknown Product",
              servingSize: (aiAnalysis?.servingSize as string) || "1 serving",
              nutritionData: {
                calories: (data.calories && !isNaN(data.calories) && isFinite(data.calories)) ? data.calories : 0,
                protein: (data.protein && !isNaN(data.protein) && isFinite(data.protein)) ? data.protein : 0,
                carbohydrates: (data.carbohydrates && !isNaN(data.carbohydrates) && isFinite(data.carbohydrates)) ? data.carbohydrates : 0,
                fat: (data.fat && !isNaN(data.fat) && isFinite(data.fat)) ? data.fat : 0,
                saturatedFat: ((aiAnalysis?.saturatedFat as number) && !isNaN(aiAnalysis?.saturatedFat as number) && isFinite(aiAnalysis?.saturatedFat as number)) ? (aiAnalysis?.saturatedFat as number) : 0,
                transFat: ((aiAnalysis?.transFat as number) && !isNaN(aiAnalysis?.transFat as number) && isFinite(aiAnalysis?.transFat as number)) ? (aiAnalysis?.transFat as number) : 0,
                fiber: (data.fiber && !isNaN(data.fiber) && isFinite(data.fiber)) ? data.fiber : 0,
                sugar: (data.sugar && !isNaN(data.sugar) && isFinite(data.sugar)) ? data.sugar : 0,
                sodium: (data.sodium && !isNaN(data.sodium) && isFinite(data.sodium)) ? data.sodium : 0,
                cholesterol: ((aiAnalysis?.cholesterol as number) && !isNaN(aiAnalysis?.cholesterol as number) && isFinite(aiAnalysis?.cholesterol as number)) ? (aiAnalysis?.cholesterol as number) : 0,
              },
              healthScore: data.health_score || 50,
              healthRating: (data.health_rating as "healthy" | "moderate" | "unhealthy") || "moderate",
              insights: (aiAnalysis?.insights as string[]) || [],
              warnings: (aiAnalysis?.warnings as string[]) || [],
              rawOcrText: data.raw_ocr_text || "",
              timestamp: data.created_at,
            };
            setResult(loadedResult);
            saveToLocalStorage(loadedResult);
          }
        }
      } catch (err) {
        console.error("Error loading result:", err);
        setError("Failed to load scan results");
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [scanId]);

  const handleShare = async () => {
    if (!result) return;
    
    const { nutritionData, healthScore, healthRating } = result;
    await shareAsImage({
      productName: result.productName,
      healthScore,
      healthRating,
      calories: nutritionData.calories,
      protein: nutritionData.protein,
      carbs: nutritionData.carbohydrates,
      fat: nutritionData.fat,
    });
  };

  const handleDelete = () => {
    if (!result?.scanId) return;
    
    try {
      const storedScans = localStorage.getItem(SCANS_STORAGE_KEY);
      if (storedScans) {
        const scans = JSON.parse(storedScans);
        const updatedScans = scans.filter((scan: { id: string }) => scan.id !== result.scanId);
        localStorage.setItem(SCANS_STORAGE_KEY, JSON.stringify(updatedScans));
      }
      
      toast({
        title: "Scan deleted",
        description: "The scan has been removed from your history.",
      });
      
      navigate("/home");
    } catch (err) {
      toast({
        title: "Delete failed",
        description: "Failed to delete the scan.",
        variant: "destructive",
      });
    }
  };

  const getScoreMessage = (score: number) => {
    if (score >= 80) return "Excellent choice! This food is very nutritious.";
    if (score >= 60) return "Good choice. This food aligns with healthy eating guidelines.";
    if (score >= 40) return "Moderate choice. Consider limiting intake.";
    return "This food has nutritional concerns. Consume sparingly.";
  };

  const handleEditName = () => {
    if (result) {
      setEditedName(result.productName);
      setIsEditingName(true);
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  };

  const handleSaveName = () => {
    const trimmedName = editedName.trim();
    if (result && trimmedName && trimmedName.length <= 100) {
      const updatedResult = { ...result, productName: trimmedName };
      setResult(updatedResult);
      saveToLocalStorage(updatedResult);
      setIsEditingName(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName("");
  };

  if (loading) {
    return (
      <AppLayout showNav={false}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (error || !result) {
    return (
      <AppLayout showNav={false}>
        <Header title="Results" showBack />
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {error || "No Results Found"}
          </h2>
          <p className="text-muted-foreground mb-6">
            Try scanning a nutrition label again.
          </p>
          <Button onClick={() => navigate("/scan")}>
            <Camera className="w-5 h-5 mr-2" />
            Scan Again
          </Button>
        </div>
      </AppLayout>
    );
  }

  const { nutritionData, healthScore, healthRating, productName, insights, warnings } = result;
  const isHealthy = healthRating === "healthy";
  const isUnhealthy = healthRating === "unhealthy";

  // Get goal-based recommendations
  const goalRecommendations = goals
    ? analyzeForHealthGoals(nutritionData, goals)
    : [];

  // Adjust health score based on goals
  const adjustedHealthScore = goals
    ? adjustHealthScoreForGoals(healthScore, nutritionData, goals)
    : healthScore;

  // Combine AI insights, warnings, and goal-based recommendations
  const allInsights: { type: "positive" | "warning" | "info"; text: string }[] = [
    ...insights.map((text) => ({ type: "positive" as const, text })),
    ...warnings.map((text) => ({ type: "warning" as const, text })),
    ...goalRecommendations.map((rec) => ({ type: rec.type, text: rec.message })),
  ].slice(0, 8);

  return (
    <AppLayout showNav={false}>
      <Header
        title="Scan Results"
        showBack
        rightElement={
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this scan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{result.productName}" from your history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        }
      />

      <div className="p-4 space-y-6 pb-32">
        {/* Product Name - Editable */}
        <div className="text-center">
          {isEditingName ? (
            <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
              <Input
                ref={nameInputRef}
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveName();
                  if (e.key === "Escape") handleCancelEdit();
                }}
                maxLength={100}
                className="text-center font-bold"
                placeholder="Enter product name"
              />
              <Button size="icon" variant="ghost" onClick={handleSaveName} className="h-8 w-8">
                <Check className="h-4 w-4 text-primary" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleCancelEdit} className="h-8 w-8">
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{productName}</h2>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleEditName}
                className="h-7 w-7"
                title="Edit product name"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
          )}
          <p className="text-sm text-muted-foreground mt-1">{result.servingSize}</p>
        </div>

        {/* Health Score Ring */}
        <Card className="p-6 bg-card border-border">
          <div className="flex flex-col items-center">
            <HealthScoreRing score={adjustedHealthScore} size={140} strokeWidth={10} />
            <Badge
              className={`mt-4 text-sm px-4 py-1 ${
                adjustedHealthScore >= 65
                  ? "bg-healthy/10 text-healthy border-healthy/20"
                  : adjustedHealthScore < 40
                  ? "bg-unhealthy/10 text-unhealthy border-unhealthy/20"
                  : "bg-accent/10 text-accent border-accent/20"
              }`}
              variant="outline"
            >
              {adjustedHealthScore >= 65
                ? "Healthy Choice"
                : adjustedHealthScore < 40
                ? "Needs Improvement"
                : "Moderate"}
            </Badge>
            <p className="text-sm text-muted-foreground mt-3 text-center max-w-xs">
              {getScoreMessage(adjustedHealthScore)}
            </p>
            {goals && goalRecommendations.length > 0 && (
              <div className="mt-3 w-full">
                <p className="text-xs font-medium text-foreground mb-2 text-center">
                  Based on your health goals:
                </p>
                <div className="space-y-1">
                  {goalRecommendations.slice(0, 2).map((rec, idx) => (
                    <div
                      key={idx}
                      className={`text-xs px-2 py-1 rounded ${
                        rec.type === "positive"
                          ? "bg-healthy/10 text-healthy"
                          : rec.type === "warning"
                          ? "bg-unhealthy/10 text-unhealthy"
                          : "bg-accent/10 text-accent"
                      }`}
                    >
                      {rec.icon} {rec.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Macro Distribution Chart */}
        <MacroChart
          protein={parseFloat(formatNutrientValue(nutritionData.protein))}
          carbs={parseFloat(formatNutrientValue(nutritionData.carbohydrates))}
          fat={parseFloat(formatNutrientValue(nutritionData.fat))}
          className="bg-card border-border"
        />

        {/* Key Nutritional Highlights */}
        <section>
          <h2 className="font-semibold text-foreground mb-3">Key Highlights</h2>
          <div className="grid grid-cols-2 gap-3">
            <NutrientCard
              icon={Flame}
              label="Calories"
              value={formatNutrientValue(nutritionData.calories)}
              unit="kcal"
            />
            <NutrientCard
              icon={Wheat}
              label="Protein"
              value={formatNutrientValue(nutritionData.protein)}
              unit="g"
            />
            <NutrientCard
              icon={Droplets}
              label="Fat"
              value={formatNutrientValue(nutritionData.fat)}
              unit="g"
            />
            <NutrientCard
              icon={Cookie}
              label="Carbs"
              value={formatNutrientValue(nutritionData.carbohydrates)}
              unit="g"
            />
          </div>
        </section>

        {/* AI Insights & Goal-Based Recommendations */}
        {allInsights.length > 0 && (
          <section>
            <h2 className="font-semibold text-foreground mb-3">
              {goals ? "Personalized Insights" : "AI Insights"}
            </h2>
            <Card className="p-4 bg-card border-border">
              <div className="space-y-2">
                {allInsights.map((insight, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-2 p-2 rounded-lg ${
                      insight.type === "positive"
                        ? "bg-healthy/10"
                        : insight.type === "warning"
                        ? "bg-unhealthy/10"
                        : "bg-accent/10"
                    }`}
                  >
                    {insight.type === "positive" ? (
                      <Check className="w-4 h-4 text-healthy mt-0.5 flex-shrink-0" />
                    ) : insight.type === "warning" ? (
                      <AlertTriangle className="w-4 h-4 text-unhealthy mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                    )}
                    <span className="text-sm text-foreground">{insight.text}</span>
                  </div>
                ))}
              </div>
            </Card>
            {!goals && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Set your health goals in Settings for personalized recommendations
              </p>
            )}
          </section>
        )}

        {/* View Details Button */}
        <Button
          variant="outline"
          className="w-full h-12 justify-between"
          onClick={() =>
            navigate(`/details/${result.scanId || scanId}`, { state: { result } })
          }
        >
          View Detailed Breakdown
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 safe-bottom">
        <div className="flex gap-3 max-w-lg mx-auto">
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={() => navigate("/history")}
          >
            View History
          </Button>
          <Button
            className="flex-1 h-12 gradient-primary"
            onClick={() => navigate("/scan")}
          >
            <Camera className="w-5 h-5 mr-2" />
            Scan Another
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

function NutrientCard({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">
        {value}
        <span className="text-sm font-normal text-muted-foreground ml-1">
          {unit}
        </span>
      </p>
    </Card>
  );
}
