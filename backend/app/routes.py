from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Owner, MonthlyReport
from app.schemas import OwnerCreate, OwnerLogin, ReportCreate, OwnerResponse, ReportResponse, Token
from app.auth import hash_password, verify_password, create_token, decode_token
from fastapi.security import OAuth2PasswordBearer
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
from ml.predict import calculate_health_score

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_owner(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    email = decode_token(token)
    owner = db.query(Owner).filter(Owner.email == email).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    return owner

@router.post("/auth/register", response_model=OwnerResponse)
def register(data: OwnerCreate, db: Session = Depends(get_db)):
    existing = db.query(Owner).filter(Owner.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    owner = Owner(
        name=data.name,
        email=data.email,
        password=hash_password(data.password),
        business_name=data.business_name,
        business_type=data.business_type
    )
    db.add(owner)
    db.commit()
    db.refresh(owner)
    return owner

@router.post("/auth/login", response_model=Token)
def login(data: OwnerLogin, db: Session = Depends(get_db)):
    owner = db.query(Owner).filter(Owner.email == data.email).first()
    if not owner or not verify_password(data.password, owner.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": owner.email})
    return {"access_token": token, "token_type": "bearer"}

@router.post("/reports", response_model=ReportResponse)
def create_report(
    data: ReportCreate,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner)
):
    previous_report = db.query(MonthlyReport).filter(
        MonthlyReport.owner_id == current_owner.id
    ).order_by(MonthlyReport.id.desc()).first()

    previous_revenue = previous_report.revenue if previous_report else None
    months_active = db.query(MonthlyReport).filter(
        MonthlyReport.owner_id == current_owner.id
    ).count()

    result = calculate_health_score(
        revenue=data.revenue,
        expenses=data.expenses,
        pending_payments=data.pending_payments,
        gst_filed=data.gst_filed,
        previous_revenue=previous_revenue,
        months_active=max(months_active, 1)
    )

    report = MonthlyReport(
        owner_id=current_owner.id,
        month=data.month,
        year=data.year,
        revenue=data.revenue,
        expenses=data.expenses,
        pending_payments=data.pending_payments,
        gst_filed=data.gst_filed,
        health_score=float(result["health_score"]),
        risk_level=result["risk_level"],
        ai_explanation=result["message"]
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report

@router.get("/reports", response_model=list[ReportResponse])
def get_reports(
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner)
):
    reports = db.query(MonthlyReport).filter(
        MonthlyReport.owner_id == current_owner.id
    ).order_by(MonthlyReport.year.desc()).all()
    return reports

@router.get("/reports/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner)
):
    report = db.query(MonthlyReport).filter(
        MonthlyReport.id == report_id,
        MonthlyReport.owner_id == current_owner.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report