from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
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
)

router = APIRouter(prefix="/billing", tags=["billing"])

FREE_PLAN_MAX_DEALS = 3


def get_value(source: Any, key: str, default: Any = None) -> Any:
    if source is None:
        return default
    if isinstance(source, dict):
        return source.get(key, default)
    return getattr(source, key, default)


def get_nested_value(source: Any, path: list[str], default: Any = None) -> Any:
    current = source
    for key in path:
        current = get_value(current, key, None)
        if current is None:
            return default
    return current


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


def get_user_id_from_paddle_object(paddle_object: Any) -> int | None:
    custom_data = get_value(paddle_object, "custom_data") or {}
    user_id_raw = get_value(custom_data, "user_id")

    if not user_id_raw:
        return None

    try:
        return int(user_id_raw)
    except (TypeError, ValueError):
        return None


def find_subscription_for_event(
    db: Session,
    paddle_object: Any,
) -> Subscription | None:
    user_id = get_user_id_from_paddle_object(paddle_object)
    if user_id is not None:
        return get_or_create_subscription(db, user_id)

    paddle_subscription_id = get_value(paddle_object, "id")
    paddle_customer_id = get_value(paddle_object, "customer_id")

    filters = []

    if paddle_subscription_id:
        filters.append(Subscription.paddle_subscription_id == paddle_subscription_id)

    if paddle_customer_id:
        filters.append(Subscription.paddle_customer_id == paddle_customer_id)

    if not filters:
        return None

    return db.query(Subscription).filter(or_(*filters)).first()


def sync_subscription_from_paddle_object(
    subscription: Subscription,
    paddle_object: Any,
) -> None:
    paddle_status = get_value(paddle_object, "status", "inactive")
    items = get_value(paddle_object, "items", []) or []
    price_id = None

    if items:
        first_item = items[0]
        price_id = get_nested_value(first_item, ["price", "id"]) or get_value(
            first_item, "price_id"
        )

    subscription.subscription_status = paddle_status
    subscription.current_plan = (
        "pro" if paddle_status in {"active", "trialing"} else "free"
    )
    subscription.paddle_subscription_id = get_value(paddle_object, "id")
    subscription.paddle_customer_id = get_value(paddle_object, "customer_id")
    subscription.paddle_price_id = price_id


def sync_customer_from_transaction_object(
    subscription: Subscription,
    paddle_object: Any,
) -> None:
    paddle_customer_id = get_value(paddle_object, "customer_id")
    items = get_value(paddle_object, "items", []) or []
    price_id = None

    if items:
        first_item = items[0]
        price_id = get_nested_value(first_item, ["price", "id"]) or get_value(
            first_item, "price_id"
        )

    if paddle_customer_id:
        subscription.paddle_customer_id = paddle_customer_id

    if price_id:
        subscription.paddle_price_id = price_id


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
            existing_customer_id=subscription.paddle_customer_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Failed to create Paddle checkout session.",
        ) from exc

    return CheckoutSessionResponse(checkout_url=checkout_url)


@router.get("/confirm", response_model=BillingConfirmResponse)
def confirm_checkout(
    transaction_id: str | None = Query(default=None, min_length=1),
    _ptxn: str | None = Query(default=None, min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BillingConfirmResponse:
    _ = transaction_id
    _ = _ptxn

    subscription = get_or_create_subscription(db, current_user.id)

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

    if not subscription.paddle_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Paddle customer found for this user.",
        )

    try:
        portal_url = create_billing_portal_session(
            customer_id=subscription.paddle_customer_id,
            subscription_id=subscription.paddle_subscription_id,
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
async def paddle_webhook(
    request: Request,
    paddle_signature: str = Header(default="", alias="Paddle-Signature"),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    payload = await request.body()

    try:
        event = construct_webhook_event(payload, paddle_signature)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    event_type = get_value(event, "event_type") or get_value(event, "type")
    data_object = get_value(event, "data")

    if event_type in {
        "transaction.completed",
    }:
        subscription = find_subscription_for_event(db, data_object)

        if subscription:
            sync_customer_from_transaction_object(subscription, data_object)
            db.add(subscription)
            db.commit()

    if event_type in {
        "subscription.created",
        "subscription.trialing",
        "subscription.activated",
        "subscription.updated",
        "subscription.resumed",
        "subscription.paused",
        "subscription.past_due",
        "subscription.canceled",
    }:
        subscription = find_subscription_for_event(db, data_object)

        if subscription:
            sync_subscription_from_paddle_object(subscription, data_object)
            db.add(subscription)
            db.commit()

    return {"received": True}