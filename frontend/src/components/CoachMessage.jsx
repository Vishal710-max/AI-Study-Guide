import { Sparkles } from 'lucide-react'

export default function CoachMessage({ message, loading }) {
  return (
    <div className="card bg-gradient-to-br from-brand-500 to-brand-700 text-white border-none">
      <div className="flex items-center gap-2 text-xs font-medium text-brand-100 mb-2">
        <Sparkles size={14} /> AI STUDY COACH
      </div>
      {loading ? (
        <div className="h-5 w-3/4 bg-white/20 rounded animate-pulse" />
      ) : (
        <p className="text-base leading-relaxed">{message}</p>
      )}
    </div>
  )
}
