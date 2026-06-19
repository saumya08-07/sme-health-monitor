from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.routes import router
from app.database import engine
from app.models import Base

load_dotenv()

# This creates all database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SME Health Monitor",
    description="Financial health monitoring for small business owners",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {"message": "SME Health Monitor API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}