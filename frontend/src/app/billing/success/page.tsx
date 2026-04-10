import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <main className="section-block">
      <div className="container">
        <div className="billing-result-card">
          <span className="section-label">Payment Success</span>
          <h1>Your Pro upgrade is processing</h1>
          <p>
            Stripe completed the checkout. Your account will switch to Pro as soon as
            the webhook updates your subscription status.
          </p>
          <div className="billing-actions">
            <Link href="/billing" className="primary-button">
              Go to Billing
            </Link>
            <Link href="/dashboard" className="secondary-button">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}