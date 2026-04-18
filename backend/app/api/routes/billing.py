from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.deal import Deal
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.billing import (
    BillingConfirmResponse,
    BillingPortalResponse,
    BillingStatusResponse,
    CheckoutSessionResponse,
)
from app.services.stripe_service import (
    construct_webhook_event,
    create_billing_portal_session,
    create_checkout_session,
    retrieve_checkout_session,
)

router = APIRouter(prefix="/billing", tags=["billing"])

FREE_PLAN_MAX_DEALS = 3
ADMIN_EMAIL = "admin@hostmetricspro.com"


class AdminActivateProRequest(BaseModel):
    email: EmailStr


class AdminActivateProResponse(BaseModel):
    email: str
    current_plan: str
    subscription_status: str
    is_pro: bool


def get_or_create_subscription(db: Session, user_id: int) -> Subscription:
    subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()
    if subscription:
        return subscription

    subscription = Subscription(
        user_id=user_id,
        current_plan="free",
        subscription_status="inactive",
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


def is_pro_subscription(subscription: Subscription) -> bool:
    return (
        subscription.current_plan == "pro"
        and subscription.subscription_status in {"active", "trialing"}
    )


def get_value(source: Any, key: str, default: Any = None) -> Any:
    if source is None:
        return default

    if isinstance(source, dict):
        return source.get(key, default)

    return getattr(source, key, default)


def get_nested_value(source: Any, path: list[str], default: Any = None) -> Any:
    current = source

    for key in path:
        if current is None:
            return default

        if isinstance(current, dict):
            current = current.get(key)
        else:
            current = getattr(current, key, None)

    return default if current is None else current


def get_user_id_from_stripe_object(stripe_object: Any) -> int | None:
    metadata = get_value(stripe_object, "metadata", {}) or {}
    user_id_raw = metadata.get("user_id")
    if not user_id_raw:
        return None

    try:
        return int(user_id_raw)
    except (TypeError, ValueError):
        return None


def find_subscription_for_event(
    db: Session,
    stripe_object: Any,
) -> Subscription | None:
    user_id = get_user_id_from_stripe_object(stripe_object)
    if user_id is not None:
        return get_or_create_subscription(db, user_id)

    stripe_subscription_id = get_value(stripe_object, "id")
    stripe_customer_id = get_value(stripe_object, "customer")

    filters = []

    if stripe_subscription_id:
        filters.append(Subscription.stripe_subscription_id == stripe_subscription_id)

    if stripe_customer_id:
        filters.append(Subscription.stripe_customer_id == stripe_customer_id)

    if not filters:
        return None

    return db.query(Subscription).filter(or_(*filters)).first()


def sync_subscription_from_stripe_object(
    subscription: Subscription,
    stripe_object: Any,
) -> None:
    stripe_status = get_value(stripe_object, "status", "inactive")
    items = get_nested_value(stripe_object, ["items", "data"], []) or []
    price_id = None

    if items:
        first_item = items[0]
        price_id = get_nested_value(first_item, ["price", "id"])

    subscription.subscription_status = stripe_status
    subscription.current_plan = (
        "pro" if stripe_status in {"active", "trialing"} else "free"
    )
    subscription.stripe_subscription_id = get_value(stripe_object, "id")
    subscription.stripe_customer_id = get_value(stripe_object, "customer")
    subscription.stripe_price_id = price_id


@router.get("/status", response_model=BillingStatusResponse)
def get_billing_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BillingStatusResponse:
    subscription = get_or_create_subscription(db, current_user.id)
    deals_used = db.query(Deal).filter(Deal.owner_id == current_user.id).count()
    is_pro = is_pro_subscription(subscription)

    return BillingStatusResponse(
        current_plan=subscription.current_plan,
        subscription_status=subscription.subscription_status,
        can_create_more_deals=True if is_pro else deals_used < FREE_PLAN_MAX_DEALS,
        max_deals=None if is_pro else FREE_PLAN_MAX_DEALS,
        deals_used=deals_used,
        is_pro=is_pro,
    )


@router.post("/admin/activate-pro", response_model=AdminActivateProResponse)
def admin_activate_pro(
    payload: AdminActivateProRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AdminActivateProResponse:
    if current_user.email.lower() != ADMIN_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )

    target_user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    subscription = get_or_create_subscription(db, target_user.id)
    subscription.current_plan = "pro"
    subscription.subscription_status = "active"
    db.add(subscription)
    db.commit()
    db.refresh(subscription)

    return AdminActivateProResponse(
        email=target_user.email,
        current_plan=subscription.current_plan,
        subscription_status=subscription.subscription_status,
        is_pro=is_pro_subscription(subscription),
    )


@router.post("/checkout", response_model=CheckoutSessionResponse)
def start_checkout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CheckoutSessionResponse:
    subscription = get_or_create_subscription(db, current_user.id)

    if is_pro_subscription(subscription):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active Pro subscription.",
        )

    try:
        checkout_url = create_checkout_session(
            user_id=current_user.id,
            email=current_user.email,
            existing_customer_id=subscription.stripe_customer_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Failed to create Stripe checkout session.",
        ) from exc

    return CheckoutSessionResponse(checkout_url=checkout_url)


@router.get("/confirm", response_model=BillingConfirmResponse)
def confirm_checkout(
    session_id: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BillingConfirmResponse:
    subscription = get_or_create_subscription(db, current_user.id)

    if is_pro_subscription(subscription):
        return BillingConfirmResponse(
            current_plan=subscription.current_plan,
            subscription_status=subscription.subscription_status,
            is_pro=True,
        )

    try:
        session = retrieve_checkout_session(session_id)
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid Stripe session.") from exc

    session_dict = session._to_dict_recursive()

    session_metadata = session_dict.get("metadata") or {}
    session_user_id = session_metadata.get("user_id") or session_dict.get(
        "client_reference_id"
    )

    if str(session_user_id) != str(current_user.id):
        raise HTTPException(
            status_code=403,
            detail="This checkout session does not belong to the current user.",
        )

    payment_status = session_dict.get("payment_status")
    session_status = session_dict.get("status")
    stripe_customer_id = session_dict.get("customer")
    stripe_subscription_id = session_dict.get("subscription")

    if payment_status != "paid" and session_status != "complete":
        raise HTTPException(
            status_code=400,
            detail="Stripe checkout is not completed yet.",
        )

    subscription.current_plan = "pro"
    subscription.subscription_status = "active"
    subscription.stripe_customer_id = stripe_customer_id
    subscription.stripe_subscription_id = stripe_subscription_id
    db.add(subscription)
    db.commit()
    db.refresh(subscription)

    return BillingConfirmResponse(
        current_plan=subscription.current_plan,
        subscription_status=subscription.subscription_status,
        is_pro=is_pro_subscription(subscription),
    )


@router.post("/portal", response_model=BillingPortalResponse)
def open_billing_portal(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BillingPortalResponse:
    subscription = get_or_create_subscription(db, current_user.id)

    if not subscription.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Stripe customer found for this user.",
        )

    try:
        portal_url = create_billing_portal_session(
            customer_id=subscription.stripe_customer_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Failed to create billing portal session.",
        ) from exc

    return BillingPortalResponse(portal_url=portal_url)


@router.post("/webhook", status_code=200)
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(default="", alias="Stripe-Signature"),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    payload = await request.body()

    try:
        event = construct_webhook_event(payload, stripe_signature)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    event_type = event["type"]
    data_object = event["data"]["object"]

    if event_type == "checkout.session.completed":
        metadata = get_value(data_object, "metadata", {}) or {}
        user_id_raw = metadata.get("user_id") or get_value(
            data_object, "client_reference_id"
        )
        customer_id = get_value(data_object, "customer")
        subscription_id = get_value(data_object, "subscription")

        if user_id_raw:
            try:
                user_id = int(user_id_raw)
            except (TypeError, ValueError):
                user_id = None

            if user_id is not None:
                subscription = get_or_create_subscription(db, user_id)
                subscription.stripe_customer_id = customer_id
                subscription.stripe_subscription_id = subscription_id
                subscription.current_plan = "pro"
                subscription.subscription_status = "active"
                db.add(subscription)
                db.commit()

    elif event_type in {"customer.subscription.created", "customer.subscription.updated"}:
        subscription = find_subscription_for_event(db, data_object)

        if subscription:
            sync_subscription_from_stripe_object(subscription, data_object)
            db.add(subscription)
            db.commit()

    elif event_type in {
        "customer.subscription.deleted",
        "customer.subscription.paused",
        "customer.subscription.resumed",
    }:
        subscription = find_subscription_for_event(db, data_object)

        if subscription:
            sync_subscription_from_stripe_object(subscription, data_object)

            if event_type == "customer.subscription.deleted":
                subscription.current_plan = "free"

            db.add(subscription)
            db.commit()

    elif event_type == "invoice.payment_failed":
        stripe_customer_id = get_value(data_object, "customer")

        if stripe_customer_id:
            subscription = (
                db.query(Subscription)
                .filter(Subscription.stripe_customer_id == stripe_customer_id)
                .first()
            )
            if subscription:
                subscription.subscription_status = "past_due"
                subscription.current_plan = "free"
                db.add(subscription)
                db.commit()

    return {"received": True}