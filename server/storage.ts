import { 
  type Portfolio, 
  type InsertPortfolio,
  type StockData,
  type InsertStockData,
  type PortfolioAnalysis,
  type InsertPortfolioAnalysis,
  type UsageTracking,
  type InsertUsageTracking,
  type PortfolioStock
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Portfolio operations
  createPortfolio(portfolio: InsertPortfolio): Promise<Portfolio>;
  getPortfolio(id: string): Promise<Portfolio | undefined>;
  getAllPortfolios(): Promise<Portfolio[]>;
  updatePortfolio(id: string, portfolio: Partial<InsertPortfolio>): Promise<Portfolio>;
  deletePortfolio(id: string): Promise<void>;

  // Stock data operations
  upsertStockData(stockData: InsertStockData): Promise<StockData>;
  getStockData(ticker: string): Promise<StockData | undefined>;
  getMultipleStockData(tickers: string[]): Promise<StockData[]>;

  // Portfolio analysis operations
  createPortfolioAnalysis(analysis: InsertPortfolioAnalysis): Promise<PortfolioAnalysis>;
  getLatestPortfolioAnalysis(portfolioId: string): Promise<PortfolioAnalysis | undefined>;

  // Usage tracking operations
  getTodayUsage(): Promise<UsageTracking>;
  incrementUsage(creditsUsed: number): Promise<UsageTracking>;
  getUsageHistory(): Promise<UsageTracking[]>;
}

export class MemStorage implements IStorage {
  private portfolios: Map<string, Portfolio>;
  private stockData: Map<string, StockData>;
  private portfolioAnalyses: Map<string, PortfolioAnalysis>;
  private usageTracking: Map<string, UsageTracking>;

  constructor() {
    this.portfolios = new Map();
    this.stockData = new Map();
    this.portfolioAnalyses = new Map();
    this.usageTracking = new Map();
  }

  async createPortfolio(insertPortfolio: InsertPortfolio): Promise<Portfolio> {
    const id = randomUUID();
    const portfolio: Portfolio = {
      name: insertPortfolio.name || "My Portfolio",
      stocks: insertPortfolio.stocks,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.portfolios.set(id, portfolio);
    return portfolio;
  }

  async getPortfolio(id: string): Promise<Portfolio | undefined> {
    return this.portfolios.get(id);
  }

  async getAllPortfolios(): Promise<Portfolio[]> {
    return Array.from(this.portfolios.values());
  }

  async updatePortfolio(id: string, updates: Partial<InsertPortfolio>): Promise<Portfolio> {
    const existing = this.portfolios.get(id);
    if (!existing) {
      throw new Error(`Portfolio with id ${id} not found`);
    }
    
    const updated: Portfolio = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };
    
    this.portfolios.set(id, updated);
    return updated;
  }

  async deletePortfolio(id: string): Promise<void> {
    this.portfolios.delete(id);
  }

  async upsertStockData(stockData: InsertStockData): Promise<StockData> {
    const id = randomUUID();
    const data: StockData = {
      ticker: stockData.ticker,
      name: stockData.name || null,
      currentPrice: stockData.currentPrice,
      dailyChange: stockData.dailyChange,
      dailyChangePercent: stockData.dailyChangePercent,
      movingAverage50: stockData.movingAverage50 || null,
      sector: stockData.sector || null,
      intradayData: stockData.intradayData || [],
      id,
      lastUpdated: new Date(),
    };
    this.stockData.set(stockData.ticker, data);
    return data;
  }

  async getStockData(ticker: string): Promise<StockData | undefined> {
    return this.stockData.get(ticker);
  }

  async getMultipleStockData(tickers: string[]): Promise<StockData[]> {
    return tickers.map(ticker => this.stockData.get(ticker)).filter(Boolean) as StockData[];
  }

  async createPortfolioAnalysis(analysis: InsertPortfolioAnalysis): Promise<PortfolioAnalysis> {
    const id = randomUUID();
    const portfolioAnalysis: PortfolioAnalysis = {
      portfolioId: analysis.portfolioId,
      advice: analysis.advice || [],
      totalValue: analysis.totalValue,
      riskLevel: analysis.riskLevel || null,
      diversificationScore: analysis.diversificationScore || null,
      id,
      createdAt: new Date(),
    };
    this.portfolioAnalyses.set(id, portfolioAnalysis);
    return portfolioAnalysis;
  }

  async getLatestPortfolioAnalysis(portfolioId: string): Promise<PortfolioAnalysis | undefined> {
    return Array.from(this.portfolioAnalyses.values())
      .filter(analysis => analysis.portfolioId === portfolioId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }

  async getTodayUsage(): Promise<UsageTracking> {
    const today = new Date().toISOString().split('T')[0];
    const existing = this.usageTracking.get(today);
    
    if (existing) {
      return existing;
    }

    // Create new usage record for today
    const usage: UsageTracking = {
      id: randomUUID(),
      date: today,
      portfolioAnalyses: 0,
      creditsUsed: 0,
      creditsRemaining: 10,
    };
    
    this.usageTracking.set(today, usage);
    return usage;
  }

  async incrementUsage(creditsUsed: number = 1): Promise<UsageTracking> {
    const today = await this.getTodayUsage();
    
    const updated: UsageTracking = {
      ...today,
      portfolioAnalyses: today.portfolioAnalyses + 1,
      creditsUsed: today.creditsUsed + creditsUsed,
      creditsRemaining: Math.max(0, today.creditsRemaining - creditsUsed),
    };
    
    this.usageTracking.set(today.date, updated);
    return updated;
  }

  async getUsageHistory(): Promise<UsageTracking[]> {
    return Array.from(this.usageTracking.values())
      .sort((a, b) => b.date.localeCompare(a.date));
  }
}

export const storage = new MemStorage();
