import { CheckCircle2, Circle, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function TodayGoalCard({ goals = [], onStart }) {
  const navigate = useNavigate()
  const done = goals.filter((g) => g.done).length

  return (
    <div className="card">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-3">
        <Target size={14} /> TODAY'S GOAL
      </div>
      <div className="space-y-2 mb-4">
        {goals.length === 0 && <p className="text-sm text-slate-400">Add a subject to get a daily goal.</p>}
        {goals.map((g, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {g.done ? (
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            ) : (
              <Circle size={18} className="text-slate-300 shrink-0" />
            )}
            <span className={g.done ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200'}>{g.label}</span>
          </div>
        ))}
      </div>
      <button
        className="btn-primary w-full"
        onClick={() => (onStart ? onStart() : navigate('/study'))}
        disabled={goals.length === 0}
      >
        {done === goals.length && goals.length > 0 ? 'Nice work — Study More' : 'Start Study'}
      </button>
    </div>
  )
}
