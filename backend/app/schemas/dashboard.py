from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_deals: int
    avg_monthly_cash_flow: float
    avg_cash_on_cash_roi: float
    avg_cap_rate: float
    best_score: float  # ✅ FIX