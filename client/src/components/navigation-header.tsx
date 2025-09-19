import { Moon, Sun, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function NavigationHeader() {
  const { theme, setTheme } = useTheme();

  return (
    <nav className="bg-card/80 backdrop-blur-sm border-b border-border px-4 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="text-primary-foreground h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Stock Consultant</h1>
          </div>
          <div className="hidden md:flex items-center space-x-1 text-sm text-muted-foreground">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse"></span>
            <span>Live Market Data</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-sm">
            <span className="text-muted-foreground">NSE:</span>
            <span className="text-success font-medium">+0.85%</span>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="h-8 w-8 p-0"
            data-testid="theme-toggle"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-medium text-xs">AI</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
