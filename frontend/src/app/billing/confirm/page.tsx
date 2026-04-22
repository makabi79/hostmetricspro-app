"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiRequestError } from "@/lib/api";
import { fetchBillingStatus, type BillingStatus } from "@/lib/billing";
import { getToken } from "@/lib/auth";

const POLL_INTERVAL_MS = 2500;
const MAX_POLL_ATTEMPTS = 12;

export default function BillingConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasToken = Boolean(getToken());

  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [errorText, setErrorText] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const attemptsRef = useRef(0);

  const transactionId =
    searchParams.get("_ptxn") || searchParams.get("transaction_id") || "";

  useEffect(() => {
    if (!hasToken) {
      router.replace("/login");
      return;
    }

    let isCancelled = false;
    let timeoutId: number | null = null;

    async function checkStatus() {
      try {
        const status = await fetchBillingStatus();

        if (isCancelled) {
          return;
        }

        setBillingStatus(status);

        if (status.is_pro) {
          setIsChecking(false);
          router.replace("/dashboard");
          return;
        }

        attemptsRef.current += 1;

        if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
          setIsChecking(false);
          return;
        }

        timeoutId = window.setTimeout(checkStatus, POLL_INTERVAL_MS);
      } catch (err) {
        if (isCancelled) {
          return;
        }

        if (err instanceof ApiRequestError && err.status === 401) {
          router.replace("/login");
          return;
        }

        setErrorText(
          err instanceof Error
            ? err.message
            : "Failed to verify your subscription status."
        );
        setIsChecking(false);
      }
    }

    void checkStatus();

    return () => {
      isCancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [hasToken, router]);

  const statusText = useMemo(() => {
    if (!billingStatus) {
      return "Checking your payment status...";
    }

    if (billingStatus.is_pro) {
      return "Payment confirmed. Redirecting to your dashboard...";
    }

    if (isChecking) {
      return "Payment received. Waiting for your Pro access to activate...";
    }

    return "We could not confirm Pro access yet.";
  }, [billingStatus, isChecking]);

  async function handleRetry() {
    try {
      setErrorText("");
      setIsChecking(true);
      attemptsRef.current = 0;

      const status = await fetchBillingStatus();
      setBillingStatus(status);

      if (status.is_pro) {
        router.replace("/dashboard");
        return;
      }

      setIsChecking(false);
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        router.replace("/login");
        return;
      }

      setErrorText(
        err instanceof Error
          ? err.message
          : "Failed to verify your subscription status."
      );
      setIsChecking(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            Paddle Billing
          </span>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Confirming your upgrade
        </h1>

        <p className="mt-3 text-base leading-7 text-slate-600">
          {statusText}
        </p>

        {transactionId ? (
          <p className="mt-4 break-all text-sm text-slate-500">
            Transaction: {transactionId}
          </p>
        ) : null}

        {billingStatus ? (
          <div className="mt-8 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-3">
            <div>
              <div className="text-sm text-slate-500">Plan</div>
              <div className="mt-1 text-lg font-semibold text-slate-950">
                {billingStatus.current_plan.toUpperCase()}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-500">Status</div>
              <div className="mt-1 text-lg font-semibold text-slate-950">
                {billingStatus.subscription_status}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-500">Deals</div>
              <div className="mt-1 text-lg font-semibold text-slate-950">
                {billingStatus.max_deals === null
                  ? `${billingStatus.deals_used} / unlimited`
                  : `${billingStatus.deals_used} / ${billingStatus.max_deals}`}
              </div>
            </div>
          </div>
        ) : null}

        {errorText ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorText}
          </div>
        ) : null}

        {!isChecking && !(billingStatus?.is_pro ?? false) ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-lg font-semibold text-slate-950">
              Upgrade not confirmed yet
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Your payment may have completed, but the app has not received the
              final subscription update yet. Try refreshing your status or open
              your dashboard and check the plan card.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleRetry()}
                className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-2 text-sm font-medium text-white"
              >
                Refresh status
              </button>

              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Go to dashboard
              </Link>

              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Back to pricing
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}