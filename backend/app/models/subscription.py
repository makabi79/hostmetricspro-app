from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Subscription(Base):
    __tablename__ = "subscriptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )
    current_plan: Mapped[str] = mapped_column(String(20), default="free", nullable=False)
    subscription_status: Mapped[str] = mapped_column(
        String(50),
        default="inactive",
        nullable=False,
    )
    paddle_customer_id: Mapped[str | None] = mapped_column(
        "stripe_customer_id",
        String(255),
        nullable=True,
    )
    paddle_subscription_id: Mapped[str | None] = mapped_column(
        "stripe_subscription_id",
        String(255),
        nullable=True,
    )
    paddle_price_id: Mapped[str | None] = mapped_column(
        "stripe_price_id",
        String(255),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    user = relationship("User", back_populates="subscription")