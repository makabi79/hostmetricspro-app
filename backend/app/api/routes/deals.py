from datetime import datetime, timezone
import re
import unicodedata

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.deal import Deal
from app.models.subscription import Subscription
from app.models.user import User
from app.schemas.deal import DealAnalysis, DealCreate, DealResponse, DealUpdate
from app.services.calculations import calculate_deal_metrics

router = APIRouter(prefix="/deals", tags=["deals"])

FREE_PLAN_MAX_DEALS = 3
FREE_PLAN_LIMIT_CODE = "FREE_PLAN_LIMIT_REACHED"
FREE_PLAN_LIMIT_MESSAGE = "You reached your free limit"


def get_or_create_subscription(db: Session, user_id: int) -> Subscription:
    subscription = db.query(Subscription).filter(Subscription.user_id == user_id).first()
    if subscription:
        return subscription

    subscription = Subscription(
        user_id=user_id,
        current_plan="free",
        subscription_status="inactive",
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


def is_pro_subscription(subscription: Subscription) -> bool:
    return (
        subscription.current_plan == "pro"
        and subscription.subscription_status in {"active", "trialing"}
    )


def build_error_detail(
    *,
    code: str,
    message: str,
    current_plan: str | None = None,
    deals_used: int | None = None,
    deals_limit: int | None = None,
) -> dict:
    detail = {
        "code": code,
        "message": message,
    }

    if current_plan is not None:
        detail["current_plan"] = current_plan

    if deals_used is not None:
        detail["deals_used"] = deals_used

    if deals_limit is not None:
        detail["deals_limit"] = deals_limit

    return detail


def model_metric_keys() -> set[str]:
    return {
        "monthly_revenue",
        "monthly_expenses",
        "monthly_cash_flow",
        "annual_cash_flow",
        "cash_on_cash_roi",
        "cap_rate",
        "break_even_occupancy",
        "noi",
        "dscr",
    }


def serialize_deal(deal: Deal) -> DealResponse:
    metrics = calculate_deal_metrics(deal)

    score = max(
        0.0,
        min(
            100.0,
            (metrics["cap_rate"] * 6.0) + (metrics["cash_on_cash_roi"] * 4.0),
        ),
    )
    risk = "Low" if score >= 70 else "Medium" if score >= 45 else "High"
    verdict = "Strong deal" if score >= 70 else "Needs review" if score >= 45 else "Weak deal"

    analysis = DealAnalysis(
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

    return DealResponse(
        id=deal.id,
        owner_id=deal.owner_id,
        title=deal.title,
        location=deal.location,
        notes=deal.notes,
        purchase_price=deal.purchase_price,
        down_payment=deal.down_payment,
        interest_rate=deal.interest_rate,
        loan_years=deal.loan_years,
        closing_costs=deal.closing_costs,
        renovation_cost=deal.renovation_cost,
        furnishing_cost=deal.furnishing_cost,
        nightly_rate=deal.nightly_rate,
        occupancy_rate=deal.occupancy_rate,
        other_monthly_income=deal.other_monthly_income,
        property_tax_monthly=deal.property_tax_monthly,
        insurance_monthly=deal.insurance_monthly,
        hoa_monthly=deal.hoa_monthly,
        utilities_monthly=deal.utilities_monthly,
        cleaning_monthly=deal.cleaning_monthly,
        maintenance_monthly=deal.maintenance_monthly,
        management_fee_percent=deal.management_fee_percent,
        platform_fee_percent=deal.platform_fee_percent,
        other_monthly_expenses=deal.other_monthly_expenses,
        created_at=deal.created_at,
        updated_at=deal.updated_at,
        analysis=analysis,
    )


def _slugify_filename(value: str) -> str:
    normalized = (
        unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    )
    slug = re.sub(r"[^A-Za-z0-9]+", "-", normalized).strip("-").lower()
    return slug or "deal-report"


def _pdf_text(value: str) -> str:
    normalized = (
        unicodedata.normalize("NFKD", str(value)).encode("ascii", "ignore").decode("ascii")
    )
    return normalized.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _currency(value: float) -> str:
    return f"${float(value or 0):,.2f}"


def _percent(value: float) -> str:
    return f"{float(value or 0):.2f}%"


def _int_like(value: float | int) -> str:
    return f"{float(value or 0):,.0f}"


def _wrap_lines(text: str, max_chars: int = 78) -> list[str]:
    words = str(text or "").split()
    if not words:
        return [""]

    lines: list[str] = []
    current = words[0]

    for word in words[1:]:
        candidate = f"{current} {word}"
        if len(candidate) <= max_chars:
            current = candidate
        else:
            lines.append(current)
            current = word

    lines.append(current)
    return lines


def _draw_text_block(
    commands: list[str],
    *,
    x: int,
    y: int,
    text: str,
    font: str = "/F1",
    size: int = 11,
    color: str = "0.18 0.24 0.33 rg",
) -> None:
    commands.extend(
        [
            color,
            f"BT {font} {size} Tf {x} {y} Td ({_pdf_text(text)}) Tj ET",
        ]
    )


def _draw_label_value_row(
    commands: list[str],
    *,
    x: int,
    y: int,
    label: str,
    value: str,
    label_font: str = "/F2",
    value_font: str = "/F1",
) -> None:
    _draw_text_block(
        commands,
        x=x,
        y=y,
        text=label,
        font=label_font,
        size=10,
        color="0.16 0.24 0.39 rg",
    )
    _draw_text_block(
        commands,
        x=x + 150,
        y=y,
        text=value,
        font=value_font,
        size=10,
        color="0.25 0.32 0.43 rg",
    )


def _estimate_section_height(items: list[str]) -> int:
    header_height = 36
    body_height = max(len(items), 1) * 17
    padding = 20
    return header_height + body_height + padding


def _draw_section(
    commands: list[str],
    *,
    top_y: int,
    title: str,
    items: list[str],
) -> int:
    box_height = _estimate_section_height(items)
    bottom_y = top_y - box_height

    commands.extend(
        [
            "1.00 1.00 1.00 rg",
            f"36 {bottom_y} 540 {box_height} re",
            "f",
            "0.87 0.91 0.96 RG",
            "1 w",
            f"36 {bottom_y} 540 {box_height} re",
            "S",
            "0.95 0.97 0.99 rg",
            f"36 {top_y - 36} 540 36 re",
            "f",
        ]
    )

    _draw_text_block(
        commands,
        x=50,
        y=top_y - 23,
        text=title,
        font="/F2",
        size=12,
        color="0.12 0.19 0.31 rg",
    )

    item_y = top_y - 57
    for item in items:
        _draw_text_block(
            commands,
            x=50,
            y=item_y,
            text=item,
            font="/F1",
            size=10,
            color="0.24 0.31 0.42 rg",
        )
        item_y -= 17

    return bottom_y - 18


def _build_deal_pdf(deal: DealResponse) -> bytes:
    generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    analysis = deal.analysis

    score_value = float(analysis.score or 0)
    risk_text = analysis.risk or "Unknown"
    verdict_text = analysis.verdict or "No verdict"

    if score_value >= 70:
        score_fill = "0.91 0.98 0.93 rg"
        score_stroke = "0.55 0.84 0.63 RG"
        score_text = "0.08 0.46 0.22 rg"
        badge_fill = "0.85 0.96 0.88 rg"
    elif score_value >= 45:
        score_fill = "1.00 0.97 0.89 rg"
        score_stroke = "0.95 0.80 0.40 RG"
        score_text = "0.71 0.44 0.03 rg"
        badge_fill = "1.00 0.94 0.78 rg"
    else:
        score_fill = "1.00 0.92 0.92 rg"
        score_stroke = "0.93 0.55 0.55 RG"
        score_text = "0.73 0.16 0.16 rg"
        badge_fill = "1.00 0.86 0.86 rg"

    content_commands: list[str] = [
        "0.98 0.99 1.00 rg",
        "0 0 612 792 re",
        "f",
        "0.09 0.15 0.27 rg",
        "0 724 612 68 re",
        "f",
    ]

    _draw_text_block(
        content_commands,
        x=42,
        y=754,
        text="HostMetricsPro",
        font="/F2",
        size=24,
        color="1 1 1 rg",
    )
    _draw_text_block(
        content_commands,
        x=42,
        y=736,
        text="Professional STR Deal Analysis Report",
        font="/F1",
        size=11,
        color="0.88 0.93 1.00 rg",
    )
    _draw_text_block(
        content_commands,
        x=404,
        y=736,
        text=f"Generated {generated_at}",
        font="/F1",
        size=10,
        color="0.88 0.93 1.00 rg",
    )

    _draw_text_block(
        content_commands,
        x=42,
        y=694,
        text=deal.title or "Untitled Deal",
        font="/F2",
        size=19,
        color="0.09 0.15 0.27 rg",
    )
    _draw_text_block(
        content_commands,
        x=42,
        y=675,
        text=deal.location or "No location provided",
        font="/F1",
        size=12,
        color="0.34 0.42 0.54 rg",
    )

    content_commands.extend(
        [
            score_fill,
            "390 640 186 66 re",
            "f",
            score_stroke,
            "1 w",
            "390 640 186 66 re",
            "S",
            badge_fill,
            "404 681 64 14 re",
            "f",
        ]
    )

    _draw_text_block(
        content_commands,
        x=414,
        y=684,
        text="DEAL SCORE",
        font="/F2",
        size=8,
        color="0.26 0.33 0.44 rg",
    )
    _draw_text_block(
        content_commands,
        x=404,
        y=662,
        text=f"{_int_like(score_value)} / 100",
        font="/F2",
        size=18,
        color=score_text,
    )
    _draw_text_block(
        content_commands,
        x=404,
        y=646,
        text=f"Risk: {risk_text}",
        font="/F1",
        size=10,
        color="0.22 0.28 0.38 rg",
    )
    _draw_text_block(
        content_commands,
        x=404,
        y=632,
        text=f"Verdict: {verdict_text}",
        font="/F1",
        size=10,
        color="0.22 0.28 0.38 rg",
    )

    section_y = 618

    deal_overview_items = [
        f"Property Title: {deal.title or 'Untitled Deal'}",
        f"Location: {deal.location or 'No location provided'}",
        f"Created: {deal.created_at.strftime('%Y-%m-%d') if deal.created_at else 'N/A'}",
        f"Updated: {deal.updated_at.strftime('%Y-%m-%d') if deal.updated_at else 'N/A'}",
    ]
    if deal.notes:
        note_lines = _wrap_lines(f"Notes: {deal.notes}", max_chars=78)
        deal_overview_items.extend(note_lines)

    financial_inputs_items = [
        f"Purchase Price: {_currency(deal.purchase_price)}",
        f"Down Payment: {_currency(deal.down_payment)}",
        f"Interest Rate: {_percent(deal.interest_rate)}",
        f"Loan Term: {_int_like(deal.loan_years)} years",
        f"Closing Costs: {_currency(deal.closing_costs)}",
        f"Renovation Cost: {_currency(deal.renovation_cost)}",
        f"Furnishing Cost: {_currency(deal.furnishing_cost)}",
    ]

    revenue_assumptions_items = [
        f"Nightly Rate: {_currency(deal.nightly_rate)}",
        f"Occupancy Rate: {_percent(deal.occupancy_rate)}",
        f"Other Monthly Income: {_currency(deal.other_monthly_income)}",
        f"Monthly Revenue: {_currency(analysis.monthly_revenue)}",
        f"Annual Revenue: {_currency(analysis.annual_revenue)}",
    ]

    expense_assumptions_items = [
        f"Property Tax Monthly: {_currency(deal.property_tax_monthly)}",
        f"Insurance Monthly: {_currency(deal.insurance_monthly)}",
        f"HOA Monthly: {_currency(deal.hoa_monthly)}",
        f"Utilities Monthly: {_currency(deal.utilities_monthly)}",
        f"Cleaning Monthly: {_currency(deal.cleaning_monthly)}",
        f"Maintenance Monthly: {_currency(deal.maintenance_monthly)}",
        f"Management Fee: {_percent(deal.management_fee_percent)}",
        f"Platform Fee: {_percent(deal.platform_fee_percent)}",
        f"Other Monthly Expenses: {_currency(deal.other_monthly_expenses)}",
    ]

    performance_metrics_items = [
        f"Monthly Revenue: {_currency(analysis.monthly_revenue)}",
        f"Monthly Expenses: {_currency(analysis.monthly_expenses)}",
        f"Monthly Mortgage: {_currency(analysis.monthly_mortgage)}",
        f"Monthly Cash Flow: {_currency(analysis.monthly_cash_flow)}",
        f"Annual Cash Flow: {_currency(analysis.annual_cash_flow)}",
        f"NOI Annual: {_currency(analysis.noi_annual)}",
        f"Cash Needed: {_currency(analysis.cash_needed)}",
        f"Cap Rate: {_percent(analysis.cap_rate)}",
        f"Cash-on-Cash ROI: {_percent(analysis.cash_on_cash_roi)}",
        f"Break-even Occupancy: {_percent(analysis.break_even_occupancy)}",
    ]

    for title, items in [
        ("Deal Overview", deal_overview_items),
        ("Financial Inputs", financial_inputs_items),
        ("Revenue Assumptions", revenue_assumptions_items),
        ("Expense Assumptions", expense_assumptions_items),
        ("Performance Metrics", performance_metrics_items),
    ]:
        section_y = _draw_section(
            content_commands,
            top_y=section_y,
            title=title,
            items=items,
        )

    score_section_items = [
        f"Score: {_int_like(score_value)} / 100",
        f"Risk Level: {risk_text}",
        f"Verdict: {verdict_text}",
        "Use this report as a fast underwriting snapshot for STR investment review.",
    ]
    section_y = _draw_section(
        content_commands,
        top_y=section_y,
        title="Final Evaluation",
        items=score_section_items,
    )

    content_commands.extend(
        [
            "0.88 0.91 0.95 RG",
            "0.8 w",
            "36 34 m 576 34 l",
            "S",
        ]
    )
    _draw_text_block(
        content_commands,
        x=42,
        y=20,
        text="Generated by HostMetricsPro",
        font="/F1",
        size=9,
        color="0.45 0.52 0.62 rg",
    )
    _draw_text_block(
        content_commands,
        x=430,
        y=20,
        text="ROI + cash flow + risk analysis",
        font="/F1",
        size=9,
        color="0.45 0.52 0.62 rg",
    )

    stream_text = "\n".join(content_commands)
    stream_bytes = stream_text.encode("latin-1", "replace")

    objects = [
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n",
        b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
        (
            f"6 0 obj\n<< /Length {len(stream_bytes)} >>\nstream\n".encode("latin-1")
            + stream_bytes
            + b"\nendstream\nendobj\n"
        ),
    ]

    pdf = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]

    for obj in objects:
        offsets.append(len(pdf))
        pdf.extend(obj)

    xref_start = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("latin-1"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("latin-1"))

    pdf.extend(
        (
            f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref_start}\n%%EOF"
        ).encode("latin-1")
    )

    return bytes(pdf)


@router.get("", response_model=list[DealResponse])
def list_deals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deals = (
        db.query(Deal)
        .filter(Deal.owner_id == current_user.id)
        .order_by(Deal.id.desc())
        .all()
    )
    return [serialize_deal(deal) for deal in deals]


@router.post("", response_model=DealResponse, status_code=status.HTTP_201_CREATED)
def create_deal(
    payload: DealCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subscription = get_or_create_subscription(db, current_user.id)
    deal_count = db.query(Deal).filter(Deal.owner_id == current_user.id).count()

    if not is_pro_subscription(subscription) and deal_count >= FREE_PLAN_MAX_DEALS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=build_error_detail(
                code=FREE_PLAN_LIMIT_CODE,
                message=FREE_PLAN_LIMIT_MESSAGE,
                current_plan=subscription.current_plan,
                deals_used=deal_count,
                deals_limit=FREE_PLAN_MAX_DEALS,
            ),
        )

    payload_data = payload.model_dump()
    metrics = calculate_deal_metrics(payload_data)
    filtered_metrics = {
        key: value for key, value in metrics.items() if key in model_metric_keys()
    }

    deal = Deal(
        owner_id=current_user.id,
        **payload_data,
        **filtered_metrics,
    )
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return serialize_deal(deal)


@router.get("/{deal_id}", response_model=DealResponse)
def get_deal(
    deal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deal = (
        db.query(Deal)
        .filter(Deal.id == deal_id, Deal.owner_id == current_user.id)
        .first()
    )
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return serialize_deal(deal)


@router.get("/{deal_id}/export")
def export_deal_pdf(
    deal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subscription = get_or_create_subscription(db, current_user.id)

    if not is_pro_subscription(subscription):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=build_error_detail(
                code="EXPORT_REQUIRES_PRO",
                message="PDF export is available on the Pro plan only.",
                current_plan=subscription.current_plan,
            ),
        )

    deal = (
        db.query(Deal)
        .filter(Deal.id == deal_id, Deal.owner_id == current_user.id)
        .first()
    )
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    serialized = serialize_deal(deal)
    filename = f"{_slugify_filename(serialized.title)}-report.pdf"
    pdf_bytes = _build_deal_pdf(serialized)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )


@router.put("/{deal_id}", response_model=DealResponse)
def update_deal(
    deal_id: int,
    payload: DealUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deal = (
        db.query(Deal)
        .filter(Deal.id == deal_id, Deal.owner_id == current_user.id)
        .first()
    )
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    update_data = payload.model_dump(exclude_unset=True)

    current_data = {
        "title": deal.title,
        "location": deal.location,
        "notes": deal.notes,
        "purchase_price": deal.purchase_price,
        "down_payment": deal.down_payment,
        "interest_rate": deal.interest_rate,
        "loan_years": deal.loan_years,
        "closing_costs": deal.closing_costs,
        "renovation_cost": deal.renovation_cost,
        "furnishing_cost": deal.furnishing_cost,
        "nightly_rate": deal.nightly_rate,
        "occupancy_rate": deal.occupancy_rate,
        "other_monthly_income": deal.other_monthly_income,
        "property_tax_monthly": deal.property_tax_monthly,
        "insurance_monthly": deal.insurance_monthly,
        "hoa_monthly": deal.hoa_monthly,
        "utilities_monthly": deal.utilities_monthly,
        "cleaning_monthly": deal.cleaning_monthly,
        "maintenance_monthly": deal.maintenance_monthly,
        "management_fee_percent": deal.management_fee_percent,
        "platform_fee_percent": deal.platform_fee_percent,
        "other_monthly_expenses": deal.other_monthly_expenses,
    }
    current_data.update(update_data)

    metrics = calculate_deal_metrics(current_data)
    filtered_metrics = {
        key: value for key, value in metrics.items() if key in model_metric_keys()
    }

    for key, value in update_data.items():
        setattr(deal, key, value)

    for key, value in filtered_metrics.items():
        setattr(deal, key, value)

    db.add(deal)
    db.commit()
    db.refresh(deal)
    return serialize_deal(deal)


@router.delete("/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_deal(
    deal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    deal = (
        db.query(Deal)
        .filter(Deal.id == deal_id, Deal.owner_id == current_user.id)
        .first()
    )
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")

    db.delete(deal)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)