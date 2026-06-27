import pandas as pd
import numpy as np
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, f1_score
import pickle
import os

print("Loading Home Credit dataset...")

CSV_PATH = os.path.join(
    os.path.dirname(__file__), '..', '..', 'data',
    'application_train.csv'
)

COLS = [
    'TARGET', 'AMT_INCOME_TOTAL', 'AMT_CREDIT', 'AMT_ANNUITY',
    'DAYS_EMPLOYED', 'DAYS_BIRTH', 'EXT_SOURCE_1', 'EXT_SOURCE_2', 'EXT_SOURCE_3',
    'AMT_REQ_CREDIT_BUREAU_YEAR', 'AMT_REQ_CREDIT_BUREAU_MON',
    'DAYS_LAST_PHONE_CHANGE', 'FLAG_OWN_CAR', 'FLAG_OWN_REALTY',
    'CNT_CHILDREN', 'REGION_RATING_CLIENT', 'DEF_30_CNT_SOCIAL_CIRCLE',
    'OBS_30_CNT_SOCIAL_CIRCLE', 'CNT_FAM_MEMBERS',
    'DAYS_REGISTRATION', 'DAYS_ID_PUBLISH',
    'FLAG_WORK_PHONE', 'FLAG_PHONE', 'FLAG_EMAIL',
    'NAME_INCOME_TYPE', 'NAME_EDUCATION_TYPE', 'NAME_CONTRACT_TYPE'
]

df = pd.read_csv(CSV_PATH, usecols=COLS, low_memory=False)
print(f"Loaded {len(df)} rows")
print(f"Default rate: {df['TARGET'].mean()*100:.1f}%")

# Feature engineering
df['ext1'] = df['EXT_SOURCE_1'].fillna(df['EXT_SOURCE_2'].median())
df['ext2'] = df['EXT_SOURCE_2'].fillna(df['EXT_SOURCE_1'].median())
df['ext3'] = df['EXT_SOURCE_3'].fillna(df['EXT_SOURCE_2'].median())
df['revenue_trend'] = (df['ext1']*0.3 + df['ext2']*0.4 + df['ext3']*0.3) * 30

df['AMT_INCOME_TOTAL'] = df['AMT_INCOME_TOTAL'].fillna(150000).clip(1)
df['AMT_ANNUITY'] = df['AMT_ANNUITY'].fillna(0)
df['expense_ratio'] = (df['AMT_ANNUITY'] * 12 / df['AMT_INCOME_TOTAL']).clip(0, 2)

df['AMT_CREDIT'] = df['AMT_CREDIT'].fillna(0)
df['pending_ratio'] = (df['AMT_CREDIT'] / df['AMT_INCOME_TOTAL'].clip(1)).clip(0, 1)

df['FLAG_OWN_CAR'] = (df['FLAG_OWN_CAR'] == 'Y').astype(int)
df['FLAG_OWN_REALTY'] = (df['FLAG_OWN_REALTY'] == 'Y').astype(int)
df['social_default'] = df['DEF_30_CNT_SOCIAL_CIRCLE'].fillna(0)
edu_map = {
    'Higher education': 1.0, 'Incomplete higher': 0.7,
    'Secondary / secondary special': 0.5,
    'Lower secondary': 0.3, 'Academic degree': 1.0
}
income_map = {
    'Working': 0.7, 'Commercial associate': 0.8,
    'State servant': 0.9, 'Pensioner': 0.6,
    'Student': 0.4, 'Unemployed': 0.1, 'Businessman': 0.85
}
df['edu_score'] = df['NAME_EDUCATION_TYPE'].map(edu_map).fillna(0.5)
df['income_stability'] = df['NAME_INCOME_TYPE'].map(income_map).fillna(0.5)
df['gst_filed'] = (
    (df['social_default'] == 0).astype(float) * 0.4 +
    df['FLAG_OWN_REALTY'].astype(float) * 0.3 +
    df['edu_score'] * 0.15 +
    df['income_stability'] * 0.15
)

df['DAYS_EMPLOYED'] = df['DAYS_EMPLOYED'].replace(365243, 0)
df['employment_years'] = (-df['DAYS_EMPLOYED'].clip(-20000, 0) / 365).clip(0, 40)
df['age_years'] = (-df['DAYS_BIRTH'] / 365).clip(18, 70)
df['months_active'] = df['employment_years'] * 12 + df['age_years']

df['inq_year'] = df['AMT_REQ_CREDIT_BUREAU_YEAR'].fillna(0).clip(0, 20)
df['inq_mon'] = df['AMT_REQ_CREDIT_BUREAU_MON'].fillna(0).clip(0, 10)
df['inq_ratio'] = (df['inq_year']/20*0.6 + df['inq_mon']/10*0.4).clip(0, 1)

df['family_stability'] = (
    df['CNT_FAM_MEMBERS'].fillna(1).clip(1, 10) /
    (df['CNT_CHILDREN'].fillna(0).clip(0, 5) + 1)
).clip(0, 5) / 5

df['reg_stability'] = (-df['DAYS_REGISTRATION'].fillna(0) / 365).clip(0, 30) / 30

features = [
    'revenue_trend', 'expense_ratio', 'pending_ratio',
    'gst_filed', 'months_active', 'inq_ratio',
    'family_stability', 'reg_stability'
]

df = df.dropna(subset=features)
print(f"Clean rows: {len(df)}")

# Use ALL data — no balancing, use class weight instead
X = df[features]
y = df['TARGET']

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Training on {len(X_train)} samples (full dataset, no balancing)...")

model = XGBClassifier(
    n_estimators=500,
    max_depth=7,
    learning_rate=0.03,
    scale_pos_weight=11,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    gamma=0.1,
    reg_alpha=0.1,
    reg_lambda=1,
    random_state=42,
    eval_metric='auc',
    verbosity=0
)

model.fit(X_train, y_train)

# Find best threshold
proba = model.predict_proba(X_test)[:, 1]
best_threshold = 0.5
best_f1 = 0
for threshold in np.arange(0.1, 0.9, 0.01):
    preds = (proba >= threshold).astype(int)
    f1 = f1_score(y_test, preds)
    if f1 > best_f1:
        best_f1 = f1
        best_threshold = threshold

print(f"Best threshold: {best_threshold:.2f}")
y_pred = (proba >= best_threshold).astype(int)
accuracy = accuracy_score(y_test, y_pred)

print(f"\nModel Accuracy: {accuracy:.2%}")
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=["Healthy", "Distressed"]))

print("\nFeature Importance:")
for feat, imp in zip(features, model.feature_importances_):
    print(f"  {feat}: {imp:.3f}")

output_path = os.path.join(os.path.dirname(__file__), "model.pkl")
with open(output_path, "wb") as f:
    pickle.dump({"model": model, "threshold": best_threshold}, f)

print(f"\nSaved to {output_path}")
print(f"Threshold: {best_threshold:.2f}")