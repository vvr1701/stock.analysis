import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const portfolios = pgTable("portfolios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().default("My Portfolio"),
  stocks: jsonb("stocks").notNull().default([]),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const stockData = pgTable("stock_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticker: text("ticker").notNull(),
  name: text("name"),
  currentPrice: real("current_price").notNull(),
  dailyChange: real("daily_change").notNull(),
  dailyChangePercent: real("daily_change_percent").notNull(),
  movingAverage50: real("moving_average_50"),
  sector: text("sector"),
  intradayData: jsonb("intraday_data").default([]),
  lastUpdated: timestamp("last_updated").notNull().default(sql`now()`),
});

export const portfolioAnalyses = pgTable("portfolio_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  portfolioId: varchar("portfolio_id").notNull(),
  advice: jsonb("advice").notNull().default([]),
  totalValue: real("total_value").notNull(),
  riskLevel: text("risk_level"),
  diversificationScore: real("diversification_score"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const usageTracking = pgTable("usage_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(), // YYYY-MM-DD format
  portfolioAnalyses: integer("portfolio_analyses").notNull().default(0),
  creditsUsed: integer("credits_used").notNull().default(0),
  creditsRemaining: integer("credits_remaining").notNull().default(10),
});

// Zod schemas for validation
export const stockSchema = z.object({
  ticker: z.string().min(1, "Ticker is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than 0"),
});

export const portfolioStockSchema = z.array(stockSchema);

export const insertPortfolioSchema = createInsertSchema(portfolios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStockDataSchema = createInsertSchema(stockData).omit({
  id: true,
  lastUpdated: true,
});

export const insertPortfolioAnalysisSchema = createInsertSchema(portfolioAnalyses).omit({
  id: true,
  createdAt: true,
});

export const insertUsageTrackingSchema = createInsertSchema(usageTracking).omit({
  id: true,
});

// Types
export type Portfolio = typeof portfolios.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;

export type StockData = typeof stockData.$inferSelect;
export type InsertStockData = z.infer<typeof insertStockDataSchema>;

export type PortfolioAnalysis = typeof portfolioAnalyses.$inferSelect;
export type InsertPortfolioAnalysis = z.infer<typeof insertPortfolioAnalysisSchema>;

export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = z.infer<typeof insertUsageTrackingSchema>;

export type PortfolioStock = z.infer<typeof stockSchema>;

// Advice types
export type AdviceType = "BUY" | "SELL" | "HOLD" | "DIVERSIFY";

export interface AdviceItem {
  type: AdviceType;
  ticker?: string;
  message: string;
  confidence: "High" | "Med" | "Low";
  icon: string;
}
