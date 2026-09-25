import { useMemo, useState } from 'react'
import { Plus, Search, Sparkles, Star } from 'lucide-react'
import { toast } from 'sonner'

import AddResourceModal from '../components/AddResourceModal'
import ResourceCard from '../components/ResourceCard'
import { addResource, deleteResource, getData, saveData, updateResource } from '../services/storage'

const CATEGORIES = ['All', 'AI Tools', 'NotebookLM', 'YouTube', 'Study Material', 'Websites', 'Notes', 'Other']
const SORT_OPTIONS = [
  { value: 'recently-added', label: 'Recently Added' },
  { value: 'recently-used', label: 'Recently Used' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'favorites', label: 'Favorites' },
]

const DEFAULT_RESOURCES = [
  { title: 'ChatGPT', url: 'https://chatgpt.com/', description: 'AI assistant for explanations and study help.', category: 'AI Tools', subjectId: null, favorite: true },
  { title: 'NotebookLM', url: 'https://notebooklm.google.com/', description: 'Organize notes and generate study summaries.', category: 'NotebookLM', subjectId: null, favorite: true },
  { title: 'YouTube', url: 'https://www.youtube.com/', description: 'Helpful lecture videos and concept explainers.', category: 'YouTube', subjectId: null, favorite: false },
]

export default function Resources() {
  const [data, setData] = useState(getData())
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const [sortBy, setSortBy] = useState('recently-added')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState(null)

  const subjectMap = useMemo(
    () => Object.fromEntries((data.subjects || []).map((subject) => [subject.id, subject.name])),
    [data.subjects]
  )

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase()

    const resources = (data.resources || []).filter((resource) => {
      const subjectName = resource.subjectId ? (subjectMap[resource.subjectId] || '') : ''
      const haystack = [resource.title, resource.description, resource.category, subjectName].join(' ').toLowerCase()

      const matchesSearch = !query || haystack.includes(query)
      const matchesCategory = categoryFilter === 'All' || resource.category === categoryFilter
      const matchesFavorite = !favoriteOnly || resource.favorite

      let matchesSubject = true
      if (subjectFilter !== 'All Subjects') {
        matchesSubject = resource.subjectId === subjectFilter
      }

      return matchesSearch && matchesCategory && matchesFavorite && matchesSubject
    })

    const sorted = [...resources]
    sorted.sort((a, b) => {
      if (favoriteOnly) {
        if (a.favorite !== b.favorite) return Number(b.favorite) - Number(a.favorite)
      }

      if (sortBy === 'recently-used') {
        const aTime = new Date(a.lastOpenedAt || 0).getTime()
        const bTime = new Date(b.lastOpenedAt || 0).getTime()
        return bTime - aTime
      }

      if (sortBy === 'name') {
        return a.title.localeCompare(b.title)
      }

      if (sortBy === 'favorites') {
        return Number(b.favorite) - Number(a.favorite)
      }

      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })

    return sorted
  }, [categoryFilter, data.resources, favoriteOnly, search, sortBy, subjectFilter, subjectMap])

  function refreshData() {
    setData(getData())
  }

  function handleSaveResource(payload) {
    const base = { ...payload, createdAt: payload.createdAt || new Date().toISOString(), lastOpenedAt: payload.lastOpenedAt || null }

    if (editingResource) {
      const updated = updateResource(editingResource.id, base)
      setData(updated)
      toast.success('✓ Resource updated.')
    } else {
      const updated = addResource(base)
      setData(updated)
      toast.success('🔗 Resource saved!')
    }

    setEditingResource(null)
    setModalOpen(false)
  }

  function handleOpenResource(resource) {
    const updated = updateResource(resource.id, { lastOpenedAt: new Date().toISOString() })
    setData(updated)
    toast.success('Opening resource...')
    window.open(resource.url, '_blank', 'noopener,noreferrer')
  }

  function handleDeleteResource(id) {
    if (!window.confirm('Delete this resource?\n\nThis will remove it from your saved resources.')) {
      return
    }

    const updated = deleteResource(id)
    setData(updated)
    toast.success('Resource removed.')
  }

  function handleToggleFavorite(id) {
    const item = data.resources.find((resource) => resource.id === id)
    if (!item) return

    const updated = updateResource(id, { favorite: !item.favorite })
    setData(updated)
  }

  function addUsefulDefaults() {
    const existing = getData().resources || []
    const next = [...existing]

    DEFAULT_RESOURCES.forEach((seed) => {
      const exists = next.some((resource) => resource.title.toLowerCase() === seed.title.toLowerCase())
      if (!exists) {
        next.push({ id: crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`, ...seed, createdAt: new Date().toISOString(), lastOpenedAt: null })
      }
    })

    saveData({ ...getData(), resources: next })
    setData(getData())
    toast.success('Useful defaults added.')
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 pb-24 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Resources</h1>
          <p className="text-sm text-slate-400">Save study links, AI tools, and useful materials.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={addUsefulDefaults} className="btn-secondary text-sm flex items-center gap-2">
            <Sparkles size={16} /> Add Useful AI Resources
          </button>
          <button type="button" onClick={() => { setEditingResource(null); setModalOpen(true) }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus size={16} /> Add Resource
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-600 dark:bg-slate-900 md:min-w-[260px] flex-1">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search resources..."
              className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400 dark:text-slate-100"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input max-w-[160px]">
              {CATEGORIES.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>

            <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="input max-w-[180px]">
              <option value="All Subjects">All Subjects</option>
              {(data.subjects || []).map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input max-w-[170px]">
              {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFavoriteOnly((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${favoriteOnly ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-200'}`}
          >
            <Star size={12} fill={favoriteOnly ? '#fbbf24' : 'none'} className={favoriteOnly ? 'text-amber-500' : ''} />
            Favorites
          </button>
          <span className="text-xs text-slate-400">{(data.resources || []).length} Resources</span>
          <span className="text-xs text-slate-400">{(data.resources || []).filter((r) => r.favorite).length} Favorites</span>
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <div className="card text-center py-12">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
            <Plus size={24} />
          </div>
          <p className="text-xl font-semibold text-slate-800 dark:text-slate-100">🔗 No resources saved yet.</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            Save useful links like ChatGPT, NotebookLM, YouTube lectures, and important study websites here.
          </p>
          <button type="button" onClick={() => setModalOpen(true)} className="btn-primary mt-5">+ Add Your First Resource</button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              subjectName={resource.subjectId ? subjectMap[resource.subjectId] : null}
              onOpen={handleOpenResource}
              onEdit={(item) => { setEditingResource(item); setModalOpen(true) }}
              onDelete={handleDeleteResource}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      <AddResourceModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingResource(null) }}
        onSave={handleSaveResource}
        subjects={data.subjects || []}
        resource={editingResource}
      />
    </div>
  )
}
