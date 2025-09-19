import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { fetchUsageStats } from "@/lib/stock-api";

export function UsageTracking() {
  const { data: usageData, isLoading } = useQuery({
    queryKey: ["usage"],
    queryFn: fetchUsageStats,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000, // Refresh every minute
  });

  const todayUsage = usageData?.today;
  const monthlyAnalyses = usageData?.monthlyAnalyses || 0;
  
  const progressPercentage = todayUsage ? 
    ((todayUsage.creditsUsed / (todayUsage.creditsUsed + todayUsage.creditsRemaining)) * 100) : 0;

  return (
    <Card data-testid="usage-tracking">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Usage & Billing</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-6 w-16 bg-muted animate-pulse rounded"></div>
              <div className="h-2 w-full bg-muted animate-pulse rounded"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-muted animate-pulse rounded"></div>
                <div className="h-16 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Analyses Remaining</span>
                <span 
                  className="font-bold text-lg text-primary" 
                  data-testid="text-credits-remaining"
                >
                  {todayUsage?.creditsRemaining || 10}
                </span>
              </div>
              
              <div className="space-y-2">
                <Progress 
                  value={progressPercentage} 
                  className="h-2"
                  data-testid="progress-usage"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{todayUsage?.creditsUsed || 0} used</span>
                  <span>{(todayUsage?.creditsUsed || 0) + (todayUsage?.creditsRemaining || 10)} total</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div 
                    className="font-bold text-lg text-foreground" 
                    data-testid="text-today-analyses"
                  >
                    {todayUsage?.portfolioAnalyses || 0}
                  </div>
                  <div className="text-muted-foreground">Today</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div 
                    className="font-bold text-lg text-foreground" 
                    data-testid="text-monthly-analyses"
                  >
                    {monthlyAnalyses}
                  </div>
                  <div className="text-muted-foreground">This Month</div>
                </div>
              </div>
              
              <Button 
                className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
                data-testid="button-upgrade"
              >
                Upgrade Plan
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
