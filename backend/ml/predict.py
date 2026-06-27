import pickle
import numpy as np
import os

model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
with open(model_path, "rb") as f:
    saved = pickle.load(f)

model = saved["model"]
threshold = saved["threshold"]


def calculate_health_score(
    revenue: float,
    expenses: float,
    pending_payments: float,
    gst_filed: int,
    outstanding_loans: float = 0,
    num_employees: int = 1,
    previous_revenue: float = None,
    months_active: int = 12
) -> dict:

    # Revenue trend
    if previous_revenue and previous_revenue > 0:
        revenue_trend = ((revenue - previous_revenue) / previous_revenue) * 100
    else:
        revenue_trend = 0.0

    # Core ratios
    expense_ratio = expenses / revenue if revenue > 0 else 1.0
    pending_ratio = pending_payments / revenue if revenue > 0 else 0.0
    loan_to_revenue = outstanding_loans / revenue if revenue > 0 else 0.0
    profit = revenue - expenses
    profit_margin = (profit / revenue * 100) if revenue > 0 else -100
    revenue_per_employee = revenue / max(num_employees, 1)

    # Build feature array — must match training order exactly:
    # ['revenue_trend', 'expense_ratio', 'pending_ratio', 'gst_filed',
    #  'months_active', 'inq_ratio', 'family_stability', 'reg_stability']
    inq_ratio = 0.0  # no inquiry data from user, default to 0

    family_stability = min(1.0, num_employees / max(num_employees + 1, 1))
    reg_stability = min(1.0, months_active / 360)

    features = np.array([[
        revenue_trend,
        expense_ratio,
        pending_ratio,
        gst_filed,
        months_active,
        inq_ratio,
        family_stability,
        reg_stability
    ]])

    distress_probability = model.predict_proba(features)[0][1]
    is_distressed = bool(distress_probability >= threshold)

    # Adjust score with additional signals
    base_score = (1 - distress_probability) * 100

    # Penalty for high loan burden
    if loan_to_revenue > 0.5:
        base_score -= 10
    elif loan_to_revenue > 0.3:
        base_score -= 5

    # Penalty for negative profit
    if profit_margin < 0:
        base_score -= 15
    elif profit_margin < 10:
        base_score -= 5

    health_score = max(0, min(100, round(base_score, 1)))

    if health_score >= 70:
        risk_level = "green"
    elif health_score >= 45:
        risk_level = "yellow"
    else:
        risk_level = "red"

    return {
        "health_score": health_score,
        "risk_level": risk_level,
        "is_distressed": is_distressed,
        "distress_probability": round(float(distress_probability), 4),
        "breakdown": {
            "revenue_trend": round(revenue_trend, 2),
            "expense_ratio": round(expense_ratio, 2),
            "pending_ratio": round(pending_ratio, 2),
            "profit_margin": round(profit_margin, 2),
            "loan_to_revenue": round(loan_to_revenue, 2),
            "revenue_per_employee": round(revenue_per_employee, 2),
            "gst_filed": gst_filed
        },
        "message": f"Health score: {health_score}/100 ({risk_level})"
    }