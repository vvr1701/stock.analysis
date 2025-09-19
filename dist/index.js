// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  portfolios;
  stockData;
  portfolioAnalyses;
  usageTracking;
  constructor() {
    this.portfolios = /* @__PURE__ */ new Map();
    this.stockData = /* @__PURE__ */ new Map();
    this.portfolioAnalyses = /* @__PURE__ */ new Map();
    this.usageTracking = /* @__PURE__ */ new Map();
  }
  async createPortfolio(insertPortfolio) {
    const id = randomUUID();
    const portfolio = {
      name: insertPortfolio.name || "My Portfolio",
      stocks: insertPortfolio.stocks,
      id,
      createdAt: /* @__PURE__ */ new Date(),
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.portfolios.set(id, portfolio);
    return portfolio;
  }
  async getPortfolio(id) {
    return this.portfolios.get(id);
  }
  async getAllPortfolios() {
    return Array.from(this.portfolios.values());
  }
  async updatePortfolio(id, updates) {
    const existing = this.portfolios.get(id);
    if (!existing) {
      throw new Error(`Portfolio with id ${id} not found`);
    }
    const updated = {
      ...existing,
      ...updates,
      updatedAt: /* @__PURE__ */ new Date()
    };
    this.portfolios.set(id, updated);
    return updated;
  }
  async deletePortfolio(id) {
    this.portfolios.delete(id);
  }
  async upsertStockData(stockData2) {
    const id = randomUUID();
    const data = {
      ticker: stockData2.ticker,
      name: stockData2.name || null,
      currentPrice: stockData2.currentPrice,
      dailyChange: stockData2.dailyChange,
      dailyChangePercent: stockData2.dailyChangePercent,
      movingAverage50: stockData2.movingAverage50 || null,
      sector: stockData2.sector || null,
      intradayData: stockData2.intradayData || [],
      id,
      lastUpdated: /* @__PURE__ */ new Date()
    };
    this.stockData.set(stockData2.ticker, data);
    return data;
  }
  async getStockData(ticker) {
    return this.stockData.get(ticker);
  }
  async getMultipleStockData(tickers) {
    return tickers.map((ticker) => this.stockData.get(ticker)).filter(Boolean);
  }
  async createPortfolioAnalysis(analysis) {
    const id = randomUUID();
    const portfolioAnalysis = {
      portfolioId: analysis.portfolioId,
      advice: analysis.advice || [],
      totalValue: analysis.totalValue,
      riskLevel: analysis.riskLevel || null,
      diversificationScore: analysis.diversificationScore || null,
      id,
      createdAt: /* @__PURE__ */ new Date()
    };
    this.portfolioAnalyses.set(id, portfolioAnalysis);
    return portfolioAnalysis;
  }
  async getLatestPortfolioAnalysis(portfolioId) {
    return Array.from(this.portfolioAnalyses.values()).filter((analysis) => analysis.portfolioId === portfolioId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }
  async getTodayUsage() {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const existing = this.usageTracking.get(today);
    if (existing) {
      return existing;
    }
    const usage = {
      id: randomUUID(),
      date: today,
      portfolioAnalyses: 0,
      creditsUsed: 0,
      creditsRemaining: 10
    };
    this.usageTracking.set(today, usage);
    return usage;
  }
  async incrementUsage(creditsUsed = 1) {
    const today = await this.getTodayUsage();
    const updated = {
      ...today,
      portfolioAnalyses: today.portfolioAnalyses + 1,
      creditsUsed: today.creditsUsed + creditsUsed,
      creditsRemaining: Math.max(0, today.creditsRemaining - creditsUsed)
    };
    this.usageTracking.set(today.date, updated);
    return updated;
  }
  async getUsageHistory() {
    return Array.from(this.usageTracking.values()).sort((a, b) => b.date.localeCompare(a.date));
  }
};
var storage = new MemStorage();

// shared/schema.ts
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var portfolios = pgTable("portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().default("My Portfolio"),
  stocks: jsonb("stocks").notNull().default([]),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`)
});
var stockData = pgTable("stock_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticker: text("ticker").notNull(),
  name: text("name"),
  currentPrice: real("current_price").notNull(),
  dailyChange: real("daily_change").notNull(),
  dailyChangePercent: real("daily_change_percent").notNull(),
  movingAverage50: real("moving_average_50"),
  sector: text("sector"),
  intradayData: jsonb("intraday_data").default([]),
  lastUpdated: timestamp("last_updated").notNull().default(sql`now()`)
});
var portfolioAnalyses = pgTable("portfolio_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull(),
  advice: jsonb("advice").notNull().default([]),
  totalValue: real("total_value").notNull(),
  riskLevel: text("risk_level"),
  diversificationScore: real("diversification_score"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`)
});
var usageTracking = pgTable("usage_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(),
  // YYYY-MM-DD format
  portfolioAnalyses: integer("portfolio_analyses").notNull().default(0),
  creditsUsed: integer("credits_used").notNull().default(0),
  creditsRemaining: integer("credits_remaining").notNull().default(10)
});
var stockSchema = z.object({
  ticker: z.string().min(1, "Ticker is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0")
});
var portfolioStockSchema = z.array(stockSchema);
var insertPortfolioSchema = createInsertSchema(portfolios).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertStockDataSchema = createInsertSchema(stockData).omit({
  id: true,
  lastUpdated: true
});
var insertPortfolioAnalysisSchema = createInsertSchema(portfolioAnalyses).omit({
  id: true,
  createdAt: true
});
var insertUsageTrackingSchema = createInsertSchema(usageTracking).omit({
  id: true
});

// server/routes.ts
import yahooFinance from "yahoo-finance2";
async function fetchStockData(ticker) {
  try {
    console.log(`Fetching live data for ${ticker} from Yahoo Finance...`);
    const quote = await yahooFinance.quote(ticker);
    if (!quote || !quote.regularMarketPrice) {
      console.warn(`No data available for ticker: ${ticker}`);
      return null;
    }
    let sector = "Unknown";
    try {
      const summaryProfile = quote.summaryProfile;
      if (summaryProfile && summaryProfile.sector) {
        sector = summaryProfile.sector;
      }
    } catch (e) {
    }
    return {
      ticker,
      name: quote.shortName || quote.displayName || ticker.replace(".NS", ""),
      currentPrice: quote.regularMarketPrice,
      dailyChange: quote.regularMarketChange || 0,
      dailyChangePercent: quote.regularMarketChangePercent || 0,
      movingAverage50: quote.fiftyDayAverage || null,
      sector,
      intradayData: []
      // Would be populated with historical data if needed
    };
  } catch (error) {
    console.error(`Error fetching Yahoo Finance data for ${ticker}:`, error);
    if (process.env.NODE_ENV === "development") {
      console.warn(`Using fallback demo data for ${ticker}`);
      return {
        ticker,
        name: ticker.replace(".NS", ""),
        currentPrice: Math.random() * 1e3 + 100,
        dailyChange: Math.random() * 20 - 10,
        dailyChangePercent: Math.random() * 4 - 2,
        movingAverage50: Math.random() * 1e3 + 100,
        sector: "Technology",
        intradayData: []
      };
    }
    return null;
  }
}
function generateAdvice(portfolio, stockData2) {
  const advice = [];
  let totalValue = 0;
  const sectorDistribution = {};
  const performanceMetrics = {};
  portfolio.forEach((stock, index) => {
    const data = stockData2[index];
    if (data) {
      const value = stock.quantity * data.currentPrice;
      totalValue += value;
      const weightage = value / totalValue;
      const sector = data.sector || "Technology";
      sectorDistribution[sector] = (sectorDistribution[sector] || 0) + value;
      performanceMetrics[stock.ticker] = {
        dailyChange: data.dailyChangePercent,
        currentPrice: data.currentPrice,
        movingAverage50: data.movingAverage50,
        value,
        weightage,
        sector,
        name: data.name
      };
    }
  });
  portfolio.forEach((stock, index) => {
    const data = stockData2[index];
    const metrics = performanceMetrics[stock.ticker];
    if (data && metrics) {
      const priceVsMA = metrics.movingAverage50 ? (metrics.currentPrice - metrics.movingAverage50) / metrics.movingAverage50 * 100 : 0;
      if (data.dailyChangePercent > 3 && priceVsMA > 5) {
        advice.push({
          type: "SELL",
          ticker: stock.ticker,
          message: `${metrics.name || stock.ticker} shows strong momentum (+${data.dailyChangePercent.toFixed(1)}% today, ${priceVsMA.toFixed(1)}% above 50-day MA). Consider booking partial profits to lock in gains.`,
          confidence: "High",
          icon: "\u{1F4C8}"
        });
      } else if (data.dailyChangePercent < -2 && priceVsMA < -5 && metrics.weightage < 0.4) {
        advice.push({
          type: "BUY",
          ticker: stock.ticker,
          message: `${metrics.name || stock.ticker} is undervalued (${Math.abs(priceVsMA).toFixed(1)}% below 50-day MA). Quality ${metrics.sector} stock trading at attractive levels - consider accumulating.`,
          confidence: "High",
          icon: "\u{1F48E}"
        });
      } else if (Math.abs(data.dailyChangePercent) > 2 && metrics.weightage > 0.4) {
        advice.push({
          type: "SELL",
          ticker: stock.ticker,
          message: `${metrics.name || stock.ticker} makes up ${(metrics.weightage * 100).toFixed(1)}% of your portfolio and shows high volatility. Consider reducing position to manage risk.`,
          confidence: "Med",
          icon: "\u2696\uFE0F"
        });
      } else if (Math.abs(data.dailyChangePercent) < 2 && Math.abs(priceVsMA) < 3) {
        advice.push({
          type: "HOLD",
          ticker: stock.ticker,
          message: `${metrics.name || stock.ticker} trades near fair value with stable performance. Good core holding - maintain current position and monitor quarterly results.`,
          confidence: "Med",
          icon: "\u{1F91D}"
        });
      }
    }
  });
  const dominantSector = Object.entries(sectorDistribution).sort(([, a], [, b]) => b - a)[0];
  const sectorConcentration = dominantSector ? dominantSector[1] / totalValue : 0;
  if (sectorConcentration > 0.65) {
    advice.push({
      type: "DIVERSIFY",
      message: `Portfolio is heavily concentrated (${(sectorConcentration * 100).toFixed(0)}%) in ${dominantSector[0]} sector. Consider adding Banking, FMCG, or Healthcare stocks for better diversification.`,
      confidence: "High",
      icon: "\u{1F504}"
    });
  } else if (sectorConcentration > 0.45) {
    advice.push({
      type: "DIVERSIFY",
      message: `Good sector mix, but ${dominantSector[0]} dominates at ${(sectorConcentration * 100).toFixed(0)}%. Consider adding small positions in defensive sectors like Pharmaceuticals or Utilities.`,
      confidence: "Med",
      icon: "\u{1F4CA}"
    });
  }
  if (totalValue < 5e4) {
    advice.push({
      type: "BUY",
      message: `Small portfolio size (\u20B9${totalValue.toLocaleString("en-IN")}). Focus on 2-3 quality large-cap stocks and consider SIP investment to build substantial wealth over time.`,
      confidence: "High",
      icon: "\u{1F4C8}"
    });
  } else if (totalValue > 5e5 && portfolio.length < 5) {
    advice.push({
      type: "DIVERSIFY",
      message: `Substantial portfolio (\u20B9${(totalValue / 1e5).toFixed(1)}L) with only ${portfolio.length} stocks. Consider adding 2-3 more quality stocks across different sectors.`,
      confidence: "Med",
      icon: "\u{1F680}"
    });
  }
  return advice.sort((a, b) => {
    const confidenceOrder = { "High": 3, "Med": 2, "Low": 1 };
    return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
  }).slice(0, 5);
}
async function registerRoutes(app2) {
  app2.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app2.post("/api/stock-data", async (req, res) => {
    try {
      const { tickers } = req.body;
      if (!Array.isArray(tickers)) {
        return res.status(400).json({ message: "Tickers must be an array" });
      }
      const stockData2 = [];
      for (const ticker of tickers) {
        try {
          const data = await fetchStockData(ticker);
          if (data) {
            const storedData = await storage.upsertStockData(data);
            stockData2.push(storedData);
          }
        } catch (error) {
          console.error(`Error fetching data for ${ticker}:`, error);
        }
      }
      res.json(stockData2);
    } catch (error) {
      console.error("Error fetching stock data:", error);
      res.status(500).json({ message: "Error fetching stock data" });
    }
  });
  app2.post("/api/analyze-portfolio", async (req, res) => {
    try {
      const portfolioData = portfolioStockSchema.parse(req.body.stocks);
      if (portfolioData.length === 0) {
        return res.status(400).json({ message: "Portfolio cannot be empty" });
      }
      const usage = await storage.getTodayUsage();
      if (usage.creditsRemaining <= 0) {
        return res.status(403).json({
          message: "No credits remaining. Please upgrade your plan.",
          usage
        });
      }
      const tickers = portfolioData.map((stock) => stock.ticker);
      const stockData2 = [];
      for (const ticker of tickers) {
        const data = await fetchStockData(ticker);
        if (data) {
          const storedData = await storage.upsertStockData(data);
          stockData2.push(storedData);
        }
      }
      let totalValue = 0;
      portfolioData.forEach((stock, index) => {
        if (stockData2[index]) {
          totalValue += stock.quantity * stockData2[index].currentPrice;
        }
      });
      const advice = generateAdvice(portfolioData, stockData2);
      const analysis = await storage.createPortfolioAnalysis({
        portfolioId: "default",
        // In a real app, this would be user-specific
        advice,
        totalValue,
        riskLevel: "Medium",
        diversificationScore: 0.7
      });
      const updatedUsage = await storage.incrementUsage(1);
      console.log("Sending usage data to Flexprice API:", {
        portfolioAnalyses: updatedUsage.portfolioAnalyses,
        creditsUsed: updatedUsage.creditsUsed
      });
      res.json({
        analysis,
        stockData: stockData2,
        usage: updatedUsage
      });
    } catch (error) {
      console.error("Error analyzing portfolio:", error);
      res.status(500).json({ message: "Error analyzing portfolio" });
    }
  });
  app2.get("/api/usage", async (req, res) => {
    try {
      const usage = await storage.getTodayUsage();
      const history = await storage.getUsageHistory();
      const monthlyAnalyses = history.filter((record) => record.date.startsWith((/* @__PURE__ */ new Date()).getFullYear() + "-" + String((/* @__PURE__ */ new Date()).getMonth() + 1).padStart(2, "0"))).reduce((sum, record) => sum + record.portfolioAnalyses, 0);
      res.json({
        today: usage,
        monthlyAnalyses,
        history: history.slice(0, 30)
        // Last 30 days
      });
    } catch (error) {
      console.error("Error getting usage stats:", error);
      res.status(500).json({ message: "Error getting usage stats" });
    }
  });
  app2.get("/api/market-overview", async (req, res) => {
    try {
      const indices = ["^NSEI", "^BSESN", "^CNXBANK"];
      const marketData = [];
      for (const index of indices) {
        const data = await fetchStockData(index);
        if (data) {
          marketData.push({
            symbol: index,
            name: index === "^NSEI" ? "NIFTY 50" : index === "^BSESN" ? "SENSEX" : "Bank NIFTY",
            value: data.currentPrice,
            change: data.dailyChangePercent
          });
        }
      }
      res.json(marketData);
    } catch (error) {
      console.error("Error fetching market data:", error);
      res.status(500).json({ message: "Error fetching market data" });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
