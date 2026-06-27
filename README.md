# SME Health Monitor

An AI-driven financial health monitoring tool for small business owners. Owners enter monthly revenue, expenses, receivables, and GST status — the app returns a 0–100 health score and AI-generated advice grounded in real RBI/SIDBI regulatory guidelines.

## What it does

Most small business owners have no structured way to know if their business is financially healthy beyond checking their bank balance. This tool turns four simple monthly inputs into:

- A **0–100 health score** with a green/yellow/red risk level, powered by an XGBoost classifier
- **AI-generated financial advice**, grounded in real RBI/SIDBI guideline documents via a RAG pipeline, served by a locally-running Llama 3.2 model
- A **dashboard** with score trends, cash flow charts, and an AI advisor chat

## Architecture

```
React frontend (Docker) → FastAPI backend (native) → PostgreSQL (Docker)
                                    │
                                    ├── XGBoost model → health score
                                    │
                                    └── RAG layer
                                         ├── ChromaDB (RBI/SIDBI guideline chunks)
                                         ├── Prompt builder (score + metrics + context)
                                         └── Ollama / Llama 3.2 (60s timeout → rule-based fallback)
```

**A deliberate scoping decision:** PostgreSQL and the frontend are containerized with Docker Compose. The backend runs natively rather than in Docker, because its ML dependencies (`torch`, `sentence-transformers`, `xgboost`) are slow and architecture-sensitive to containerize reliably on ARM64. Docker was scoped to where it added real value without forcing a fragile build.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS, Recharts |
| Backend | FastAPI, SQLAlchemy, JWT auth |
| ML scoring | XGBoost, trained on the Home Credit dataset |
| RAG pipeline | LangChain, ChromaDB, HuggingFace sentence embeddings |
| LLM | Llama 3.2 via Ollama (local inference) |
| Database | PostgreSQL (Dockerized) |
| Infra | Docker Compose |

## How the scoring works

Revenue, expenses, pending payments, and GST status are converted into 8 engineered features (expense ratio, payment-pending ratio, revenue trend, etc.) and passed to an XGBoost classifier trained on the Home Credit default-risk dataset, repurposed for SME financial distress prediction. The model outputs a distress probability, which is converted into a 0–100 health score with rule-based adjustments for loan burden and profit margin.

## How the AI advice works (RAG)

1. The health score and financial breakdown are converted into a descriptive query.
2. That query is embedded and matched against a ChromaDB vector store containing RBI/SIDBI guideline document chunks.
3. The top 3 most relevant chunks are retrieved and inserted into a prompt alongside the business's actual numbers.
4. The prompt is sent to a locally-running Llama 3.2 model via Ollama, wrapped in a 60-second timeout.
5. If Ollama is slow or unavailable, the app falls back to deterministic, rule-based advice — the user never sees a hung request or a failed response.

## Running locally

**Prerequisites:** Python 3.11, Node.js, Docker Desktop, [Ollama](https://ollama.com) with `llama3.2` pulled.

```bash
# 1. Start PostgreSQL + frontend
docker compose up

# 2. Start the backend (separate terminal)
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# 3. Ollama runs as a background service once installed — no separate command needed
```

The backend automatically checks for an existing ChromaDB vector store on startup and re-ingests the RBI/SIDBI guideline documents if it's missing, so the RAG pipeline self-heals on a fresh clone.

Visit `http://localhost:3000` once both are running.

## Project structure

```
sme-health-monitor/
├── backend/
│   ├── app/          # FastAPI routes, auth, database, schemas
│   ├── ml/            # XGBoost training + inference
│   ├── rag/            # ChromaDB ingestion + RAG query pipeline
│   └── chroma_db/     # Generated vector store (not tracked in git)
├── frontend/           # React app
└── docker-compose.yml  # PostgreSQL + frontend services
```

## Author
Built by [Saumya Kumar](https://github.com/saumya08-07) as a personal full-stack ML/RAG project.
