
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, Ticket, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface OrganizationCardProps {
  id: string;
  name: string;
  description: string;
  couponsCount: number;
  membersCount: number;
  className?: string;
  style?: React.CSSProperties; // Add style prop
}

export function OrganizationCard({ 
  id, 
  name, 
  description, 
  couponsCount, 
  membersCount,
  className,
  style, // Add style to destructured props
}: OrganizationCardProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all hover:shadow-md dark:card-gradient-dark card-gradient-light", 
        className
      )} 
      style={style}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center space-x-2">
          <div className={cn(
            "rounded-full p-2",
            "bg-gradient-to-br from-primary/20 to-primary/10"
          )}>
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl">{name}</CardTitle>
        </div>
        <CardDescription className="line-clamp-2 mt-2 ">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-4 text-sm">
          <div className="flex items-center">
            <Ticket className="mr-1 h-4 w-4 text-muted-foreground" />
            <span>{couponsCount} coupon</span>
          </div>
          <div className="flex items-center">
            <Users className="mr-1 h-4 w-4 text-muted-foreground" />
            <span>{membersCount} members</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Button 
          asChild 
          className={cn(
            "w-full",
            "bg-gradient-primary-light dark:bg-gradient-primary-dark hover:opacity-90"
          )}
        >
          <Link to={`/organizations/${id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
