from fastapi import APIRouter, HTTPException

from models.schemas import (
    MCQRequest, MarkedQuestionRequest, ExplainRequest,
    EvaluateAnswerRequest, MotivateRequest, StudyPlanRequest, CommandRequest,
)
from services import groq_service as ai
from services.groq_service import GroqNotConfiguredError

router = APIRouter(prefix="/api/ai", tags=["ai"])


def _handle(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except GroqNotConfiguredError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Something went wrong while talking to the AI. Please try again. ({e})")


@router.post("/generate-mcqs")
def generate_mcqs(req: MCQRequest):
    questions = _handle(ai.generate_mcqs, req.content, req.count, req.topic, req.unit)
    return {"questions": questions}


@router.post("/generate-questions")
def generate_questions(req: MarkedQuestionRequest):
    questions = _handle(ai.generate_marked_questions, req.content, req.marks, req.count, req.topic, req.unit)
    return {"questions": questions}


@router.post("/explain")
def explain(req: ExplainRequest):
    return _handle(ai.explain_topic, req.content, req.topic)


@router.post("/evaluate-answer")
def evaluate_answer(req: EvaluateAnswerRequest):
    return _handle(ai.evaluate_answer, req.question, req.expected_answer, req.student_answer, req.marks)


@router.post("/motivate")
def motivate(req: MotivateRequest):
    return _handle(
        ai.generate_motivation,
        req.exam_name, req.days_remaining, req.today_progress_pct,
        req.is_tired, req.skipped_sessions, req.recent_performance, req.style, req.situation,
    )


@router.post("/study-plan")
def study_plan(req: StudyPlanRequest):
    return _handle(ai.generate_study_plan, req.available_minutes, req.weak_topics, req.days_remaining)


@router.post("/command")
def command(req: CommandRequest):
    """Classifies a free-text command from the AI command box and returns the
    routed action; the frontend then calls the specific endpoint."""
    return _handle(ai.classify_command, req.command)
