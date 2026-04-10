"use client";

import { useEffect, useMemo, useState } from "react";
import DealForm from "./DealForm";
import DealsTable from "./DealsTable";

type Deal = any;

export default function DashboardPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadDashboard() {
    try {
      setLoading(true);
      // აქ შეგიძლია შენი API ჩასვა
      setDeals([]);
    } catch (err) {
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteDeal(id: number) {
    try {
      setDeletingId(id);
      // აქ უნდა წაშალო deal API-ით

      setMessage("Deal deleted successfully.");
      await loadDashboard();
    } catch (err) {
      setError("Failed to delete deal");
    } finally {
      setDeletingId(null);
    }
  }

  function handleEditDeal(deal: Deal) {
    console.log("Edit:", deal);
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  const topDeal = useMemo(() => {
    return (
      [...deals].sort((a, b) => b.analysis?.score - a.analysis?.score)[0] ||
      null
    );
  }, [deals]);

  return (
    <main className="dashboard-shell">
      <h1>Dashboard</h1>

      {message && <div>{message}</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {topDeal && (
            <div>
              Top Deal: {topDeal.title} ({topDeal.analysis?.score})
            </div>
          )}

          <DealForm
            onSubmit={() => {}}
            submitting={false}
            editingDeal={null}
          />

          <DealsTable
            deals={deals}
            onEdit={handleEditDeal}
            onDelete={handleDeleteDeal}
            deletingId={deletingId}
          />
        </>
      )}
    </main>
  );
}
