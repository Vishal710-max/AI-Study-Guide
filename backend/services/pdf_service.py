import fitz  # PyMuPDF
import re
from typing import List, Dict


class PDFExtractionError(Exception):
    pass


def extract_text_from_pdf(file_bytes: bytes) -> Dict:
    """Extract and clean text from a PDF, returning text, page count, and a
    heuristic guess of whether the PDF is scanned/image-based."""
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
    except Exception as e:
        raise PDFExtractionError("Unable to read this PDF. Please upload another file.") from e

    if doc.page_count == 0:
        raise PDFExtractionError("This PDF has no pages.")

    pages_text: List[str] = []
    total_chars = 0
    for page in doc:
        text = page.get_text("text")
        pages_text.append(text)
        total_chars += len(text.strip())

    doc.close()

    avg_chars_per_page = total_chars / max(1, len(pages_text))
    looks_scanned = avg_chars_per_page < 20  # heuristic: almost no extractable text

    full_text = "\n\n".join(pages_text)
    cleaned = clean_text(full_text)

    return {
        "text": cleaned,
        "page_count": len(pages_text),
        "looks_scanned": looks_scanned,
        "pages": [clean_text(p) for p in pages_text],
    }


def clean_text(text: str) -> str:
    if not text:
        return ""
    # collapse excessive whitespace, drop common PDF artifacts
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"\x0c", "", text)  # form feed
    return text.strip()


def chunk_text(text: str, max_chars: int = 6000) -> List[str]:
    """Split text into chunks small enough to safely send to the LLM,
    breaking on paragraph boundaries where possible."""
    if len(text) <= max_chars:
        return [text] if text else []

    paragraphs = text.split("\n\n")
    chunks: List[str] = []
    current = ""
    for para in paragraphs:
        if len(current) + len(para) + 2 <= max_chars:
            current = f"{current}\n\n{para}" if current else para
        else:
            if current:
                chunks.append(current)
            if len(para) > max_chars:
                # paragraph itself too long, hard split
                for i in range(0, len(para), max_chars):
                    chunks.append(para[i : i + max_chars])
                current = ""
            else:
                current = para
    if current:
        chunks.append(current)
    return chunks


def select_relevant_chunks(chunks: List[str], unit_or_topic: str = None, max_chunks: int = 3) -> str:
    """Very lightweight relevance selection: if a unit/topic hint is given,
    prefer chunks that mention it; otherwise take the first N chunks.
    This intentionally avoids building a vector DB, per the MVP spec."""
    if not chunks:
        return ""
    if unit_or_topic:
        needle = unit_or_topic.lower()
        matched = [c for c in chunks if needle in c.lower()]
        if matched:
            return "\n\n".join(matched[:max_chunks])
    return "\n\n".join(chunks[:max_chunks])
