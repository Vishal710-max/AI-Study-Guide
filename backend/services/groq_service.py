import os
import json
import re
from groq import Groq

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
TEXT_MODEL = os.getenv("GROQ_TEXT_MODEL") or "openai/gpt-oss-20b"
WHISPER_MODEL = os.getenv("GROQ_WHISPER_MODEL") or "whisper-large-v3"

_client = None


class GroqNotConfiguredError(Exception):
    pass


def get_client() -> Groq:
    global _client
    if not GROQ_API_KEY:
        raise GroqNotConfiguredError(
            "AI features require a Groq API key. Please add GROQ_API_KEY to your backend .env file."
        )
    if _client is None:
        _client = Groq(api_key=GROQ_API_KEY)
    return _client


def _strip_code_fences(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return text.strip()


def _chat_json(system_prompt: str, user_prompt: str, retry: bool = True) -> dict:
    """Call Groq chat completion and parse a JSON object from the response,
    retrying once with a stricter instruction if parsing fails."""
    client = get_client()
    resp = client.chat.completions.create(
        model=TEXT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.4,
        max_tokens=4000,
    )
    raw = resp.choices[0].message.content
    cleaned = _strip_code_fences(raw)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        if retry:
            client = get_client()
            resp2 = client.chat.completions.create(
                model=TEXT_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                    {"role": "assistant", "content": raw},
                    {
                        "role": "user",
                        "content": "That was not valid JSON. Respond again with ONLY a single valid JSON object/array. No prose, no markdown fences.",
                    },
                ],
                temperature=0.2,
                max_tokens=4000,
            )
            raw2 = _strip_code_fences(resp2.choices[0].message.content)
            return json.loads(raw2)
        raise


GROUNDING_RULE = (
    "Use ONLY the supplied study material as your source of facts. "
    "Do not invent facts, numbers, or claims that are not supported by the material. "
    "If the material does not contain enough information to answer confidently, "
    "say so honestly instead of fabricating."
)


def generate_mcqs(content: str, count: int = 10, topic: str = None, unit: str = None) -> list:
    focus = f" Focus specifically on: {topic or unit}." if (topic or unit) else ""
    system = (
        f"You are an expert exam question setter. {GROUNDING_RULE}\n"
        "Return ONLY a JSON array (no markdown, no prose). Each item must have exactly these keys: "
        '"question", "options" (array of exactly 4 strings), "correctAnswer" (must match one of the options verbatim), '
        '"explanation", "topic".'
    )
    user = (
        f"Study material:\n\"\"\"\n{content}\n\"\"\"\n\n"
        f"Generate {count} multiple choice questions from this material.{focus} "
        "If the material is insufficient for this many good questions, generate as many high-quality ones as you can."
    )
    result = _chat_json(system, user)
    return result if isinstance(result, list) else result.get("questions", [])


def generate_marked_questions(content: str, marks: int, count: int = 5, topic: str = None, unit: str = None) -> list:
    focus = f" Focus specifically on: {topic or unit}." if (topic or unit) else ""
    if marks == 2:
        shape = (
            'Each item needs: "question", "expectedAnswer" (short, exam-friendly), '
            '"keyPoints" (array of short strings), "topic".'
        )
        guidance = "These are short-answer questions worth 2 marks. Keep answers concise: essential concept + definition + one key point."
    elif marks == 4:
        shape = (
            'Each item needs: "question", "expectedAnswer", "keyPoints" (array), '
            '"example" (string, empty if not applicable), "topic".'
        )
        guidance = "These are 4-mark questions requiring explanation, multiple points, and comparison/example where appropriate."
    else:
        shape = (
            'Each item needs: "question", "detailedAnswer" (structured, exam-writing style), '
            '"keyPoints" (array), "example" (string), "topic".'
        )
        guidance = (
            "These are detailed 8-mark questions. The detailed answer should be structured "
            "(introduction, explanation, key points, example, conclusion) so the student can see how to write it in an exam."
        )
    system = (
        f"You are an expert university exam question setter. {GROUNDING_RULE}\n"
        f"{guidance}\n"
        f"Return ONLY a JSON array. {shape}"
    )
    user = (
        f"Study material:\n\"\"\"\n{content}\n\"\"\"\n\n"
        f"Generate {count} such questions from this material.{focus} "
        'Label these as practice questions, never claim they will definitely appear in the real exam '
        '(you may internally think of them as "Important Practice Question" style, but do not add exam-guarantee language).'
    )
    result = _chat_json(system, user)
    return result if isinstance(result, list) else result.get("questions", [])


def explain_topic(content: str, topic: str) -> dict:
    system = (
        f"You are a friendly, clear tutor. {GROUNDING_RULE}\n"
        'Return ONLY a JSON object with keys: "explanation" (simple, step-by-step, uses analogies where helpful), '
        '"keyPoints" (array of short strings), "example" (string, empty if not applicable).'
    )
    user = f"Study material:\n\"\"\"\n{content}\n\"\"\"\n\nExplain this topic simply: {topic}"
    return _chat_json(system, user)


def evaluate_answer(question: str, expected_answer: str, student_answer: str, marks: int = 4) -> dict:
    system = (
        "You are an exam answer evaluator. Evaluate the student's answer based on semantic/conceptual "
        "correctness, not exact wording. A conceptually correct answer phrased differently should score well.\n"
        f"This question is worth {marks} marks - calibrate strictness accordingly "
        f"({'focus on the essential concept/definition' if marks == 2 else 'expect explanation and key points' if marks == 4 else 'expect a well-structured, detailed answer covering multiple aspects'}).\n"
        "Consider: concept correctness, key points covered, missing information, incorrect information, "
        "relevance, completeness, clarity. Be encouraging and concise, never harsh.\n"
        'Return ONLY a JSON object with keys: "score" (number out of 10), "percentage" (0-100), '
        '"correctPoints" (array of strings), "missingPoints" (array of strings), "incorrectPoints" (array of strings), '
        '"improvementAdvice" (short, encouraging string), "betterVersion" (a short improved version of the answer).'
    )
    user = (
        f"Question:\n{question}\n\n"
        f"Expected Answer:\n{expected_answer}\n\n"
        f"Student Answer:\n{student_answer}\n\n"
        "Evaluate this answer now."
    )
    return _chat_json(system, user)


def generate_motivation(
    exam_name: str = None,
    days_remaining: int = None,
    today_progress_pct: int = None,
    is_tired: bool = False,
    skipped_sessions: int = 0,
    recent_performance: str = None,
    style: str = "friendly",
    situation: str = None,
) -> dict:
    system = (
        "You are 'Study Coach', a warm, funny, supportive AI study buddy for an Indian college student "
        "who is also working a job. You speak in natural Hindi/Hinglish (Devanagari + English mixed casually), "
        "short and punchy, with light humor and emojis - like a friendly senior, not a strict teacher, parent, "
        "or motivational speaker. You NEVER shame, threaten, guilt-trip, or say the student will fail. "
        "You break big tasks into small, doable next steps. Use humor sparingly and warmly, never mocking.\n"
        f"Motivation style requested: {style}.\n"
        'Return ONLY a JSON object with keys: "message" (the Hindi/Hinglish message, 1-3 short sentences), '
        '"suggestedNextStep" (a very small, concrete next action, e.g. "5 MCQ karo").'
    )
    context_bits = []
    if exam_name and days_remaining is not None:
        context_bits.append(f"Next exam: {exam_name} in {days_remaining} days.")
    if today_progress_pct is not None:
        context_bits.append(f"Today's study goal is {today_progress_pct}% complete.")
    if is_tired:
        context_bits.append("The student mentioned feeling tired (e.g. after work).")
    if skipped_sessions:
        context_bits.append(f"The student has skipped {skipped_sessions} recent study session(s).")
    if recent_performance:
        context_bits.append(f"Recent quiz performance was: {recent_performance}.")
    if situation:
        context_bits.append(f"Situation: {situation}.")
    user = "Context:\n" + ("\n".join(context_bits) if context_bits else "No specific context - just say hi and nudge gently.")
    return _chat_json(system, user)


def generate_study_plan(available_minutes: int, weak_topics: list = None, days_remaining: int = None) -> dict:
    system = (
        "You are a realistic, kind study planner for a working student. Never suggest unrealistic schedules. "
        "Break the available time into small blocks (MCQs, short-answer questions, revision). "
        'Return ONLY a JSON object with keys: "title" (e.g. "20-Minute Sprint"), '
        '"blocks" (array of {"label": string, "minutes": number, "type": "mcq"|"2mark"|"4mark"|"8mark"|"revision"}), '
        '"note" (one short encouraging sentence).'
    )
    context = f"Available time: {available_minutes} minutes."
    if weak_topics:
        context += f" Weak topics to prioritize: {', '.join(weak_topics)}."
    if days_remaining is not None:
        context += f" Days until next exam: {days_remaining}."
    return _chat_json(system, context)


COMMAND_TYPES = [
    "generate_mcqs", "generate_2mark", "generate_4mark", "generate_8mark",
    "explain_topic", "study_plan", "unclear",
]


def classify_command(command: str) -> dict:
    """Classify a free-text AI command box entry into a structured action."""
    system = (
        "You route a study app's command box to the right backend action.\n"
        f"Valid action values: {COMMAND_TYPES}.\n"
        'Return ONLY a JSON object: {"action": one of the values above, "count": number or null, '
        '"topic": string or null, "unit": string or null}. '
        'Infer count from phrases like "20 MCQs" (default 10 for MCQs, 5 for marked questions if unspecified).'
    )
    result = _chat_json(system, f"Command: {command}")
    return result


def transcribe_audio(file_bytes: bytes, filename: str = "audio.webm") -> str:
    client = get_client()
    transcription = client.audio.transcriptions.create(
        file=(filename, file_bytes),
        model=WHISPER_MODEL,
        response_format="text",
    )
    return str(transcription).strip()
