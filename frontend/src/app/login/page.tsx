"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { hasSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && (user || hasSession())) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await api.login({
        email: email.trim(),
        password,
      });

      login(response.access_token, response.user);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-shell">
          <div className="auth-card">
            <p className="auth-loading">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-shell auth-shell-split">
        <section className="auth-side-panel">
          <span className="badge">HostMetricsPro</span>
          <h1>Professional STR deal analysis for serious investors.</h1>
          <p>
            Analyze Airbnb and short-term rental deals, track returns, and manage
            investment opportunities in one clean dashboard.
          </p>

          <div className="auth-side-points">
            <article className="auth-side-point">
              <strong>Analyze faster</strong>
              <span>Cash flow, cap rate, ROI, and risk in one place.</span>
            </article>
            <article className="auth-side-point">
              <strong>Decide clearly</strong>
              <span>Use score and verdict signals to filter weak deals faster.</span>
            </article>
            <article className="auth-side-point">
              <strong>Upgrade when ready</strong>
              <span>Start free, then unlock unlimited deal analysis with Pro.</span>
            </article>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="auth-card">
          <div className="auth-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to continue using HostMetricsPro.</p>
          </div>

          {error ? <div className="auth-error">{error}</div> : null}

          <div className="auth-form-grid">
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="primary-button auth-submit"
            >
              {submitting ? "Signing in..." : "Login"}
            </button>
          </div>

          <p className="auth-footer-note">
            Don’t have an account?{" "}
            <Link href="/signup" className="auth-inline-link">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}