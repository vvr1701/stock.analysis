import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  portfolioStockSchema, 
  insertPortfolioSchema,
  type AdviceItem,
  type AdviceType,
  type StockData 
} from "@shared/schema";
import { z } from "zod";
import yahooFinance from "yahoo-finance2";

// Real stock data fetching using Yahoo Finance
async function fetchStockData(ticker: string): Promise<Omit<StockData, 'id' | 'lastUpdated'> | null> {
  try {
    console.log(`Fetching live data for ${ticker} from Yahoo Finance...`);
    
    const quote = await yahooFinance.quote(ticker);
    
    if (!quote || !quote.regularMarketPrice) {
      console.warn(`No data available for ticker: ${ticker}`);
      return null;
    }

    // Extract sector information from summaryProfile if available
    let sector = 'Unknown';
    try {
      const summaryProfile = (quote as any).summaryProfile;
      if (summaryProfile && summaryProfile.sector) {
        sector = summaryProfile.sector;
      }
    } catch (e) {
      // Sector info not available, use default
    }

    return {
      ticker,
      name: quote.shortName || quote.displayName || ticker.replace('.NS', ''),
      currentPrice: quote.regularMarketPrice,
      dailyChange: quote.regularMarketChange || 0,
      dailyChangePercent: quote.regularMarketChangePercent || 0,
      movingAverage50: quote.fiftyDayAverage || null,
      sector: sector,
      intradayData: [] as any, // Would be populated with historical data if needed
    };
    
  } catch (error) {
    console.error(`Error fetching Yahoo Finance data for ${ticker}:`, error);
    
    // Fallback to demo data only in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Using fallback demo data for ${ticker}`);
      return {
        ticker,
        name: ticker.replace('.NS', ''),
        currentPrice: Math.random() * 1000 + 100,
        dailyChange: Math.random() * 20 - 10,
        dailyChangePercent: Math.random() * 4 - 2,
        movingAverage50: Math.random() * 1000 + 100,
        sector: "Technology",
        intradayData: [] as any,
      };
    }
    
    return null;
  }
}

// AI Advice Engine
function generateAdvice(portfolio: any[], stockData: any[]): AdviceItem[] {
  const advice: AdviceItem[] = [];
  let totalValue = 0;
  const sectorDistribution: { [key: string]: number } = {};

  // Calculate portfolio metrics
  portfolio.forEach((stock, index) => {
    const data = stockData[index];
    if (data) {
      const value = stock.quantity * data.currentPrice;
      totalValue += value;
      
      const sector = data.sector || "Unknown";
      sectorDistribution[sector] = (sectorDistribution[sector] || 0) + value;

      // Individual stock advice
      if (data.dailyChangePercent > 5) {
        advice.push({
          type: "SELL",
          ticker: stock.ticker,
          message: `${stock.ticker} is up ${data.dailyChangePercent.toFixed(1)}% today. Consider taking profits if you're overweight.`,
          confidence: "Med",
          icon: "📉"
        });
      } else if (data.dailyChangePercent < -3) {
        advice.push({
          type: "BUY",
          ticker: stock.ticker,
          message: `${stock.ticker} is down ${Math.abs(data.dailyChangePercent).toFixed(1)}% - potential buying opportunity if fundamentals are strong.`,
          confidence: "Med",
          icon: "📈"
        });
      } else if (Math.abs(data.dailyChangePercent) < 1) {
        advice.push({
          type: "HOLD",
          ticker: stock.ticker,
          message: `${stock.ticker} shows stable performance. Maintain current position and monitor quarterly results.`,
          confidence: "Low",
          icon: "🤝"
        });
      }
    }
  });

  // Diversification advice
  const dominantSector = Object.entries(sectorDistribution)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (dominantSector && dominantSector[1] / totalValue > 0.6) {
    advice.push({
      type: "DIVERSIFY",
      message: `Your portfolio is ${((dominantSector[1] / totalValue) * 100).toFixed(0)}% ${dominantSector[0]}. Consider diversifying into other sectors for better risk management.`,
      confidence: "High",
      icon: "🔄"
    });
  }

  return advice.slice(0, 4); // Return top 4 pieces of advice
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Get stock data for multiple tickers
  app.post("/api/stock-data", async (req, res) => {
    try {
      const { tickers } = req.body;
      
      if (!Array.isArray(tickers)) {
        return res.status(400).json({ message: "Tickers must be an array" });
      }

      const stockData: StockData[] = [];
      
      for (const ticker of tickers) {
        try {
          const data = await fetchStockData(ticker);
          if (data) {
            const storedData = await storage.upsertStockData(data);
            stockData.push(storedData);
          }
        } catch (error) {
          console.error(`Error fetching data for ${ticker}:`, error);
        }
      }

      res.json(stockData);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      res.status(500).json({ message: "Error fetching stock data" });
    }
  });

  // Analyze portfolio
  app.post("/api/analyze-portfolio", async (req, res) => {
    try {
      const portfolioData = portfolioStockSchema.parse(req.body.stocks);
      
      if (portfolioData.length === 0) {
        return res.status(400).json({ message: "Portfolio cannot be empty" });
      }

      // Get current usage
      const usage = await storage.getTodayUsage();
      if (usage.creditsRemaining <= 0) {
        return res.status(403).json({ 
          message: "No credits remaining. Please upgrade your plan.",
          usage 
        });
      }

      // Fetch stock data for all tickers
      const tickers = portfolioData.map(stock => stock.ticker);
      const stockData: StockData[] = [];
      
      for (const ticker of tickers) {
        const data = await fetchStockData(ticker);
        if (data) {
          const storedData = await storage.upsertStockData(data);
          stockData.push(storedData);
        }
      }

      // Calculate portfolio value
      let totalValue = 0;
      portfolioData.forEach((stock, index) => {
        if (stockData[index]) {
          totalValue += stock.quantity * stockData[index].currentPrice;
        }
      });

      // Generate AI advice
      const advice = generateAdvice(portfolioData, stockData);

      // Create portfolio analysis
      const analysis = await storage.createPortfolioAnalysis({
        portfolioId: "default", // In a real app, this would be user-specific
        advice,
        totalValue,
        riskLevel: "Medium",
        diversificationScore: 0.7,
      });

      // Update usage
      const updatedUsage = await storage.incrementUsage(1);

      // Simulate Flexprice billing API call
      console.log("Sending usage data to Flexprice API:", {
        portfolioAnalyses: updatedUsage.portfolioAnalyses,
        creditsUsed: updatedUsage.creditsUsed,
      });

      res.json({
        analysis,
        stockData,
        usage: updatedUsage,
      });
      
    } catch (error) {
      console.error("Error analyzing portfolio:", error);
      res.status(500).json({ message: "Error analyzing portfolio" });
    }
  });

  // Get usage stats
  app.get("/api/usage", async (req, res) => {
    try {
      const usage = await storage.getTodayUsage();
      const history = await storage.getUsageHistory();
      
      const monthlyAnalyses = history
        .filter(record => record.date.startsWith(new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, '0')))
        .reduce((sum, record) => sum + record.portfolioAnalyses, 0);

      res.json({
        today: usage,
        monthlyAnalyses,
        history: history.slice(0, 30), // Last 30 days
      });
    } catch (error) {
      console.error("Error getting usage stats:", error);
      res.status(500).json({ message: "Error getting usage stats" });
    }
  });

  // Market overview data
  app.get("/api/market-overview", async (req, res) => {
    try {
      // Fetch major indices data
      const indices = ["^NSEI", "^BSESN", "^CNXBANK"]; // NIFTY, SENSEX, Bank NIFTY
      const marketData = [];

      for (const index of indices) {
        const data = await fetchStockData(index);
        if (data) {
          marketData.push({
            symbol: index,
            name: index === "^NSEI" ? "NIFTY 50" : index === "^BSESN" ? "SENSEX" : "Bank NIFTY",
            value: data.currentPrice,
            change: data.dailyChangePercent,
          });
        }
      }

      res.json(marketData);
    } catch (error) {
      console.error("Error fetching market data:", error);
      res.status(500).json({ message: "Error fetching market data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
