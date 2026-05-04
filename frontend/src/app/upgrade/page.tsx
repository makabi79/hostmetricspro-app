"use client";

import { useState } from "react";

export default function UpgradePage() {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <main className="section-block">
      <div className="container">
        <div className="billing-result-card">
          <span className="section-label">Manual Payment</span>

          <h1>Upgrade to Pro ($29/month)</h1>

          {!confirmed ? (
            <>
              <p>
                Send payment using one of the methods below and then confirm.
              </p>

              <div style={{ marginTop: 20 }}>
                <h3>💳 Wise</h3>
                <p>Email: your-wise@email.com</p>

                <h3 style={{ marginTop: 16 }}>💳 Payoneer</h3>
                <p>Email: your-payoneer@email.com</p>

                <p style={{ marginTop: 16 }}>
                  Amount: <strong>$29 USD</strong>
                </p>

                <button
                  className="primary-button"
                  style={{ marginTop: 20 }}
                  onClick={() => setConfirmed(true)}
                >
                  I’ve sent the payment
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 style={{ marginTop: 20 }}>Payment submitted</h2>

              <p>
                Your payment will be reviewed manually. Once confirmed, your Pro
                plan will be activated.
              </p>

              <p style={{ marginTop: 16 }}>
                If activation takes longer than expected, contact support:
              </p>

              <p>
                📩 your@email.com
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}