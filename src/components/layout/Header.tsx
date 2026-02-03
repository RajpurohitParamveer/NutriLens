import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  rightElement?: ReactNode;
}

export function Header({ title, showBack = false, rightElement }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border safe-top w-full">
      <div className="flex items-center justify-between h-14 px-4 safe-left safe-right">
        <div className="flex items-center gap-2 sm:gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          )}
          {title && (
            <h1 className="text-base sm:text-lg font-semibold text-foreground">{title}</h1>
          )}
        </div>
        {rightElement && <div className="flex items-center">{rightElement}</div>}
      </div>
    </header>
  );
}
