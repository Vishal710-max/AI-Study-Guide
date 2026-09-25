import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routes import pdf, ai, speech

app = FastAPI(title="AI Exam Study Companion API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ai-study-guide-seven.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pdf.router)
app.include_router(ai.router)
app.include_router(speech.router)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "groqConfigured": bool(os.getenv("GROQ_API_KEY")),
    }


@app.exception_handler(Exception)
async def generic_exception_handler(request, exc):
    # Never leak raw stack traces to the client.
    return JSONResponse(status_code=500, content={"detail": "Something went wrong. Please try again."})
