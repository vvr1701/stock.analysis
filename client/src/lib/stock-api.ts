import { apiRequest } from "@/lib/queryClient";
import { StockData, MarketIndex } from "@/types/stock";

export async function fetchStockData(tickers: string[]): Promise<StockData[]> {
  const response = await apiRequest("POST", "/api/stock-data", { tickers });
  return response.json();
}

export async function analyzePortfolio(stocks: { ticker: string; quantity: number }[]) {
  const response = await apiRequest("POST", "/api/analyze-portfolio", { stocks });
  return response.json();
}

export async function fetchMarketOverview(): Promise<MarketIndex[]> {
  const response = await apiRequest("GET", "/api/market-overview");
  return response.json();
}

export async function fetchUsageStats() {
  const response = await apiRequest("GET", "/api/usage");
  return response.json();
}
