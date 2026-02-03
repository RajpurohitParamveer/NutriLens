import { useState } from "react";
import { usePWAInstall } from "@/hooks/use-pwa-install";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Share, X } from "lucide-react";

export function PWAInstallPrompt() {
  const { canInstall, isIOS, promptInstall, isInstalled } = usePWAInstall();
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem("pwa-install-dismissed") === "true";
  });

  if (!canInstall || dismissed || isInstalled) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  const handleInstall = async () => {
    if (isIOS) {
      // Can't programmatically install on iOS, just show instructions
      return;
    }
    await promptInstall();
  };

  return (
    <Card className="fixed bottom-20 left-4 right-4 z-50 border-primary/20 shadow-lg animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-sm">Install NutriLens</h3>
            {isIOS ? (
              <p className="text-xs text-muted-foreground mt-1">
                Tap <Share className="w-3 h-3 inline mx-1" /> then "Add to Home Screen"
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Install for quick access and offline use
              </p>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {!isIOS && (
          <Button
            onClick={handleInstall}
            size="sm"
            className="w-full mt-3 gradient-primary"
          >
            Install App
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
