import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useBackButton } from "@/hooks/use-back-button";
import ErrorBoundary from "@/components/ErrorBoundary";
import Welcome, { isFirstLaunch } from "./pages/Welcome";
import Home from "./pages/Home";
import Scan from "./pages/Scan";
import Processing from "./pages/Processing";
import Results from "./pages/Results";
import Details from "./pages/Details";
import History from "./pages/History";
import Profile from "./pages/Profile";
import HealthGoals from "./pages/HealthGoals";
import StepGoal from "./pages/StepGoal";
import Steps from "./pages/Steps";
import NutritionSummary from "./pages/NutritionSummary";
import Achievements from "./pages/Achievements";
import Trends from "./pages/Trends";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function RootRedirect() {
  return isFirstLaunch() ? <Welcome /> : <Navigate to="/home" replace />;
}

function AppRoutes() {
  useBackButton();

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/home" element={<Home />} />
      <Route path="/scan" element={<Scan />} />
      <Route path="/processing" element={<Processing />} />
      <Route path="/results/:scanId" element={<Results />} />
      <Route path="/details/:scanId" element={<Details />} />
      <Route path="/history" element={<History />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/health-goals" element={<HealthGoals />} />
      <Route path="/step-goal" element={<StepGoal />} />
      <Route path="/steps" element={<Steps />} />
      <Route path="/nutrition-summary" element={<NutritionSummary />} />
      <Route path="/achievements" element={<Achievements />} />
      <Route path="/trends" element={<Trends />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
