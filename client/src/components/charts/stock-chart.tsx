import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StockData } from "@/types/stock";
import { useState } from "react";

interface StockChartProps {
  portfolio: { ticker: string; quantity: number }[];
  stockData: StockData[];
  isLoading?: boolean;
}

export function StockChart({ portfolio, stockData, isLoading }: StockChartProps) {
  const [selectedStock, setSelectedStock] = useState(portfolio[0]?.ticker || "");
  
  const selectedStockIndex = portfolio.findIndex(stock => stock.ticker === selectedStock);
  const selectedStockData = stockData?.[selectedStockIndex];

  // Generate mock intraday data for demonstration
  const generateIntradayData = (currentPrice: number, changePercent: number) => {
    const data = [];
    const startPrice = currentPrice - (currentPrice * changePercent / 100);
    const priceRange = currentPrice - startPrice;
    
    for (let i = 0; i < 24; i++) {
      const hour = 9 + (i * 6.5 / 24); // Market hours 9:15 AM to 3:30 PM
      const time = `${Math.floor(hour)}:${Math.floor((hour % 1) * 60).toString().padStart(2, '0')}`;
      const volatility = Math.random() * 0.02 - 0.01; // ±1% volatility
      const trend = (i / 24) * priceRange;
      const price = startPrice + trend + (startPrice * volatility);
      
      data.push({
        time,
        price: Math.max(0, price),
      });
    }
    
    return data;
  };

  const intradayData = selectedStockData ? 
    generateIntradayData(selectedStockData.currentPrice, selectedStockData.dailyChangePercent) : [];

  if (isLoading) {
    return (
      <Card data-testid="stock-chart-loading">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Live Price Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!selectedStockData) {
    return (
      <Card data-testid="stock-chart-empty">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Live Price Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                📈
              </div>
              <p>No stock data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-primary">
            ₹{payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  const isPositive = selectedStockData.dailyChangePercent >= 0;

  return (
    <Card data-testid="stock-chart">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-semibold">Live Price Trends</CardTitle>
        <Select value={selectedStock} onValueChange={setSelectedStock}>
          <SelectTrigger className="w-32" data-testid="select-stock">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {portfolio.map((stock) => (
              <SelectItem key={stock.ticker} value={stock.ticker}>
                {stock.ticker.replace('.NS', '')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      
      <CardContent>
        <div className="h-64 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={intradayData}>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                domain={['dataMin - 10', 'dataMax + 10']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="price"
                stroke={isPositive ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-xs text-muted-foreground">Open</div>
            <div className="font-medium text-sm" data-testid="text-open">
              ₹{(selectedStockData.currentPrice - (selectedStockData.currentPrice * selectedStockData.dailyChangePercent / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">High</div>
            <div className="font-medium text-sm" data-testid="text-high">
              ₹{(selectedStockData.currentPrice * 1.02).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Volume</div>
            <div className="font-medium text-sm" data-testid="text-volume">
              {(Math.random() * 5 + 1).toFixed(1)}M
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
