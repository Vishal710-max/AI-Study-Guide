const STORAGE_KEY = 'ai-exam-companion-data-v1'

const DEFAULT_DATA = {
  subjects: [],       // { id, name, examId, pdfText, chunks, progressPct, weakTopics: [], strongTopics: [] }
  exams: [],           // { id, subjectId, name, date, time, priority }
  questions: [],        // { id, subjectId, type: 'mcq'|'2mark'|'4mark'|'8mark', payload, topic }
  attempts: [],          // { id, questionId, isCorrect, score, percentage, marks, createdAt }
  progress: {
    questionsAttempted: 0,
    correctAnswers: 0,
    studySessions: 0,
    studyStreak: 0,
    lastStudyDate: null,
  },
  studySessions: [],       // { id, date, minutes, completedBlocks }
  settings: {
    dailyStudyTargetMinutes: 20,
    preferredStudyDuration: 20,
    playbackSpeed: 1,
    notificationFrequency: 'normal',
    darkMode: false,
    motivationStyle: 'friendly',
    workStart: '',
    workEnd: '',
    preferredStudyTime: '',
  },
  resources: [],       // { id, title, url, description, category, subjectId, favorite, createdAt, lastOpenedAt }
}

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function getData() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    saveData(DEFAULT_DATA)
    return structuredClone(DEFAULT_DATA)
  }
  const parsed = safeParse(raw)
  if (!parsed) {
    saveData(DEFAULT_DATA)
    return structuredClone(DEFAULT_DATA)
  }
  // merge with defaults so new fields introduced later don't break old data
  return {
    ...structuredClone(DEFAULT_DATA),
    ...parsed,
    settings: { ...DEFAULT_DATA.settings, ...parsed.settings },
    progress: { ...DEFAULT_DATA.progress, ...parsed.progress },
    resources: Array.isArray(parsed.resources) ? parsed.resources : [],
  }
}

export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function updateData(mutator) {
  const data = getData()
  const updated = mutator(data) || data
  saveData(updated)
  return updated
}

export function removeData(key) {
  const data = getData()
  delete data[key]
  saveData(data)
}

export function clearData() {
  localStorage.removeItem(STORAGE_KEY)
}

export function newId() {
  return (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`)
}

// ---- convenience helpers built on top of the raw store ----

export function addSubject(subject) {
  return updateData((d) => {
    d.subjects.push({ id: newId(), progressPct: 0, weakTopics: [], strongTopics: [], pdfText: '', chunks: [], ...subject })
    return d
  })
}

export function updateSubject(id, patch) {
  return updateData((d) => {
    d.subjects = d.subjects.map((s) => (s.id === id ? { ...s, ...patch } : s))
    return d
  })
}

export function deleteSubject(id) {
  return updateData((d) => {
    d.subjects = d.subjects.filter((s) => s.id !== id)
    d.exams = d.exams.filter((e) => e.subjectId !== id)
    d.questions = d.questions.filter((q) => q.subjectId !== id)
    d.resources = d.resources.map((resource) =>
      resource.subjectId === id ? { ...resource, subjectId: null } : resource
    )
    return d
  })
}

export function addResource(resource) {
  return updateData((d) => {
    d.resources.push({
      id: newId(),
      favorite: false,
      createdAt: new Date().toISOString(),
      lastOpenedAt: null,
      ...resource,
    })
    return d
  })
}

export function updateResource(id, patch) {
  return updateData((d) => {
    d.resources = d.resources.map((resource) =>
      resource.id === id ? { ...resource, ...patch } : resource
    )
    return d
  })
}

export function deleteResource(id) {
  return updateData((d) => {
    d.resources = d.resources.filter((resource) => resource.id !== id)
    return d
  })
}

export function addExam(exam) {
  return updateData((d) => {
    d.exams.push({ id: newId(), priority: 'normal', ...exam })
    return d
  })
}

export function updateExam(id, patch) {
  return updateData((d) => {
    d.exams = d.exams.map((e) => (e.id === id ? { ...e, ...patch } : e))
    return d
  })
}

export function deleteExam(id) {
  return updateData((d) => {
    d.exams = d.exams.filter((e) => e.id !== id)
    return d
  })
}

export function addQuestions(subjectId, type, items, topic = null) {
  return updateData((d) => {
    const newQs = items.map((payload) => ({
      id: newId(),
      subjectId,
      type,
      topic: topic || payload.topic || null,
      payload,
      attempted: false,
      lastResult: null,
    }))
    d.questions.push(...newQs)
    return d
  })
}

export function recordAttempt(questionId, result) {
  return updateData((d) => {
    d.attempts.push({ id: newId(), questionId, createdAt: new Date().toISOString(), ...result })
    d.questions = d.questions.map((q) =>
      q.id === questionId ? { ...q, attempted: true, lastResult: result } : q
    )
    d.progress.questionsAttempted += 1
    if (result.isCorrect) d.progress.correctAnswers += 1
    return d
  })
}

export function recordStudySession(minutes, completedBlocks = []) {
  return updateData((d) => {
    const today = new Date().toDateString()
    d.studySessions.push({ id: newId(), date: today, minutes, completedBlocks })
    d.progress.studySessions += 1
    if (d.progress.lastStudyDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      d.progress.studyStreak = d.progress.lastStudyDate === yesterday ? d.progress.studyStreak + 1 : 1
      d.progress.lastStudyDate = today
    }
    return d
  })
}

export function updateSettings(patch) {
  return updateData((d) => {
    d.settings = { ...d.settings, ...patch }
    return d
  })
}

export function daysRemaining(dateStr) {
  if (!dateStr) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target - now) / 86400000)
}

export function getNextExam(data) {
  const upcoming = data.exams
    .map((e) => ({ ...e, days: daysRemaining(e.date) }))
    .filter((e) => e.days !== null && e.days >= 0)
    .sort((a, b) => a.days - b.days)
  return upcoming[0] || null
}
