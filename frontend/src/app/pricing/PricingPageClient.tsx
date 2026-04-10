"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getToken } from "@/lib/auth";
import {
  confirmCheckoutSession,
  createBillingPortal,
  fetchBillingStatus,
  type BillingStatus,
} from "@/lib/billing";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Best for testing the product and screening a few properties.",
    features: [
      "Up to 3 deals",
      "Core STR metrics",
      "Dashboard access",
      "Basic property analysis",
      "Deal score and verdict",
    ],
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description:
      "Best for active Airbnb hosts and investors analyzing deals regularly.",
    features: [
      "Unlimited deals",
      "PDF export",
      "Advanced analytics",
      "Billing management",
      "Premium feature access",
      "Professional workflow",
    ],
    highlighted: true,
  },
];

const comparisonRows = [
  { feature: "Deals", free: "Up to 3", pro: "Unlimited" },
  { feature: "Cash flow analysis", free: "Included", pro: "Included" },
  { feature: "Cap rate and ROI", free: "Included", pro: "Included" },
  { feature: "Deal score and verdict", free: "Included", pro: "Included" },
  { feature: "PDF export", free: "Not included", pro: "Included" },
  { feature: "Advanced analytics", free: "Not included", pro: "Included" },
];

export default function PricingPageClient() {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const checkoutState = useMemo(() => {
    const value = searchParams.get("checkout");
    if (value === "success") return "success";
    if (value === "cancel") return "cancel";
    return null;
  }, [searchParams]);

  const checkoutSessionId = useMemo(() => {
    return searchParams.get("session_id");
  }, [searchParams]);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        if (checkoutState === "success" && checkoutSessionId) {
          setConfirming(true);
          await confirmCheckoutSession(checkoutSessionId);
        }

        const data = await fetchBillingStatus();
        setStatus(data);
      } catch (err) {
        setStatus(null);
        setError(
          err instanceof Error ? err.message : "Failed to load billing status"
        );
      } finally {
        setConfirming(false);
        setLoading(false);
      }
    };

    void load();
  }, [checkoutState, checkoutSessionId]);

  const handleUpgrade = async () => {
    setError("Payments are coming soon.");
  };

  const handleOpenPortal = async () => {
    try {
      setPortalLoading(true);
      setError("");
      const data = await createBillingPortal();
      window.location.href = data.portal_url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to open billing portal"
      );
      setPortalLoading(false);
    }
  };

  return (
    <main className="pricing-page">
      <section className="pricing-hero">
        <div className="container pricing-hero-inner">
          <span className="badge">Simple pricing</span>
          <h1>Choose the plan that fits your investing workflow</h1>
          <p>
            Start free, validate the product, and upgrade when you need
            unlimited deal analysis, PDF export, and advanced analytics.
          </p>
          <p className="text-sm text-slate-500">
            Early access is live. Pro payments are coming soon.
          </p>
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          {checkoutState === "success" ? (
            <div className="billing-status-banner">
              <div>
                <span className="section-label">Payment successful</span>
                <h2>
                  {confirming
                    ? "Confirming your Pro plan..."
                    : "Your Stripe checkout completed."}
                </h2>
                <p>
                  {confirming
                    ? "We are syncing your subscription now."
                    : "Your billing status was refreshed below."}
                </p>
              </div>
            </div>
          ) : null}

          {checkoutState === "cancel" ? (
            <div className="billing-error-box">
              Checkout was canceled. No payment was made.
            </div>
          ) : null}

          {!loading && status ? (
            <div className="billing-status-banner">
              <div>
                <span className="section-label">Current Plan</span>
                <h2>
                  {status.current_plan.toUpperCase()} ·{" "}
                  {status.subscription_status}
                </h2>
                <p>
                  Deals used: {status.deals_used}
                  {status.max_deals === null
                    ? " / unlimited"
                    : ` / ${status.max_deals}`}
                </p>
              </div>

              <div className="billing-status-actions">
                {!status.is_pro ? (
                  <button
                    type="button"
                    className="primary-button cursor-not-allowed bg-slate-300"
                    onClick={handleUpgrade}
                  >
                    Payments Coming Soon
                  </button>
                ) : (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleOpenPortal}
                    disabled={portalLoading}
                  >
                    {portalLoading ? "Opening..." : "Billing Portal"}
                  </button>
                )}
              </div>
            </div>
          ) : null}

          {error ? <div className="billing-error-box">{error}</div> : null}

          <div className="pricing-grid">
            {plans.map((plan) => {
              const isProCard = plan.name === "Pro";
              const isCurrentPlan =
                status?.current_plan.toLowerCase() ===
                  plan.name.toLowerCase() &&
                status?.subscription_status !== "canceled";

              return (
                <article
                  key={plan.name}
                  className={
                    plan.highlighted ? "pricing-card featured" : "pricing-card"
                  }
                >
                  {plan.highlighted ? (
                    <div className="pricing-badge">Most Popular</div>
                  ) : null}

                  <h2>{plan.name}</h2>
                  <p className="pricing-description">{plan.description}</p>

                  <div className="pricing-price-row">
                    <span className="pricing-price">{plan.price}</span>
                    <span className="pricing-period">{plan.period}</span>
                  </div>

                  <ul className="pricing-features">
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <div className="current-plan-badge">Current plan</div>
                  ) : isProCard ? (
                    <button
                      type="button"
                      className="primary-button cursor-not-allowed bg-slate-300"
                      onClick={handleUpgrade}
                    >
                      Payments Coming Soon
                    </button>
                  ) : (
                    <Link
                      href={status ? "/dashboard" : "/signup"}
                      className="secondary-button"
                    >
                      {status ? "Go to Dashboard" : "Start Free"}
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-block section-alt">
        <div className="container">
          <div className="section-heading">
            <span className="section-label">Compare plans</span>
            <h2>Free for testing. Pro for active investing.</h2>
            <p>
              One bad deal can cost you far more than a monthly subscription.
              Upgrade when you need more volume and better outputs.
            </p>
          </div>

          <div className="feature-grid">
            {comparisonRows.map((row) => (
              <article key={row.feature} className="feature-card">
                <h3>{row.feature}</h3>
                <p>
                  <strong>Free:</strong> {row.free}
                </p>
                <p>
                  <strong>Pro:</strong> {row.pro}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <div className="cta-banner">
            <div>
              <span className="section-label">Upgrade path</span>
              <h2>Start free. Upgrade when you are ready.</h2>
              <p>
                Test your workflow with the free plan, then unlock unlimited
                deals, PDF export, and advanced analytics with Pro.
              </p>
              <p className="text-sm text-slate-500">
                Pro payments are coming soon.
              </p>
            </div>

            <div className="cta-actions">
              {!status ? (
                <>
                  <Link href="/signup" className="primary-button">
                    Start Free
                  </Link>
                  <Link href="/dashboard" className="secondary-button">
                    View Dashboard
                  </Link>
                </>
              ) : status.is_pro ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleOpenPortal}
                  disabled={portalLoading}
                >
                  {portalLoading ? "Opening..." : "Billing Portal"}
                </button>
              ) : (
                <button
                  type="button"
                  className="primary-button cursor-not-allowed bg-slate-300"
                  onClick={handleUpgrade}
                >
                  Payments Coming Soon
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
