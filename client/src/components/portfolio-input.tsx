import { useState } from "react";
import { Plus, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchStockData, analyzePortfolio } from "@/lib/stock-api";
import { StockData } from "@/types/stock";
import { useToast } from "@/hooks/use-toast";

interface PortfolioInputProps {
  onAnalysisComplete?: (data: any) => void;
}

export function PortfolioInput({ onAnalysisComplete }: PortfolioInputProps) {
  const [newTicker, setNewTicker] = useState("");
  const [newQuantity, setNewQuantity] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const { portfolio, addStock, removeStock, updateQuantity } = usePortfolio();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch stock data for current portfolio
  const { data: stockData, isLoading, refetch } = useQuery({
    queryKey: ["stock-data", portfolio.map(s => s.ticker)],
    queryFn: () => fetchStockData(portfolio.map(s => s.ticker)),
    enabled: portfolio.length > 0,
    staleTime: 60000, // 1 minute
  });

  // Portfolio analysis mutation
  const analysisMutation = useMutation({
    mutationFn: analyzePortfolio,
    onSuccess: (data) => {
      toast({
        title: "Analysis Complete",
        description: "Your portfolio has been analyzed successfully",
      });
      onAnalysisComplete?.(data);
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze portfolio",
        variant: "destructive",
      });
    },
  });

  const handleAddStock = () => {
    if (!newTicker || !newQuantity) {
      toast({
        title: "Invalid Input",
        description: "Please enter both ticker symbol and quantity",
        variant: "destructive",
      });
      return;
    }

    const quantity = parseFloat(newQuantity);
    if (quantity <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    addStock({ ticker: newTicker.toUpperCase(), quantity });
    setNewTicker("");
    setNewQuantity("");
    setIsAddDialogOpen(false);
  };

  const handleAnalyze = () => {
    if (portfolio.length === 0) {
      toast({
        title: "Empty Portfolio",
        description: "Please add some stocks to analyze",
        variant: "destructive",
      });
      return;
    }

    analysisMutation.mutate(portfolio);
  };

  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["usage"] });
    toast({
      title: "Data Refreshed",
      description: "Latest stock prices have been fetched",
    });
  };

  const calculateTotalValue = () => {
    if (!stockData) return 0;
    return portfolio.reduce((total, stock, index) => {
      const data = stockData[index];
      return total + (data ? stock.quantity * data.currentPrice : 0);
    }, 0);
  };

  return (
    <Card data-testid="portfolio-input-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Portfolio Holdings</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-stock">
              <Plus className="h-4 w-4 mr-2" />
              Add Stock
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Stock to Portfolio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="ticker">Ticker Symbol</Label>
                <Input
                  id="ticker"
                  placeholder="e.g., TCS.NS, INFY.NS"
                  value={newTicker}
                  onChange={(e) => setNewTicker(e.target.value)}
                  data-testid="input-ticker"
                />
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Number of shares"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  data-testid="input-quantity"
                />
              </div>
              <Button onClick={handleAddStock} className="w-full" data-testid="button-confirm-add">
                Add to Portfolio
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Ticker</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Quantity</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Current Price</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Change</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Value</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((stock, index) => {
                const data = stockData?.[index];
                const isPositive = data ? data.dailyChangePercent >= 0 : false;
                
                return (
                  <tr key={stock.ticker} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">
                            {stock.ticker.split('.')[0].slice(0, 4)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-sm" data-testid={`text-ticker-${stock.ticker}`}>
                            {stock.ticker}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {data?.name || stock.ticker.replace('.NS', '')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        type="number"
                        value={stock.quantity}
                        onChange={(e) => updateQuantity(stock.ticker, parseFloat(e.target.value) || 0)}
                        className="w-20 h-8"
                        data-testid={`input-quantity-${stock.ticker}`}
                      />
                    </td>
                    <td className="py-3 px-2">
                      {isLoading ? (
                        <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                      ) : (
                        <span className="font-medium text-sm" data-testid={`text-price-${stock.ticker}`}>
                          {data ? `₹${data.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'N/A'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {isLoading ? (
                        <div className="h-4 w-12 bg-muted animate-pulse rounded"></div>
                      ) : data ? (
                        <span 
                          className={`text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}
                          data-testid={`text-change-${stock.ticker}`}
                        >
                          {isPositive ? '+' : ''}{data.dailyChangePercent.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      {isLoading ? (
                        <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                      ) : (
                        <span className="font-medium text-sm" data-testid={`text-value-${stock.ticker}`}>
                          {data ? `₹${(stock.quantity * data.currentPrice).toLocaleString('en-IN')}` : 'N/A'}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStock(stock.ticker)}
                        className="text-muted-foreground hover:text-destructive"
                        data-testid={`button-remove-${stock.ticker}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {portfolio.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/30">
                  <td colSpan={4} className="py-3 px-2 font-semibold text-sm">
                    Total Portfolio Value
                  </td>
                  <td className="py-3 px-2 font-bold text-lg" data-testid="text-total-value">
                    {isLoading ? (
                      <div className="h-6 w-24 bg-muted animate-pulse rounded"></div>
                    ) : (
                      `₹${calculateTotalValue().toLocaleString('en-IN')}`
                    )}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>

          {portfolio.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No stocks in portfolio. Add some stocks to get started.</p>
            </div>
          )}
        </div>

        {portfolio.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleAnalyze}
              disabled={analysisMutation.isPending}
              className="flex-1 sm:flex-none"
              data-testid="button-analyze"
            >
              {analysisMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                "🧠 "
              )}
              {analysisMutation.isPending ? "Analyzing..." : "Analyze Portfolio"}
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
              data-testid="button-refresh"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
