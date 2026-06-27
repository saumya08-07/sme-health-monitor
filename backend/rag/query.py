import os
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
import ollama

CHROMA_DIR = os.path.join(os.path.dirname(__file__), '..', 'chroma_db')
OLLAMA_TIMEOUT_SECONDS = 60


def _fallback_text(risk_level: str, breakdown: dict) -> str:
    """Used whenever Ollama is slow, unreachable, or errors out."""
    expense_ratio = breakdown.get('expense_ratio', 0)
    pending_ratio = breakdown.get('pending_ratio', 0)

    if risk_level == "red":
        return (
            f"Critical: Health score reflects serious risk. Expense ratio {expense_ratio} "
            f"means you're spending more than earning. Immediate action: cut expenses by "
            f"{round((expense_ratio - 0.8) * 100)}% and collect outstanding payments "
            f"(currently {pending_ratio * 100:.0f}% of revenue) within 30 days."
        )
    elif risk_level == "yellow":
        return (
            "Caution: Monitor cash flow closely. Collect pending payments and review "
            "expense categories this month."
        )
    else:
        return "Healthy: Business is performing well. Continue current financial discipline."


def get_ai_explanation(health_score: float, risk_level: str, breakdown: dict, industry: str = "retail") -> str:
    try:
        query = f"""
        SME in {industry} sector with:
        - Health score {health_score}/100
        - Expense ratio {breakdown.get('expense_ratio', 0)}
        - Revenue trend {breakdown.get('revenue_trend', 0)}%
        - Profit margin {breakdown.get('profit_margin', 0)}%
        - Pending payment ratio {breakdown.get('pending_ratio', 0)}
        - Loan to revenue ratio {breakdown.get('loan_to_revenue', 0)}
        - GST filed: {breakdown.get('gst_filed', 0)}
        """

        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        chroma_path = os.path.abspath(CHROMA_DIR)
        vectorstore = Chroma(persist_directory=chroma_path, embedding_function=embeddings)
        relevant_docs = vectorstore.similarity_search(query, k=3)
        context = "\n".join([doc.page_content for doc in relevant_docs])

        expense_ratio = breakdown.get('expense_ratio', 0)
        pending_ratio = breakdown.get('pending_ratio', 0)
        gst_filed = breakdown.get('gst_filed', 0)

        prompt = f"""You are a senior financial advisor at a bank reviewing a small business owner's monthly financials.

Business sector: {industry}
Health Score: {health_score}/100 — Risk Level: {risk_level.upper()}

Key metrics this month:
- Revenue trend vs last month: {breakdown.get('revenue_trend', 0)}%
- Expense ratio (expenses/revenue): {expense_ratio} {"⚠️ CRITICAL — spending more than earning" if expense_ratio > 1 else "✓ OK" if expense_ratio < 0.8 else "⚠️ High"}
- Profit margin: {breakdown.get('profit_margin', 0)}%
- Pending payments ratio: {pending_ratio} {"⚠️ High — clients not paying" if pending_ratio > 0.3 else "✓ OK"}
- Outstanding loan burden: {breakdown.get('loan_to_revenue', 0)} of revenue
- GST compliance: {"Filed on time ✓" if gst_filed == 1 else "DELAYED ⚠️"}
- Revenue per employee: ₹{breakdown.get('revenue_per_employee', 0):,.0f}

Regulatory context:
{context}

Write a specific, direct financial advisory note with:
1. One sentence summary of their financial situation right now
2. The single biggest risk factor with exact numbers from their data
3. Two concrete actions they must take this month with deadlines
4. One positive thing if their score is above 50

Be specific with numbers. No generic advice. Speak directly to the owner as "your business"."""

        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(
                ollama.chat,
                model="llama3.2",
                messages=[{"role": "user", "content": prompt}]
            )
            response = future.result(timeout=OLLAMA_TIMEOUT_SECONDS)

        return response['message']['content']

    except FutureTimeoutError:
        print(f"Ollama timed out after {OLLAMA_TIMEOUT_SECONDS}s — using fallback text")
        return _fallback_text(risk_level, breakdown)
    except Exception as e:
        print(f"RAG/Ollama error: {e} — using fallback text")
        return _fallback_text(risk_level, breakdown)