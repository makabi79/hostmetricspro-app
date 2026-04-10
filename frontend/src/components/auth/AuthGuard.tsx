"use client";

import { type ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasSession } from "@/lib/auth";
import { useAuth } from "@/components/auth/AuthProvider";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !hasSession())) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="container">
          <section className="dashboard-loading-card">
            <div className="dashboard-loading-dot" />
            <div>
              <h1>Loading dashboard...</h1>
              <p>Checking your session and preparing your workspace.</p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  if (!user || !hasSession()) {
    return null;
  }

  return <>{children}</>;
}