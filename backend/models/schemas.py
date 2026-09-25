from pydantic import BaseModel, Field
from typing import Optional, List, Literal


class MCQRequest(BaseModel):
    content: str = Field(..., description="Study material text/chunk to generate from")
    count: int = 10
    topic: Optional[str] = None
    unit: Optional[str] = None


class MarkedQuestionRequest(BaseModel):
    content: str
    marks: Literal[2, 4, 8]
    count: int = 5
    topic: Optional[str] = None
    unit: Optional[str] = None


class ExplainRequest(BaseModel):
    content: str
    topic: str


class EvaluateAnswerRequest(BaseModel):
    question: str
    expected_answer: str
    student_answer: str
    marks: Literal[2, 4, 8] = 4


class MotivateRequest(BaseModel):
    exam_name: Optional[str] = None
    days_remaining: Optional[int] = None
    today_progress_pct: Optional[int] = None
    is_tired: Optional[bool] = False
    skipped_sessions: Optional[int] = 0
    recent_performance: Optional[str] = None  # "good" | "poor" | None
    style: Optional[Literal["friendly", "funny", "minimal"]] = "friendly"
    situation: Optional[str] = None  # free text hint, e.g. "user hasn't started"


class StudyPlanRequest(BaseModel):
    available_minutes: int
    weak_topics: Optional[List[str]] = None
    days_remaining: Optional[int] = None


class CommandRequest(BaseModel):
    """For the free-text AI command box - backend classifies + routes."""
    command: str
    content: Optional[str] = ""
