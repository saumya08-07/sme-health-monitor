import os
import sys
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

# Where your RBI/SIDBI PDFs are stored
DOCS_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'rag_docs')
CHROMA_DIR = os.path.join(os.path.dirname(__file__), '..', 'chroma_db')

def ingest_documents():
    """
    Reads all PDFs from rag_docs folder,
    splits them into chunks,
    embeds them,
    stores in ChromaDB.
    """
    print("Loading documents...")

    # If no PDFs yet, create sample financial advice text
    docs_path = os.path.abspath(DOCS_DIR)
    if not os.path.exists(docs_path):
        os.makedirs(docs_path)

    # Check if any PDFs exist
    pdf_files = [f for f in os.listdir(docs_path) if f.endswith('.pdf')]

    documents = []

    if pdf_files:
        # Load real PDFs
        for pdf_file in pdf_files:
            print(f"Loading {pdf_file}...")
            loader = PyPDFLoader(os.path.join(docs_path, pdf_file))
            documents.extend(loader.load())
    else:
        # Use built-in financial knowledge as fallback
        print("No PDFs found. Using built-in financial guidelines...")
        from langchain_core.documents import Document
        documents = [
            Document(page_content="""
            SME Financial Health Guidelines - RBI Framework
            
            Early Warning Signals for SME Distress:
            1. Delay or default in payment of instalments and interest
            2. Frequent requests for loan restructuring
            3. Return of cheques or ECS mandates
            4. Reduction in credit summation in current account
            5. GST filing delays for more than 2 consecutive quarters
            6. Revenue declining more than 20% quarter over quarter
            7. Expense ratio exceeding 90% of revenue consistently
            
            When expense ratio exceeds revenue (>1.0), the business is spending 
            more than it earns. Immediate cost reduction is necessary.
            
            Pending payment ratio above 40% indicates serious cash flow problems.
            Clients are not paying on time, creating a working capital crisis.
            """),
            Document(page_content="""
            SIDBI MSME Pulse Report - Key Findings
            
            Common causes of SME financial distress in India:
            1. Working capital mismanagement - businesses overextend credit to customers
            2. GST compliance issues leading to input tax credit blockage
            3. Over-dependence on single customers or suppliers
            4. Inadequate cash flow forecasting
            5. High fixed costs during revenue downturns
            
            Recommended actions for distressed SMEs:
            - Immediately review and reduce discretionary expenses
            - Follow up aggressively on pending receivables (outstanding payments)
            - Negotiate extended payment terms with suppliers
            - Consider invoice discounting to improve immediate cash flow
            - File all pending GST returns to avoid penalties and credit blockage
            
            For SMEs with health score below 50:
            The business shows multiple early warning signals. 
            Priority action: reduce expenses below 80% of revenue within 60 days.
            """),
            Document(page_content="""
            RBI Guidelines on MSME Credit Assessment
            
            Financial ratios for healthy SME assessment:
            - Current ratio should be above 1.2
            - Debt service coverage ratio (DSCR) above 1.5 is considered safe
            - Net profit margin should be positive and growing
            - Receivables turnover should not exceed 60 days
            
            Green zone (Health Score 70-100):
            Business is financially healthy. Continue monitoring quarterly.
            Maintain expense ratio below 75% of revenue.
            
            Yellow zone (Health Score 45-70):
            Business shows early stress signals. Monthly monitoring required.
            Focus on collecting pending payments and controlling expenses.
            Avoid taking on new debt until ratios improve.
            
            Red zone (Health Score 0-45):
            High distress probability. Immediate intervention required.
            Consider loan restructuring if repayment is at risk.
            Reduce expenses to below 80% of revenue immediately.
            Contact a chartered accountant for emergency financial review.
            """)
        ]

    # Split into smaller chunks for precise searching
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )
    chunks = splitter.split_documents(documents)
    print(f"Created {len(chunks)} chunks from documents")

    # Embed using a free local model
    print("Embedding chunks (this takes 1-2 minutes first time)...")
    embeddings = HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2"
    )

    # Store in ChromaDB
    chroma_path = os.path.abspath(CHROMA_DIR)
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=chroma_path
    )

    print(f"Done! {len(chunks)} chunks stored in ChromaDB at {chroma_path}")
    return vectorstore

if __name__ == "__main__":
    ingest_documents()