import stripe

from app.core.config import get_settings

settings = get_settings()

if settings.stripe_secret_key:
    stripe.api_key = settings.stripe_secret_key


def ensure_stripe_secret_key() -> None:
    if not settings.stripe_secret_key.strip():
        raise ValueError("STRIPE_SECRET_KEY is missing")


def ensure_checkout_config() -> None:
    ensure_stripe_secret_key()

    if not settings.stripe_pro_price_id.strip():
        raise ValueError("STRIPE_PRO_PRICE_ID is missing")

    if not settings.app_base_url.strip():
        raise ValueError("APP_BASE_URL is missing")


def ensure_portal_config() -> None:
    ensure_stripe_secret_key()

    if not settings.app_base_url.strip():
        raise ValueError("APP_BASE_URL is missing")


def ensure_webhook_config() -> None:
    ensure_stripe_secret_key()

    if not settings.stripe_webhook_secret.strip():
        raise ValueError("STRIPE_WEBHOOK_SECRET is missing")


def create_checkout_session(
    *,
    user_id: int,
    email: str,
    existing_customer_id: str | None,
) -> str:
    ensure_checkout_config()

    session_params = {
        "mode": "subscription",
        "line_items": [
            {
                "price": settings.stripe_pro_price_id,
                "quantity": 1,
            }
        ],
        "success_url": (
            f"{settings.app_base_url}/pricing"
            "?checkout=success&session_id={CHECKOUT_SESSION_ID}"
        ).replace("{CHECKOUT_SESSION_ID}", "{CHECKOUT_SESSION_ID}"),
        "cancel_url": f"{settings.app_base_url}/pricing?checkout=cancel",
        "client_reference_id": str(user_id),
        "allow_promotion_codes": True,
        "metadata": {"user_id": str(user_id)},
        "subscription_data": {
            "metadata": {
                "user_id": str(user_id),
            }
        },
    }

    if existing_customer_id:
        session_params["customer"] = existing_customer_id
    else:
        session_params["customer_email"] = email

    session = stripe.checkout.Session.create(**session_params)
    return session.url


def retrieve_checkout_session(session_id: str):
    ensure_stripe_secret_key()
    return stripe.checkout.Session.retrieve(session_id)


def create_billing_portal_session(*, customer_id: str) -> str:
    ensure_portal_config()

    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{settings.app_base_url}/pricing",
    )
    return session.url


def construct_webhook_event(payload: bytes, signature: str):
    ensure_webhook_config()

    return stripe.Webhook.construct_event(
        payload=payload,
        sig_header=signature,
        secret=settings.stripe_webhook_secret,
    )