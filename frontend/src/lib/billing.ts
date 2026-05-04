import { api } from "@/lib/api";

export type BillingStatus = {
  current_plan: string;
  subscription_status: string;
  can_create_more_deals: boolean;
  max_deals: number | null;
  deals_used: number;
  is_pro: boolean;
};

export async function fetchBillingStatus(): Promise<BillingStatus> {
  return api.getBillingStatus();
}