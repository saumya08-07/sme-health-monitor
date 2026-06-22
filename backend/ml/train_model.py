import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import pickle
import os

np.random.seed(42)
n = 1000
data = pd.DataFrame({
    "revenue_trend": np.concatenate([
        np.random.uniform(-5, 30, 700),  
        np.random.uniform(-40, -5, 300) 
    ]),
    "expense_ratio": np.concatenate([
        np.random.uniform(0.3, 0.75, 700),  # healthy: controlled expenses
        np.random.uniform(0.75, 1.2, 300)   # distressed: overspending
    ]),
    "pending_ratio": np.concatenate([
        np.random.uniform(0.0, 0.3, 700),   # healthy: collecting payments
        np.random.uniform(0.3, 0.8, 300)    # distressed: not collecting
    ]),

    # GST filed on time: 1 = yes, 0 = delayed
    # Delayed GST = business is struggling with compliance
    "gst_filed": np.concatenate([
        np.random.choice([1, 0], 700, p=[0.95, 0.05]),  # healthy: mostly on time
        np.random.choice([1, 0], 300, p=[0.4, 0.6])     # distressed: often late
    ]),

    # Months of data: how long they've been filing (more = more stable)
    "months_active": np.concatenate([
        np.random.randint(6, 36, 700),   # healthy: established businesses
        np.random.randint(1, 12, 300)    # distressed: newer or struggling
    ]),
})

# Label: 1 = distressed, 0 = healthy
data["distressed"] = np.concatenate([
    np.zeros(700),  # first 700 are healthy
    np.ones(300)    # last 300 are distressed
])

# Shuffle so model doesn't learn order
data = data.sample(frac=1, random_state=42).reset_index(drop=True)

print("Dataset created:")
print(data["distressed"].value_counts())
print(data.head())

# ── Step 2: Train the model ───────────────────────────────────────────────────

X = data.drop("distressed", axis=1)
y = data["distressed"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = XGBClassifier(
    n_estimators=100,
    max_depth=4,
    learning_rate=0.1,
    random_state=42,
    eval_metric="logloss"
)

model.fit(X_train, y_train)

# ── Step 3: Evaluate ──────────────────────────────────────────────────────────

y_pred = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)

print(f"\nModel Accuracy: {accuracy:.2%}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=["Healthy", "Distressed"]))

# ── Step 4: Save the model ────────────────────────────────────────────────────

os.makedirs("ml", exist_ok=True)
with open("ml/model.pkl", "wb") as f:
    pickle.dump(model, f)

print("\nModel saved to ml/model.pkl")