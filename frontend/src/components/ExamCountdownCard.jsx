import { CalendarClock } from 'lucide-react'
import { formatDate, daysLabel } from '../utils/dateUtils'

export default function ExamCountdownCard({ exam, subjectName }) {
  if (!exam) {
    return (
      <div className="card flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
          <CalendarClock size={22} />
        </div>
        <div>
          <p className="text-sm text-slate-400">No upcoming exam yet</p>
          <p className="text-xs text-slate-400">Add an exam to see your countdown</p>
        </div>
      </div>
    )
  }
  const urgent = exam.days <= 3
  return (
    <div className="card">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
        <CalendarClock size={14} /> NEXT EXAM
      </div>
      <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{subjectName || exam.name}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{formatDate(exam.date)}</p>
      <span
        className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${
          urgent ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-700'
        }`}
      >
        {daysLabel(exam.days)}
      </span>
    </div>
  )
}
