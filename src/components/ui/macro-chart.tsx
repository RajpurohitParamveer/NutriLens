import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { Card } from "./card";

interface MacroChartProps {
  protein: number;
  carbs: number;
  fat: number;
  className?: string;
}

export function MacroChart({ protein, carbs, fat, className }: MacroChartProps) {
  const total = protein + carbs + fat;
  
  const data = [
    { name: "Protein", value: protein, color: "hsl(var(--primary))" },
    { name: "Carbs", value: carbs, color: "hsl(var(--accent))" },
    { name: "Fat", value: fat, color: "hsl(var(--unhealthy))" },
  ];

  const proteinPercent = total > 0 ? Math.round((protein / total) * 100) : 0;
  const carbsPercent = total > 0 ? Math.round((carbs / total) * 100) : 0;
  const fatPercent = total > 0 ? Math.round((fat / total) * 100) : 0;

  return (
    <Card className={className}>
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-4">Macro Distribution</h3>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-4 mt-2">
          <MacroLegendItem label="Protein" value={`${proteinPercent}%`} color="bg-primary" />
          <MacroLegendItem label="Carbs" value={`${carbsPercent}%`} color="bg-accent" />
          <MacroLegendItem label="Fat" value={`${fatPercent}%`} color="bg-unhealthy" />
        </div>
      </div>
    </Card>
  );
}

function MacroLegendItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <div className="text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground ml-1">{value}</span>
      </div>
    </div>
  );
}
