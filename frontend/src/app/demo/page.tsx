import Link from "next/link";

const demoDeals = [
  {
    id: 1,
    title: "Miami Beach Condo",
    location: "Miami, FL",
    purchasePrice: 420000,
    nightlyRate: 235,
    occupancyRate: 68,
    monthlyCashFlow: 1245,
    annualCashFlow: 14940,
    capRate: 8.2,
    cashOnCashRoi: 14.6,
    breakEvenOccupancy: 54,
    score: 82,
    risk: "Low",
    verdict: "Strong deal",
  },
  {
    id: 2,
    title: "Scottsdale Pool House",
    location: "Scottsdale, AZ",
    purchasePrice: 510000,
    nightlyRate: 310,
    occupancyRate: 61,
    monthlyCashFlow: 890,
    annualCashFlow: 10680,
    capRate: 7.1,
    cashOnCashRoi: 11.9,
    breakEvenOccupancy: 58,
    score: 71,
    risk: "Low",
    verdict: "Strong deal",
  },
  {
    id: 3,
    title: "Smoky Mountains Cabin",
    location: "Gatlinburg, TN",
    purchasePrice: 365000,
    nightlyRate: 210,
    occupancyRate: 56,
    monthlyCashFlow: 285,
    annualCashFlow: 3420,
    capRate: 5.8,
    cashOnCashRoi: 7.4,
    breakEvenOccupancy: 61,
    score: 49,
    risk: "Medium",
    verdict: "Needs review",
  },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function getScoreStyle(score: number) {
  if (score >= 70) {
    return {
      background: "rgba(34,197,94,0.16)",
      color: "#86efac",
      border: "1px solid rgba(34,197,94,0.25)",
    };
  }

  if (score >= 45) {
    return {
      background: "rgba(245,158,11,0.16)",
      color: "#fcd34d",
      border: "1px solid rgba(245,158,11,0.25)",
    };
  }

  return {
    background: "rgba(239,68,68,0.16)",
    color: "#fca5a5",
    border: "1px solid rgba(239,68,68,0.25)",
  };
}

export default function DemoPage() {
  const totalDeals = demoDeals.length;
  const avgMonthlyCashFlow =
    demoDeals.reduce((sum, deal) => sum + deal.monthlyCashFlow, 0) / totalDeals;
  const avgCapRate =
    demoDeals.reduce((sum, deal) => sum + deal.capRate, 0) / totalDeals;
  const avgCashOnCashRoi =
    demoDeals.reduce((sum, deal) => sum + deal.cashOnCashRoi, 0) / totalDeals;
  const bestScore = Math.max(...demoDeals.map((deal) => deal.score));

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(37,99,235,0.18) 0%, rgba(15,23,42,0) 32%), linear-gradient(180deg, #07111f 0%, #0b1220 42%, #0f172a 100%)",
        color: "#e5e7eb",
        padding: "40px 20px 64px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1380px",
          margin: "0 auto",
        }}
      >
        <section
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: "28px",
          }}
        >
          <div style={{ maxWidth: "760px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "999px",
                border: "1px solid rgba(96,165,250,0.25)",
                background: "rgba(37,99,235,0.14)",
                color: "#bfdbfe",
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "16px",
              }}
            >
              HostMetricsPro Demo
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: "42px",
                lineHeight: 1.05,
                letterSpacing: "-0.04em",
                color: "#f8fafc",
                fontWeight: 800,
              }}
            >
              See how deal analysis looks before you sign up
            </h1>

            <p
              style={{
                margin: "14px 0 0",
                maxWidth: "760px",
                color: "#94a3b8",
                fontSize: "16px",
                lineHeight: 1.7,
              }}
            >
              This demo shows sample short-term rental deals with cash flow, cap
              rate, ROI, break-even occupancy, score, risk, and verdict so you
              can understand the value of HostMetricsPro instantly.
            </p>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
                marginTop: "22px",
              }}
            >
              <Link
                href="/signup"
                style={{
                  border: "none",
                  borderRadius: "14px",
                  padding: "12px 18px",
                  background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 800,
                  textDecoration: "none",
                  boxShadow: "0 14px 30px rgba(37,99,235,0.3)",
                }}
              >
                Create Free Account
              </Link>

              <Link
                href="/pricing"
                style={{
                  border: "1px solid rgba(148,163,184,0.18)",
                  borderRadius: "14px",
                  padding: "11px 16px",
                  background: "#111c31",
                  color: "#e2e8f0",
                  fontSize: "14px",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                View Pricing
              </Link>

              <Link
                href="/"
                style={{
                  border: "1px solid rgba(148,163,184,0.18)",
                  borderRadius: "14px",
                  padding: "11px 16px",
                  background: "#111c31",
                  color: "#e2e8f0",
                  fontSize: "14px",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Back to Home
              </Link>
            </div>
          </div>

          <div
            style={{
              minWidth: "220px",
              padding: "14px 16px",
              borderRadius: "18px",
              background: "rgba(15,23,42,0.88)",
              border: "1px solid rgba(148,163,184,0.14)",
              boxShadow: "0 18px 40px rgba(2,6,23,0.22)",
            }}
          >
            <span
              style={{
                color: "#93c5fd",
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Demo Mode
            </span>
            <div
              style={{
                color: "#f8fafc",
                fontSize: "20px",
                fontWeight: 800,
                lineHeight: 1.1,
                marginTop: "6px",
              }}
            >
              Sample Portfolio
            </div>
            <div
              style={{
                color: "#94a3b8",
                fontSize: "13px",
                lineHeight: 1.5,
                marginTop: "6px",
              }}
            >
              View example deals before creating your own account.
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <MetricCard
            label="Sample Deals"
            value={String(totalDeals)}
            helper="Demo portfolio size"
          />
          <MetricCard
            label="Avg Monthly Cash Flow"
            value={formatCurrency(avgMonthlyCashFlow)}
            helper="Average demo performance"
          />
          <MetricCard
            label="Avg Cap Rate"
            value={formatPercent(avgCapRate)}
            helper="Portfolio yield signal"
          />
          <MetricCard
            label="Avg Cash on Cash ROI"
            value={formatPercent(avgCashOnCashRoi)}
            helper="Return efficiency"
          />
          <MetricCard
            label="Best Score"
            value={String(bestScore)}
            helper="Top sample opportunity"
          />
        </section>

        <section
          style={{
            background: "rgba(15,23,42,0.9)",
            border: "1px solid rgba(148,163,184,0.14)",
            borderRadius: "24px",
            padding: "24px",
            boxShadow: "0 18px 40px rgba(2,6,23,0.34)",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <div>
              <p
                style={{
                  margin: 0,
                  color: "#60a5fa",
                  fontSize: "12px",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                Demo Portfolio
              </p>
              <h2
                style={{
                  margin: "8px 0 0",
                  color: "#f8fafc",
                  fontSize: "26px",
                  lineHeight: 1.1,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                }}
              >
                Example STR deals
              </h2>
              <p
                style={{
                  margin: "10px 0 0",
                  color: "#94a3b8",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  maxWidth: "760px",
                }}
              >
                These sample deals show the kind of outputs users see inside
                HostMetricsPro after entering property assumptions.
              </p>
            </div>
          </div>

          <div style={{ width: "100%", overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                minWidth: "1180px",
                borderCollapse: "separate",
                borderSpacing: 0,
              }}
            >
              <thead>
                <tr>
                  <th style={thStyle}>Deal</th>
                  <th style={thStyle}>Purchase Price</th>
                  <th style={thStyle}>Nightly Rate</th>
                  <th style={thStyle}>Occupancy</th>
                  <th style={thStyle}>Monthly Cash Flow</th>
                  <th style={thStyle}>Cap Rate</th>
                  <th style={thStyle}>CoC ROI</th>
                  <th style={thStyle}>Break-even</th>
                  <th style={thStyle}>Score</th>
                  <th style={thStyle}>Risk</th>
                  <th style={thStyle}>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {demoDeals.map((deal) => (
                  <tr key={deal.id}>
                    <td style={tdStyle}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          minWidth: "180px",
                        }}
                      >
                        <div
                          style={{
                            color: "#f8fafc",
                            fontWeight: 700,
                            fontSize: "14px",
                          }}
                        >
                          {deal.title}
                        </div>
                        <div
                          style={{
                            color: "#94a3b8",
                            fontSize: "13px",
                          }}
                        >
                          {deal.location}
                        </div>
                      </div>
                    </td>
                    <td style={tdStyle}>{formatCurrency(deal.purchasePrice)}</td>
                    <td style={tdStyle}>{formatCurrency(deal.nightlyRate)}</td>
                    <td style={tdStyle}>{formatPercent(deal.occupancyRate)}</td>
                    <td style={tdStyle}>
                      {formatCurrency(deal.monthlyCashFlow)}
                    </td>
                    <td style={tdStyle}>{formatPercent(deal.capRate)}</td>
                    <td style={tdStyle}>{formatPercent(deal.cashOnCashRoi)}</td>
                    <td style={tdStyle}>
                      {formatPercent(deal.breakEvenOccupancy)}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: "44px",
                          height: "30px",
                          padding: "0 10px",
                          borderRadius: "999px",
                          fontSize: "13px",
                          fontWeight: 800,
                          ...getScoreStyle(deal.score),
                        }}
                      >
                        {deal.score}
                      </span>
                    </td>
                    <td style={tdStyle}>{deal.risk}</td>
                    <td style={tdStyle}>{deal.verdict}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
            marginBottom: "24px",
          }}
        >
          <InfoCard
            title="What this demo shows"
            text="A realistic preview of how HostMetricsPro helps investors understand profitability, financing impact, and risk in one dashboard."
          />
          <InfoCard
            title="What you unlock with a real account"
            text="Create your own deals, track your portfolio, and upgrade to Pro for unlimited deals, PDF export, and advanced analytics."
          />
          <InfoCard
            title="Best next step"
            text="Use the free plan to test your own first deals, then upgrade when you want more volume and stronger outputs."
          />
        </section>

        <section
          style={{
            background: "rgba(15,23,42,0.9)",
            border: "1px solid rgba(148,163,184,0.14)",
            borderRadius: "24px",
            padding: "28px",
            boxShadow: "0 18px 40px rgba(2,6,23,0.34)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "18px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                color: "#60a5fa",
                fontSize: "12px",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: "8px",
              }}
            >
              Ready to analyze your own deals?
            </div>
            <h2
              style={{
                margin: 0,
                color: "#f8fafc",
                fontSize: "28px",
                lineHeight: 1.15,
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              Start free and test HostMetricsPro with real properties
            </h2>
            <p
              style={{
                margin: "10px 0 0",
                color: "#94a3b8",
                fontSize: "14px",
                lineHeight: 1.7,
                maxWidth: "760px",
              }}
            >
              Begin with the free plan and upgrade to Pro when you need
              unlimited deals, PDF export, and advanced analytics.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/signup"
              style={{
                border: "none",
                borderRadius: "14px",
                padding: "12px 18px",
                background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 14px 30px rgba(37,99,235,0.3)",
              }}
            >
              Create Free Account
            </Link>

            <Link
              href="/pricing"
              style={{
                border: "1px solid rgba(148,163,184,0.18)",
                borderRadius: "14px",
                padding: "11px 16px",
                background: "#111c31",
                color: "#e2e8f0",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Compare Plans
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div
      style={{
        background:
          "linear-gradient(180deg, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.88) 100%)",
        border: "1px solid rgba(148,163,184,0.14)",
        borderRadius: "22px",
        padding: "22px",
        boxShadow: "0 18px 40px rgba(2,6,23,0.34)",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <span
        style={{
          color: "#94a3b8",
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </span>
      <strong
        style={{
          color: "#f8fafc",
          fontSize: "30px",
          lineHeight: 1.1,
          fontWeight: 800,
          letterSpacing: "-0.03em",
        }}
      >
        {value}
      </strong>
      <span
        style={{
          color: "#64748b",
          fontSize: "13px",
        }}
      >
        {helper}
      </span>
    </div>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div
      style={{
        background: "rgba(15,23,42,0.9)",
        border: "1px solid rgba(148,163,184,0.14)",
        borderRadius: "22px",
        padding: "22px",
        boxShadow: "0 18px 40px rgba(2,6,23,0.28)",
      }}
    >
      <h3
        style={{
          margin: 0,
          color: "#f8fafc",
          fontSize: "20px",
          lineHeight: 1.2,
          fontWeight: 800,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: "12px 0 0",
          color: "#94a3b8",
          fontSize: "14px",
          lineHeight: 1.7,
        }}
      >
        {text}
      </p>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0 14px 14px",
  color: "#94a3b8",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  borderBottom: "1px solid rgba(148,163,184,0.12)",
};

const tdStyle: React.CSSProperties = {
  padding: "18px 14px",
  borderBottom: "1px solid rgba(148,163,184,0.08)",
  color: "#e2e8f0",
  fontSize: "14px",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
};