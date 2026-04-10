import { DashboardSummary } from "@/lib/types";

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function KpiCards({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="metrics-grid">
      <div className="metric-card">
        <span>Total Deals</span>
        <strong>{summary.total_deals}</strong>
      </div>
      <div className="metric-card">
        <span>Avg Monthly Cash Flow</span>
        <strong>{currency(summary.avg_monthly_cash_flow)}</strong>
      </div>
      <div className="metric-card">
        <span>Avg CoC ROI</span>
        <strong>{summary.avg_cash_on_cash_roi.toFixed(1)}%</strong>
      </div>
      <div className="metric-card">
        <span>Best Score</span>
        <strong>{summary.best_score}/100</strong>
      </div>
    </section>
  );
}