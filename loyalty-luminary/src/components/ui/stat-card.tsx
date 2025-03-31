
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  style?: React.CSSProperties; // Add style prop
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  style, // Add style to destructured props
}: StatCardProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all hover:shadow-md dark:card-gradient-dark card-gradient-light", 
        className
      )} 
      style={style}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <CardDescription>
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center text-xs font-medium mr-2",
                  trend.isPositive ? "text-green-500" : "text-red-500"
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
            )}
            {description}
          </CardDescription>
        </div>
        {icon && (
          <div className={cn(
            "rounded-full p-2",
            "bg-gradient-to-br from-primary/20 to-primary/10"
          )}>
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
