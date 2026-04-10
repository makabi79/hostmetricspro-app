from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.deal import Deal
from app.models.user import User
from app.schemas.dashboard import DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


def calculate_score(cap_rate: float, cash_on_cash_roi: float) -> float:
    raw_score = (cap_rate * 6.0) + (cash_on_cash_roi * 4.0)
    return max(0.0, min(100.0, raw_score))


@router.get("/summary", response_model=DashboardSummary)
def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardSummary:
    deals = db.query(Deal).filter(Deal.owner_id == current_user.id).all()

    if not deals:
        return DashboardSummary(
            total_deals=0,
            avg_monthly_cash_flow=0,
            avg_cash_on_cash_roi=0,
            avg_cap_rate=0,
            best_score=0,
        )

    total = len(deals)

    avg_monthly_cash_flow = sum(
        float(getattr(d, "monthly_cash_flow", 0) or 0) for d in deals
    ) / total

    avg_cash_on_cash_roi = sum(
        float(getattr(d, "cash_on_cash_roi", 0) or 0) for d in deals
    ) / total

    avg_cap_rate = sum(
        float(getattr(d, "cap_rate", 0) or 0) for d in deals
    ) / total

    best_score = max(
        calculate_score(
            float(getattr(d, "cap_rate", 0) or 0),
            float(getattr(d, "cash_on_cash_roi", 0) or 0),
        )
        for d in deals
    )

    return DashboardSummary(
        total_deals=total,
        avg_monthly_cash_flow=round(avg_monthly_cash_flow, 2),
        avg_cash_on_cash_roi=round(avg_cash_on_cash_roi, 2),
        avg_cap_rate=round(avg_cap_rate, 2),
        best_score=round(best_score, 2),
    )