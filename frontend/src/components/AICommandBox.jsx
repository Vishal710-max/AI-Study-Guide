import { useState } from 'react'
import { Send, Sparkles } from 'lucide-react'
import VoiceButton from './VoiceButton'

const EXAMPLES = [
  'Create 20 MCQs from this PDF',
  'Give me important 2-mark questions',
  'Generate 4-mark questions from Unit 2',
  'Explain this topic simply',
]

export default function AICommandBox({ onSubmit, loading }) {
  const [value, setValue] = useState('')
  const [editingVoice, setEditingVoice] = useState(false)

  function submit(text) {
    const cmd = (text ?? value).trim()
    if (!cmd) return
    onSubmit?.(cmd)
    setValue('')
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-3">
        <Sparkles size={14} /> ASK YOUR STUDY COACH ANYTHING
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); submit() }}
        className="flex items-center gap-2"
      >
        <input
          className="input flex-1"
          placeholder="Ask your study coach anything..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <button type="submit" className="btn-primary px-3.5" disabled={loading || !value.trim()}>
          <Send size={16} />
        </button>
      </form>
      <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
        <VoiceButton
          onResult={(text) => { setValue(text); setEditingVoice(true) }}
        />
        {editingVoice && value && (
          <span className="text-xs text-slate-400">Edit if needed, then press send ↑</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => submit(ex)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:bg-slate-700"
          >
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}
