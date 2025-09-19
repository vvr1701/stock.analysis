import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockData } from "@/types/stock";

interface PortfolioChartProps {
  portfolio: { ticker: string; quantity: number }[];
  stockData: StockData[];
  isLoading?: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
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
    <Card data-testid="portfolio-chart">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Portfolio Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataWithPercentages}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                stroke="hsl(var(--border))"
                strokeWidth={2}
              >
                {dataWithPercentages.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-4">
          {dataWithPercentages.map((item, index) => (
            <div 
              key={item.ticker} 
              className="flex items-center space-x-2"
              data-testid={`legend-item-${item.ticker}`}
            >
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <span className="text-xs text-muted-foreground">
                {item.ticker} {item.percentage.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
