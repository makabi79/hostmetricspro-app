import Link from "next/link";

const benefits = [
  "Instant cash flow, cap rate, ROI, and break-even occupancy analysis",
  "Clear Buy / Review / Skip verdict for faster underwriting",
  "Professional workflow for Airbnb and STR investors",
];

const steps = [
  {
    title: "Enter the deal",
    description:
      "Add purchase price, financing, revenue assumptions, and operating costs in minutes.",
  },
  {
    title: "Get instant analysis",
    description:
      "See monthly cash flow, annual cash flow, cap rate, cash-on-cash ROI, and risk in one place.",
  },
  {
    title: "Make the decision",
    description:
      "Use a clear score and verdict to decide whether the deal deserves your time and capital.",
  },
];

const comparisonPoints = [
  {
    title: "Stop spreadsheet chaos",
    description:
      "Manually underwriting deals takes too long, creates mistakes, and slows down decision-making.",
  },
  {
    title: "Analyze faster",
    description:
      "HostMetricsPro gives you a clean underwriting workflow built for short-term rental deals.",
  },
  {
    title: "Decide with confidence",
    description:
      "See the numbers, the risk, and the verdict together so you can move with clarity.",
  },
];

const investorTypes = [
  "Airbnb hosts",
  "Short-term rental investors",
  "Acquisition analysts",
  "Small STR operators",
];

export default function HomePage() {
  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="container">
          <div className="home-hero-grid">
            <div className="home-hero-copy">
              <span className="badge">Built for US short-term rental deal analysis</span>

              <h1 className="home-hero-title">
                Analyze STR deals in seconds. Make faster investment decisions.
              </h1>

              <p className="home-hero-text">
                HostMetricsPro helps Airbnb hosts and short-term rental investors
                see cash flow, ROI, cap rate, break-even occupancy, and risk in
                one clean workflow.
              </p>

              <div className="hero-actions">
                <Link href="/signup" className="primary-button">
                  Start Free
                </Link>
                <Link href="/pricing" className="secondary-button">
                  View Pricing
                </Link>
              </div>

              <div className="home-benefits-grid">
                {benefits.map((item) => (
                  <article key={item} className="home-benefit-card">
                    <p>{item}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="home-hero-preview">
              <div className="deal-preview-card">
                <div className="deal-preview-header">
                  <div>
                    <p className="deal-preview-label">Sample deal</p>
                    <h2 className="deal-preview-title">
                      Nashville STR Opportunity
                    </h2>
                  </div>

                  <span className="status-pill status-pill-review">BUY</span>
                </div>

                <div className="deal-preview-metrics">
                  <Metric label="Monthly Cash Flow" value="$1,482" />
                  <Metric label="Annual Cash Flow" value="$17,784" />
                  <Metric label="Cap Rate" value="8.4%" />
                  <Metric label="Cash-on-Cash ROI" value="15.7%" />
                </div>

                <div className="deal-preview-summary">
                  <Row label="Break-even occupancy" value="51%" />
                  <Row label="Risk level" value="Medium" highlight />
                  <Row
                    label="Verdict"
                    value="BUY: strong cash-flow potential with manageable risk"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block section-alt">
        <div className="container">
          <div className="section-heading section-heading-left">
            <span className="section-label">The problem</span>
            <h2>
              Most STR deal decisions are still too slow, too messy, and too risky.
            </h2>
            <p>
              Investors rely on spreadsheets, rough assumptions, and manual math.
              That leads to slow decisions and missed opportunities.
            </p>
          </div>

          <div className="three-card-grid">
            {comparisonPoints.map((item) => (
              <article key={item.title} className="surface-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <div className="section-heading section-heading-left">
            <span className="section-label">How it works</span>
            <h2>A simple workflow built for real underwriting.</h2>
            <p>
              Move from raw assumptions to a real investment decision without
              spreadsheet chaos.
            </p>
          </div>

          <div className="three-card-grid">
            {steps.map((step, index) => (
              <article key={step.title} className="surface-card step-card">
                <div className="step-number">{index + 1}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block section-alt">
        <div className="container">
          <div className="section-heading">
            <span className="section-label">Who it is for</span>
            <h2>Built for people who need faster underwriting.</h2>
            <p>
              HostMetricsPro is made for operators and investors who want speed,
              clarity, and cleaner decisions.
            </p>
          </div>

          <div className="investor-grid">
            {investorTypes.map((item) => (
              <article key={item} className="investor-card">
                <span className="investor-dot" />
                <span>{item}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="container">
          <div className="final-cta-card">
            <span className="section-label">Start free</span>
            <h2>Start free. Upgrade when you’re serious.</h2>
            <p>
              Validate the workflow on the free plan, then unlock unlimited
              deals, PDF export, and advanced analytics with Pro.
            </p>

            <div className="hero-actions hero-actions-centered">
              <Link href="/signup" className="primary-button">
                Start Free
              </Link>
              <Link href="/pricing" className="secondary-button">
                Upgrade to Pro
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="preview-metric-card">
      <p className="preview-metric-label">{label}</p>
      <p className="preview-metric-value">{value}</p>
    </div>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="preview-row">
      <span className="preview-row-label">{label}</span>
      <span
        className={
          highlight ? "preview-row-value preview-row-value-highlight" : "preview-row-value"
        }
      >
        {value}
      </span>
    </div>
  );
}