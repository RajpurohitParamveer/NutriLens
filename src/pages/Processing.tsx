import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import { analyzeNutritionWithAI } from "@/services/ai-nutrition-service";
import { useTranslation } from "react-i18next";

type ProcessingStep = {
  id: string;
  label: string;
  status: "pending" | "active" | "complete" | "error";
};

const initialSteps: ProcessingStep[] = [
  { id: "analyze", label: "processing.analyzingImage", status: "pending" },
  { id: "extract", label: "processing.extractingData", status: "pending" },
  { id: "calculate", label: "processing.calculatingScore", status: "pending" },
];

export default function Processing() {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const [steps, setSteps] = useState<ProcessingStep[]>(initialSteps);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const updateStep = useCallback((stepId: string, status: ProcessingStep["status"]) => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  }, []);

  const processImage = useCallback(async () => {
    const image = sessionStorage.getItem("captured-image");
    
    if (!image) {
      setError(t('processing.noImageFound'));
      return;
    }
    
    setCapturedImage(image);

    try {
      // Step 1: Analyzing image with AI
      updateStep("analyze", "active");
      
      // Call the AI service with language
      const analysis = await analyzeNutritionWithAI(image, i18n.language);
      
      updateStep("analyze", "complete");

      // Step 2: Extracting nutrition data (already done by AI)
      updateStep("extract", "active");
      await new Promise((resolve) => setTimeout(resolve, 300));
      updateStep("extract", "complete");

      // Step 3: Calculating health score (already done by AI)
      updateStep("calculate", "active");
      await new Promise((resolve) => setTimeout(resolve, 300));
      updateStep("calculate", "complete");

      // Get user-provided serving size or use AI-detected one
      const userServingSize = sessionStorage.getItem("serving-size");
      const finalServingSize = userServingSize || analysis.servingSize;

      // Store results in sessionStorage for the results page
      sessionStorage.setItem("scan-result", JSON.stringify({
        scanId: `local-${Date.now()}`,
        productName: analysis.productName,
        servingSize: finalServingSize,
        nutritionData: {
          calories: analysis.calories,
          protein: analysis.protein,
          carbohydrates: analysis.carbohydrates,
          fat: analysis.fat,
          saturatedFat: analysis.saturatedFat,
          transFat: analysis.transFat,
          fiber: analysis.fiber,
          sugar: analysis.sugar,
          sodium: analysis.sodium,
          cholesterol: analysis.cholesterol,
        },
        healthScore: analysis.healthScore,
        healthRating: analysis.healthRating,
        insights: analysis.insights,
        warnings: analysis.warnings,
        rawOcrText: analysis.rawOcrText,
        timestamp: new Date().toISOString(),
      }));

      // Clean up serving size from sessionStorage
      sessionStorage.removeItem("serving-size");

      // Navigate to results
      await new Promise((resolve) => setTimeout(resolve, 300));
      navigate("/results/latest");
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Processing failed";
      console.error("Processing error:", err);
      setError(errorMessage);
      
      // Mark remaining steps as error
      setSteps((prev) =>
        prev.map((step) =>
          step.status === "pending" || step.status === "active"
            ? { ...step, status: "error" }
            : step
        )
      );
    }
  }, [navigate, updateStep]);

  useEffect(() => {
    processImage();
  }, [processImage]);

  const handleCancel = () => {
    sessionStorage.removeItem("captured-image");
    navigate("/scan");
  };

  const handleRetry = () => {
    setError(null);
    setSteps(initialSteps);
    processImage();
  };

  const currentStep = steps.find((s) => s.status === "active")?.label || 
                      (error ? t('processing.processingFailed') : t('processing.analyzingWithAI'));

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Image Preview */}
      {capturedImage && (
        <div className="w-20 h-20 rounded-xl overflow-hidden mb-6 ring-2 ring-border shadow-lg animate-fade-in-up">
          <img
            src={capturedImage}
            alt="Captured nutrition label"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Processing Animation */}
      <div className="relative mb-8">
        <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-colors ${
          error ? "border-destructive" : "border-muted"
        }`}>
          {error ? (
            <AlertCircle className="w-12 h-12 text-destructive" />
          ) : (
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          )}
        </div>
        {/* Pulse Ring - only show when not error */}
        {!error && (
          <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse-ring" />
        )}
      </div>

      {/* Status Text */}
      <h2 className={`text-xl font-semibold mb-2 transition-colors ${
        error ? "text-destructive" : "text-foreground"
      }`}>
        {error ? t('processing.processingFailed') : t('processing.analyzingWithAI')}
      </h2>
      <p className="text-muted-foreground mb-8 text-center max-w-xs">
        {error || currentStep}
      </p>

      {/* Progress Steps */}
      <div className="w-full max-w-xs space-y-3 mb-10">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 transition-opacity duration-300 ${
              step.status === "pending" ? "opacity-50" : "opacity-100"
            }`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                step.status === "complete"
                  ? "bg-primary text-primary-foreground"
                  : step.status === "active"
                  ? "bg-primary/20 text-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : step.status === "error"
                  ? "bg-destructive/20 text-destructive"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.status === "complete" ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : step.status === "error" ? (
                "×"
              ) : (
                index + 1
              )}
            </div>
            <span
              className={`text-sm transition-colors ${
                step.status === "complete" || step.status === "active"
                  ? "text-foreground"
                  : step.status === "error"
                  ? "text-destructive"
                  : "text-muted-foreground"
              }`}
            >
              {t(step.label)}
            </span>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        {error ? (
          <>
            <Button variant="outline" onClick={handleCancel}>
              {t('processing.backToScan')}
            </Button>
            <Button onClick={handleRetry}>
              {t('processing.tryAgain')}
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={handleCancel}>
            {t('processing.cancel')}
          </Button>
        )}
      </div>

      {/* Time Estimate */}
      {!error && (
        <p className="text-xs text-muted-foreground mt-6">
          {t('processing.aiAnalysisTime')}
        </p>
      )}
    </div>
  );
}
