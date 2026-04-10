from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Deal(Base):
    __tablename__ = "deals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    owner_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    location: Mapped[str] = mapped_column(String(200), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    purchase_price: Mapped[float] = mapped_column(Float, nullable=False)
    down_payment: Mapped[float] = mapped_column(Float, nullable=False)
    interest_rate: Mapped[float] = mapped_column(Float, nullable=False)
    loan_years: Mapped[int] = mapped_column(Integer, nullable=False)

    closing_costs: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    renovation_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    furnishing_cost: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    nightly_rate: Mapped[float] = mapped_column(Float, nullable=False)
    occupancy_rate: Mapped[float] = mapped_column(Float, nullable=False)
    other_monthly_income: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    property_tax_monthly: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    insurance_monthly: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    hoa_monthly: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    utilities_monthly: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    cleaning_monthly: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    maintenance_monthly: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    management_fee_percent: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    platform_fee_percent: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    other_monthly_expenses: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    monthly_revenue: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    monthly_expenses: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    monthly_cash_flow: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    annual_cash_flow: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    cash_on_cash_roi: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    cap_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    break_even_occupancy: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    noi: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    dscr: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    owner = relationship("User", back_populates="deals")