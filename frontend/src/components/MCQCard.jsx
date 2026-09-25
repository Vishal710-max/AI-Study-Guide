import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import AudioPlayer from './AudioPlayer'

export default function MCQCard({ question, onAnswered }) {
  const { question: q, options, correctAnswer, explanation, topic } = question.payload
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  function choose(opt) {
    if (submitted) return
    setSelected(opt)
    setSubmitted(true)
    const isCorrect = opt === correctAnswer
    onAnswered?.({ isCorrect, marks: 1 })
  }

  return (
    <div className="card">
      {topic && <p className="text-[11px] uppercase tracking-wide text-brand-500 font-semibold mb-1">{topic}</p>}
      <p className="font-medium text-slate-800 dark:text-slate-100 mb-3">{q}</p>
      <div className="space-y-2">
        {options.map((opt) => {
          const isCorrectOpt = opt === correctAnswer
          const isSelected = opt === selected
          let style = 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:bg-slate-700/40'
          if (submitted && isCorrectOpt) style = 'border-emerald-400 bg-emerald-50'
          else if (submitted && isSelected && !isCorrectOpt) style = 'border-rose-400 bg-rose-50'

          return (
            <button
              key={opt}
              onClick={() => choose(opt)}
              className={`w-full text-left border rounded-xl px-3.5 py-2.5 text-sm flex items-center justify-between transition-colors ${style}`}
            >
              <span>{opt}</span>
              {submitted && isCorrectOpt && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
              {submitted && isSelected && !isCorrectOpt && <XCircle size={16} className="text-rose-500 shrink-0" />}
            </button>
          )
        })}
      </div>
      {submitted && (
        <div className="mt-3 text-sm bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3">
          <p className="text-slate-600 dark:text-slate-300">{explanation}</p>
          <AudioPlayer text={`${q}. Correct answer: ${correctAnswer}. ${explanation}`} />
        </div>
      )}
    </div>
  )
}
