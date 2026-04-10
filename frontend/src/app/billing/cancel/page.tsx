import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <main className="section-block">
      <div className="container">
        <div className="billing-result-card">
          <span className="section-label">Checkout Canceled</span>
          <h1>No charge was made</h1>
          <p>
            Your account is still on the current plan. You can return to billing and
            upgrade any time.
          </p>
          <div className="billing-actions">
            <Link href="/billing" className="primary-button">
              Return to Billing
            </Link>
            <Link href="/pricing" className="secondary-button">
              View Pricing
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}