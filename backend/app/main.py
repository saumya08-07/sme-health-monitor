import os
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
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.on_event("startup")
@app.on_event("startup")
def ensure_rag_ready():
    """
    Make sure ChromaDB has embedded documents before any /reports
    request tries to query it. If the folder is missing or empty,
    run ingest.py automatically so RAG doesn't silently fall back
    to generic advice.
    """
    chroma_dir = os.path.join(os.path.dirname(__file__), '..', 'chroma_db')
    chroma_dir = os.path.abspath(chroma_dir)

    needs_ingest = (
        not os.path.exists(chroma_dir)
        or not os.listdir(chroma_dir)
    )

    if needs_ingest:
        print(f"[startup] ChromaDB not found at {chroma_dir} — running ingest...")
        from rag.ingest import ingest_documents
        try:
            ingest_documents()
            print("[startup] Ingest complete. ChromaDB is ready.")
        except Exception as e:
            print(f"[startup] WARNING: ingest failed — {e}")
            print("[startup] RAG will fall back to generic advice until this is fixed.")
    else:
        print(f"[startup] ChromaDB found at {chroma_dir} — skipping ingest.")

@app.get("/")
def root():
    return {"message": "SME Health Monitor API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}