"use client";

import { FormEvent, useEffect, useState } from "react";

export type DealFormValues = {
  title: string;
  location: string;
  purchase_price: number;
  down_payment: number;
  interest_rate: number;
  loan_years: number;
  closing_costs: number;
  renovation_cost: number;
  furnishing_cost: number;
  nightly_rate: number;
  occupancy_rate: number;
  other_monthly_income: number;
  property_tax_monthly: number;
  insurance_monthly: number;
  hoa_monthly: number;
  utilities_monthly: number;
  cleaning_monthly: number;
  maintenance_monthly: number;
  management_fee_percent: number;
  platform_fee_percent: number;
  other_monthly_expenses: number;
  notes: string;
};

type DealFormProps = {
  onSubmit: (payload: DealFormValues) => void | Promise<void>;
  submitting?: boolean;
  editingDeal?: Partial<DealFormValues> | null;
};

const defaultForm: DealFormValues = {
  title: "",
  location: "",
  purchase_price: 0,
  down_payment: 0,
  interest_rate: 0,
  loan_years: 30,
  closing_costs: 0,
  renovation_cost: 0,
  furnishing_cost: 0,
  nightly_rate: 0,
  occupancy_rate: 0,
  other_monthly_income: 0,
  property_tax_monthly: 0,
  insurance_monthly: 0,
  hoa_monthly: 0,
  utilities_monthly: 0,
  cleaning_monthly: 0,
  maintenance_monthly: 0,
  management_fee_percent: 0,
  platform_fee_percent: 0,
  other_monthly_expenses: 0,
  notes: "",
};

export default function DealForm({
  onSubmit,
  submitting = false,
  editingDeal = null,
}: DealFormProps) {
  const [form, setForm] = useState<DealFormValues>(defaultForm);

  useEffect(() => {
    if (editingDeal) {
      setForm({
        ...defaultForm,
        ...editingDeal,
        notes: editingDeal.notes ?? "",
      });
      return;
    }

    setForm(defaultForm);
  }, [editingDeal]);

  function updateField<K extends keyof DealFormValues>(
    key: K,
    value: DealFormValues[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit(form);
  }

  return (
    <section className="section-card">
      <div className="section-head">
        <div>
          <h2>{editingDeal ? "Edit Deal" : "Create New Deal"}</h2>
          <p>Enter the property details and monthly assumptions below.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label>Deal Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              required
            />
          </div>

          <div>
            <label>Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => updateField("location", e.target.value)}
              required
            />
          </div>

          <div>
            <label>Purchase Price</label>
            <input
              type="number"
              value={form.purchase_price}
              onChange={(e) =>
                updateField("purchase_price", Number(e.target.value))
              }
              required
            />
          </div>

          <div>
            <label>Down Payment</label>
            <input
              type="number"
              value={form.down_payment}
              onChange={(e) =>
                updateField("down_payment", Number(e.target.value))
              }
              required
            />
          </div>

          <div>
            <label>Interest Rate %</label>
            <input
              type="number"
              step="0.01"
              value={form.interest_rate}
              onChange={(e) =>
                updateField("interest_rate", Number(e.target.value))
              }
              required
            />
          </div>

          <div>
            <label>Loan Years</label>
            <input
              type="number"
              value={form.loan_years}
              onChange={(e) => updateField("loan_years", Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label>Closing Costs</label>
            <input
              type="number"
              value={form.closing_costs}
              onChange={(e) =>
                updateField("closing_costs", Number(e.target.value))
              }
              required
            />
          </div>

          <div>
            <label>Renovation Cost</label>
            <input
              type="number"
              value={form.renovation_cost}
              onChange={(e) =>
                updateField("renovation_cost", Number(e.target.value))
              }
              required
            />
          </div>

          <div>
            <label>Furnishing Cost</label>
            <input
              type="number"
              value={form.furnishing_cost}
              onChange={(e) =>
                updateField("furnishing_cost", Number(e.target.value))
              }
              required
            />
          </div>

          <div>
            <label>Nightly Rate</label>
            <input
              type="number"
              step="0.01"
              value={form.nightly_rate}
              onChange={(e) =>
                updateField("nightly_rate", Number(e.target.value))
              }
              required
            />
          </div>

          <div>
            <label>Occupancy Rate %</label>
            <input
              type="number"
              step="0.01"
              value={form.occupancy_rate}
              onChange={(e) =>
                updateField("occupancy_rate", Number(e.target.value))
              }
              required
            />
          </div>

          <div>
            <label>Other Monthly Income</label>
            <input
              type="number"
              value={form.other_monthly_income}
              onChange={(e) =>
                updateField("other_monthly_income", Number(e.target.value))
              }
              required
            />
          </div>

          <div>
            <label>Property Tax / Month</label>
            <input
              type="number"
              value={form.property_tax_monthly}
              onChange={(e) =>
                updateField("property_tax_monthly", Number(e.target.value))
              }
              required
            />
          </div>

          <div>
            <label>Insurance / Month</label>
            <input
              type="number"
              value={form.insurance_monthly}
              onChange={(e) =>
                updateField("insurance_monthly", Number(e.target.value))
              }
              required
            />
          </div>

          <div>
            <label>HOA / Month</label>
            <input
              type="number"
              value={form.hoa_monthly}
              onChange={(e) =>
                updateField("hoa_monthly", Number(e.target.value))
              }
              required
            />
          </div>

          <div>
            <label>Utilities / Month</label>
            <input
              type="number"
              value={form.utilities_monthly}
              onChange={(e) =>
                updateField("utilities_monthly", Number(e.target.value))
              }
              required
            />
          </div>

          <div>
            <label>Cleaning / Month</label>
            <input
              type="number"
              value={form.cleaning_monthly}
              onChange={(e) =>
                updateField("cleaning_monthly", Number(e.target.value))
              }
              required
            />
          </div>

          <div>
            <label>Maintenance / Month</label>
            <input
              type="number"
              value={form.maintenance_monthly}
              onChange={(e) =>
                updateField("maintenance_monthly", Number(e.target.value))
              }
              required
            />
          </div>

          <div>
            <label>Management Fee %</label>
            <input
              type="number"
              step="0.01"
              value={form.management_fee_percent}
              onChange={(e) =>
                updateField("management_fee_percent", Number(e.target.value))
              }
              required
            />
          </div>

          <div>
            <label>Platform Fee %</label>
            <input
              type="number"
              step="0.01"
              value={form.platform_fee_percent}
              onChange={(e) =>
                updateField("platform_fee_percent", Number(e.target.value))
              }
              required
            />
          </div>

          <div>
            <label>Other Monthly Expenses</label>
            <input
              type="number"
              value={form.other_monthly_expenses}
              onChange={(e) =>
                updateField("other_monthly_expenses", Number(e.target.value))
              }
              required
            />
          </div>

          <div className="full-span">
            <label>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => updateField("notes", e.target.value)}
            />
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
