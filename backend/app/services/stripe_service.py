import base64
import hashlib
import hmac
import json
import time
from typing import Any
from urllib import error, parse, request

from app.core.config import get_settings

settings = get_settings()

DODO_TEST_API_BASE = "https://test.dodopayments.com"
DODO_LIVE_API_BASE = "https://live.dodopayments.com"


def get_dodo_api_base() -> str:
    if settings.dodo_payments_environment == "live":
        return DODO_LIVE_API_BASE
    return DODO_TEST_API_BASE


def ensure_dodo_api_key() -> None:
    if not settings.dodo_payments_api_key.strip():
        raise ValueError("DODO_PAYMENTS_API_KEY is missing")


def ensure_checkout_config() -> None:
    ensure_dodo_api_key()

    if not settings.dodo_pro_product_id.strip():
        raise ValueError("DODO_PRO_PRODUCT_ID is missing")

    if not settings.app_base_url.strip():
        raise ValueError("APP_BASE_URL is missing")


def ensure_portal_config() -> None:
    ensure_dodo_api_key()

    if not settings.app_base_url.strip():
        raise ValueError("APP_BASE_URL is missing")


def ensure_webhook_config() -> None:
    if not settings.dodo_payments_webhook_key.strip():
        raise ValueError("DODO_PAYMENTS_WEBHOOK_KEY is missing")


def _build_headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.dodo_payments_api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def _parse_api_error_body(raw_body: bytes) -> str:
    if not raw_body:
        return "Dodo Payments API request failed."

    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        return raw_body.decode("utf-8", errors="ignore") or "Dodo Payments API request failed."

    if isinstance(payload, dict):
        detail = payload.get("detail")
        message = payload.get("message")

        if isinstance(detail, str) and detail.strip():
            return detail

        if isinstance(message, str) and message.strip():
            return message

        error_obj = payload.get("error")
        if isinstance(error_obj, dict):
            error_detail = error_obj.get("detail")
            error_message = error_obj.get("message")
            errors = error_obj.get("errors") or []

            if isinstance(error_detail, str) and error_detail.strip():
                return error_detail

            if isinstance(error_message, str) and error_message.strip():
                return error_message

            if errors:
                first_error = errors[0]
                if isinstance(first_error, dict):
                    first_message = first_error.get("detail") or first_error.get("message")
                    if isinstance(first_message, str) and first_message.strip():
                        return first_message

    return "Dodo Payments API request failed."


def _api_request(
    method: str,
    path: str,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    ensure_dodo_api_key()

    body = json.dumps(payload or {}).encode("utf-8")
    req = request.Request(
        url=f"{get_dodo_api_base()}{path}",
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
        raise ValueError("Unable to reach Dodo Payments API.") from exc

    try:
        return json.loads(response_body.decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError("Invalid response from Dodo Payments API.") from exc


def _build_checkout_return_url() -> str:
    return f"{settings.app_base_url}/billing/confirm"


def _build_checkout_cancel_url() -> str:
    return f"{settings.app_base_url}/pricing"


def create_checkout_session(
    *,
    user_id: int,
    email: str,
    existing_customer_id: str | None,
) -> str:
    _ = existing_customer_id
    ensure_checkout_config()

    payload: dict[str, Any] = {
        "product_cart": [
            {
                "product_id": settings.dodo_pro_product_id,
                "quantity": 1,
            }
        ],
        "return_url": _build_checkout_return_url(),
        "cancel_url": _build_checkout_cancel_url(),
        "metadata": {
            "user_id": str(user_id),
            "user_email": email,
            "plan": "pro",
            "source": "hostmetricspro",
        },
    }

    response = _api_request("POST", "/checkouts", payload)
    checkout_url = response.get("checkout_url")

    if not isinstance(checkout_url, str) or not checkout_url.strip():
        raise ValueError("Dodo checkout URL is missing from the API response.")

    return checkout_url


def create_billing_portal_session(
    *,
    customer_id: str,
    subscription_id: str | None,
) -> str:
    _ = subscription_id
    ensure_portal_config()

    query = parse.urlencode(
        {
            "return_url": settings.app_base_url,
        }
    )

    response = _api_request(
        "POST",
        f"/customers/{customer_id}/customer-portal/session?{query}",
        {},
    )

    portal_url = response.get("link")

    if not isinstance(portal_url, str) or not portal_url.strip():
        raise ValueError("Dodo customer portal URL is missing from the API response.")

    return portal_url


def _extract_signature_candidates(signature_header: str) -> list[str]:
    candidates: list[str] = []

    for piece in signature_header.replace(" ", ",").split(","):
        item = piece.strip()
        if not item:
            continue

        candidates.append(item)

        if "=" in item:
            _, value = item.split("=", 1)
            if value.strip():
                candidates.append(value.strip())

    return candidates


def construct_webhook_event(
    payload: bytes,
    webhook_id: str,
    webhook_signature: str,
    webhook_timestamp: str,
) -> dict[str, Any]:
    ensure_webhook_config()

    if not webhook_id.strip():
        raise ValueError("Missing webhook-id header.")

    if not webhook_signature.strip():
        raise ValueError("Missing webhook-signature header.")

    if not webhook_timestamp.strip():
        raise ValueError("Missing webhook-timestamp header.")

    try:
        timestamp_int = int(webhook_timestamp)
    except ValueError as exc:
        raise ValueError("Invalid Dodo webhook timestamp.") from exc

    current_time = int(time.time())
    if abs(current_time - timestamp_int) > settings.dodo_webhook_tolerance_seconds:
        raise ValueError("Dodo webhook signature timestamp is outside the allowed window.")

    try:
        raw_payload = payload.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise ValueError("Invalid Dodo webhook payload encoding.") from exc

    signed_payload = f"{webhook_id}.{webhook_timestamp}.{raw_payload}".encode("utf-8")
    digest = hmac.new(
        settings.dodo_payments_webhook_key.encode("utf-8"),
        signed_payload,
        hashlib.sha256,
    ).digest()

    expected_base64 = base64.b64encode(digest).decode("utf-8")
    expected_hex = digest.hex()

    signature_candidates = _extract_signature_candidates(webhook_signature)

    valid_signature = any(
        hmac.compare_digest(expected_base64, candidate)
        or hmac.compare_digest(f"v1,{expected_base64}", candidate)
        or hmac.compare_digest(expected_hex, candidate)
        or hmac.compare_digest(f"v1,{expected_hex}", candidate)
        for candidate in signature_candidates
    )

    if not valid_signature:
        raise ValueError("Invalid Dodo webhook signature.")

    try:
        return json.loads(raw_payload)
    except json.JSONDecodeError as exc:
        raise ValueError("Invalid Dodo webhook payload.") from exc