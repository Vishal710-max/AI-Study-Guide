import { TrendingUp } from 'lucide-react'

export default function ProgressCard({ progress }) {
  const accuracy =
    progress.questionsAttempted > 0
      ? Math.round((progress.correctAnswers / progress.questionsAttempted) * 100)
      : 0

  const items = [
    { label: 'Attempted', value: progress.questionsAttempted },
    { label: 'Accuracy', value: `${accuracy}%` },
    { label: 'Sessions', value: progress.studySessions },
    { label: 'Streak', value: `${progress.studyStreak}🔥` },
  ]

  return (
    <div className="card">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-3">
        <TrendingUp size={14} /> PROGRESS
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((it) => (
          <div key={it.label} className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3">
            <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{it.value}</p>
            <p className="text-xs text-slate-400">{it.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
