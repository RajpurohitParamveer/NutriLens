import nutrilensLogo from "@/assets/nutrilens-logo.png";
import nutrilensIcon from "@/assets/nutrilens-icon.png";

interface NutriLensLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-7 sm:h-8",
  md: "h-10 sm:h-12",
  lg: "h-14 sm:h-16",
  xl: "h-20 sm:h-24",
};

const iconSizeClasses = {
  sm: "h-7 w-7 sm:h-8 sm:w-8",
  md: "h-9 w-9 sm:h-10 sm:w-10",
  lg: "h-14 w-14 sm:h-16 sm:w-16",
  xl: "h-20 w-20 sm:h-24 sm:w-24",
};

export function NutriLensLogo({ size = "md", className = "" }: NutriLensLogoProps) {
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={nutrilensLogo} 
        alt="NutriLens" 
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
    </div>
  );
}

export function NutriLensIcon({ size = "md", className = "" }: Omit<NutriLensLogoProps, "showText">) {
  return (
    <img 
      src={nutrilensIcon} 
      alt="NutriLens" 
      className={`${iconSizeClasses[size]} object-contain ${className}`}
    />
  );
}
