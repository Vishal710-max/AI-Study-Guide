import { useState } from 'react'
import { Eye, Mic, CheckCircle2, AlertCircle, XCircle, Lightbulb, RefreshCw } from 'lucide-react'
import AudioPlayer from './AudioPlayer'
import VoiceButton from './VoiceButton'
import { evaluateAnswer } from '../services/api'
import { toast } from 'sonner'

function expectedAnswerText(payload, marks) {
  if (marks === 8) return payload.detailedAnswer || ''
  return payload.expectedAnswer || ''
}

export default function MarkedQuestionCard({ question, marks, onAnswered }) {
  const { question: q, keyPoints = [], example, topic } = question.payload
  const expected = expectedAnswerText(question.payload, marks)

  const [showAnswer, setShowAnswer] = useState(false)
  const [practiceMode, setPracticeMode] = useState(false)
  const [studentAnswer, setStudentAnswer] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [result, setResult] = useState(null)

  async function handleEvaluate() {
    if (!studentAnswer.trim()) {
      toast.error('Please answer the question first (type or use voice).')
      return
    }
    setEvaluating(true)
    try {
      const evalResult = await evaluateAnswer({ question: q, expectedAnswer: expected, studentAnswer, marks })
      setResult(evalResult)
      onAnswered?.({ isCorrect: (evalResult.percentage || 0) >= 60, score: evalResult.score, percentage: evalResult.percentage, marks })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setEvaluating(false)
    }
  }

  function tryAgain() {
    setResult(null)
    setStudentAnswer('')
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        {topic && <p className="text-[11px] uppercase tracking-wide text-brand-500 font-semibold">{topic}</p>}
        <span className="text-[11px] text-slate-400 font-medium">{marks} Marks</span>
      </div>
      <p className="font-medium text-slate-800 dark:text-slate-100 mb-3">{q}</p>

      {!showAnswer && !practiceMode && (
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary text-sm flex items-center gap-1.5" onClick={() => setShowAnswer(true)}>
            <Eye size={15} /> Show Answer
          </button>
          <button className="btn-primary text-sm flex items-center gap-1.5" onClick={() => setPracticeMode(true)}>
            <Mic size={15} /> Answer in Your Own Words
          </button>
        </div>
      )}

      {showAnswer && (
        <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3.5 text-sm mb-3">
          <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">Answer</p>
          <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">{expected}</p>
          {keyPoints.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">Key Points</p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-0.5">
                {keyPoints.map((k, i) => <li key={i}>{k}</li>)}
              </ul>
            </div>
          )}
          {example && (
            <p className="mt-2 text-slate-600 dark:text-slate-300"><span className="font-medium text-slate-700 dark:text-slate-200">Example: </span>{example}</p>
          )}
          <AudioPlayer text={`${expected}. ${keyPoints.join('. ')}`} />
        </div>
      )}

      {practiceMode && !result && (
        <div className="space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">Answer this question in your own words.</p>
          <textarea
            className="input min-h-[90px]"
            placeholder="Type your answer, or use voice below..."
            value={studentAnswer}
            onChange={(e) => setStudentAnswer(e.target.value)}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <VoiceButton label="Start Recording" onResult={(text) => setStudentAnswer((prev) => (prev ? `${prev} ${text}` : text))} />
            <button className="btn-primary text-sm" onClick={handleEvaluate} disabled={evaluating}>
              {evaluating ? 'Evaluating...' : 'Submit for AI Evaluation'}
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3.5 text-sm">
            <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">Your Answer</p>
            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line">{studentAnswer}</p>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">AI Estimated Score</p>
            <span className="text-lg font-bold text-brand-600">{result.score}/10</span>
          </div>

          {result.correctPoints?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-emerald-600 flex items-center gap-1 mb-1"><CheckCircle2 size={13} /> Correct Points</p>
              <ul className="text-sm text-slate-600 dark:text-slate-300 list-disc list-inside space-y-0.5">
                {result.correctPoints.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
          {result.missingPoints?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-amber-600 flex items-center gap-1 mb-1"><AlertCircle size={13} /> Missing Points</p>
              <ul className="text-sm text-slate-600 dark:text-slate-300 list-disc list-inside space-y-0.5">
                {result.missingPoints.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
          {result.incorrectPoints?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-rose-600 flex items-center gap-1 mb-1"><XCircle size={13} /> Incorrect Points</p>
              <ul className="text-sm text-slate-600 dark:text-slate-300 list-disc list-inside space-y-0.5">
                {result.incorrectPoints.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}
          {result.improvementAdvice && (
            <div className="bg-brand-50 rounded-xl p-3 text-sm text-brand-800 flex items-start gap-2">
              <Lightbulb size={15} className="shrink-0 mt-0.5" />
              <span>{result.improvementAdvice}</span>
            </div>
          )}

          <button className="btn-secondary text-sm flex items-center gap-1.5" onClick={tryAgain}>
            <RefreshCw size={14} /> Try Again
          </button>
        </div>
      )}
    </div>
  )
}
