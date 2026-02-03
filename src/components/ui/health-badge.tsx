import { cn } from "@/lib/utils";

interface HealthScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function HealthScoreBadge({ 
  score, 
  size = "md", 
  showLabel = false,
  className 
}: HealthScoreBadgeProps) {
  const isHealthy = score >= 60;
  
  const sizeClasses = {
    sm: "w-10 h-10 text-sm",
    md: "w-16 h-16 text-xl",
    lg: "w-24 h-24 text-3xl",
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div
        className={cn(
          "rounded-full flex items-center justify-center font-bold",
          sizeClasses[size],
          isHealthy
            ? "bg-healthy/10 text-healthy"
            : "bg-unhealthy/10 text-unhealthy"
        )}
      >
        {score}
      </div>
      {showLabel && (
        <span
          className={cn(
            "text-sm font-medium px-3 py-1 rounded-full",
            isHealthy
              ? "bg-healthy/10 text-healthy"
              : "bg-unhealthy/10 text-unhealthy"
          )}
        >
          {isHealthy ? "Healthy" : "Unhealthy"}
        </span>
      )}
    </div>
  );
}

interface NutrientBadgeProps {
  label: string;
  value: string;
  unit: string;
  icon?: React.ReactNode;
  className?: string;
}

export function NutrientBadge({ 
  label, 
  value, 
  unit, 
  icon,
  className 
}: NutrientBadgeProps) {
  return (
    <div className={cn(
      "p-4 bg-card border border-border rounded-xl",
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-primary">{icon}</span>}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">
        {value}
        <span className="text-sm font-normal text-muted-foreground ml-1">
          {unit}
        </span>
      </p>
    </div>
  );
}
