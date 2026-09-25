import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react'
import { useTextToSpeech } from '../utils/useSpeech'

const SPEEDS = [0.75, 1, 1.25, 1.5]

export default function AudioPlayer({ text, defaultRate = 1 }) {
  const { speak, pause, resume, stop, speaking, paused, supported } = useTextToSpeech(defaultRate)

  if (!supported) return null

  return (
    <div className="flex items-center gap-2 flex-wrap mt-2">
      <button
        className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
        onClick={() => {
          if (!speaking) speak(text, defaultRate)
          else if (paused) resume()
          else pause()
        }}
      >
        <Volume2 size={15} />
        {!speaking ? 'Listen to Answer' : paused ? 'Resume' : 'Pause'}
      </button>
      {speaking && (
        <>
          <button onClick={() => { stop(); speak(text, defaultRate) }} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">
            <RotateCcw size={14} />
          </button>
          <div className="flex items-center gap-1 ml-1">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => speak(text, s)}
                className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-500 dark:text-slate-400"
              >
                {s}x
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
