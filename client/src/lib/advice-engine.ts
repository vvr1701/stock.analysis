import { AdviceItem } from "@/types/stock";

export function getAdviceIcon(type: string): string {
  switch (type) {
    case "BUY":
      return "📈";
    case "SELL":
      return "📉";
    case "HOLD":
      return "🤝";
    case "DIVERSIFY":
      return "🔄";
    default:
      return "📊";
  }
}

export function getAdviceColor(type: string): string {
  switch (type) {
    case "BUY":
      return "success";
    case "SELL":
      return "destructive";
    case "HOLD":
      return "warning";
    case "DIVERSIFY":
      return "primary";
    default:
      return "muted";
  }
}

export function getAdviceBackground(type: string): string {
  switch (type) {
    case "BUY":
      return "advice-buy";
    case "SELL":
      return "advice-sell";
    case "HOLD":
      return "advice-hold";
    case "DIVERSIFY":
      return "advice-diversify";
    default:
      return "bg-muted";
  }
}
