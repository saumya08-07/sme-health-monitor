from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# --- Owner Schemas ---

class OwnerCreate(BaseModel):
    name: str
    email: str
    password: str
    business_name: str
    business_type: str

class OwnerLogin(BaseModel):
    email: str
    password: str

class OwnerResponse(BaseModel):
    id: int
    name: str
    email: str
    business_name: str
    business_type: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Monthly Report Schemas ---

class ReportCreate(BaseModel):
    month: str
    year: int
    day: int = 1
    revenue: float
    expenses: float
    pending_payments: float
    gst_filed: int
    outstanding_loans: float = 0
    num_employees: int = 1
    industry: str = "retail"
    previous_month_revenue: float = 0
    notes: str = ""

class ReportResponse(BaseModel):
    id: int
    owner_id: int
    month: str
    year: int
    day: int = 1
    revenue: float
    expenses: float
    pending_payments: float
    gst_filed: int
    outstanding_loans: Optional[float]
    num_employees: Optional[int]
    industry: Optional[str]
    notes: Optional[str]
    health_score: Optional[float]
    risk_level: Optional[str]
    ai_explanation: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
# --- Token Schema (for login) ---

class Token(BaseModel):
    access_token: str
    token_type: str