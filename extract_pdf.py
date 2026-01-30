
import os
from pypdf import PdfReader

def extract_text(pdf_path):
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        return f"Error reading {pdf_path}: {e}"


files = ['desc.pdf', 'inst.pdf']
with open('pdf_content.txt', 'w', encoding='utf-8') as outfile:
    for f in files:
        outfile.write(f"========== START OF {f} ==========\n")
        path = os.path.join(os.getcwd(), f)
        if os.path.exists(path):
            outfile.write(extract_text(path))
        else:
            outfile.write(f"File not found: {path}\n")
        outfile.write(f"\n========== END OF {f} ==========\n")
