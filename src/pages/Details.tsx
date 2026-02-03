import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MacroChart } from "@/components/ui/macro-chart";
import { useShare } from "@/hooks/use-share";
import { Share2, Download, Check, AlertTriangle, Info, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase, supabaseClient } from "@/integrations/supabase/client";

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

export default function Details() {
  const { scanId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { shareAsImage } = useShare();
  const [result, setResult] = useState<ScanResult | null>(
    location.state?.result || null
  );
  const [loading, setLoading] = useState(!location.state?.result);

  useEffect(() => {
    const loadFromDatabase = async () => {
      if (result || !scanId || scanId === "latest") {
        setLoading(false);
        return;
      }

      try {
        const client = supabase || supabaseClient;
        const { data, error } = await client
          .from("scans")
          .select("*")
          .eq("id", scanId)
          .single();

        if (error) throw error;

        if (data) {
          const aiAnalysis = data.ai_analysis as Record<string, unknown> | null;
          setResult({
            scanId: data.id,
            productName: data.product_name || "Unknown Product",
            servingSize: (aiAnalysis?.servingSize as string) || "1 serving",
            nutritionData: {
              calories: data.calories || 0,
              protein: data.protein || 0,
              carbohydrates: data.carbohydrates || 0,
              fat: data.fat || 0,
              saturatedFat: (aiAnalysis?.saturatedFat as number) || 0,
              transFat: (aiAnalysis?.transFat as number) || 0,
              fiber: data.fiber || 0,
              sugar: data.sugar || 0,
              sodium: data.sodium || 0,
              cholesterol: (aiAnalysis?.cholesterol as number) || 0,
            },
            healthScore: data.health_score || 50,
            healthRating: (data.health_rating as "healthy" | "moderate" | "unhealthy") || "moderate",
            insights: (aiAnalysis?.insights as string[]) || [],
            warnings: (aiAnalysis?.warnings as string[]) || [],
            rawOcrText: data.raw_ocr_text || "",
            timestamp: data.created_at,
          });
        }
      } catch (err) {
        console.error("Error loading details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadFromDatabase();
  }, [scanId, result]);

  if (loading) {
    return (
      <AppLayout showNav={false}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!result) {
    return (
      <AppLayout showNav={false}>
        <Header title="Details" showBack />
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">
            No Details Found
          </h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </AppLayout>
    );
  }

  const { nutritionData, productName, servingSize, healthScore, insights, warnings } = result;

  // Calculate daily values based on a 2000 calorie diet
  const nutritionFacts = [
    { label: "Calories", value: `${nutritionData.calories}`, daily: Math.round((nutritionData.calories / 2000) * 100), unit: "kcal" },
    { label: "Total Fat", value: `${nutritionData.fat}g`, daily: Math.round((nutritionData.fat / 65) * 100), unit: "" },
    { label: "Saturated Fat", value: `${nutritionData.saturatedFat}g`, daily: Math.round((nutritionData.saturatedFat / 20) * 100), unit: "" },
    { label: "Trans Fat", value: `${nutritionData.transFat}g`, daily: null, unit: "" },
    { label: "Cholesterol", value: `${nutritionData.cholesterol}mg`, daily: Math.round((nutritionData.cholesterol / 300) * 100), unit: "" },
    { label: "Sodium", value: `${nutritionData.sodium}mg`, daily: Math.round((nutritionData.sodium / 2300) * 100), unit: "" },
    { label: "Total Carbs", value: `${nutritionData.carbohydrates}g`, daily: Math.round((nutritionData.carbohydrates / 300) * 100), unit: "" },
    { label: "Dietary Fiber", value: `${nutritionData.fiber}g`, daily: Math.round((nutritionData.fiber / 28) * 100), unit: "" },
    { label: "Total Sugars", value: `${nutritionData.sugar}g`, daily: null, unit: "" },
    { label: "Protein", value: `${nutritionData.protein}g`, daily: Math.round((nutritionData.protein / 50) * 100), unit: "" },
  ];

  const handleShare = async () => {
    await shareAsImage({
      productName,
      healthScore,
      healthRating: result.healthRating,
      calories: nutritionData.calories,
      protein: nutritionData.protein,
      carbs: nutritionData.carbohydrates,
      fat: nutritionData.fat,
    });
  };

  const handleExport = () => {
    const csvContent = [
      ["Nutrient", "Value", "% Daily Value"],
      ...nutritionFacts.map((f) => [f.label, f.value, f.daily ? `${f.daily}%` : "N/A"]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nutrition-${productName.replace(/\s+/g, "-").toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported Successfully",
      description: "Nutrition data saved as CSV file.",
    });
  };

  // Combine AI insights and warnings
  const allInsights: { type: "positive" | "warning" | "info"; text: string }[] = [
    ...insights.map((text) => ({ type: "positive" as const, text })),
    ...warnings.map((text) => ({ type: "warning" as const, text })),
  ];

  return (
    <AppLayout showNav={false}>
      <Header
        title="Nutrition Details"
        showBack
        rightElement={
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleExport}>
              <Download className="h-5 w-5" />
            </Button>
          </div>
        }
      />

      <div className="p-4 space-y-6 pb-8">
        {/* Product Info */}
        <Card className="p-4 bg-card border-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
              <span className="text-2xl">🥗</span>
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{productName}</h2>
              <p className="text-sm text-muted-foreground">
                Serving Size: {servingSize}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Health Score: {healthScore}/100
              </p>
            </div>
          </div>
        </Card>

        {/* Macro Distribution */}
        <MacroChart
          protein={nutritionData.protein}
          carbs={nutritionData.carbohydrates}
          fat={nutritionData.fat}
          className="bg-card border-border"
        />

        {/* Nutrition Facts Table */}
        <Card className="p-4 bg-card border-border">
          <h3 className="font-bold text-lg text-foreground border-b border-border pb-2 mb-3">
            Nutrition Facts
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            % Daily Value based on a 2,000 calorie diet
          </p>
          <div className="space-y-3">
            {nutritionFacts.map((item, index) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm ${
                      index === 0 ? "font-semibold" : ""
                    } text-foreground`}
                  >
                    {item.label}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {item.value}
                  </span>
                </div>
                {item.daily !== null && (
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={Math.min(item.daily, 100)} 
                      className="h-2 flex-1" 
                    />
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {item.daily}% DV
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* AI Nutritional Insights */}
        {allInsights.length > 0 && (
          <Card className="p-4 bg-card border-border">
            <h3 className="font-semibold text-foreground mb-3">AI Nutritional Insights</h3>
            <div className="space-y-2">
              {allInsights.map((insight, index) => (
                <InsightItem key={index} type={insight.type} text={insight.text} />
              ))}
            </div>
          </Card>
        )}

        {/* Daily Intake Note */}
        <Card className="p-4 bg-muted/30 border-border">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-foreground font-medium">About Daily Values</p>
              <p className="text-xs text-muted-foreground mt-1">
                The % Daily Value (DV) tells you how much a nutrient in a serving of food 
                contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
              </p>
            </div>
          </div>
        </Card>

        {/* Back to Results */}
        <Button
          variant="outline"
          className="w-full h-12"
          onClick={() => navigate(-1)}
        >
          Back to Results
        </Button>
      </div>
    </AppLayout>
  );
}

function InsightItem({
  type,
  text,
}: {
  type: "positive" | "warning" | "info";
  text: string;
}) {
  const icons = {
    positive: <Check className="w-4 h-4 text-healthy" />,
    warning: <AlertTriangle className="w-4 h-4 text-accent" />,
    info: <Info className="w-4 h-4 text-primary" />,
  };

  const bgColors = {
    positive: "bg-healthy/10",
    warning: "bg-accent/10",
    info: "bg-primary/10",
  };

  return (
    <div className={`flex items-start gap-2 p-3 ${bgColors[type]} rounded-lg`}>
      <span className="flex-shrink-0 mt-0.5">{icons[type]}</span>
      <span className="text-sm text-foreground">{text}</span>
    </div>
  );
}
