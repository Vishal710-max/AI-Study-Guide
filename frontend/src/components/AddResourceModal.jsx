import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const CATEGORIES = ['AI Tools', 'NotebookLM', 'YouTube', 'Study Material', 'Websites', 'Notes', 'Other']

function normalizeUrl(raw) {
  const value = raw.trim()
  if (!value) return ''
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`
  try {
    return new URL(withProtocol).toString()
  } catch {
    return ''
  }
}

export default function AddResourceModal({ open, onClose, onSave, subjects = [], resource = null }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [category, setCategory] = useState('AI Tools')
  const [subjectId, setSubjectId] = useState('')
  const [description, setDescription] = useState('')
  const [favorite, setFavorite] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return

    if (resource) {
      setTitle(resource.title || '')
      setUrl(resource.url || '')
      setCategory(resource.category || 'AI Tools')
      setSubjectId(resource.subjectId || '')
      setDescription(resource.description || '')
      setFavorite(Boolean(resource.favorite))
      setError('')
      return
    }

    setTitle('')
    setUrl('')
    setCategory('AI Tools')
    setSubjectId('')
    setDescription('')
    setFavorite(false)
    setError('')
  }, [open, resource])

  if (!open) return null

  function submit(e) {
    e.preventDefault()
    const trimmedTitle = title.trim()
    const normalizedUrl = normalizeUrl(url)

    if (!trimmedTitle) {
      setError('Please enter a resource name.')
      return
    }

    if (!normalizedUrl) {
      setError('Please enter a valid URL.')
      return
    }

    onSave({
      title: trimmedTitle,
      url: normalizedUrl,
      description: description.trim(),
      category,
      subjectId: subjectId || null,
      favorite,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-soft dark:bg-slate-800" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <p className="font-semibold text-slate-800 dark:text-slate-100">{resource ? 'Edit Resource' : 'Add Resource'}</p>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Resource Name *</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. ChatGPT" />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">URL *</label>
            <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://chatgpt.com/" />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Category *</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Subject</label>
              <select className="input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">All Subjects</option>
                {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">Description</label>
            <textarea className="input min-h-[90px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Use this for concept explanations and doubts." />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input type="checkbox" checked={favorite} onChange={(e) => setFavorite(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400" />
            Favorite
          </label>

          {error && <p className="text-sm text-rose-500">{error}</p>}

          <button type="submit" className="btn-primary w-full">{resource ? 'Save Changes' : 'Save Resource'}</button>
        </form>
      </div>
    </div>
  )
}
