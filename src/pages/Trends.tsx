import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useScans } from "@/hooks/use-scans";
import { useSteps } from "@/hooks/use-steps";
import { format, subDays, startOfWeek, startOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Calendar, Footprints } from "lucide-react";

export default function Trends() {
  const navigate = useNavigate();
  const { scans } = useScans();
  const { weeklySteps } = useSteps();
  const [timeRange, setTimeRange] = useState<"week" | "month">("week");

  // Prepare weekly data
  const weeklyData = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days = eachDayOfInterval({
      start: weekStart,
      end: new Date(),
    });

    return days.map((day) => {
      const dayScans = scans.filter((scan) => {
        const scanDate = new Date(scan.created_at);
        return isSameDay(scanDate, day);
      });

      const totalCalories = dayScans.reduce((sum, s) => sum + (s.calories || 0), 0);
      const avgHealthScore =
        dayScans.length > 0
          ? dayScans.reduce((sum, s) => sum + (s.health_score || 0), 0) / dayScans.length
          : 0;
      const healthyCount = dayScans.filter((s) => s.health_rating === "healthy").length;

      return {
        date: format(day, "EEE"),
        fullDate: format(day, "MMM d"),
        scans: dayScans.length,
        calories: Math.round(totalCalories),
        healthScore: Math.round(avgHealthScore),
        healthy: healthyCount,
        unhealthy: dayScans.filter((s) => s.health_rating === "unhealthy").length,
      };
    });
  }, [scans]);

  // Prepare monthly data
  const monthlyData = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const days = eachDayOfInterval({
      start: monthStart,
      end: new Date(),
    });

    // Group by week
    const weeks: Record<string, typeof weeklyData> = {};
    days.forEach((day) => {
      const weekKey = format(startOfWeek(day, { weekStartsOn: 1 }), "MMM d");
      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }

      const dayScans = scans.filter((scan) => {
        const scanDate = new Date(scan.created_at);
        return isSameDay(scanDate, day);
      });

      const totalCalories = dayScans.reduce((sum, s) => sum + (s.calories || 0), 0);
      const avgHealthScore =
        dayScans.length > 0
          ? dayScans.reduce((sum, s) => sum + (s.health_score || 0), 0) / dayScans.length
          : 0;

      weeks[weekKey].push({
        date: format(day, "EEE"),
        fullDate: format(day, "MMM d"),
        scans: dayScans.length,
        calories: Math.round(totalCalories),
        healthScore: Math.round(avgHealthScore),
        healthy: dayScans.filter((s) => s.health_rating === "healthy").length,
        unhealthy: dayScans.filter((s) => s.health_rating === "unhealthy").length,
      });
    });

    // Aggregate by week
    return Object.entries(weeks).map(([week, days]) => ({
      week,
      scans: days.reduce((sum, d) => sum + d.scans, 0),
      calories: days.reduce((sum, d) => sum + d.calories, 0),
      healthScore: Math.round(
        days.reduce((sum, d) => sum + d.healthScore, 0) / days.length || 0
      ),
      healthy: days.reduce((sum, d) => sum + d.healthy, 0),
      unhealthy: days.reduce((sum, d) => sum + d.unhealthy, 0),
    }));
  }, [scans]);

  const chartData = timeRange === "week" ? weeklyData : monthlyData;

  // Steps data
  const stepsChartData = useMemo(() => {
    return weeklySteps.map((day) => ({
      date: format(new Date(day.date), "EEE"),
      steps: day.steps,
      distance: Math.round((day.steps / 1300) * 100) / 100,
    }));
  }, [weeklySteps]);

  return (
    <AppLayout showNav={false}>
      <Header title="Trends & Analytics" showBack />

      <div className="p-4 space-y-6 pb-32">
        {/* Time Range Selector */}
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as "week" | "month")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="space-y-6 mt-4">
            {/* Scans Trend */}
            <Card className="p-4 bg-card border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Scans This Week
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="scans" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Calories Trend */}
            <Card className="p-4 bg-card border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Calories Trend
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Health Score Trend */}
            <Card className="p-4 bg-card border-border">
              <h3 className="font-semibold text-foreground mb-4">Health Score Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="healthScore"
                    stroke="hsl(var(--healthy))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Steps Trend */}
            {stepsChartData.length > 0 && (
              <Card className="p-4 bg-card border-border">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Footprints className="w-5 h-5 text-accent" />
                  Steps This Week
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={stepsChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="steps" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="month" className="space-y-6 mt-4">
            {/* Monthly Scans */}
            <Card className="p-4 bg-card border-border">
              <h3 className="font-semibold text-foreground mb-4">Scans This Month</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="scans" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Monthly Calories */}
            <Card className="p-4 bg-card border-border">
              <h3 className="font-semibold text-foreground mb-4">Monthly Calories</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
