"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError, api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  createBillingPortal,
  createCheckoutSession,
  fetchBillingStatus,
  type BillingStatus,
} from "@/lib/billing";
import type { DashboardSummary, Deal, DealPayload } from "@/lib/types";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";

type SimpleDealForm = {
  title: string;
  location: string;
  purchase_price: string;
  down_payment: string;
  interest_rate: string;
  loan_years: string;
  nightly_rate: string;
  occupancy_rate: string;
  cleaning_monthly: string;
  utilities_monthly: string;
  maintenance_monthly: string;
  property_tax_monthly: string;
  insurance_monthly: string;
  hoa_monthly: string;
};

type NoticeState = {
  type: "success" | "error";
  text: string;
  actionLabel?: string;
  onAction?: () => void;
} | null;

const emptyForm: SimpleDealForm = {
  title: "",
  location: "",
  purchase_price: "",
  down_payment: "",
  interest_rate: "7.5",
  loan_years: "30",
  nightly_rate: "",
  occupancy_rate: "65",
  cleaning_monthly: "0",
  utilities_monthly: "0",
  maintenance_monthly: "0",
  property_tax_monthly: "0",
  insurance_monthly: "0",
  hoa_monthly: "0",
};

const demoDeal: Partial<Deal> = {
  title: "Scottsdale STR Example",
  location: "Scottsdale, AZ",
  purchase_price: 525000,
  analysis: {
    monthly_revenue: 0,
    annual_revenue: 0,
    monthly_expenses: 0,
    annual_expenses: 0,
    noi_annual: 0,
    monthly_mortgage: 0,
    monthly_cash_flow: 1840,
    annual_cash_flow: 22080,
    cash_needed: 0,
    cash_on_cash_roi: 14.8,
    cap_rate: 8.2,
    break_even_occupancy: 52,
    score: 78,
    risk: "Medium",
    verdict: "Buy",
  },
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api/v1";

const FREE_PLAN_LIMIT_CODE = "FREE_PLAN_LIMIT_REACHED";
const FREE_PLAN_LIMIT_MESSAGE = "You reached your free limit";
const FREE_PLAN_UPGRADE_MESSAGE = "Upgrade to Pro to continue";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [deals, setDeals] = useState<Deal[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);

  const [form, setForm] = useState<SimpleDealForm>(emptyForm);
  const [editingDealId, setEditingDealId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [exportingId, setExportingId] = useState<number | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState<NoticeState>(null);

  useEffect(() => {
    void loadDashboard();
  }, []);

  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(() => {
      setNotice(null);
    }, 5000);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  function handleUnauthorized() {
    logout();
    router.replace("/login");
  }

  async function loadDashboard() {
    try {
      setLoading(true);
      setPageError("");

      const [dealsData, summaryData, billingData] = await Promise.all([
        api.getDeals(),
        api.getDashboardSummary(),
        fetchBillingStatus(),
      ]);

      setDeals(dealsData);
      setSummary(summaryData);
      setBillingStatus(billingData);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        handleUnauthorized();
        return;
      }

      setPageError(
        err instanceof Error ? err.message : "Failed to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  function toNumber(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value || 0);
  }

  function formatPercent(value: number): string {
    return `${(value || 0).toFixed(2)}%`;
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingDealId(null);
    setFormError("");
  }

  function scrollToForm() {
    const element = document.getElementById("deal-form-panel");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEdit(deal: Deal) {
    setEditingDealId(deal.id);
    setForm({
      title: deal.title ?? "",
      location: deal.location ?? "",
      purchase_price: String(deal.purchase_price ?? ""),
      down_payment: String(deal.down_payment ?? ""),
      interest_rate: String(deal.interest_rate ?? ""),
      loan_years: String(deal.loan_years ?? ""),
      nightly_rate: String(deal.nightly_rate ?? ""),
      occupancy_rate: String(deal.occupancy_rate ?? ""),
      cleaning_monthly: String(deal.cleaning_monthly ?? 0),
      utilities_monthly: String(deal.utilities_monthly ?? 0),
      maintenance_monthly: String(deal.maintenance_monthly ?? 0),
      property_tax_monthly: String(deal.property_tax_monthly ?? 0),
      insurance_monthly: String(deal.insurance_monthly ?? 0),
      hoa_monthly: String(deal.hoa_monthly ?? 0),
    });

    setFormError("");
    setNotice(null);
    scrollToForm();
  }

  function buildPayload(values: SimpleDealForm): DealPayload {
    return {
      title: values.title.trim(),
      location: values.location.trim(),
      notes: null,
      purchase_price: toNumber(values.purchase_price),
      down_payment: toNumber(values.down_payment),
      interest_rate: toNumber(values.interest_rate),
      loan_years: toNumber(values.loan_years),
      closing_costs: 0,
      renovation_cost: 0,
      furnishing_cost: 0,
      nightly_rate: toNumber(values.nightly_rate),
      occupancy_rate: toNumber(values.occupancy_rate),
      other_monthly_income: 0,
      property_tax_monthly: toNumber(values.property_tax_monthly),
      insurance_monthly: toNumber(values.insurance_monthly),
      hoa_monthly: toNumber(values.hoa_monthly),
      utilities_monthly: toNumber(values.utilities_monthly),
      cleaning_monthly: toNumber(values.cleaning_monthly),
      maintenance_monthly: toNumber(values.maintenance_monthly),
      management_fee_percent: 0,
      platform_fee_percent: 0,
      other_monthly_expenses: 0,
    };
  }

  async function startCheckout() {
    try {
      setCheckoutLoading(true);
      setNotice(null);
      setPageError("");

      const data = await createCheckoutSession();

      if (!data?.checkout_url) {
        throw new Error("Paddle checkout URL is missing.");
      }

      window.location.href = data.checkout_url;
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        handleUnauthorized();
        return;
      }

      setNotice({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Failed to start Paddle checkout.",
      });
    } finally {
      setCheckoutLoading(false);
    }
  }

  function showUpgradeNotice(customText?: string) {
    setNotice({
      type: "error",
      text: customText
        ? `${customText}\n${FREE_PLAN_UPGRADE_MESSAGE}`
        : `${FREE_PLAN_LIMIT_MESSAGE}\n${FREE_PLAN_UPGRADE_MESSAGE}`,
      actionLabel: "Upgrade to Pro",
      onAction: () => {
        void startCheckout();
      },
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setNotice(null);

    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }

    if (!form.location.trim()) {
      setFormError("Location is required.");
      return;
    }

    if (toNumber(form.purchase_price) <= 0) {
      setFormError("Purchase price must be greater than 0.");
      return;
    }

    if (toNumber(form.nightly_rate) <= 0) {
      setFormError("Nightly rate must be greater than 0.");
      return;
    }

    const payload = buildPayload(form);

    try {
      setSaving(true);

      if (editingDealId !== null) {
        await api.updateDeal(editingDealId, payload);
        setNotice({ type: "success", text: "Deal updated with new analysis." });
      } else {
        await api.createDeal(payload);
        setNotice({ type: "success", text: "Deal analyzed and saved." });
      }

      resetForm();
      await loadDashboard();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 401) {
          handleUnauthorized();
          return;
        }

        if (err.code === FREE_PLAN_LIMIT_CODE) {
          showUpgradeNotice(FREE_PLAN_LIMIT_MESSAGE);
          setFormError(FREE_PLAN_LIMIT_MESSAGE);
          await loadDashboard();
          return;
        }

        setFormError(err.message || "Failed to save deal");
        return;
      }

      setFormError(err instanceof Error ? err.message : "Failed to save deal");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    const ok = window.confirm("Delete this deal?");
    if (!ok) return;

    setNotice(null);
    setPageError("");

    try {
      setDeletingId(id);
      await api.deleteDeal(id);
      setNotice({ type: "success", text: "Deal removed from your portfolio." });

      if (editingDealId === id) {
        resetForm();
      }

      await loadDashboard();
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        handleUnauthorized();
        return;
      }

      setPageError(err instanceof Error ? err.message : "Failed to delete deal");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleExport(id: number, title: string) {
    if (!isPro) {
      showUpgradeNotice("PDF export is available on the Pro plan only.");
      return;
    }

    try {
      setExportingId(id);
      setNotice(null);
      setPageError("");

      const token = getToken();

      if (!token) {
        handleUnauthorized();
        return;
      }

      const response = await fetch(`${API_URL}/deals/${id}/export`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return;
      }

      if (!response.ok) {
        let message = "Failed to export PDF";
        let code: string | undefined;

        try {
          const data = (await response.json()) as {
            detail?:
              | string
              | {
                  code?: string;
                  message?: string;
                };
          };

          if (typeof data.detail === "string") {
            message = data.detail;
          } else if (data.detail && typeof data.detail === "object") {
            code = data.detail.code;
            message = data.detail.message || message;
          }
        } catch {
          message = "Failed to export PDF";
        }

        throw new ApiRequestError(message, response.status, code);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const safeTitle = (title || "deal-report")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      const fileName = `${safeTitle || "deal-report"}-report.pdf`;

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setNotice({ type: "success", text: "Report generated successfully." });
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 401) {
          handleUnauthorized();
          return;
        }

        if (err.code === "EXPORT_REQUIRES_PRO") {
          showUpgradeNotice("PDF export is available on the Pro plan only.");
          return;
        }
      }

      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to export PDF",
      });
    } finally {
      setExportingId(null);
    }
  }

  async function handleUpgrade() {
    await startCheckout();
  }

  async function handleOpenPortal() {
    try {
      setPortalLoading(true);
      setNotice(null);
      setPageError("");
      const data = await createBillingPortal();
      window.location.href = data.portal_url;
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        handleUnauthorized();
        return;
      }

      setNotice({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to open billing portal",
      });
    } finally {
      setPortalLoading(false);
    }
  }

  const computed = useMemo(() => {
    const totalDeals = summary?.total_deals ?? deals.length;
    const avgMonthlyCashFlow =
      summary?.avg_monthly_cash_flow ??
      (deals.length
        ? deals.reduce(
            (sum, deal) => sum + (deal.analysis?.monthly_cash_flow ?? 0),
            0
          ) / deals.length
        : 0);

    const avgCashOnCashRoi =
      summary?.avg_cash_on_cash_roi ??
      (deals.length
        ? deals.reduce(
            (sum, deal) => sum + (deal.analysis?.cash_on_cash_roi ?? 0),
            0
          ) / deals.length
        : 0);

    const avgCapRate =
      summary?.avg_cap_rate ??
      (deals.length
        ? deals.reduce((sum, deal) => sum + (deal.analysis?.cap_rate ?? 0), 0) /
          deals.length
        : 0);

    const bestScore =
      summary?.best_score ??
      (deals.length
        ? Math.max(...deals.map((deal) => deal.analysis?.score ?? 0))
        : 0);

    return {
      totalDeals,
      avgMonthlyCashFlow,
      avgCashOnCashRoi,
      avgCapRate,
      bestScore,
    };
  }, [summary, deals]);

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="container">
          <section className="dashboard-loading-card">
            <div className="dashboard-loading-dot" />
            <div>
              <h1>Analyzing your STR portfolio...</h1>
              <p>
                Preparing your latest deal metrics, cash flow, and performance data.
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  const planName = billingStatus?.current_plan?.toUpperCase() || "FREE";
  const planStatus = billingStatus?.subscription_status || "inactive";
  const dealsUsageText = billingStatus
    ? billingStatus.max_deals === null
      ? `${billingStatus.deals_used} / unlimited deals`
      : `${billingStatus.deals_used} / ${billingStatus.max_deals} deals`
    : "0 / 3 deals";
  const isPro = billingStatus?.is_pro ?? false;
  const freeDealsLeft =
    billingStatus && billingStatus.max_deals !== null
      ? Math.max(billingStatus.max_deals - billingStatus.deals_used, 0)
      : null;

  return (
    <main className="dashboard-page">
      <div className="container">
        <section className="dashboard-hero">
          <div className="dashboard-hero-copy">
            <span className="badge">HostMetricsPro Dashboard</span>
            <h1>Investment dashboard</h1>
            <p>
              Welcome{user?.name ? `, ${user.name}` : ""}. Analyze deal quality,
              compare portfolio performance, and make faster STR investment decisions
              in one focused workspace.
            </p>
          </div>

          <div className="dashboard-hero-side">
            <div className="dashboard-plan-card">
              <span className="dashboard-plan-label">Current Plan</span>
              <div className="dashboard-plan-row">
                <strong>{planName}</strong>
                <span
                  className={
                    isPro
                      ? "dashboard-plan-pill dashboard-plan-pill-pro"
                      : "dashboard-plan-pill dashboard-plan-pill-free"
                  }
                >
                  {isPro ? "PRO" : "FREE"}
                </span>
              </div>
              <span className="dashboard-plan-meta">
                {planStatus} · {dealsUsageText}
              </span>
              {!isPro && freeDealsLeft !== null ? (
                <span className="dashboard-plan-hint">
                  {freeDealsLeft === 0
                    ? "You are on Free plan and reached your 3-deal limit."
                    : `You are on Free plan. ${freeDealsLeft} deal${freeDealsLeft === 1 ? "" : "s"} remaining.`}
                </span>
              ) : (
                <span className="dashboard-plan-hint">
                  Pro plan active — unlimited deal analysis and PDF export unlocked.
                </span>
              )}
            </div>

            <div className="dashboard-top-actions">
              {!isPro ? (
                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={checkoutLoading}
                  className="primary-button"
                >
                  {checkoutLoading ? "Redirecting to checkout..." : "Upgrade to Pro"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenPortal}
                  disabled={portalLoading}
                  className="secondary-button"
                >
                  {portalLoading ? "Opening billing portal..." : "Billing Portal"}
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  resetForm();
                  scrollToForm();
                }}
                className="secondary-button"
              >
                Analyze New Deal
              </button>
            </div>
          </div>
        </section>

        {!isPro ? (
          <section className="dashboard-upgrade-banner">
            <div>
              <span className="section-label">Free plan</span>
              <h2>Upgrade to Pro for unlimited deal analysis and professional reports.</h2>
              <p>
                Free is great for getting started. Pro is built for serious
                investors who need unlimited underwriting, stronger workflow
                value, and export-ready reports.
              </p>
              <p className="text-sm text-slate-500">
                Unlock unlimited deals, PDF export, and advanced workflow value.
              </p>
            </div>

            <div className="dashboard-upgrade-actions">
              <button
                type="button"
                onClick={handleUpgrade}
                disabled={checkoutLoading}
                className="primary-button"
              >
                {checkoutLoading ? "Redirecting to checkout..." : "Upgrade to Pro"}
              </button>
            </div>
          </section>
        ) : null}

        {notice ? (
          <Banner
            type={notice.type}
            text={notice.text}
            actionLabel={notice.actionLabel}
            onAction={notice.onAction}
          />
        ) : null}

        {pageError ? <Banner type="error" text={pageError} /> : null}

        <section className="dashboard-metrics-grid">
          <MetricCard
            label="Total Deals"
            value={String(computed.totalDeals)}
            helper="Tracked properties"
          />
          <MetricCard
            label="Avg Monthly Cash Flow"
            value={formatCurrency(computed.avgMonthlyCashFlow)}
            helper="Net monthly performance"
          />
          <MetricCard
            label="Avg Cash on Cash ROI"
            value={formatPercent(computed.avgCashOnCashRoi)}
            helper="Portfolio efficiency"
          />
          <MetricCard
            label="Avg Cap Rate"
            value={formatPercent(computed.avgCapRate)}
            helper="Average yield signal"
          />
          <MetricCard
            label="Best Score"
            value={Number(computed.bestScore).toFixed(0)}
            helper="Top deal quality"
          />
        </section>

        <section className="dashboard-content-grid">
          <section className="dashboard-panel" id="deal-form-panel">
            <div className="dashboard-panel-header">
              <div>
                <p className="dashboard-section-eyebrow">Deal Form</p>
                <h2>
                  {editingDealId !== null ? "Edit analysis" : "Analyze new deal"}
                </h2>
                <p>
                  Enter your core STR assumptions and get an instant investment analysis.
                </p>
                {!isPro ? (
                  <p className="dashboard-section-subtext">
                    You are on Free plan: up to 3 deals included. Professional
                    report export is Pro only.
                  </p>
                ) : (
                  <p className="dashboard-section-subtext">
                    Pro plan active — unlimited deal analysis and professional
                    report export unlocked.
                  </p>
                )}
              </div>

              {editingDealId !== null ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="dashboard-text-button"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>

            {formError ? <Banner type="error" text={formError} compact /> : null}

            <form onSubmit={handleSubmit} className="dashboard-form-grid">
              <FormField
                label="Title"
                value={form.title}
                onChange={(value) => setForm((prev) => ({ ...prev, title: value }))}
                placeholder="e.g. Miami Beach Condo"
              />

              <FormField
                label="Location"
                value={form.location}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, location: value }))
                }
                placeholder="e.g. Miami, FL"
              />

              <FormField
                label="Purchase Price"
                type="number"
                value={form.purchase_price}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, purchase_price: value }))
                }
                placeholder="e.g. 350000"
              />

              <FormField
                label="Down Payment"
                type="number"
                value={form.down_payment}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, down_payment: value }))
                }
                placeholder="e.g. 70000"
              />

              <FormField
                label="Interest Rate (%)"
                type="number"
                step="0.01"
                value={form.interest_rate}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, interest_rate: value }))
                }
                placeholder="e.g. 7.50"
              />

              <FormField
                label="Loan Years"
                type="number"
                value={form.loan_years}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, loan_years: value }))
                }
                placeholder="e.g. 30"
              />

              <FormField
                label="Nightly Rate"
                type="number"
                value={form.nightly_rate}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, nightly_rate: value }))
                }
                placeholder="e.g. 180"
              />

              <FormField
                label="Occupancy Rate (%)"
                type="number"
                step="0.01"
                value={form.occupancy_rate}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, occupancy_rate: value }))
                }
                placeholder="e.g. 65"
              />

              <FormField
                label="Cleaning Monthly"
                type="number"
                value={form.cleaning_monthly}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, cleaning_monthly: value }))
                }
                placeholder="e.g. 300"
              />

              <FormField
                label="Utilities Monthly"
                type="number"
                value={form.utilities_monthly}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, utilities_monthly: value }))
                }
                placeholder="e.g. 250"
              />

              <FormField
                label="Maintenance Monthly"
                type="number"
                value={form.maintenance_monthly}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, maintenance_monthly: value }))
                }
                placeholder="e.g. 150"
              />

              <FormField
                label="Property Tax Monthly"
                type="number"
                value={form.property_tax_monthly}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, property_tax_monthly: value }))
                }
                placeholder="e.g. 250"
              />

              <FormField
                label="Insurance Monthly"
                type="number"
                value={form.insurance_monthly}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, insurance_monthly: value }))
                }
                placeholder="e.g. 120"
              />

              <FormField
                label="HOA Monthly"
                type="number"
                value={form.hoa_monthly}
                onChange={(value) =>
                  setForm((prev) => ({ ...prev, hoa_monthly: value }))
                }
                placeholder="e.g. 0"
              />

              <div className="dashboard-form-footer">
                <div className="dashboard-form-hint">
                  All calculations are based on STR investment assumptions.
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="primary-button"
                >
                  {saving
                    ? "Analyzing deal..."
                    : editingDealId !== null
                    ? "Update Analysis"
                    : "Analyze Deal"}
                </button>
              </div>
            </form>
          </section>

          <section className="dashboard-panel">
            <div className="dashboard-panel-header">
              <div>
                <p className="dashboard-section-eyebrow">Portfolio</p>
                <h2>Saved deals</h2>
                <p>
                  Review your saved analyses, update assumptions, and compare deal
                  quality anytime.
                </p>
              </div>
            </div>

            {deals.length === 0 ? (
              <div className="dashboard-empty-state">
                <div className="dashboard-empty-icon">+</div>
                <h3>No deals yet</h3>
                <p>
                  Start by analyzing your first STR investment. See cash flow,
                  cap rate, ROI, score, and risk in one place.
                </p>

                <div className="dashboard-demo-card">
                  <div className="dashboard-demo-header">
                    <div>
                      <div className="dashboard-demo-label">Example deal</div>
                      <div className="dashboard-demo-title">{demoDeal.title}</div>
                    </div>
                    <span className="status-pill status-pill-buy">
                      {demoDeal.analysis?.verdict}
                    </span>
                  </div>

                  <div className="dashboard-demo-grid">
                    <MiniMetric
                      label="Monthly Cash Flow"
                      value={formatCurrency(
                        demoDeal.analysis?.monthly_cash_flow ?? 0
                      )}
                    />
                    <MiniMetric
                      label="Cap Rate"
                      value={formatPercent(demoDeal.analysis?.cap_rate ?? 0)}
                    />
                    <MiniMetric
                      label="CoC ROI"
                      value={formatPercent(
                        demoDeal.analysis?.cash_on_cash_roi ?? 0
                      )}
                    />
                    <MiniMetric
                      label="Score"
                      value={String(demoDeal.analysis?.score ?? 0)}
                    />
                  </div>
                </div>

                <div className="dashboard-empty-actions">
                  <button
                    type="button"
                    onClick={scrollToForm}
                    className="primary-button"
                  >
                    Analyze First Deal
                  </button>

                  {!isPro ? (
                    <button
                      type="button"
                      onClick={handleUpgrade}
                      disabled={checkoutLoading}
                      className="secondary-button"
                    >
                      {checkoutLoading ? "Redirecting..." : "Upgrade to Pro"}
                    </button>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Deal</th>
                      <th>Purchase Price</th>
                      <th>Cash Flow</th>
                      <th>Cap Rate</th>
                      <th>CoC ROI</th>
                      <th>Score</th>
                      <th>Verdict</th>
                      <th className="dashboard-th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((deal) => {
                      const score = Number(deal.analysis?.score ?? 0);
                      const verdict = deal.analysis?.verdict ?? "No verdict";
                      const isDeleting = deletingId === deal.id;
                      const isExporting = exportingId === deal.id;

                      return (
                        <tr key={deal.id}>
                          <td>
                            <div className="dashboard-deal-cell">
                              <div className="dashboard-deal-title">{deal.title}</div>
                              <div className="dashboard-deal-meta">{deal.location}</div>
                            </div>
                          </td>
                          <td>{formatCurrency(deal.purchase_price)}</td>
                          <td>{formatCurrency(deal.analysis?.monthly_cash_flow ?? 0)}</td>
                          <td>{formatPercent(deal.analysis?.cap_rate ?? 0)}</td>
                          <td>{formatPercent(deal.analysis?.cash_on_cash_roi ?? 0)}</td>
                          <td>
                            <span
                              className={
                                score >= 70
                                  ? "dashboard-score-pill dashboard-score-good"
                                  : score >= 45
                                  ? "dashboard-score-pill dashboard-score-medium"
                                  : "dashboard-score-pill dashboard-score-weak"
                              }
                            >
                              {score.toFixed(0)}
                            </span>
                          </td>
                          <td>
                            <span className="dashboard-verdict-text">{verdict}</span>
                          </td>
                          <td className="dashboard-td-actions">
                            <div className="dashboard-row-actions">
                              <button
                                type="button"
                                onClick={() => handleExport(deal.id, deal.title)}
                                disabled={isExporting}
                                className="secondary-button"
                                title={
                                  !isPro
                                    ? "PDF export is available on the Pro plan only."
                                    : undefined
                                }
                              >
                                {isExporting
                                  ? "Generating report..."
                                  : !isPro
                                  ? "Download Report (Pro)"
                                  : "Download Report"}
                              </button>

                              <button
                                type="button"
                                onClick={() => startEdit(deal)}
                                className="secondary-button"
                              >
                                Edit Analysis
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(deal.id)}
                                disabled={isDeleting}
                                className="danger-outline-button"
                              >
                                {isDeleting ? "Removing deal..." : "Remove"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
};

function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <div className="dashboard-metric-card">
      <span className="dashboard-metric-label">{label}</span>
      <strong className="dashboard-metric-value">{value}</strong>
      <span className="dashboard-metric-helper">{helper}</span>
    </div>
  );
}

type BannerProps = {
  type: "success" | "error";
  text: string;
  compact?: boolean;
  actionLabel?: string;
  onAction?: () => void;
};

function Banner({
  type,
  text,
  compact = false,
  actionLabel,
  onAction,
}: BannerProps) {
  return (
    <div
      className={[
        "dashboard-banner",
        type === "success" ? "dashboard-banner-success" : "dashboard-banner-error",
        compact ? "dashboard-banner-compact" : "",
        actionLabel && onAction ? "dashboard-banner-with-action" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="dashboard-banner-text">{text}</span>

      {actionLabel && onAction ? (
        <button type="button" onClick={onAction} className="dashboard-banner-action">
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

type FormFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  step?: string;
};

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  step,
}: FormFieldProps) {
  return (
    <div className="dashboard-field">
      <label>{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="dashboard-mini-metric">
      <span className="dashboard-mini-label">{label}</span>
      <strong className="dashboard-mini-value">{value}</strong>
    </div>
  );
}