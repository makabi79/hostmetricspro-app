import { clearSession, getToken } from "@/lib/auth";
import { ApiRequestError } from "@/lib/api";
import type { ApiErrorDetail, ApiErrorResponse } from "@/lib/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api/v1";

function getErrorMessage(
  detail: ApiErrorResponse["detail"],
  status: number
): string {
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const message = detail
      .map((item) => {
        const loc = Array.isArray(item.loc) ? item.loc.join(".") : "";
        return loc
          ? `${loc}: ${item.msg || "Invalid value"}`
          : item.msg || "Invalid value";
      })
      .join(" | ");

    return message || "Validation error";
  }

  if (detail && typeof detail === "object" && detail.message) {
    return detail.message;
  }

  return `Request failed with status ${status}`;
}

function getStructuredDetail(
  detail: ApiErrorResponse["detail"]
): ApiErrorDetail | undefined {
  if (!detail || typeof detail !== "object" || Array.isArray(detail)) {
    return undefined;
  }

  return detail;
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  if (!token) {
    clearSession();
    throw new ApiRequestError("Unauthorized", 401);
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const data: ApiErrorResponse = await response
      .json()
      .catch(() => ({ detail: `Request failed with status ${response.status}` }));

    const message = getErrorMessage(data.detail, response.status);
    const structuredDetail = getStructuredDetail(data.detail);
    const code = structuredDetail?.code;

    if (response.status === 401) {
      clearSession();
    }

    throw new ApiRequestError(message, response.status, code, structuredDetail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export type BillingStatus = {
  current_plan: string;
  subscription_status: string;
  can_create_more_deals: boolean;
  max_deals: number | null;
  deals_used: number;
  is_pro: boolean;
};

export type BillingConfirmResponse = {
  current_plan: string;
  subscription_status: string;
  is_pro: boolean;
};

export async function fetchBillingStatus(): Promise<BillingStatus> {
  return apiRequest<BillingStatus>("/billing/status", { method: "GET" });
}

export async function createCheckoutSession(): Promise<{ checkout_url: string }> {
  throw new ApiRequestError("Payments are coming soon.", 503);
}

export async function confirmCheckoutSession(
  sessionId: string
): Promise<BillingConfirmResponse> {
  return apiRequest<BillingConfirmResponse>(
    `/billing/confirm?session_id=${encodeURIComponent(sessionId)}`,
    { method: "GET" }
  );
}

export async function createBillingPortal(): Promise<{ portal_url: string }> {
  return apiRequest<{ portal_url: string }>("/billing/portal", {
    method: "POST",
  });
}