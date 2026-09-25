import { useMemo, useState } from 'react'
import { Bot, BookOpenText, FolderOpen, Globe, Link2, MoreHorizontal, NotebookPen, Pencil, Play, Star, Trash2 } from 'lucide-react'

const CATEGORY_ICONS = {
  'AI Tools': Bot,
  'NotebookLM': NotebookPen,
  YouTube: Play,
  'Study Material': BookOpenText,
  Websites: Globe,
  Notes: FolderOpen,
  Other: Link2,
}

export default function ResourceCard({ resource, subjectName, onOpen, onEdit, onDelete, onToggleFavorite }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const Icon = useMemo(() => CATEGORY_ICONS[resource?.category] || Link2, [resource?.category])

  return (
    <div className="card relative flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
            <Icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{resource.title}</p>
            <p className="text-xs text-slate-400">{resource.category}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleFavorite?.(resource.id)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-amber-500 dark:hover:bg-slate-700"
            aria-label={resource.favorite ? 'Unfavorite resource' : 'Favorite resource'}
          >
            <Star size={16} fill={resource.favorite ? '#fbbf24' : 'none'} className={resource.favorite ? 'text-amber-500' : ''} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
              aria-label="Open resource menu"
            >
              <MoreHorizontal size={16} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <button type="button" onClick={() => { onEdit?.(resource); setMenuOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700">
                  <Pencil size={14} /> Edit
                </button>
                <button type="button" onClick={() => { onToggleFavorite?.(resource.id); setMenuOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700">
                  <Star size={14} fill={resource.favorite ? '#fbbf24' : 'none'} className={resource.favorite ? 'text-amber-500' : ''} />
                  {resource.favorite ? 'Unfavorite' : 'Favorite'}
                </button>
                <button type="button" onClick={() => { onDelete?.(resource.id); setMenuOpen(false) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
        {subjectName && <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{subjectName}</p>}
        {resource.description && <p className="text-sm text-slate-600 dark:text-slate-300">{resource.description}</p>}
      </div>

      <div className="mt-5 flex items-center justify-between gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
        <div className="text-[11px] uppercase tracking-wide text-slate-400">
          {resource.favorite ? 'Favorite' : 'Saved'}
        </div>
        <button type="button" onClick={() => onOpen?.(resource)} className="btn-secondary text-xs px-3 py-2">
          Open Resource
        </button>
      </div>
    </div>
  )
}
