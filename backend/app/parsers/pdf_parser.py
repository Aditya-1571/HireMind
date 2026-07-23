import fitz


def extract_pdf_text(content: bytes) -> str:
    with fitz.open(stream=content, filetype="pdf") as document:
        return "\n\n".join(
            page.get_text("text").strip()
            for page in document
            if page.get_text("text").strip()
        )
