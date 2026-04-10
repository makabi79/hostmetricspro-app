"use client";
            <label>Occupancy Rate %</label>
            <input type="number" step="0.01" value={form.occupancy_rate} onChange={(e) => updateField("occupancy_rate", Number(e.target.value))} required />
          </div>
          <div>
            <label>Other Monthly Income</label>
            <input type="number" value={form.other_monthly_income} onChange={(e) => updateField("other_monthly_income", Number(e.target.value))} required />
          </div>

          <div>
            <label>Property Tax / Month</label>
            <input type="number" value={form.property_tax_monthly} onChange={(e) => updateField("property_tax_monthly", Number(e.target.value))} required />
          </div>
          <div>
            <label>Insurance / Month</label>
            <input type="number" value={form.insurance_monthly} onChange={(e) => updateField("insurance_monthly", Number(e.target.value))} required />
          </div>

          <div>
            <label>HOA / Month</label>
            <input type="number" value={form.hoa_monthly} onChange={(e) => updateField("hoa_monthly", Number(e.target.value))} required />
          </div>
          <div>
            <label>Utilities / Month</label>
            <input type="number" value={form.utilities_monthly} onChange={(e) => updateField("utilities_monthly", Number(e.target.value))} required />
          </div>

          <div>
            <label>Cleaning / Month</label>
            <input type="number" value={form.cleaning_monthly} onChange={(e) => updateField("cleaning_monthly", Number(e.target.value))} required />
          </div>
          <div>
            <label>Maintenance / Month</label>
            <input type="number" value={form.maintenance_monthly} onChange={(e) => updateField("maintenance_monthly", Number(e.target.value))} required />
          </div>

          <div>
            <label>Management Fee %</label>
            <input type="number" step="0.01" value={form.management_fee_percent} onChange={(e) => updateField("management_fee_percent", Number(e.target.value))} required />
          </div>
          <div>
            <label>Platform Fee %</label>
            <input type="number" step="0.01" value={form.platform_fee_percent} onChange={(e) => updateField("platform_fee_percent", Number(e.target.value))} required />
          </div>

          <div>
            <label>Other Monthly Expenses</label>
            <input type="number" value={form.other_monthly_expenses} onChange={(e) => updateField("other_monthly_expenses", Number(e.target.value))} required />
          </div>
          <div className="full-span">
            <label>Notes</label>
            <textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} />
          </div>
        </div>

        <div className="toolbar" style={{ marginTop: 18 }}>
          <button className="button primary" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : editingDeal ? "Update Deal" : "Create Deal"}
          </button>
        </div>
      </form>
    </section>
  );
}