from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Owner, MonthlyReport
from app.schemas import OwnerCreate, OwnerLogin, ReportCreate, OwnerResponse, ReportResponse, Token
from app.auth import hash_password, verify_password, create_token, decode_token
from fastapi.security import OAuth2PasswordBearer

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# --- Helper: get current logged in owner ---
def get_current_owner(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    email = decode_token(token)
    owner = db.query(Owner).filter(Owner.email == email).first()
    if not owner:
        raise HTTPException(status_code=404, detail="Owner not found")
    return owner

# --- Register ---
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

# --- Login ---
@router.post("/auth/login", response_model=Token)
def login(data: OwnerLogin, db: Session = Depends(get_db)):
    owner = db.query(Owner).filter(Owner.email == data.email).first()
    if not owner or not verify_password(data.password, owner.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": owner.email})
    return {"access_token": token, "token_type": "bearer"}

# --- Submit monthly report ---
@router.post("/reports", response_model=ReportResponse)
def create_report(
    data: ReportCreate,
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner)
):
    report = MonthlyReport(
        owner_id=current_owner.id,
        month=data.month,
        year=data.year,
        revenue=data.revenue,
        expenses=data.expenses,
        pending_payments=data.pending_payments,
        gst_filed=data.gst_filed
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report

# --- Get all reports for logged in owner ---
@router.get("/reports", response_model=list[ReportResponse])
def get_reports(
    db: Session = Depends(get_db),
    current_owner: Owner = Depends(get_current_owner)
):
    reports = db.query(MonthlyReport).filter(
        MonthlyReport.owner_id == current_owner.id
    ).order_by(MonthlyReport.year.desc()).all()
    return reports

# --- Get single report ---
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