import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NutriLensLogo } from "@/components/NutriLensLogo";
import { Camera, Sparkles, Shield } from "lucide-react";

const FIRST_LAUNCH_KEY = "nutrilens-has-launched";

export function markAppAsLaunched() {
  localStorage.setItem(FIRST_LAUNCH_KEY, "true");
}

export function isFirstLaunch(): boolean {
  return localStorage.getItem(FIRST_LAUNCH_KEY) !== "true";
}

export default function Welcome() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    markAppAsLaunched();
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-8 animate-fade-in">
          <NutriLensLogo size="lg" />
        </div>

        {/* Tagline */}
        <h1 className="text-3xl font-bold text-foreground text-center mb-3 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Scan. Analyze. Eat Better.
        </h1>
        <p className="text-muted-foreground text-center max-w-xs mb-10 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          Make informed dietary choices by scanning nutrition labels instantly with AI
        </p>

        {/* Features */}
        <div className="w-full max-w-sm space-y-4 mb-10">
          <FeatureItem
            icon={Camera}
            title="Instant Scanning"
            description="Point your camera at any nutrition label"
            delay="0.2s"
          />
          <FeatureItem
            icon={Sparkles}
            title="AI-Powered Analysis"
            description="Get health scores and insights in seconds"
            delay="0.25s"
          />
          <FeatureItem
            icon={Shield}
            title="No Account Required"
            description="Start scanning immediately, no sign-up needed"
            delay="0.3s"
          />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="p-6 pb-10 animate-fade-in" style={{ animationDelay: "0.35s" }}>
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold gradient-primary shadow-primary hover:opacity-90 transition-all"
          onClick={handleGetStarted}
        >
          Get Started
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-4">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}

function FeatureItem({
  icon: Icon,
  title,
  description,
  delay,
}: {
  icon: typeof Camera;
  title: string;
  description: string;
  delay: string;
}) {
  return (
    <div 
      className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border animate-fade-in"
      style={{ animationDelay: delay }}
    >
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h3 className="font-medium text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
