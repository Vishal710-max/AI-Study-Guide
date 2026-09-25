from fastapi import APIRouter, UploadFile, File, HTTPException

from services.pdf_service import extract_text_from_pdf, chunk_text, PDFExtractionError

router = APIRouter(prefix="/api/pdf", tags=["pdf"])

MAX_FILE_SIZE_MB = 25


@router.post("/extract")
async def extract_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    file_bytes = await file.read()
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(status_code=400, detail=f"File too large. Max size is {MAX_FILE_SIZE_MB}MB.")

    try:
        result = extract_text_from_pdf(file_bytes)
    except PDFExtractionError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result["text"].strip():
        raise HTTPException(
            status_code=422,
            detail="This PDF appears to contain scanned pages. Text extraction may not work correctly.",
        )

    chunks = chunk_text(result["text"])

    return {
        "filename": file.filename,
        "pageCount": result["page_count"],
        "looksScanned": result["looks_scanned"],
        "text": result["text"],
        "chunks": chunks,
        "chunkCount": len(chunks),
    }
