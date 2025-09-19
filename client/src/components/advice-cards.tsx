import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdviceItem } from "@/types/stock";
import { getAdviceBackground, getAdviceColor } from "@/lib/advice-engine";

interface AdviceCardsProps {
  advice: AdviceItem[];
  isLoading?: boolean;
}

export function AdviceCards({ advice, isLoading }: AdviceCardsProps) {
  if (isLoading) {
    return (
      <Card data-testid="advice-cards-loading">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">AI Investment Advice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-muted rounded-lg p-4 animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-muted-foreground/20 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-muted-foreground/20 rounded"></div>
                    <div className="h-4 w-full bg-muted-foreground/20 rounded"></div>
                    <div className="h-4 w-3/4 bg-muted-foreground/20 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="advice-cards">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">AI Investment Advice</CardTitle>
        {advice.length > 0 && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span>Updated just now</span>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {advice.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Run portfolio analysis to get AI-powered investment advice</p>
          </div>
        ) : (
          <div className="space-y-4">
            {advice.map((item, index) => (
              <div
                key={index}
                className={`${getAdviceBackground(item.type)} rounded-lg p-4 transition-all duration-300 hover:shadow-md border-l-4 border-l-transparent hover:border-l-current`}
                data-testid={`advice-card-${item.type.toLowerCase()}-${index}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-background/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg">{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge 
                        variant={getAdviceColor(item.type) as any}
                        className="text-xs font-semibold"
                        data-testid={`badge-${item.type.toLowerCase()}`}
                      >
                        {item.type}
                      </Badge>
                      {item.ticker && (
                        <span className="text-sm text-muted-foreground font-medium" data-testid={`text-ticker-${item.ticker}`}>
                          {item.ticker}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-card-foreground leading-relaxed" data-testid={`text-advice-${index}`}>
                      {item.message}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      data-testid={`badge-confidence-${item.confidence.toLowerCase()}`}
                    >
                      {item.confidence}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
