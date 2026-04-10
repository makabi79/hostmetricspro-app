"use client";
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Deal</th>
            <th>Cash Flow</th>
            <th>ROI</th>
            <th>Cap Rate</th>
            <th>Break-even</th>
            <th>Score</th>
            <th>Risk</th>
            <th>Verdict</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.id}>
              <td>
                <strong>{deal.title}</strong>
                <div className="meta-text">{deal.location}</div>
              </td>
              <td>{currency(deal.analysis.monthly_cash_flow)}</td>
              <td>{deal.analysis.cash_on_cash_roi.toFixed(1)}%</td>
              <td>{deal.analysis.cap_rate.toFixed(1)}%</td>
              <td>{deal.analysis.break_even_occupancy.toFixed(1)}%</td>
              <td>{deal.analysis.score}/100</td>
              <td>
                <span className={`badge ${riskClass(deal.analysis.risk)}`}>{deal.analysis.risk}</span>
              </td>
              <td>{deal.analysis.verdict}</td>
              <td>
                <div className="toolbar">
                  <button className="button secondary" onClick={() => onEdit(deal)} type="button">Edit</button>
                  <button className="button danger" onClick={() => onDelete(deal.id)} type="button" disabled={deletingId === deal.id}>
                    {deletingId === deal.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}