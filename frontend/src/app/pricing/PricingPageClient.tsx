"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";
import {
  createCheckoutSession,
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
      "Stop guessing your Airbnb deal profitability. Know your real cash flow, ROI, and risk BEFORE you buy. Built for serious STR investors.",
    features: [
      "Unlimited deals",
      "PDF export",
      "Advanced analytics",
      "Automatic Pro activation after payment",
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
  { feature: "Payment", free: "No payment required", pro: "Dodo Payments" },
];

export default function PricingPageClient() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    async function loadBillingStatus() {
      try {
        setLoading(true);
        setError("");

        const data = await fetchBillingStatus();
        setStatus(data);
      } catch (err) {
        setStatus(null);
        setError(
          err instanceof Error ? err.message : "Failed to load billing status"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadBillingStatus();
  }, []);

  async function handleCheckout() {
    const token = getToken();

    if (!token) {
      window.location.href = "/signup";
      return;
    }

    try {
      setCheckoutLoading(true);
      setError("");

      const data = await createCheckoutSession();

      if (!data.checkout_url) {
        throw new Error("Checkout URL is missing.");
      }

      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
    } finally {
      setCheckoutLoading(false);
    }
  }

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
        </div>
      </section>

      <section className="section-block">
        <div className="container">
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
                    className="primary-button"
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading
                      ? "Starting checkout..."
                      : "Start analyzing unlimited deals"}
                  </button>
                ) : (
                  <Link href="/dashboard" className="secondary-button">
                    Go to Dashboard
                  </Link>
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

                  {isProCard ? (
                    <div style={{ marginTop: "12px", fontSize: "14px" }}>
                      ✔ No risk — cancel anytime <br />
                      ✔ Instant analysis in seconds <br />
                      ✔ Built for real investors, not theory
                    </div>
                  ) : null}

                  {isCurrentPlan ? (
                    <div className="current-plan-badge">Current plan</div>
                  ) : isProCard ? (
                    <>
                      <button
                        type="button"
                        className="primary-button"
                        onClick={handleCheckout}
                        disabled={checkoutLoading}
                      >
                        {checkoutLoading
                          ? "Starting checkout..."
                          : "Start analyzing unlimited deals"}
                      </button>
                      <p style={{ fontSize: "12px", marginTop: "8px", color: "#666" }}>
                        Early users price: $29/month. May increase later.
                      </p>
                    </>
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
            <h2>Free for testing. Pro for serious STR investing.</h2>
            <p>
              One bad deal can cost far more than a monthly subscription. Pro
              helps you review cash flow, ROI, risk, and deal quality before you
              make a buying decision.
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
              <h2>Start free. Upgrade when you need unlimited analysis.</h2>
              <p>
                Pay securely with Dodo Payments. Your Pro plan will activate
                after successful payment confirmation.
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
                <Link href="/dashboard" className="secondary-button">
                  Go to Dashboard
                </Link>
              ) : (
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading
                    ? "Starting checkout..."
                    : "Start analyzing unlimited deals"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}