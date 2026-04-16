import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export function StatsCard({ title, value, icon, trend, trendUp }: StatsCardProps) {
  return (
    <Card className="border-none shadow-lg shadow-black/5 bg-white/50 backdrop-blur-sm overflow-hidden hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-3xl font-display font-bold text-foreground">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl bg-primary/10 text-primary`}>
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-xs font-medium">
            <span className={trendUp ? "text-green-600" : "text-red-500"}>
              {trendUp ? "↑" : "↓"} {trend}
            </span>
            <span className="text-muted-foreground ml-2">from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
