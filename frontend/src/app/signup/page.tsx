"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";

export default function SignupPage() {
  const router = useRouter();
  const { login, user, loading: authLoading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.signup({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      login(response.access_token, response.user);
      router.replace("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
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
          <span className="badge">Start free</span>
          <h1>Create your HostMetricsPro account.</h1>
          <p>
            Start analyzing short-term rental deals with a cleaner, faster
            underwriting workflow built for real investing decisions.
          </p>

          <div className="auth-side-points">
            <article className="auth-side-point">
              <strong>3 free deals</strong>
              <span>Test the workflow before you upgrade.</span>
            </article>
            <article className="auth-side-point">
              <strong>Instant metrics</strong>
              <span>Get cash flow, cap rate, ROI, break-even occupancy, and risk.</span>
            </article>
            <article className="auth-side-point">
              <strong>Pro when you scale</strong>
              <span>Unlock unlimited deals, PDF export, and advanced analytics.</span>
            </article>
          </div>
        </section>

        <form onSubmit={handleSubmit} className="auth-card">
          <div className="auth-card-header">
            <h2>Create account</h2>
            <p>Sign up to start using HostMetricsPro.</p>
          </div>

          {error ? <div className="auth-error">{error}</div> : null}

          <div className="auth-form-grid">
            <div className="auth-field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="primary-button auth-submit"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </div>

          <p className="auth-footer-note">
            Already have an account?{" "}
            <Link href="/login" className="auth-inline-link">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}