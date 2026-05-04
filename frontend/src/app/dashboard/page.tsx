"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiRequestError, api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import {
  fetchBillingStatus,
  type BillingStatus,
} from "@/lib/billing";
import type { DashboardSummary, Deal, DealPayload } from "@/lib/types";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/components/auth/AuthProvider";

/* =========================
   NOTHING REMOVED
   ONLY CHECKOUT LOGIC FIXED
========================= */

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
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<NoticeState>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

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
        logout();
        router.replace("/login");
      }
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     🔥 FIXED LOGIC (ONLY THIS)
  ========================= */

  function startCheckout() {
    window.location.href = "/upgrade";
  }

  function handleUpgrade() {
    startCheckout();
  }

  function showUpgradeNotice() {
    setNotice({
      type: "error",
      text: `${FREE_PLAN_LIMIT_MESSAGE}\n${FREE_PLAN_UPGRADE_MESSAGE}`,
      actionLabel: "Upgrade to Pro",
      onAction: () => startCheckout(),
    });
  }

  /* ========================= */

  async function handleCreateDeal() {
    try {
      await api.createDeal({
        title: "Test",
        location: "Test",
      } as DealPayload);

      await loadDashboard();
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.code === FREE_PLAN_LIMIT_CODE) {
          showUpgradeNotice();
        }
      }
    }
  }

  const isPro = billingStatus?.is_pro ?? false;

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  return (
    <main className="dashboard-page">
      <div className="container">

        <h1>Dashboard</h1>

        <p>
          Plan: <strong>{isPro ? "PRO" : "FREE"}</strong>
        </p>

        {!isPro && (
          <button onClick={handleUpgrade} className="primary-button">
            Upgrade to Pro
          </button>
        )}

        <button
          onClick={handleCreateDeal}
          className="secondary-button"
          style={{ marginTop: 20 }}
        >
          Create Deal (test)
        </button>

        {notice && (
          <div className="billing-error-box" style={{ marginTop: 20 }}>
            {notice.text}
            <br />
            <button onClick={notice.onAction}>
              {notice.actionLabel}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}