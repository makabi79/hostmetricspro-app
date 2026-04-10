import { Suspense } from "react";
import PricingPageClient from "./PricingPageClient";

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <main className="pricing-page">
          <section className="pricing-hero">
            <div className="container pricing-hero-inner">
              <span className="badge">Simple pricing</span>
              <h1>Choose the plan that fits your investing workflow</h1>
              <p>Loading pricing...</p>
            </div>
          </section>
        </main>
      }
    >
      <PricingPageClient />
    </Suspense>
  );
}
