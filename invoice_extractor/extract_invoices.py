import os
from pathlib import Path
import pandas as pd
from invoice_extractor.lib import extract_from_pdf_bytes, load_env_file

# =====================================================
# CONFIG
# =====================================================
PROJECT_ROOT = Path(__file__).resolve().parent
PDF_PATH = str(PROJECT_ROOT / "Adjustment Invoices.pdf")
OUTPUT_EXCEL = str(PROJECT_ROOT / "invoice_output2.xlsx")
DPI = 300
MODEL_NAME = "gemini-2.5-flash"  # supported multimodal model


load_env_file(PROJECT_ROOT / ".env")
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise RuntimeError(
        "Missing GEMINI_API_KEY. Add it to .env in this folder:\n"
        "GEMINI_API_KEY=your_key_here"
    )

def extract_invoices_from_pdf():
    pdf_bytes = Path(PDF_PATH).read_bytes()
    pages = extract_from_pdf_bytes(pdf_bytes, api_key=API_KEY, model_name=MODEL_NAME, dpi=DPI)
    results = []
    for p in pages:
        record = dict(p.data)
        record["Page_No"] = p.page_no
        record["Needs_Rescan"] = p.needs_rescan
        record["Unreadable_Fields"] = ", ".join(p.unreadable_fields)
        results.append(record)
    return results


def main():
    data = extract_invoices_from_pdf()

    if not data:
        print("No invoices extracted")
        return

    df = pd.DataFrame(data)
    df.to_excel(OUTPUT_EXCEL, index=False)

    print(f"Saved {len(data)} invoices to {OUTPUT_EXCEL}")


if __name__ == "__main__":
    main()

