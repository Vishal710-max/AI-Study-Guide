import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import { getData, updateSettings, clearData } from '../services/storage'
import { checkHealth } from '../services/api'

export default function Settings() {
  const [data, setData] = useState(getData())
  const [health, setHealth] = useState(null)
  const s = data.settings

  useEffect(() => {
    checkHealth().then(setHealth)
  }, [])

  function patch(fields) {
    const updated = updateSettings(fields)
    setData(updated)
  }

  function handleReset() {
    if (confirm('This will erase all subjects, questions, and progress stored in this browser. Continue?')) {
      clearData()
      setData(getData())
      toast.success('All local data cleared.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 pb-24 space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Settings</h1>

      {health && !health.groqConfigured && (
        <div className="card bg-amber-50 border-amber-100 flex items-start gap-2 text-sm text-amber-700">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>AI features require a Groq API key. Add <code>GROQ_API_KEY</code> to your backend <code>.env</code> file, then restart the backend.</span>
        </div>
      )}

      <div className="card space-y-4">
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Daily Study Target (minutes)</label>
          <input type="number" className="input" value={s.dailyStudyTargetMinutes}
            onChange={(e) => patch({ dailyStudyTargetMinutes: Number(e.target.value) })} />
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Preferred Study Duration</label>
          <select className="input" value={s.preferredStudyDuration}
            onChange={(e) => patch({ preferredStudyDuration: Number(e.target.value) })}>
            {[10, 20, 30].map((d) => <option key={d} value={d}>{d} min</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Playback Speed</label>
          <select className="input" value={s.playbackSpeed}
            onChange={(e) => patch({ playbackSpeed: Number(e.target.value) })}>
            {[0.75, 1, 1.25, 1.5].map((r) => <option key={r} value={r}>{r}x</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Notification Frequency</label>
          <select className="input" value={s.notificationFrequency}
            onChange={(e) => patch({ notificationFrequency: e.target.value })}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Motivation Style</label>
          <select className="input" value={s.motivationStyle}
            onChange={(e) => patch({ motivationStyle: e.target.value })}>
            <option value="friendly">Friendly + Light Humor</option>
            <option value="funny">Funny</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={s.darkMode} onChange={(e) => patch({ darkMode: e.target.checked })} />
          Dark Mode (coming soon)
        </label>
      </div>

      <div className="card space-y-4">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Working Student Mode</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Work Start</label>
            <input type="time" className="input" value={s.workStart} onChange={(e) => patch({ workStart: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Work End</label>
            <input type="time" className="input" value={s.workEnd} onChange={(e) => patch({ workEnd: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">Preferred Study Time</label>
          <input type="time" className="input" value={s.preferredStudyTime} onChange={(e) => patch({ preferredStudyTime: e.target.value })} />
        </div>
      </div>

      <div className="card border-rose-100">
        <p className="text-sm font-medium text-rose-600 mb-2">Danger Zone</p>
        <p className="text-xs text-slate-400 mb-3">
          All your data lives only in this browser's local storage. Clearing it removes subjects, questions, and progress permanently.
        </p>
        <button onClick={handleReset} className="btn-secondary text-sm text-rose-600">Clear All Local Data</button>
      </div>
    </div>
  )
}
