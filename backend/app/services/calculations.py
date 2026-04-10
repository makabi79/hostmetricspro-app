from app.schemas.deal import DealAnalysis


def _as_dict(data) -> dict:
    if isinstance(data, dict):
        return data

    return {
        "purchase_price": float(getattr(data, "purchase_price", 0) or 0),
        "down_payment": float(getattr(data, "down_payment", 0) or 0),
        "interest_rate": float(getattr(data, "interest_rate", 0) or 0),
        "loan_years": int(getattr(data, "loan_years", 0) or 0),
        "closing_costs": float(getattr(data, "closing_costs", 0) or 0),
        "renovation_cost": float(getattr(data, "renovation_cost", 0) or 0),
        "furnishing_cost": float(getattr(data, "furnishing_cost", 0) or 0),
        "nightly_rate": float(getattr(data, "nightly_rate", 0) or 0),
        "occupancy_rate": float(getattr(data, "occupancy_rate", 0) or 0),
        "other_monthly_income": float(getattr(data, "other_monthly_income", 0) or 0),
        "property_tax_monthly": float(getattr(data, "property_tax_monthly", 0) or 0),
        "insurance_monthly": float(getattr(data, "insurance_monthly", 0) or 0),
        "hoa_monthly": float(getattr(data, "hoa_monthly", 0) or 0),
        "utilities_monthly": float(getattr(data, "utilities_monthly", 0) or 0),
        "cleaning_monthly": float(getattr(data, "cleaning_monthly", 0) or 0),
        "maintenance_monthly": float(getattr(data, "maintenance_monthly", 0) or 0),
        "management_fee_percent": float(getattr(data, "management_fee_percent", 0) or 0),
        "platform_fee_percent": float(getattr(data, "platform_fee_percent", 0) or 0),
        "other_monthly_expenses": float(getattr(data, "other_monthly_expenses", 0) or 0),
    }


def calculate_deal_metrics(data) -> dict:
    values = _as_dict(data)

    purchase_price = float(values.get("purchase_price", 0))
    down_payment = float(values.get("down_payment", 0))
    interest_rate = float(values.get("interest_rate", 0))
    loan_years = int(values.get("loan_years", 0))

    closing_costs = float(values.get("closing_costs", 0))
    renovation_cost = float(values.get("renovation_cost", 0))
    furnishing_cost = float(values.get("furnishing_cost", 0))

    nightly_rate = float(values.get("nightly_rate", 0))
    occupancy_rate = float(values.get("occupancy_rate", 0))
    other_monthly_income = float(values.get("other_monthly_income", 0))

    property_tax_monthly = float(values.get("property_tax_monthly", 0))
    insurance_monthly = float(values.get("insurance_monthly", 0))
    hoa_monthly = float(values.get("hoa_monthly", 0))
    utilities_monthly = float(values.get("utilities_monthly", 0))
    cleaning_monthly = float(values.get("cleaning_monthly", 0))
    maintenance_monthly = float(values.get("maintenance_monthly", 0))

    management_fee_percent = float(values.get("management_fee_percent", 0))
    platform_fee_percent = float(values.get("platform_fee_percent", 0))
    other_monthly_expenses = float(values.get("other_monthly_expenses", 0))

    occupied_nights = 30 * (occupancy_rate / 100.0)
    gross_booking_revenue = nightly_rate * occupied_nights
    management_fee = gross_booking_revenue * (management_fee_percent / 100.0)
    platform_fee = gross_booking_revenue * (platform_fee_percent / 100.0)

    loan_amount = max(purchase_price - down_payment, 0.0)
    monthly_interest_rate = interest_rate / 100.0 / 12.0
    total_payments = loan_years * 12

    if loan_amount > 0 and monthly_interest_rate > 0 and total_payments > 0:
        monthly_mortgage = (
            loan_amount
            * monthly_interest_rate
            * (1 + monthly_interest_rate) ** total_payments
            / ((1 + monthly_interest_rate) ** total_payments - 1)
        )
    elif loan_amount > 0 and total_payments > 0:
        monthly_mortgage = loan_amount / total_payments
    else:
        monthly_mortgage = 0.0

    monthly_revenue = gross_booking_revenue + other_monthly_income

    monthly_expenses = (
        property_tax_monthly
        + insurance_monthly
        + hoa_monthly
        + utilities_monthly
        + cleaning_monthly
        + maintenance_monthly
        + management_fee
        + platform_fee
        + other_monthly_expenses
        + monthly_mortgage
    )

    monthly_cash_flow = monthly_revenue - monthly_expenses
    annual_cash_flow = monthly_cash_flow * 12.0

    annual_revenue = monthly_revenue * 12.0
    annual_expenses = monthly_expenses * 12.0

    annual_operating_expenses = (
        property_tax_monthly
        + insurance_monthly
        + hoa_monthly
        + utilities_monthly
        + cleaning_monthly
        + maintenance_monthly
        + management_fee
        + platform_fee
        + other_monthly_expenses
    ) * 12.0

    noi = annual_revenue - annual_operating_expenses

    total_cash_needed = (
        down_payment + closing_costs + renovation_cost + furnishing_cost
    )

    cash_on_cash_roi = (
        (annual_cash_flow / total_cash_needed) * 100.0
        if total_cash_needed > 0
        else 0.0
    )

    cap_rate = (noi / purchase_price) * 100.0 if purchase_price > 0 else 0.0

    variable_cost_ratio = (management_fee_percent + platform_fee_percent) / 100.0
    if nightly_rate > 0:
        fixed_costs = (
            property_tax_monthly
            + insurance_monthly
            + hoa_monthly
            + utilities_monthly
            + cleaning_monthly
            + maintenance_monthly
            + other_monthly_expenses
            + monthly_mortgage
        )
        break_even_revenue = fixed_costs / max(1.0 - variable_cost_ratio, 0.01)
        break_even_occupancy = min(
            max((break_even_revenue / (nightly_rate * 30.0)) * 100.0, 0.0),
            100.0,
        )
    else:
        break_even_occupancy = 0.0

    annual_debt_service = monthly_mortgage * 12.0
    dscr = noi / annual_debt_service if annual_debt_service > 0 else 0.0

    return {
        "monthly_revenue": round(monthly_revenue, 2),
        "monthly_expenses": round(monthly_expenses, 2),
        "monthly_cash_flow": round(monthly_cash_flow, 2),
        "annual_cash_flow": round(annual_cash_flow, 2),
        "cash_on_cash_roi": round(cash_on_cash_roi, 2),
        "cap_rate": round(cap_rate, 2),
        "break_even_occupancy": round(break_even_occupancy, 2),
        "noi": round(noi, 2),
        "dscr": round(dscr, 2),
        "annual_revenue": round(annual_revenue, 2),
        "annual_expenses": round(annual_expenses, 2),
        "monthly_mortgage": round(monthly_mortgage, 2),
        "cash_needed": round(total_cash_needed, 2),
    }


def analyze_deal(data) -> DealAnalysis:
    metrics = calculate_deal_metrics(data)

    score = max(
        0.0,
        min(
            100.0,
            (metrics["cap_rate"] * 6.0) + (metrics["cash_on_cash_roi"] * 4.0),
        ),
    )
    risk = "Low" if score >= 70 else "Medium" if score >= 45 else "High"
    verdict = "Strong deal" if score >= 70 else "Needs review" if score >= 45 else "Weak deal"

    return DealAnalysis(
        monthly_revenue=metrics["monthly_revenue"],
        annual_revenue=metrics["annual_revenue"],
        monthly_expenses=metrics["monthly_expenses"],
        annual_expenses=metrics["annual_expenses"],
        noi_annual=metrics["noi"],
        monthly_mortgage=metrics["monthly_mortgage"],
        monthly_cash_flow=metrics["monthly_cash_flow"],
        annual_cash_flow=metrics["annual_cash_flow"],
        cash_needed=metrics["cash_needed"],
        cash_on_cash_roi=metrics["cash_on_cash_roi"],
        cap_rate=metrics["cap_rate"],
        break_even_occupancy=metrics["break_even_occupancy"],
        score=round(score, 2),
        risk=risk,
        verdict=verdict,
    )