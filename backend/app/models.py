from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
Base = declarative_base()

class Owner(Base):
    __tablename__ = "owners"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    business_name = Column(String, nullable=False)
    business_type = Column(String)  
    created_at = Column(DateTime, default=datetime.utcnow)
    reports = relationship("MonthlyReport", back_populates="owner")


class MonthlyReport(Base):
    __tablename__ = "monthly_reports"

    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("owners.id"))
    month = Column(String, nullable=False)   
    year = Column(Integer, nullable=False)

    revenue = Column(Float, nullable=False)        
    expenses = Column(Float, nullable=False)      
    pending_payments = Column(Float, default=0)   
    gst_filed = Column(Integer, default=1)   

    health_score = Column(Float)       
    risk_level = Column(String)       
    ai_explanation = Column(String)     
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("Owner", back_populates="reports")