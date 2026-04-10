"use client";
      }
      setMessage("Deal deleted successfully.");
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete deal");
    } finally {
      setDeletingId(null);
    }
  }

  const topDeal = useMemo(() => {
    return [...deals].sort((a, b) => b.analysis.score - a.analysis.score)[0] || null;
  }, [deals]);

  return (
    <main className="dashboard-shell">
      <div className="dashboard-topbar">
        <div>
          <h1 style={{ marginBottom: 6 }}>Welcome back{user ? `, ${user.name}` : ""}</h1>
          <div className="page-subtitle">STR deal analysis dashboard with live investment metrics.</div>
        </div>
        <div className="toolbar">
          <button className="button secondary" onClick={() => { void loadDashboard(); }} type="button">Refresh</button>
          <button className="button secondary" onClick={logout} type="button">Logout</button>
        </div>
      </div>

      <KpiCards summary={summary} />

      {topDeal ? (
        <div className="surface-card" style={{ marginBottom: 20 }}>
          <strong>Top Deal:</strong> {topDeal.title} — {topDeal.analysis.verdict} with score {topDeal.analysis.score}/100 and monthly cash flow ${topDeal.analysis.monthly_cash_flow}
        </div>
      ) : null}

      {message ? <div className="info-box" style={{ marginBottom: 16 }}>{message}</div> : null}
      {error ? <div className="error-box" style={{ marginBottom: 16 }}>{error}</div> : null}

      {loading ? (
        <div className="loader-card" style={{ padding: 24 }}>Loading dashboard data...</div>
      ) : (
        <div className="dashboard-grid">
          <DealForm
            editingDeal={editingDeal}
            onSubmitDeal={handleSubmitDeal}
            onCancelEdit={() => setEditingDeal(null)}
            submitting={saving}
          />

          <section className="surface-card">
            <div className="toolbar" style={{ justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <h2 style={{ margin: 0 }}>Deals</h2>
                <p className="page-subtitle" style={{ marginTop: 6 }}>Compare cash flow, ROI, cap rate, break-even, risk, and verdict.</p>
              </div>
            </div>
            <DealsTable deals={deals} onEdit={setEditingDeal} onDelete={handleDeleteDeal} deletingId={deletingId} />
          </section>
        </div>
      )}
    </main>
  );
}