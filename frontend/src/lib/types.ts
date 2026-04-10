export type User = {
  id: number;
  name: string;
  email: string;
  created_at: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export type DealAnalysis = {
  monthly_revenue: number;
  annual_revenue: number;
  monthly_expenses: number;
  annual_expenses: number;
  noi_annual: number;
  monthly_mortgage: number;
  monthly_cash_flow: number;
  annual_cash_flow: number;
  cash_needed: number;
  cash_on_cash_roi: number;
  cap_rate: number;
  break_even_occupancy: number;
  score: number;
  risk: string;
  verdict: string;
};

export type DealPayload = {
  title: string;
  location: string;
  notes: string | null;
  purchase_price: number;
  down_payment: number;
  interest_rate: number;
  loan_years: number;
  closing_costs: number;
  renovation_cost: number;
  furnishing_cost: number;
  nightly_rate: number;
  occupancy_rate: number;
  other_monthly_income: number;
  property_tax_monthly: number;
  insurance_monthly: number;
  hoa_monthly: number;
  utilities_monthly: number;
  cleaning_monthly: number;
  maintenance_monthly: number;
  management_fee_percent: number;
  platform_fee_percent: number;
  other_monthly_expenses: number;
};

export type Deal = DealPayload & {
  id: number;
  owner_id: number;
  created_at: string;
  updated_at: string;
  analysis: DealAnalysis;
};

export type DashboardSummary = {
  total_deals: number;
  avg_monthly_cash_flow: number;
  avg_cash_on_cash_roi: number;
  avg_cap_rate: number;
  best_score: number;
};

export type ApiErrorDetail = {
  code?: string;
  message?: string;
  current_plan?: string;
  deals_used?: number;
  deals_limit?: number;
};

export type ApiErrorResponse = {
  detail?:
    | string
    | ApiErrorDetail
    | Array<{
        msg?: string;
        loc?: Array<string | number>;
      }>;
};