from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class DealBase(BaseModel):
    title: str
    location: str
    notes: Optional[str] = None

    purchase_price: float
    down_payment: float
    interest_rate: float
    loan_years: int

    closing_costs: float = 0.0
    renovation_cost: float = 0.0
    furnishing_cost: float = 0.0

    nightly_rate: float
    occupancy_rate: float
    other_monthly_income: float = 0.0

    property_tax_monthly: float = 0.0
    insurance_monthly: float = 0.0
    hoa_monthly: float = 0.0
    utilities_monthly: float = 0.0
    cleaning_monthly: float = 0.0
    maintenance_monthly: float = 0.0

    management_fee_percent: float = 0.0
    platform_fee_percent: float = 0.0
    other_monthly_expenses: float = 0.0


class DealCreate(DealBase):
    pass


class DealUpdate(BaseModel):
    title: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None

    purchase_price: Optional[float] = None
    down_payment: Optional[float] = None
    interest_rate: Optional[float] = None
    loan_years: Optional[int] = None

    closing_costs: Optional[float] = None
    renovation_cost: Optional[float] = None
    furnishing_cost: Optional[float] = None

    nightly_rate: Optional[float] = None
    occupancy_rate: Optional[float] = None
    other_monthly_income: Optional[float] = None

    property_tax_monthly: Optional[float] = None
    insurance_monthly: Optional[float] = None
    hoa_monthly: Optional[float] = None
    utilities_monthly: Optional[float] = None
    cleaning_monthly: Optional[float] = None
    maintenance_monthly: Optional[float] = None

    management_fee_percent: Optional[float] = None
    platform_fee_percent: Optional[float] = None
    other_monthly_expenses: Optional[float] = None


class DealAnalysis(BaseModel):
    monthly_revenue: float = 0.0
    annual_revenue: float = 0.0
    monthly_expenses: float = 0.0
    annual_expenses: float = 0.0
    noi_annual: float = 0.0
    monthly_mortgage: float = 0.0
    monthly_cash_flow: float = 0.0
    annual_cash_flow: float = 0.0
    cash_needed: float = 0.0
    cash_on_cash_roi: float = 0.0
    cap_rate: float = 0.0
    break_even_occupancy: float = 0.0
    score: float = 0.0
    risk: str = "Unknown"
    verdict: str = "No verdict"


class DealResponse(DealBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime
    analysis: DealAnalysis