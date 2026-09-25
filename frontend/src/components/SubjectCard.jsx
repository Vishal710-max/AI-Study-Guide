import { FileCheck2, FileX2, Trash2 } from 'lucide-react'
import { formatDate, daysLabel } from '../utils/dateUtils'

export default function SubjectCard({ subject, exam, onOpen, onDelete }) {
  const hasPdf = !!subject.pdfText
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-slate-800 dark:text-slate-100">{subject.name}</p>
          {exam && (
            <p className="text-xs text-slate-400">
              Exam: {formatDate(exam.date)} · {daysLabel(exam.days)}
            </p>
          )}
        </div>
        <button onClick={() => onDelete?.(subject.id)} className="text-slate-300 hover:text-rose-500">
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex items-center gap-1.5 text-xs mt-3 mb-2">
        {hasPdf ? (
          <span className="flex items-center gap-1 text-emerald-600"><FileCheck2 size={14} /> PDF ✓</span>
        ) : (
          <span className="flex items-center gap-1 text-slate-400"><FileX2 size={14} /> No PDF yet</span>
        )}
      </div>

      <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
        <div className="h-full bg-brand-500 rounded-full" style={{ width: `${subject.progressPct || 0}%` }} />
      </div>
      <p className="text-xs text-slate-400 mb-3">{subject.progressPct || 0}% progress</p>

      <button className="btn-secondary w-full text-sm" onClick={() => onOpen?.(subject)}>
        Open Subject
      </button>
    </div>
  )
}
