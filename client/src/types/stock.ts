export interface Stock {
  ticker: string;
  quantity: number;
}

export interface StockData {
  ticker: string;
  name?: string;
  currentPrice: number;
  dailyChange: number;
  dailyChangePercent: number;
  movingAverage50?: number;
  sector?: string;
  intradayData?: any[];
  open?: number;
  high?: number;
  volume?: number;
}

export interface AdviceItem {
  type: "BUY" | "SELL" | "HOLD" | "DIVERSIFY";
  ticker?: string;
  message: string;
  confidence: "High" | "Med" | "Low";
  icon: string;
}

export interface PortfolioAnalysis {
  id: string;
  advice: AdviceItem[];
  totalValue: number;
  riskLevel?: string;
  diversificationScore?: number;
  createdAt: string;
}

export interface UsageStats {
  portfolioAnalyses: number;
  creditsUsed: number;
  creditsRemaining: number;
  date: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
}
