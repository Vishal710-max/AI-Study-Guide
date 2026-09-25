# AI Exam Study Companion (Local MVP)

A local-first study buddy: upload a PDF of your notes, and generate MCQs,
2/4/8-mark questions, get AI evaluation of your written or spoken answers,
listen to answers via text-to-speech, run timed study sessions, and get
Hindi/Hinglish motivational nudges from your "AI Study Coach".

Everything (subjects, exams, questions, progress) is stored in your browser's
`localStorage` — there's no database, no login, no cloud sync.

## Stack

- **Frontend:** React + Vite + Tailwind CSS + Lucide icons + Framer Motion
- **Backend:** FastAPI + PyMuPDF (PDF text extraction) + Groq API (all AI features)
- **Voice:** Browser `SpeechRecognition` (input) + `speechSynthesis` (output),
  with a FastAPI + Groq Whisper fallback for browsers without native speech recognition

## 1. Get a Groq API key

This app uses [Groq](https://console.groq.com/keys) (free tier available) for all
AI features — MCQ/question generation, answer evaluation, explanations, motivation,
and the Whisper speech-to-text fallback.

## 2. Backend setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate       # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# now edit .env and paste your GROQ_API_KEY
uvicorn main:app --reload --port 8000
```

The backend runs at `http://localhost:8000`. Visit `http://localhost:8000/api/health`
to confirm it's up (it also tells you if the Groq key is configured).

## 3. Frontend setup

In a separate terminal:

```bash
cd frontend
npm install
cp .env.example .env   # only needed if your backend runs somewhere other than :8000
npm run dev
```

Open `http://localhost:5173`.

## 4. Using it

1. On the **Dashboard**, click **Add Subject**, give it a name and exam date.
2. You'll land on the **Study** page — upload a PDF of your notes for that subject.
3. Pick a session length (10/20/30 min) and hit **Start Study** — the app builds a
   small mixed session (MCQs, short-answer questions, revision) from your material.
4. Or go to **Questions** to generate MCQs / 2-mark / 4-mark / 8-mark questions on
   demand, browse your growing question bank, and filter by type or attempted status.
5. Use the **AI command box** on the dashboard (text or 🎙 voice) to say things like
   *"Create 20 MCQs from this PDF"* or *"Explain this topic simply"*.
6. Go to **Voice Practice** to answer 2/4/8-mark questions out loud — your speech
   is transcribed, then evaluated by AI for conceptual correctness (not exact wording).
7. Check **Progress** for accuracy, streaks, and weak/strong topics.
8. **Settings** lets you tune study duration, playback speed, motivation style, and
   working-student hours, plus a "Clear All Local Data" reset.

## What's intentionally left out (per the MVP brief)

No authentication, no database, no vector DB/RAG framework, no cloud storage. PDF
content is chunked and the most relevant chunk(s) are sent to Groq per request —
large PDFs are never sent in a single request. If a PDF looks scanned/image-based,
the app warns you (OCR is out of scope for this MVP).

## Project structure

```
ai-exam-companion/
├── frontend/          React + Vite + Tailwind app
│   └── src/
│       ├── components/   Reusable UI (cards, PDF upload, voice button, audio player...)
│       ├── pages/         Dashboard, Study, Questions, VoicePractice, Progress, Settings
│       ├── services/      storage.js (localStorage), api.js (backend calls)
│       └── utils/          date helpers, useSpeech hook (TTS + STT)
└── backend/            FastAPI app
    ├── main.py
    ├── routes/          pdf.py, ai.py, speech.py
    ├── services/         pdf_service.py (PyMuPDF), groq_service.py (all AI prompts)
    └── models/           schemas.py (Pydantic request models)
```

## Notes / known limitations of this first pass

- The "study plan" block sizing uses realistic minutes-per-question estimates
  (MCQ ≈1 min, 2-mark ≈2.5 min, 4-mark ≈5 min, 8-mark ≈9 min) capped per block —
  Groq may still occasionally return slightly more/fewer items than requested.
- Dark mode toggle in Settings is now wired end-to-end (checking it in Settings
  immediately switches the whole app's theme via Tailwind's `dark:` classes).
- Voice input uses Chrome/Edge's built-in `SpeechRecognition` where available;
  other browsers automatically fall back to recording + Whisper transcription.
- Scanned/image-based PDFs are detected heuristically and flagged with a warning;
  OCR itself is intentionally out of scope for this MVP.
- No automated tests included — this is an MVP scaffold meant to be iterated on.
