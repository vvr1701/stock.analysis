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

// Enhanced AI Advice Engine with Real Market Data Analysis
function generateAdvice(portfolio: any[], stockData: any[]): AdviceItem[] {
  const advice: AdviceItem[] = [];
  let totalValue = 0;
  const sectorDistribution: { [key: string]: number } = {};
  const performanceMetrics: { [key: string]: any } = {};

  // Calculate comprehensive portfolio metrics
  portfolio.forEach((stock, index) => {
    const data = stockData[index];
    if (data) {
      const value = stock.quantity * data.currentPrice;
      totalValue += value;
      const weightage = value / totalValue;
      
      const sector = data.sector || "Technology";
      sectorDistribution[sector] = (sectorDistribution[sector] || 0) + value;
      
      // Store performance metrics for advanced analysis
      performanceMetrics[stock.ticker] = {
        dailyChange: data.dailyChangePercent,
        currentPrice: data.currentPrice,
        movingAverage50: data.movingAverage50,
        value: value,
        weightage: weightage,
        sector: sector,
        name: data.name
      };
    }
  });

  // Advanced individual stock analysis
  portfolio.forEach((stock, index) => {
    const data = stockData[index];
    const metrics = performanceMetrics[stock.ticker];
    
    if (data && metrics) {
      // Price vs Moving Average Analysis
      const priceVsMA = metrics.movingAverage50 ? 
        ((metrics.currentPrice - metrics.movingAverage50) / metrics.movingAverage50) * 100 : 0;

      // Strong momentum (up significantly today + above MA)
      if (data.dailyChangePercent > 3 && priceVsMA > 5) {
        advice.push({
          type: "SELL",
          ticker: stock.ticker,
          message: `${metrics.name || stock.ticker} shows strong momentum (+${data.dailyChangePercent.toFixed(1)}% today, ${priceVsMA.toFixed(1)}% above 50-day MA). Consider booking partial profits to lock in gains.`,
          confidence: "High",
          icon: "📈"
        });
      }
      // Value opportunity (down but fundamentally strong)
      else if (data.dailyChangePercent < -2 && priceVsMA < -5 && metrics.weightage < 0.4) {
        advice.push({
          type: "BUY",
          ticker: stock.ticker,
          message: `${metrics.name || stock.ticker} is undervalued (${Math.abs(priceVsMA).toFixed(1)}% below 50-day MA). Quality ${metrics.sector} stock trading at attractive levels - consider accumulating.`,
          confidence: "High",
          icon: "💎"
        });
      }
      // Overweight position in volatile stock
      else if (Math.abs(data.dailyChangePercent) > 2 && metrics.weightage > 0.4) {
        advice.push({
          type: "SELL",
          ticker: stock.ticker,
          message: `${metrics.name || stock.ticker} makes up ${(metrics.weightage * 100).toFixed(1)}% of your portfolio and shows high volatility. Consider reducing position to manage risk.`,
          confidence: "Med",
          icon: "⚖️"
        });
      }
      // Stable performer - hold
      else if (Math.abs(data.dailyChangePercent) < 2 && Math.abs(priceVsMA) < 3) {
        advice.push({
          type: "HOLD",
          ticker: stock.ticker,
          message: `${metrics.name || stock.ticker} trades near fair value with stable performance. Good core holding - maintain current position and monitor quarterly results.`,
          confidence: "Med",
          icon: "🤝"
        });
      }
    }
  });

  // Sector diversification analysis
  const dominantSector = Object.entries(sectorDistribution)
    .sort(([,a], [,b]) => b - a)[0];
  
  const sectorConcentration = dominantSector ? (dominantSector[1] / totalValue) : 0;
  
  if (sectorConcentration > 0.65) {
    advice.push({
      type: "DIVERSIFY",
      message: `Portfolio is heavily concentrated (${(sectorConcentration * 100).toFixed(0)}%) in ${dominantSector[0]} sector. Consider adding Banking, FMCG, or Healthcare stocks for better diversification.`,
      confidence: "High",
      icon: "🔄"
    });
  } else if (sectorConcentration > 0.45) {
    advice.push({
      type: "DIVERSIFY", 
      message: `Good sector mix, but ${dominantSector[0]} dominates at ${(sectorConcentration * 100).toFixed(0)}%. Consider adding small positions in defensive sectors like Pharmaceuticals or Utilities.`,
      confidence: "Med",
      icon: "📊"
    });
  }

  // Portfolio size analysis
  if (totalValue < 50000) {
    advice.push({
      type: "BUY",
      message: `Small portfolio size (₹${totalValue.toLocaleString('en-IN')}). Focus on 2-3 quality large-cap stocks and consider SIP investment to build substantial wealth over time.`,
      confidence: "High",
      icon: "📈"
    });
  } else if (totalValue > 500000 && portfolio.length < 5) {
    advice.push({
      type: "DIVERSIFY",
      message: `Substantial portfolio (₹${(totalValue/100000).toFixed(1)}L) with only ${portfolio.length} stocks. Consider adding 2-3 more quality stocks across different sectors.`,
      confidence: "Med", 
      icon: "🚀"
    });
  }

  // Return prioritized advice (high confidence first, then limit to top 5)
  return advice
    .sort((a, b) => {
      const confidenceOrder = { "High": 3, "Med": 2, "Low": 1 };
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    })
    .slice(0, 5);
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
