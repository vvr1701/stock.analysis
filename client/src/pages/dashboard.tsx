import { useState } from "react";
import { NavigationHeader } from "@/components/navigation-header";
import { PortfolioInput } from "@/components/portfolio-input";
import { AdviceCards } from "@/components/advice-cards";
import { PortfolioChart } from "@/components/charts/portfolio-chart";
import { StockChart } from "@/components/charts/stock-chart";
import { MarketOverview } from "@/components/market-overview";
import { UsageTracking } from "@/components/usage-tracking";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePortfolio } from "@/hooks/use-portfolio";
import { AdviceItem, PortfolioAnalysis, StockData } from "@/types/stock";
import { FileText, Save, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { portfolio } = usePortfolio();
  const { toast } = useToast();
  
  const [analysisData, setAnalysisData] = useState<{
    analysis: PortfolioAnalysis;
    stockData: StockData[];
  } | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalysisComplete = (data: any) => {
    setAnalysisData(data);
    setIsAnalyzing(false);
  };

  const handleExportReport = () => {
    toast({
      title: "Export Report",
      description: "PDF report generation would be implemented here",
    });
  };

  const handleSavePortfolio = () => {
    // Save to localStorage for now
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    toast({
      title: "Portfolio Saved",
      description: "Your portfolio has been saved successfully",
    });
  };

  const handleShareAdvice = () => {
    toast({
      title: "Share Advice",
      description: "Shareable link generation would be implemented here",
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
      },
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <NavigationHeader />
      
      <motion.div 
        className="max-w-7xl mx-auto p-4 space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        
        {/* Usage Stats Header */}
        <motion.div variants={itemVariants}>
          <div className="bg-gradient-to-r from-primary to-accent rounded-xl p-6 text-primary-foreground">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
              <div>
                <h2 className="text-2xl font-bold mb-2">Portfolio Analysis Dashboard</h2>
                <p className="text-primary-foreground/80">AI-powered investment advice for smarter decisions</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="bg-white/10 rounded-lg px-4 py-2 backdrop-blur-sm">
                  <div className="text-sm text-primary-foreground/80">Analyses Today</div>
                  <div className="text-xl font-bold">2</div>
                </div>
                <div className="bg-white/10 rounded-lg px-4 py-2 backdrop-blur-sm">
                  <div className="text-sm text-primary-foreground/80">Credits Used</div>
                  <div className="text-xl font-bold">2 / 10</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Left Column: Portfolio Input & Advice */}
          <div className="lg:col-span-2 space-y-6">
            
            <motion.div variants={itemVariants}>
              <PortfolioInput onAnalysisComplete={handleAnalysisComplete} />
            </motion.div>

            <motion.div variants={itemVariants}>
              <AdviceCards 
                advice={analysisData?.analysis?.advice || []} 
                isLoading={isAnalyzing}
              />
            </motion.div>

          </div>

          {/* Right Column: Charts & Analytics */}
          <div className="space-y-6">
            
            <motion.div variants={itemVariants}>
              <PortfolioChart 
                portfolio={portfolio}
                stockData={analysisData?.stockData || []}
                isLoading={!analysisData && portfolio.length > 0}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <StockChart 
                portfolio={portfolio}
                stockData={analysisData?.stockData || []}
                isLoading={!analysisData && portfolio.length > 0}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <MarketOverview />
            </motion.div>

            <motion.div variants={itemVariants}>
              <UsageTracking />
            </motion.div>

          </div>
        </div>

        {/* Quick Actions Footer */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                <div>
                  <h3 className="font-semibold text-card-foreground mb-1">Quick Actions</h3>
                  <p className="text-sm text-muted-foreground">Streamline your investment decisions</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="secondary" 
                    onClick={handleExportReport}
                    data-testid="button-export"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={handleSavePortfolio}
                    data-testid="button-save"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Portfolio
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={handleShareAdvice}
                    data-testid="button-share"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Advice
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </motion.div>
    </div>
  );
}
