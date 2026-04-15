import type {
  ActivateProResponse,
  ApiErrorDetail,
  ApiErrorResponse,
  DashboardSummary,
  Deal,
  DealPayload,
  TokenResponse,
  User,
} from "@/lib/types";
import { clearSession, getToken } from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api/v1";

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

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  detail?: ApiErrorDetail;

  constructor(
    message: string,
    status: number,
    code?: string,
    detail?: ApiErrorDetail
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.detail = detail;
  }
}

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

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = false
): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getToken();

    if (!token) {
      clearSession();
      throw new ApiRequestError("Unauthorized", 401);
    }

    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
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

export const api = {
  signup: (payload: { name: string; email: string; password: string }) =>
    request<TokenResponse>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<TokenResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: () =>
    request<User>(
      "/auth/me",
      {
        method: "GET",
      },
      true
    ),

  getDeals: () =>
    request<Deal[]>(
      "/deals",
      {
        method: "GET",
      },
      true
    ),

  createDeal: (payload: DealPayload) =>
    request<Deal>(
      "/deals",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
      true
    ),

  updateDeal: (id: number, payload: DealPayload) =>
    request<Deal>(
      `/deals/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
      true
    ),

  deleteDeal: (id: number) =>
    request<void>(
      `/deals/${id}`,
      {
        method: "DELETE",
      },
      true
    ),

  getDashboardSummary: () =>
    request<DashboardSummary>(
      "/dashboard/summary",
      {
        method: "GET",
      },
      true
    ),

  activateProByEmail: (email: string) =>
    request<ActivateProResponse>(
      "/billing/admin/activate-pro",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      },
      true
    ),

  getBillingStatus: () =>
    request<BillingStatus>(
      "/billing/status",
      {
        method: "GET",
      },
      true
    ),

  createCheckoutSession: () =>
    request<{ checkout_url: string }>(
      "/billing/checkout",
      {
        method: "POST",
      },
      true
    ),

  confirmCheckoutSession: (sessionId: string) =>
    request<BillingConfirmResponse>(
      `/billing/confirm?session_id=${encodeURIComponent(sessionId)}`,
      {
        method: "GET",
      },
      true
    ),

  createBillingPortal: () =>
    request<{ portal_url: string }>(
      "/billing/portal",
      {
        method: "POST",
      },
      true
    ),
};
