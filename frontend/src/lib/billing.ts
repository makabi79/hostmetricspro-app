import { api } from "@/lib/api";

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
  return api.getBillingStatus();
}

export async function createCheckoutSession(): Promise<{ checkout_url: string }> {
  return api.createCheckoutSession();
}

export async function confirmCheckoutSession(
  sessionId: string
): Promise<BillingConfirmResponse> {
  return api.confirmCheckoutSession(sessionId);
}

export async function createBillingPortal(): Promise<{ portal_url: string }> {
  return api.createBillingPortal();
}
