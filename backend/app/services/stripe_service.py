import hashlib
import hmac
import json
import time
from typing import Any
from urllib import error, request

from app.core.config import get_settings

settings = get_settings()

PADDLE_API_BASE = "https://api.paddle.com"
PADDLE_API_VERSION = "1"


def ensure_paddle_api_key() -> None:
    if not settings.paddle_api_key.strip():
        raise ValueError("PADDLE_API_KEY is missing")


def ensure_checkout_config() -> None:
    ensure_paddle_api_key()

    if not settings.paddle_pro_price_id.strip():
        raise ValueError("PADDLE_PRO_PRICE_ID is missing")

    if not settings.app_base_url.strip():
        raise ValueError("APP_BASE_URL is missing")


def ensure_portal_config() -> None:
    ensure_paddle_api_key()


def ensure_webhook_config() -> None:
    if not settings.paddle_webhook_secret.strip():
        raise ValueError("PADDLE_WEBHOOK_SECRET is missing")


def _build_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.paddle_api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Paddle-Version": PADDLE_API_VERSION,
    }


def _parse_api_error_body(raw_body: bytes) -> str:
    if not raw_body:
        return "Paddle API request failed."

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return raw_body.decode("utf-8", errors="ignore") or "Paddle API request failed."

    error_obj = payload.get("error") or {}
    detail = error_obj.get("detail")
    errors = error_obj.get("errors") or []

    if isinstance(detail, str) and detail.strip():
        return detail

    if errors:
        first_error = errors[0]
        if isinstance(first_error, dict):
            first_message = first_error.get("detail") or first_error.get("message")
            if isinstance(first_message, str) and first_message.strip():
                return first_message

    return "Paddle API request failed."


def _api_request(
    method: str,
    path: str,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    ensure_paddle_api_key()

    body = json.dumps(payload or {}).encode("utf-8")
    req = request.Request(
        url=f"{PADDLE_API_BASE}{path}",
        data=body,
        headers=_build_headers(),
        method=method.upper(),
    )

    try:
        with request.urlopen(req, timeout=30) as response:
            response_body = response.read()
    except error.HTTPError as exc:
        error_body = exc.read()
        raise ValueError(_parse_api_error_body(error_body)) from exc
    except error.URLError as exc:
        raise ValueError("Unable to reach Paddle API.") from exc

    try:
        return json.loads(response_body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError("Invalid response from Paddle API.") from exc


def _build_checkout_return_url() -> str:
    return f"{settings.app_base_url}/billing/confirm"


def create_checkout_session(
    *,
    user_id: int,
    email: str,
    existing_customer_id: str | None,
) -> str:
    ensure_checkout_config()

    payload: dict[str, Any] = {
        "items": [
            {
                "price_id": settings.paddle_pro_price_id,
                "quantity": 1,
            }
        ],
        "collection_mode": "automatic",
        "custom_data": {
            "user_id": str(user_id),
            "user_email": email,
        },
        "checkout": {
            "url": _build_checkout_return_url(),
        },
    }

    if existing_customer_id:
        payload["customer_id"] = existing_customer_id

    response = _api_request("POST", "/transactions", payload)
    checkout_url = response.get("data", {}).get("checkout", {}).get("url")

    if not isinstance(checkout_url, str) or not checkout_url.strip():
        raise ValueError("Paddle checkout URL is missing from the API response.")

    return checkout_url


def create_billing_portal_session(
    *,
    customer_id: str,
    subscription_id: str | None,
) -> str:
    ensure_portal_config()

    payload: dict[str, Any] = {}
    if subscription_id:
        payload["subscription_ids"] = [subscription_id]

    response = _api_request(
        "POST",
        f"/customers/{customer_id}/portal-sessions",
        payload,
    )

    portal_url = (
        response.get("data", {})
        .get("urls", {})
        .get("general", {})
        .get("overview")
    )

    if not isinstance(portal_url, str) or not portal_url.strip():
        raise ValueError("Paddle billing portal URL is missing from the API response.")

    return portal_url


def construct_webhook_event(payload: bytes, signature: str) -> dict[str, Any]:
    ensure_webhook_config()

    if not signature.strip():
        raise ValueError("Missing Paddle-Signature header.")

    parts: dict[str, list[str]] = {}
    for piece in signature.split(";"):
        item = piece.strip()
        if "=" not in item:
            continue
        key, value = item.split("=", 1)
        parts.setdefault(key.strip(), []).append(value.strip())

    timestamp_values = parts.get("ts", [])
    signature_values = parts.get("h1", [])

    if not timestamp_values or not signature_values:
        raise ValueError("Invalid Paddle-Signature header.")

    timestamp_raw = timestamp_values[0]

    try:
        timestamp_int = int(timestamp_raw)
    except ValueError as exc:
        raise ValueError("Invalid Paddle webhook timestamp.") from exc

    current_time = int(time.time())
    if abs(current_time - timestamp_int) > settings.paddle_webhook_tolerance_seconds:
        raise ValueError("Paddle webhook signature timestamp is outside the allowed window.")

    signed_payload = f"{timestamp_raw}:{payload.decode('utf-8')}".encode("utf-8")
    expected_signature = hmac.new(
        settings.paddle_webhook_secret.encode("utf-8"),
        signed_payload,
        hashlib.sha256,
    ).hexdigest()

    if not any(hmac.compare_digest(expected_signature, candidate) for candidate in signature_values):
        raise ValueError("Invalid Paddle webhook signature.")

    try:
        return json.loads(payload.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError("Invalid Paddle webhook payload.") from exc