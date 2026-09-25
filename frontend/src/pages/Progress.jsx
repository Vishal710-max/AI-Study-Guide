import { useMemo, useState } from 'react'
import { getData } from '../services/storage'

function accuracyFor(attempts, marks) {
  const filtered = attempts.filter((a) => a.marks === marks || (marks === 1 && a.marks === 1))
  if (filtered.length === 0) return null
  const correct = filtered.filter((a) => a.isCorrect).length
  return Math.round((correct / filtered.length) * 100)
}

export default function Progress() {
  const [data] = useState(getData())
  const { progress, attempts, questions } = data

  const overallAccuracy =
    progress.questionsAttempted > 0 ? Math.round((progress.correctAnswers / progress.questionsAttempted) * 100) : 0

  const byMarks = useMemo(
    () => ({
      2: accuracyFor(attempts, 2),
      4: accuracyFor(attempts, 4),
      8: accuracyFor(attempts, 8),
    }),
    [attempts]
  )

  const topicStats = useMemo(() => {
    const map = {}
    questions.forEach((q) => {
      if (!q.topic || !q.lastResult) return
      map[q.topic] = map[q.topic] || { correct: 0, total: 0 }
      map[q.topic].total += 1
      if (q.lastResult.isCorrect) map[q.topic].correct += 1
    })
    const entries = Object.entries(map).map(([topic, s]) => ({ topic, pct: Math.round((s.correct / s.total) * 100) }))
    return {
      weak: entries.filter((e) => e.pct < 60).sort((a, b) => a.pct - b.pct).slice(0, 5),
      strong: entries.filter((e) => e.pct >= 80).sort((a, b) => b.pct - a.pct).slice(0, 5),
    }
  }, [questions])

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-24 space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Progress</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Questions Attempted', value: progress.questionsAttempted },
          { label: 'Correct Answers', value: progress.correctAnswers },
          { label: 'Study Sessions', value: progress.studySessions },
          { label: 'Study Streak', value: `${progress.studyStreak}🔥` },
        ].map((it) => (
          <div key={it.label} className="card text-center">
            <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">{it.value}</p>
            <p className="text-xs text-slate-400 mt-1">{it.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">Overall Accuracy</p>
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${overallAccuracy}%` }} />
        </div>
        <p className="text-xs text-slate-400">{overallAccuracy}%</p>
      </div>

      <div className="card">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-3">Performance by Marks</p>
        <div className="space-y-3">
          {[2, 4, 8].map((m) => (
            <div key={m}>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span>{m}-Mark</span>
                <span>{byMarks[m] === null ? '—' : `${byMarks[m]}%`}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-brand-400 rounded-full" style={{ width: `${byMarks[m] || 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm font-medium text-rose-500 mb-2">Weak Topics</p>
          {topicStats.weak.length === 0 && <p className="text-xs text-slate-400">Not enough data yet.</p>}
          <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {topicStats.weak.map((t) => <li key={t.topic}>{t.topic} <span className="text-xs text-slate-400">({t.pct}%)</span></li>)}
          </ul>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-emerald-600 mb-2">Strong Topics</p>
          {topicStats.strong.length === 0 && <p className="text-xs text-slate-400">Not enough data yet.</p>}
          <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            {topicStats.strong.map((t) => <li key={t.topic}>{t.topic} <span className="text-xs text-slate-400">({t.pct}%)</span></li>)}
          </ul>
        </div>
      </div>
    </div>
  )
}
