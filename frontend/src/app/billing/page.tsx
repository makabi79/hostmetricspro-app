"use client";

import { useEffect, useState } from "react";
import {
  createBillingPortal,
  createCheckoutSession,
  fetchBillingStatus,
  type BillingStatus,
} from "@/lib/billing";

export default function BillingPage() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBillingStatus()
      .then((data) => setStatus(data))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load billing");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async () => {
    try {
      setCheckoutLoading(true);
      setError("");
      const data = await createCheckoutSession();
      window.location.href = data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setCheckoutLoading(false);
    }
  };

  const handlePortal = async () => {
    try {
      setPortalLoading(true);
      setError("");
      const data = await createBillingPortal();
      window.location.href = data.portal_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open billing portal");
      setPortalLoading(false);
    }
  };

  return (
    <main className="section-block">
      <div className="container">
        <div className="section-heading">
          <span className="section-label">Billing</span>
          <h2>Manage your plan</h2>
          <p>Upgrade to Pro for unlimited deals and premium features.</p>
        </div>

        {loading ? <div className="billing-card">Loading billing status...</div> : null}
        {error ? <div className="billing-error-box">{error}</div> : null}

        {status ? (
          <div className="billing-card">
            <div className="billing-row">
              <span>Current plan</span>
              <strong>{status.current_plan.toUpperCase()}</strong>
            </div>

            <div className="billing-row">
              <span>Subscription status</span>
              <strong>{status.subscription_status}</strong>
            </div>

            <div className="billing-row">
              <span>Deals used</span>
              <strong>
                {status.deals_used}
                {status.max_deals === null ? " / unlimited" : ` / ${status.max_deals}`}
              </strong>
            </div>

            <div className="billing-actions">
              {!status.is_pro ? (
                <button
                  type="button"
                  className="primary-button"
                  onClick={handleUpgrade}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? "Redirecting..." : "Upgrade to Pro"}
                </button>
              ) : null}

              {status.is_pro ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={handlePortal}
                  disabled={portalLoading}
                >
                  {portalLoading ? "Opening..." : "Manage Subscription"}
                </button>
              ) : null}
            </div>

            {!status.is_pro ? (
              <div className="locked-feature-list">
                <h3>Locked on Free</h3>
                <ul>
                  <li>Unlimited deals</li>
                  <li>Premium feature access</li>
                  <li>Advanced billing management</li>
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}