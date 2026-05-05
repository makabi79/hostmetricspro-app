import os
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
    AdminActivateProRequest,
    AdminActivateProResponse,
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


def get_user_id_from_dodo_object(dodo_object: Any) -> int | None:
    metadata = get_value(dodo_object, "metadata") or {}
    user_id_raw = get_value(metadata, "user_id")

    if not user_id_raw:
        user_id_raw = get_nested_value(dodo_object, ["customer", "metadata", "user_id"])

    if not user_id_raw:
        return None

    try:
        return int(user_id_raw)
    except (TypeError, ValueError):
        return None


def get_dodo_subscription_id(dodo_object: Any) -> str | None:
    value = (
        get_value(dodo_object, "subscription_id")
        or get_value(dodo_object, "subscriptionId")
        or get_nested_value(dodo_object, ["subscription", "id"])
    )

    if isinstance(value, str) and value.strip():
        return value

    object_id = get_value(dodo_object, "id")
    payload_type = get_value(dodo_object, "payload_type")

    if payload_type == "Subscription" and isinstance(object_id, str) and object_id.strip():
        return object_id

    return None


def get_dodo_customer_id(dodo_object: Any) -> str | None:
    value = (
        get_value(dodo_object, "customer_id")
        or get_value(dodo_object, "customerId")
        or get_nested_value(dodo_object, ["customer", "customer_id"])
        or get_nested_value(dodo_object, ["customer", "id"])
    )

    if isinstance(value, str) and value.strip():
        return value

    return None


def get_dodo_product_id(dodo_object: Any) -> str | None:
    value = (
        get_value(dodo_object, "product_id")
        or get_value(dodo_object, "productId")
        or get_nested_value(dodo_object, ["product", "id"])
    )

    if isinstance(value, str) and value.strip():
        return value

    product_cart = get_value(dodo_object, "product_cart") or []
    if product_cart:
        first_item = product_cart[0]
        cart_product_id = get_value(first_item, "product_id") or get_nested_value(
            first_item,
            ["product", "id"],
        )
        if isinstance(cart_product_id, str) and cart_product_id.strip():
            return cart_product_id

    return None


def find_subscription_for_event(
    db: Session,
    dodo_object: Any,
) -> Subscription | None:
    user_id = get_user_id_from_dodo_object(dodo_object)
    if user_id is not None:
        return get_or_create_subscription(db, user_id)

    dodo_subscription_id = get_dodo_subscription_id(dodo_object)
    dodo_customer_id = get_dodo_customer_id(dodo_object)

    filters = []

    if dodo_subscription_id:
        filters.append(Subscription.paddle_subscription_id == dodo_subscription_id)

    if dodo_customer_id:
        filters.append(Subscription.paddle_customer_id == dodo_customer_id)

    if not filters:
        return None

    return db.query(Subscription).filter(or_(*filters)).first()


def sync_subscription_from_dodo_object(
    subscription: Subscription,
    dodo_object: Any,
    fallback_status: str,
) -> None:
    dodo_status = get_value(dodo_object, "status") or fallback_status

    if dodo_status in {"active", "renewed", "trialing"}:
        subscription.current_plan = "pro"
        subscription.subscription_status = "active"
    elif dodo_status in {"on_hold", "processing"}:
        subscription.current_plan = "free"
        subscription.subscription_status = "inactive"
    elif dodo_status in {"cancelled", "canceled", "failed", "expired"}:
        subscription.current_plan = "free"
        subscription.subscription_status = "canceled" if dodo_status in {"cancelled", "canceled"} else "inactive"
    else:
        subscription.current_plan = "free"
        subscription.subscription_status = str(dodo_status)

    dodo_subscription_id = get_dodo_subscription_id(dodo_object)
    dodo_customer_id = get_dodo_customer_id(dodo_object)
    dodo_product_id = get_dodo_product_id(dodo_object)

    if dodo_subscription_id:
        subscription.paddle_subscription_id = dodo_subscription_id

    if dodo_customer_id:
        subscription.paddle_customer_id = dodo_customer_id

    if dodo_product_id:
        subscription.paddle_price_id = dodo_product_id


def sync_customer_from_payment_object(
    subscription: Subscription,
    dodo_object: Any,
) -> None:
    dodo_customer_id = get_dodo_customer_id(dodo_object)
    dodo_subscription_id = get_dodo_subscription_id(dodo_object)
    dodo_product_id = get_dodo_product_id(dodo_object)

    if dodo_customer_id:
        subscription.paddle_customer_id = dodo_customer_id

    if dodo_subscription_id:
        subscription.paddle_subscription_id = dodo_subscription_id

    if dodo_product_id:
        subscription.paddle_price_id = dodo_product_id


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
            detail="Failed to create Dodo checkout session.",
        ) from exc

    return CheckoutSessionResponse(checkout_url=checkout_url)


@router.get("/confirm", response_model=BillingConfirmResponse)
def confirm_checkout(
    checkout_session_id: str | None = Query(default=None, min_length=1),
    session_id: str | None = Query(default=None, min_length=1),
    payment_id: str | None = Query(default=None, min_length=1),
    subscription_id: str | None = Query(default=None, min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BillingConfirmResponse:
    _ = checkout_session_id
    _ = session_id
    _ = payment_id
    _ = subscription_id

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
            detail="No Dodo customer found for this user.",
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


@router.post("/admin/activate-pro", response_model=AdminActivateProResponse)
def activate_pro_admin(
    payload: AdminActivateProRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AdminActivateProResponse:
    admin_email = os.getenv("ADMIN_EMAIL", "").strip().lower()

    if not admin_email:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="ADMIN_EMAIL is not configured.",
        )

    if current_user.email.lower() != admin_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )

    user = db.query(User).filter(User.email == payload.email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    subscription = get_or_create_subscription(db, user.id)
    subscription.current_plan = "pro"
    subscription.subscription_status = "active"

    db.add(subscription)
    db.commit()
    db.refresh(subscription)

    return AdminActivateProResponse(
        message="Pro activated successfully.",
        email=user.email,
        current_plan=subscription.current_plan,
        subscription_status=subscription.subscription_status,
        is_pro=is_pro_subscription(subscription),
    )


@router.post("/webhook", status_code=200)
async def dodo_webhook(
    request: Request,
    webhook_id: str = Header(default="", alias="webhook-id"),
    webhook_signature: str = Header(default="", alias="webhook-signature"),
    webhook_timestamp: str = Header(default="", alias="webhook-timestamp"),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    payload = await request.body()

    try:
        event = construct_webhook_event(
            payload=payload,
            webhook_id=webhook_id,
            webhook_signature=webhook_signature,
            webhook_timestamp=webhook_timestamp,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    event_type = get_value(event, "type")
    data_object = get_value(event, "data")

    if not event_type or not data_object:
        return {"received": True}

    if event_type == "payment.succeeded":
        subscription = find_subscription_for_event(db, data_object)

        if subscription:
            sync_customer_from_payment_object(subscription, data_object)
            subscription.current_plan = "pro"
            subscription.subscription_status = "active"
            db.add(subscription)
            db.commit()

    if event_type in {
        "subscription.active",
        "subscription.renewed",
        "subscription.updated",
    }:
        subscription = find_subscription_for_event(db, data_object)

        if subscription:
            sync_subscription_from_dodo_object(
                subscription=subscription,
                dodo_object=data_object,
                fallback_status="active",
            )
            db.add(subscription)
            db.commit()

    if event_type in {
        "subscription.cancelled",
        "subscription.failed",
        "subscription.expired",
    }:
        subscription = find_subscription_for_event(db, data_object)

        if subscription:
            sync_subscription_from_dodo_object(
                subscription=subscription,
                dodo_object=data_object,
                fallback_status="cancelled",
            )
            db.add(subscription)
            db.commit()

    return {"received": True}