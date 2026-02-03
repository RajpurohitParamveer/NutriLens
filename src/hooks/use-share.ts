import { toast } from "@/hooks/use-toast";

interface NutritionShareData {
  productName: string;
  healthScore: number;
  healthRating: "healthy" | "moderate" | "unhealthy";
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function getHealthColor(rating: "healthy" | "moderate" | "unhealthy"): string {
  if (rating === "healthy") return "#22c55e";
  if (rating === "unhealthy") return "#ef4444";
  return "#f59e0b";
}

function getRatingLabel(rating: "healthy" | "moderate" | "unhealthy"): string {
  if (rating === "healthy") return "Healthy Choice";
  if (rating === "unhealthy") return "Needs Improvement";
  return "Moderate";
}

async function generateShareImage(data: NutritionShareData): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  
  // Set canvas size (Instagram story friendly)
  canvas.width = 540;
  canvas.height = 720;
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#f0fdf4");
  gradient.addColorStop(1, "#ecfdf5");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add subtle pattern
  ctx.fillStyle = "rgba(16, 185, 129, 0.03)";
  for (let i = 0; i < canvas.width; i += 40) {
    for (let j = 0; j < canvas.height; j += 40) {
      ctx.beginPath();
      ctx.arc(i, j, 15, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Header bar
  ctx.fillStyle = "#10b981";
  ctx.fillRect(0, 0, canvas.width, 80);
  
  // App name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🍃 NutriLens", canvas.width / 2, 50);
  
  // Product name
  ctx.fillStyle = "#1f2937";
  ctx.font = "bold 32px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  const productName = data.productName.length > 25 
    ? data.productName.substring(0, 25) + "..." 
    : data.productName;
  ctx.fillText(productName, canvas.width / 2, 140);
  
  // Health score circle
  const centerX = canvas.width / 2;
  const centerY = 280;
  const radius = 80;
  
  // Background circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 8;
  ctx.stroke();
  
  // Score arc
  const scoreAngle = (data.healthScore / 100) * Math.PI * 2 - Math.PI / 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, -Math.PI / 2, scoreAngle);
  ctx.strokeStyle = getHealthColor(data.healthRating);
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.stroke();
  
  // Score text
  ctx.fillStyle = "#1f2937";
  ctx.font = "bold 48px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(data.healthScore.toString(), centerX, centerY - 5);
  
  ctx.font = "16px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#6b7280";
  ctx.fillText("Health Score", centerX, centerY + 30);
  
  // Rating badge
  const badgeY = 400;
  ctx.fillStyle = getHealthColor(data.healthRating);
  ctx.globalAlpha = 0.15;
  const badgeWidth = 180;
  const badgeHeight = 36;
  ctx.beginPath();
  ctx.roundRect(centerX - badgeWidth / 2, badgeY - badgeHeight / 2, badgeWidth, badgeHeight, 18);
  ctx.fill();
  ctx.globalAlpha = 1;
  
  ctx.fillStyle = getHealthColor(data.healthRating);
  ctx.font = "bold 16px Inter, system-ui, sans-serif";
  ctx.fillText(getRatingLabel(data.healthRating), centerX, badgeY + 5);
  
  // Nutrition facts card
  const cardY = 460;
  const cardHeight = 180;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(40, cardY, canvas.width - 80, cardHeight, 16);
  ctx.fill();
  ctx.strokeStyle = "#e5e7eb";
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Nutrition title
  ctx.fillStyle = "#1f2937";
  ctx.font = "bold 18px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Nutrition Facts", 60, cardY + 35);
  
  // Nutrition items
  const items = [
    { label: "Calories", value: `${data.calories} kcal`, icon: "🔥" },
    { label: "Protein", value: `${data.protein}g`, icon: "💪" },
    { label: "Carbs", value: `${data.carbs}g`, icon: "🌾" },
    { label: "Fat", value: `${data.fat}g`, icon: "🧈" },
  ];
  
  const startY = cardY + 70;
  const colWidth = (canvas.width - 80) / 2;
  
  items.forEach((item, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 60 + col * colWidth;
    const y = startY + row * 50;
    
    ctx.font = "20px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#1f2937";
    ctx.textAlign = "left";
    ctx.fillText(`${item.icon} ${item.label}`, x, y);
    
    ctx.font = "bold 20px Inter, system-ui, sans-serif";
    ctx.fillStyle = "#10b981";
    ctx.fillText(item.value, x, y + 25);
  });
  
  // Footer
  ctx.fillStyle = "#9ca3af";
  ctx.font = "14px Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Scanned with NutriLens", canvas.width / 2, canvas.height - 30);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!);
    }, "image/png", 1.0);
  });
}

export function useShare() {
  const canShare = typeof navigator !== "undefined" && !!navigator.share;
  const canShareFiles = canShare && !!navigator.canShare;

  const shareAsImage = async (data: NutritionShareData) => {
    try {
      const imageBlob = await generateShareImage(data);
      const file = new File([imageBlob], `nutrilens-${data.productName.replace(/\s+/g, "-")}.png`, {
        type: "image/png",
      });

      // Check if device supports file sharing
      if (canShareFiles && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `NutriLens: ${data.productName}`,
          text: `Health Score: ${data.healthScore}/100`,
        });
        return true;
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(imageBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `nutrilens-${data.productName.replace(/\s+/g, "-")}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Image downloaded",
          description: "Share the downloaded image with your friends!",
        });
        return true;
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Share failed:", error);
        toast({
          title: "Share failed",
          description: "Could not share the image. Please try again.",
          variant: "destructive",
        });
      }
      return false;
    }
  };

  return { shareAsImage, canShare };
}
