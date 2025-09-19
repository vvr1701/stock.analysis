import { useState, useCallback } from "react";
import { Stock } from "@/types/stock";
import { useToast } from "@/hooks/use-toast";

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<Stock[]>([
    { ticker: "TCS.NS", quantity: 10 },
    { ticker: "INFY.NS", quantity: 15 },
    { ticker: "HDFCBANK.NS", quantity: 8 },
  ]);
  
  const { toast } = useToast();

  const addStock = useCallback((stock: Stock) => {
    const existingIndex = portfolio.findIndex(s => s.ticker === stock.ticker);
    
    if (existingIndex >= 0) {
      // Update existing stock quantity
      const updatedPortfolio = [...portfolio];
      updatedPortfolio[existingIndex].quantity += stock.quantity;
      setPortfolio(updatedPortfolio);
      
      toast({
        title: "Stock Updated",
        description: `Added ${stock.quantity} shares to existing ${stock.ticker} position`,
      });
    } else {
      // Add new stock
      setPortfolio(prev => [...prev, stock]);
      
      toast({
        title: "Stock Added",
        description: `Added ${stock.ticker} with ${stock.quantity} shares to portfolio`,
      });
    }
  }, [portfolio, toast]);

  const removeStock = useCallback((ticker: string) => {
    setPortfolio(prev => prev.filter(stock => stock.ticker !== ticker));
    
    toast({
      title: "Stock Removed",
      description: `Removed ${ticker} from portfolio`,
      variant: "destructive",
    });
  }, [toast]);

  const updateQuantity = useCallback((ticker: string, quantity: number) => {
    if (quantity <= 0) {
      removeStock(ticker);
      return;
    }

    setPortfolio(prev => 
      prev.map(stock => 
        stock.ticker === ticker 
          ? { ...stock, quantity }
          : stock
      )
    );
  }, [removeStock]);

  const clearPortfolio = useCallback(() => {
    setPortfolio([]);
    toast({
      title: "Portfolio Cleared",
      description: "All stocks removed from portfolio",
    });
  }, [toast]);

  return {
    portfolio,
    addStock,
    removeStock,
    updateQuantity,
    clearPortfolio,
  };
}
