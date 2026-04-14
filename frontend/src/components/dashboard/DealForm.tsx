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
    <section>
      <form onSubmit={handleSubmit}>
        <div>
          <div>
            <label>Deal Title</label>
            <input
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
          </div>

          <div>
            <label>Occupancy Rate %</label>
            <input
              type="number"
              value={form.occupancy_rate}
              onChange={(e) =>
                updateField("occupancy_rate", Number(e.target.value))
              }
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
            />
          </div>
        </div>

        <button type="submit">{submitting ? "Saving..." : "Submit"}</button>
      </form>
    </section>
  );
}