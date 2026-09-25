import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'

import MCQCard from '../components/MCQCard'
import MarkedQuestionCard from '../components/MarkedQuestionCard'
import { getData, addQuestions, recordAttempt } from '../services/storage'
import { generateMcqs, generateMarkedQuestions, explainTopic } from '../services/api'

const TYPE_LABELS = { mcq: 'MCQ', '2mark': '2 Mark', '4mark': '4 Mark', '8mark': '8 Mark' }

export default function Questions() {
  const [params] = useSearchParams()
  const [data, setData] = useState(getData())
  const [subjectId, setSubjectId] = useState(params.get('subjectId') || data.subjects[0]?.id || '')
  const [type, setType] = useState('mcq')
  const [count, setCount] = useState(10)
  const [topic, setTopic] = useState('')
  const [generating, setGenerating] = useState(false)
  const [explanation, setExplanation] = useState(null)

  const [filterType, setFilterType] = useState('all')
  const [filterAttempted, setFilterAttempted] = useState('all')
  const [search, setSearch] = useState('')

  const subject = data.subjects.find((s) => s.id === subjectId)

  // Auto-route from Dashboard's AI command box
  useEffect(() => {
    const action = params.get('action')
    if (!action || action === 'unclear') return
    const map = { generate_mcqs: 'mcq', generate_2mark: '2mark', generate_4mark: '4mark', generate_8mark: '8mark' }
    if (map[action]) {
      setType(map[action])
      if (params.get('count')) setCount(Number(params.get('count')))
      if (params.get('topic')) setTopic(params.get('topic'))
    }
    if (action === 'explain_topic' && params.get('topic')) {
      runExplain(params.get('topic'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function runExplain(t) {
    if (!subject?.pdfText) return toast.error('Upload a PDF for this subject first.')
    try {
      const res = await explainTopic({ content: subject.chunks?.[0] || subject.pdfText, topic: t })
      setExplanation({ topic: t, ...res })
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleGenerate() {
    if (!subject?.pdfText) {
      toast.error('Upload a PDF for this subject on the Study page first.')
      return
    }
    setGenerating(true)
    try {
      const content = subject.chunks?.[0] || subject.pdfText
      let items
      if (type === 'mcq') {
        items = await generateMcqs({ content, count, topic: topic || undefined })
      } else {
        const marks = type === '2mark' ? 2 : type === '4mark' ? 4 : 8
        items = await generateMarkedQuestions({ content, marks, count, topic: topic || undefined })
      }
      const updated = addQuestions(subjectId, type, items, topic || null)
      setData(updated)
      toast.success(`${items.length} questions generated.`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const filteredQuestions = useMemo(() => {
    return data.questions
      .filter((q) => q.subjectId === subjectId)
      .filter((q) => filterType === 'all' || q.type === filterType)
      .filter((q) => filterAttempted === 'all' || (filterAttempted === 'attempted' ? q.attempted : !q.attempted))
      .filter((q) => !search || (q.payload.question || '').toLowerCase().includes(search.toLowerCase()))
      .reverse()
  }, [data.questions, subjectId, filterType, filterAttempted, search])

  if (data.subjects.length === 0) {
    return <div className="max-w-3xl mx-auto p-8 text-center text-slate-400">Add a subject from the Dashboard first.</div>
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-24 space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Questions</h1>

      <div className="card space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400"><Sparkles size={14} /> GENERATE QUESTIONS</div>
        <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          {data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="mcq">MCQs</option>
            <option value="2mark">2-Mark</option>
            <option value="4mark">4-Mark</option>
            <option value="8mark">8-Mark</option>
          </select>
          <select className="input" value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {(type === 'mcq' ? [5, 10, 20, 30] : [3, 5, 8, 10]).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <input className="input" placeholder="Optional: topic or unit (e.g. Unit 2)" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <button className="btn-primary w-full" onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generating...' : `Generate ${count} ${TYPE_LABELS[type]} Questions`}
        </button>
      </div>

      {explanation && (
        <div className="card">
          <p className="text-[11px] uppercase tracking-wide text-brand-500 font-semibold mb-1">{explanation.topic}</p>
          <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">{explanation.explanation}</p>
          {explanation.keyPoints?.length > 0 && (
            <ul className="list-disc list-inside text-sm text-slate-600 dark:text-slate-300 mt-2 space-y-0.5">
              {explanation.keyPoints.map((k, i) => <li key={i}>{k}</li>)}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <input className="input max-w-[180px]" placeholder="Search question bank..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input max-w-[140px]" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="mcq">MCQ</option>
          <option value="2mark">2-Mark</option>
          <option value="4mark">4-Mark</option>
          <option value="8mark">8-Mark</option>
        </select>
        <select className="input max-w-[140px]" value={filterAttempted} onChange={(e) => setFilterAttempted(e.target.value)}>
          <option value="all">All</option>
          <option value="attempted">Attempted</option>
          <option value="unattempted">Not Attempted</option>
        </select>
      </div>

      <div className="space-y-4">
        {filteredQuestions.length === 0 && (
          <div className="card text-center text-slate-400 text-sm py-8">No questions yet — generate some above.</div>
        )}
        {filteredQuestions.map((q) =>
          q.type === 'mcq' ? (
            <MCQCard key={q.id} question={q} onAnswered={(r) => setData(recordAttempt(q.id, r))} />
          ) : (
            <MarkedQuestionCard
              key={q.id}
              question={q}
              marks={q.type === '2mark' ? 2 : q.type === '4mark' ? 4 : 8}
              onAnswered={(r) => setData(recordAttempt(q.id, r))}
            />
          )
        )}
      </div>
    </div>
  )
}
