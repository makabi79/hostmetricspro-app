from pydantic import BaseModel


class BillingStatusResponse(BaseModel):
    current_plan: str
    subscription_status: str
    can_create_more_deals: bool
    max_deals: int | None
    deals_used: int
    is_pro: bool


class CheckoutSessionResponse(BaseModel):
    checkout_url: str


class BillingPortalResponse(BaseModel):
    portal_url: str


class BillingConfirmResponse(BaseModel):
    current_plan: str
    subscription_status: str
    is_pro: bool