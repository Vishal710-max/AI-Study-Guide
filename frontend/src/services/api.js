import axios from 'axios'

export const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: BACKEND_URL, timeout: 60000 })

function friendlyError(err, fallback) {
  const detail = err?.response?.data?.detail
  const message = typeof detail === 'string' ? detail : fallback
  const e = new Error(message)
  e.status = err?.response?.status
  throw e
}

export async function checkHealth() {
  try {
    const { data } = await api.get('/api/health')
    return data
  } catch {
    return { status: 'down', groqConfigured: false }
  }
}

export async function extractPdf(file) {
  const form = new FormData()
  form.append('file', file)
  try {
    const { data } = await api.post('/api/pdf/extract', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  } catch (err) {
    friendlyError(err, "I couldn't read this PDF properly. Try another PDF or a text-based version.")
  }
}

export async function generateMcqs({ content, count = 10, topic, unit }) {
  try {
    const { data } = await api.post('/api/ai/generate-mcqs', { content, count, topic, unit })
    return data.questions
  } catch (err) {
    friendlyError(err, 'Something went wrong while generating questions. Please try again.')
  }
}

export async function generateMarkedQuestions({ content, marks, count = 5, topic, unit }) {
  try {
    const { data } = await api.post('/api/ai/generate-questions', { content, marks, count, topic, unit })
    return data.questions
  } catch (err) {
    friendlyError(err, 'Something went wrong while generating questions. Please try again.')
  }
}

export async function explainTopic({ content, topic }) {
  try {
    const { data } = await api.post('/api/ai/explain', { content, topic })
    return data
  } catch (err) {
    friendlyError(err, 'Something went wrong while explaining this. Please try again.')
  }
}

export async function evaluateAnswer({ question, expectedAnswer, studentAnswer, marks = 4 }) {
  try {
    const { data } = await api.post('/api/ai/evaluate-answer', {
      question, expected_answer: expectedAnswer, student_answer: studentAnswer, marks,
    })
    return data
  } catch (err) {
    friendlyError(err, 'Something went wrong while evaluating your answer. Please try again.')
  }
}

export async function getMotivation(payload) {
  try {
    const { data } = await api.post('/api/ai/motivate', {
      exam_name: payload.examName,
      days_remaining: payload.daysRemaining,
      today_progress_pct: payload.todayProgressPct,
      is_tired: payload.isTired,
      skipped_sessions: payload.skippedSessions,
      recent_performance: payload.recentPerformance,
      style: payload.style,
      situation: payload.situation,
    })
    return data
  } catch {
    return { message: 'चलो थोड़ा पढ़ते हैं 😊', suggestedNextStep: '5 MCQ karo' }
  }
}

export async function getStudyPlan({ availableMinutes, weakTopics, daysRemaining }) {
  try {
    const { data } = await api.post('/api/ai/study-plan', {
      available_minutes: availableMinutes, weak_topics: weakTopics, days_remaining: daysRemaining,
    })
    return data
  } catch (err) {
    friendlyError(err, 'Could not build a study plan right now.')
  }
}

export async function classifyCommand(command) {
  try {
    const { data } = await api.post('/api/ai/command', { command })
    return data
  } catch (err) {
    friendlyError(err, 'Could not understand that command. Please try rephrasing.')
  }
}

export async function transcribeAudio(blob) {
  const form = new FormData()
  form.append('file', blob, 'answer.webm')
  try {
    const { data } = await api.post('/api/speech/transcribe', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.text
  } catch (err) {
    friendlyError(err, 'Speech recognition failed. Please try again or type your answer.')
  }
}
