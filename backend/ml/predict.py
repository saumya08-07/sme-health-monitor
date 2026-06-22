import pickle
import numpy as np
import os

# Load the trained model
model_path = os.path.join(os.path.dirname(__file__), "model.pkl")
with open(model_path, "rb") as f:
    model = pickle.load(f)

def calculate_health_score(
    revenue: float,
    expenses: float,
    pending_payments: float,
    gst_filed: int,
    previous_revenue: float = None,
    months_active: int = 12
) -> dict:
    """
    Takes an owner's monthly numbers and returns a health score.
    
    revenue: money that came in this month
    expenses: money that went out this month  
    pending_payments: money clients owe the owner
    gst_filed: 1 = on time, 0 = delayed
    previous_revenue: last month's revenue (to calculate trend)
    months_active: how many months they've been in business
    """

    # Calculate revenue trend %
    if previous_revenue and previous_revenue > 0:
        revenue_trend = ((revenue - previous_revenue) / previous_revenue) * 100
    else:
        revenue_trend = 0.0

    # Calculate expense ratio
    if revenue > 0:
        expense_ratio = expenses / revenue
    else:
        expense_ratio = 1.0  # spending but no income = bad

    # Calculate pending payment ratio
    if revenue > 0:
        pending_ratio = pending_payments / revenue
    else:
        pending_ratio = 0.0

    # Build feature array in same order as training
    features = np.array([[
        revenue_trend,
        expense_ratio,
        pending_ratio,
        gst_filed,
        months_active
    ]])

    # Get distress probability (0 = healthy, 1 = distressed)
    distress_probability = model.predict_proba(features)[0][1]

    # Convert to health score (higher = healthier)
    health_score = round((1 - distress_probability) * 100, 1)

    # Assign risk level
    if health_score >= 70:
        risk_level = "green"
        message = "Your business looks healthy. Keep maintaining your cash flow."
    elif health_score >= 45:
        risk_level = "yellow"
        message = "Some warning signs detected. Monitor your expenses and follow up on pending payments."
    else:
        risk_level = "red"
        message = "High financial stress detected. Reduce expenses immediately and collect pending payments."

    return {
        "health_score": health_score,
        "risk_level": risk_level,
        "message": message,
        "breakdown": {
            "revenue_trend": round(revenue_trend, 2),
            "expense_ratio": round(expense_ratio, 2),
            "pending_ratio": round(pending_ratio, 2),
            "gst_filed": gst_filed
        }
    }


# Quick test
if __name__ == "__main__":
    # Test 1: Healthy business
    print("Test 1 - Healthy business:")
    result = calculate_health_score(
        revenue=100000,
        expenses=60000,
        pending_payments=10000,
        gst_filed=1,
        previous_revenue=90000,
        months_active=18
    )
    print(result)

    print("\nTest 2 - Distressed business:")
    result = calculate_health_score(
        revenue=50000,
        expenses=80000,
        pending_payments=40000,
        gst_filed=0,
        previous_revenue=90000,
        months_active=3
    )
    print(result)