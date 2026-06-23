import os
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
import ollama

CHROMA_DIR = os.path.join(os.path.dirname(__file__), '..', 'chroma_db')

def get_ai_explanation(health_score: float, risk_level: str, breakdown: dict) -> str:
    """
    Takes ML results and queries ChromaDB for relevant context,
    then asks Llama to write a plain English explanation.
    """
    try:
        # Build search query from the owner's situation
        query = f"""
        SME business with expense ratio {breakdown['expense_ratio']},
        revenue trend {breakdown['revenue_trend']}%,
        pending payment ratio {breakdown['pending_ratio']},
        GST filed: {breakdown['gst_filed']},
        health score {health_score}, risk level {risk_level}
        """

        # Search ChromaDB for relevant financial guidelines
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        chroma_path = os.path.abspath(CHROMA_DIR)
        vectorstore = Chroma(
            persist_directory=chroma_path,
            embedding_function=embeddings
        )
        relevant_docs = vectorstore.similarity_search(query, k=2)
        context = "\n".join([doc.page_content for doc in relevant_docs])

        # Ask Llama to explain in plain English
        prompt = f"""
You are a financial advisor helping a small business owner understand their financial health.

Their financial data:
- Health Score: {health_score}/100
- Risk Level: {risk_level.upper()}
- Revenue Trend: {breakdown['revenue_trend']}% vs last month
- Expense Ratio: {breakdown['expense_ratio']} (expenses/revenue)
- Pending Payment Ratio: {breakdown['pending_ratio']} (unpaid invoices/revenue)
- GST Filed on Time: {"Yes" if breakdown['gst_filed'] == 1 else "No"}

Relevant financial guidelines:
{context}

Write a 3-4 sentence plain English explanation of:
1. What these numbers mean for their business
2. What is the biggest risk right now
3. One specific action they should take immediately

Keep it simple, direct, and actionable. No jargon.
"""

        response = ollama.chat(
            model="llama3.2",
            messages=[{"role": "user", "content": prompt}]
        )

        return response['message']['content']

    except Exception as e:
        # Fallback if Ollama isn't running
        if risk_level == "red":
            return f"High financial stress detected (score: {health_score}/100). Your expenses exceed revenue and payments are overdue. Reduce costs immediately and collect pending payments."
        elif risk_level == "yellow":
            return f"Moderate financial stress detected (score: {health_score}/100). Monitor your cash flow closely and follow up on pending payments."
        else:
            return f"Business looks healthy (score: {health_score}/100). Keep maintaining your current financial discipline."


if __name__ == "__main__":
    # Test it
    result = get_ai_explanation(
        health_score=11.9,
        risk_level="red",
        breakdown={
            "revenue_trend": -44.44,
            "expense_ratio": 1.6,
            "pending_ratio": 0.8,
            "gst_filed": 0
        }
    )
    print("\nAI Explanation:")
    print(result)