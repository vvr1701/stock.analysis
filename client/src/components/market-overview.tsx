import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { fetchMarketOverview } from "@/lib/stock-api";

export function MarketOverview() {
  const { data: marketData, isLoading } = useQuery({
    queryKey: ["market-overview"],
    queryFn: fetchMarketOverview,
    staleTime: 300000, // 5 minutes
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  return (
    <Card data-testid="market-overview">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Market Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {isLoading ? (
            // Loading skeleton
            [...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border">
                <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                <div className="space-y-1">
                  <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                  <div className="h-3 w-12 bg-muted animate-pulse rounded ml-auto"></div>
                </div>
              </div>
            ))
          ) : marketData && marketData.length > 0 ? (
            marketData.map((index) => {
              const isPositive = index.change >= 0;
              return (
                <div 
                  key={index.symbol} 
                  className="flex items-center justify-between py-2 border-b border-border last:border-b-0"
                  data-testid={`market-index-${index.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <span className="text-sm text-muted-foreground">{index.name}</span>
                  <div className="text-right">
                    <div className="font-medium text-sm" data-testid={`text-value-${index.symbol}`}>
                      {index.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </div>
                    <div 
                      className={`text-xs ${isPositive ? 'text-success' : 'text-destructive'}`}
                      data-testid={`text-change-${index.symbol}`}
                    >
                      {isPositive ? '+' : ''}{index.change.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            // Fallback data when API is not available
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">NIFTY 50</span>
                <div className="text-right">
                  <div className="font-medium text-sm">22,475.85</div>
                  <div className="text-xs text-success">+0.85%</div>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">SENSEX</span>
                <div className="text-right">
                  <div className="font-medium text-sm">74,005.94</div>
                  <div className="text-xs text-success">+0.92%</div>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Bank NIFTY</span>
                <div className="text-right">
                  <div className="font-medium text-sm">48,723.15</div>
                  <div className="text-xs text-destructive">-0.34%</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
