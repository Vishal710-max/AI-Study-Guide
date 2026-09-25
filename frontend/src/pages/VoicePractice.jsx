import { useMemo, useState } from 'react'
import { Shuffle } from 'lucide-react'
import { toast } from 'sonner'

import MarkedQuestionCard from '../components/MarkedQuestionCard'
import { getData, recordAttempt } from '../services/storage'

export default function VoicePractice() {
  const [data, setData] = useState(getData())
  const [subjectId, setSubjectId] = useState(data.subjects[0]?.id || '')
  const [marksFilter, setMarksFilter] = useState('all')
  const [currentId, setCurrentId] = useState(null)

  const pool = useMemo(() => {
    return data.questions.filter(
      (q) =>
        q.subjectId === subjectId &&
        q.type !== 'mcq' &&
        (marksFilter === 'all' || q.type === marksFilter)
    )
  }, [data.questions, subjectId, marksFilter])

  const current = pool.find((q) => q.id === currentId) || pool[0]

  function pickRandom() {
    if (pool.length === 0) {
      toast.error('No 2/4/8-mark questions yet — generate some from the Questions page first.')
      return
    }
    const remaining = pool.filter((q) => q.id !== currentId)
    const choices = remaining.length ? remaining : pool
    setCurrentId(choices[Math.floor(Math.random() * choices.length)].id)
  }

  if (data.subjects.length === 0) {
    return <div className="max-w-3xl mx-auto p-8 text-center text-slate-400">Add a subject from the Dashboard first.</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 pb-24 space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Voice Practice</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">Speak your answer out loud — the AI will evaluate it just like a written one.</p>

      <div className="flex flex-wrap gap-2">
        <select className="input max-w-[220px]" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setCurrentId(null) }}>
          {data.subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input max-w-[140px]" value={marksFilter} onChange={(e) => { setMarksFilter(e.target.value); setCurrentId(null) }}>
          <option value="all">Any Marks</option>
          <option value="2mark">2-Mark</option>
          <option value="4mark">4-Mark</option>
          <option value="8mark">8-Mark</option>
        </select>
        <button className="btn-secondary flex items-center gap-1.5 text-sm" onClick={pickRandom}>
          <Shuffle size={15} /> {current ? 'Next Question' : 'Pick a Question'}
        </button>
      </div>

      {!current && (
        <div className="card text-center text-slate-400 text-sm py-10">
          Click "Pick a Question" to start voice practice.
        </div>
      )}

      {current && (
        <MarkedQuestionCard
          key={current.id}
          question={current}
          marks={current.type === '2mark' ? 2 : current.type === '4mark' ? 4 : 8}
          onAnswered={(r) => setData(recordAttempt(current.id, r))}
        />
      )}
    </div>
  )
}
