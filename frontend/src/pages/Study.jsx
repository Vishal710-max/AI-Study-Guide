import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Timer, PlayCircle, ExternalLink } from 'lucide-react'

import PDFUpload from '../components/PDFUpload'
import MCQCard from '../components/MCQCard'
import MarkedQuestionCard from '../components/MarkedQuestionCard'

import { getData, updateSubject, addQuestions, recordAttempt, recordStudySession, daysRemaining, updateResource } from '../services/storage'
import { generateMcqs, generateMarkedQuestions, getStudyPlan } from '../services/api'

const DURATIONS = [10, 20, 30]

// Rough minutes-per-question, based on reading + answering + reviewing feedback.
// Used to size each study-session block realistically rather than guessing.
const MINUTES_PER_ITEM = { mcq: 1, '2mark': 2.5, '4mark': 5, '8mark': 9 }
const MAX_ITEMS_PER_BLOCK = { mcq: 15, '2mark': 6, '4mark': 4, '8mark': 3 }

function estimateBlockCount(block) {
  const perItem = MINUTES_PER_ITEM[block.type] || 2
  const cap = MAX_ITEMS_PER_BLOCK[block.type] || 6
  const estimate = Math.round(block.minutes / perItem)
  return Math.min(cap, Math.max(1, estimate))
}

export default function Study() {
  const location = useLocation()
  const navigate = useNavigate()
  const [data, setData] = useState(getData())
  const [selectedSubjectId, setSelectedSubjectId] = useState(location.state?.subjectId || data.subjects[0]?.id || null)

  const [duration, setDuration] = useState(20)
  const [plan, setPlan] = useState(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [blockIndex, setBlockIndex] = useState(-1) // -1 = not started
  const [blockQuestions, setBlockQuestions] = useState([])
  const [blockLoading, setBlockLoading] = useState(false)
  const [completedInBlock, setCompletedInBlock] = useState(0)

  const subject = data.subjects.find((s) => s.id === selectedSubjectId)
  const exam = data.exams.find((e) => e.subjectId === selectedSubjectId)
  const subjectResources = (data.resources || []).filter((resource) => resource.subjectId === selectedSubjectId).slice(0, 3)

  useEffect(() => {
    if (!selectedSubjectId && data.subjects.length > 0) setSelectedSubjectId(data.subjects[0].id)
  }, [data.subjects, selectedSubjectId])

  function handlePdfExtracted(result) {
    if (!selectedSubjectId) return
    const updated = updateSubject(selectedSubjectId, { pdfText: result.text, chunks: result.chunks })
    setData(updated)
  }

  async function startSession() {
    if (!subject?.pdfText) {
      toast.error('Upload a PDF for this subject first.')
      return
    }
    setPlanLoading(true)
    try {
      const weak = subject.weakTopics || []
      const days = exam ? daysRemaining(exam.date) : null
      const res = await getStudyPlan({ availableMinutes: duration, weakTopics: weak, daysRemaining: days })
      setPlan(res)
      setBlockIndex(0)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPlanLoading(false)
    }
  }

  useEffect(() => {
    if (plan && blockIndex >= 0 && blockIndex < plan.blocks.length) {
      loadBlockQuestions(plan.blocks[blockIndex])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockIndex, plan])

  async function loadBlockQuestions(block) {
    if (block.type === 'revision') {
      setBlockQuestions([])
      return
    }
    setBlockLoading(true)
    setCompletedInBlock(0)
    try {
      const content = subject.chunks?.[0] || subject.pdfText
      let questions = []
      const countGuess = estimateBlockCount(block)
      if (block.type === 'mcq') {
        questions = await generateMcqs({ content, count: countGuess })
      } else {
        const marks = block.type === '2mark' ? 2 : block.type === '4mark' ? 4 : 8
        questions = await generateMarkedQuestions({ content, marks, count: countGuess })
      }
      const type = block.type === 'mcq' ? 'mcq' : block.type
      const updated = addQuestions(selectedSubjectId, type, questions)
      const newlyAdded = updated.questions.slice(-questions.length)
      setBlockQuestions(newlyAdded)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBlockLoading(false)
    }
  }

  function handleAnswered(questionId, result) {
    recordAttempt(questionId, result)
    setCompletedInBlock((c) => c + 1)
  }

  function handleOpenResource(resource) {
    if (!resource?.url) return
    updateResource(resource.id, { lastOpenedAt: new Date().toISOString() })
    setData(getData())
    window.open(resource.url, '_blank', 'noopener,noreferrer')
  }

  function nextBlock() {
    if (blockIndex < plan.blocks.length - 1) {
      setBlockIndex(blockIndex + 1)
    } else {
      recordStudySession(duration, plan.blocks.map((b) => b.label))
      setData(getData())
      toast.success('🎉 Study session complete! Great work today.')
      setPlan(null)
      setBlockIndex(-1)
    }
  }

  if (data.subjects.length === 0) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center text-slate-400">
        Add a subject from the Dashboard first to start studying.
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-24 space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Study</h1>

      <div className="flex flex-wrap gap-2">
        {data.subjects.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSelectedSubjectId(s.id); setPlan(null); setBlockIndex(-1) }}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium ${
              s.id === selectedSubjectId ? 'bg-brand-500 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {subject && !subject.pdfText && (
        <div className="card">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Upload study material for {subject.name}</p>
          <PDFUpload onExtracted={handlePdfExtracted} />
        </div>
      )}

      {subjectResources.length > 0 && (
        <div className="card">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Useful Resources</p>
            <button type="button" onClick={() => navigate('/resources')} className="text-xs text-brand-600 hover:text-brand-700">View All</button>
          </div>
          <div className="space-y-2">
            {subjectResources.map((resource) => (
              <button
                key={resource.id}
                type="button"
                onClick={() => handleOpenResource(resource)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{resource.category === 'YouTube' ? '▶️' : resource.category === 'AI Tools' ? '🤖' : resource.category === 'NotebookLM' ? '📓' : '🔗'}</span>
                  <span className="font-medium">{resource.title}</span>
                </span>
                <ExternalLink size={14} className="text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {subject?.pdfText && blockIndex === -1 && (
        <div className="card">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-3">
            <Timer size={14} /> CHOOSE SESSION LENGTH
          </div>
          <div className="flex gap-2 mb-4">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`px-4 py-2 rounded-xl text-sm font-medium ${
                  d === duration ? 'bg-brand-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {d} min
              </button>
            ))}
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={startSession} disabled={planLoading}>
            <PlayCircle size={18} /> {planLoading ? 'Preparing session...' : 'Start Study'}
          </button>
        </div>
      )}

      {plan && blockIndex >= 0 && (
        <div className="space-y-4">
          <div className="card bg-brand-50 border-brand-100">
            <p className="text-sm font-medium text-brand-700">{plan.blocks[blockIndex].label}</p>
            <p className="text-xs text-brand-500">Block {blockIndex + 1} of {plan.blocks.length} · {plan.blocks[blockIndex].minutes} min</p>
          </div>

          {blockLoading && <div className="card text-center text-sm text-slate-400 py-8">Generating your questions...</div>}

          {!blockLoading && plan.blocks[blockIndex].type === 'revision' && (
            <div className="card text-sm text-slate-600 dark:text-slate-300">
              Quick revision time — skim through the key points you've covered so far. 🔁
            </div>
          )}

          {!blockLoading && blockQuestions.map((q) =>
            q.type === 'mcq' ? (
              <MCQCard key={q.id} question={q} onAnswered={(r) => handleAnswered(q.id, r)} />
            ) : (
              <MarkedQuestionCard key={q.id} question={q} marks={q.type === '2mark' ? 2 : q.type === '4mark' ? 4 : 8} onAnswered={(r) => handleAnswered(q.id, r)} />
            )
          )}

          {!blockLoading && (
            <button className="btn-primary w-full" onClick={nextBlock}>
              {blockIndex < plan.blocks.length - 1 ? 'Next Block →' : 'Finish Session 🎉'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
