"use client";

import { useState } from "react";

const WISE_LINK = "https://wise.com/pay/me/bidzinan";
const SUPPORT_EMAIL = "support.hostmetricpro@gmail.com";

export default function UpgradePage() {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <main className="section-block">
      <div className="container">
        <div className="billing-result-card">
          <span className="section-label">Manual Payment</span>

          <h1>Upgrade to Pro</h1>

          {!confirmed ? (
            <>
              <p style={{ marginTop: 12 }}>
                Unlock unlimited deals, PDF export, and advanced analytics.
              </p>

              <div style={{ marginTop: 24 }}>
                <h2>Pro Plan</h2>
                <p>
                  <strong>$29 USD / month</strong>
                </p>
              </div>

              <div style={{ marginTop: 24 }}>
                <h2>Pay with Wise</h2>
                <p>Click the button below to send your Pro payment securely via Wise.</p>

                <a
                  href={WISE_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="primary-button"
                  style={{ marginTop: 12 }}
                >
                  Pay $29 via Wise
                </a>

                <p style={{ marginTop: 12, wordBreak: "break-all" }}>
                  Wise link: <strong>{WISE_LINK}</strong>
                </p>
              </div>

              <div style={{ marginTop: 24 }}>
                <h2>Important</h2>
                <p>
                  In the Wise payment note/reference, write the email address you
                  use for your HostMetricsPro account.
                </p>
              </div>

              <button
                type="button"
                className="secondary-button"
                style={{ marginTop: 24 }}
                onClick={() => setConfirmed(true)}
              >
                I’ve sent the payment
              </button>
            </>
          ) : (
            <>
              <h2 style={{ marginTop: 20 }}>Payment submitted</h2>

              <p style={{ marginTop: 12 }}>
                Thank you. Your payment will be reviewed manually.
              </p>

              <p style={{ marginTop: 12 }}>
                Please send your Wise payment screenshot to:
              </p>

              <p>
                📩 <strong>{SUPPORT_EMAIL}</strong>
              </p>

              <p style={{ marginTop: 12 }}>
                Your Pro plan will be activated manually after confirmation.
              </p>

              <p style={{ marginTop: 12 }}>
                Activation time: <strong>1–12 hours</strong>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}