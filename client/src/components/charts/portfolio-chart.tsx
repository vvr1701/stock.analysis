import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockData } from "@/types/stock";

interface PortfolioChartProps {
  portfolio: { ticker: string; quantity: number }[];
  stockData: StockData[];
  isLoading?: boolean;
}

// Vibrant, distinct color palette that complements the deep blue theme
const COLORS = [
  '#3B82F6', // Bright Blue (primary complement)
  '#10B981', // Emerald Green  
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#84CC16', // Lime
];

export function PortfolioChart({ portfolio, stockData, isLoading }: PortfolioChartProps) {
  const chartData = portfolio.map((stock, index) => {
    const data = stockData?.[index];
    const value = data ? stock.quantity * data.currentPrice : 0;
    
    return {
      ticker: stock.ticker.replace('.NS', ''),
      value,
      percentage: 0, // Will be calculated after we have total
    };
  }).filter(item => item.value > 0);

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);
  
  // Calculate percentages
  const dataWithPercentages = chartData.map(item => ({
    ...item,
    percentage: totalValue > 0 ? ((item.value / totalValue) * 100) : 0,
  }));

  if (isLoading) {
    return (
      <Card data-testid="portfolio-chart-loading">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Portfolio Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="w-32 h-32 rounded-full bg-muted animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card data-testid="portfolio-chart-empty">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Portfolio Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                📊
              </div>
              <p>No data available</p>
              <p className="text-sm">Add stocks and refresh data</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.ticker}</p>
          <p className="text-primary">
            ₹{data.value.toLocaleString('en-IN')}
          </p>
          <p className="text-muted-foreground text-sm">
            {data.percentage.toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card data-testid="portfolio-chart" className="relative overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          Portfolio Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 relative">
          {/* Subtle gradient background for depth */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 rounded-lg"></div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithPercentages}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={95}
                dataKey="value"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth={3}
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))',
                }}
              >
                {dataWithPercentages.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]}
                    style={{
                      filter: `brightness(1.1) saturate(1.2)`,
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center label showing total value */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-card/80 backdrop-blur-sm rounded-full px-4 py-2 border border-border/50">
              <div className="text-xs text-muted-foreground">Total Value</div>
              <div className="font-bold text-sm text-foreground">
                ₹{totalValue.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced legend with better styling and readability */}
        <div className="mt-6 space-y-3">
          <div className="text-sm font-medium text-foreground mb-3">Holdings Breakdown</div>
          <div className="grid grid-cols-1 gap-3">
            {dataWithPercentages.map((item, index) => (
              <div 
                key={item.ticker} 
                className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-muted/30 to-transparent border border-border/30 hover:bg-muted/50 transition-colors"
                data-testid={`legend-item-${item.ticker}`}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white/50 shadow-lg" 
                    style={{ 
                      backgroundColor: COLORS[index % COLORS.length],
                      boxShadow: `0 2px 8px ${COLORS[index % COLORS.length]}30`
                    }}
                  ></div>
                  <div>
                    <div className="font-medium text-sm text-foreground">{item.ticker}</div>
                    <div className="text-xs text-muted-foreground">
                      ₹{item.value.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm text-foreground">
                    {item.percentage.toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    of portfolio
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
