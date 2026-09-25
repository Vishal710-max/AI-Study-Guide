import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import ExamCountdownCard from '../components/ExamCountdownCard'
import TodayGoalCard from '../components/TodayGoalCard'
import ProgressCard from '../components/ProgressCard'
import CoachMessage from '../components/CoachMessage'
import SubjectCard from '../components/SubjectCard'
import AddSubjectModal from '../components/AddSubjectModal'
import AICommandBox from '../components/AICommandBox'

import { getData, addSubject, addExam, deleteSubject, daysRemaining, getNextExam } from '../services/storage'
import { getMotivation, classifyCommand } from '../services/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(getData())
  const [modalOpen, setModalOpen] = useState(false)
  const [coachMessage, setCoachMessage] = useState('')
  const [coachLoading, setCoachLoading] = useState(true)

  const nextExam = getNextExam(data)
  const nextExamSubject = nextExam ? data.subjects.find((s) => s.id === nextExam.subjectId) : null

  useEffect(() => {
    async function loadCoach() {
      setCoachLoading(true)
      const todayGoals = buildTodayGoals()
      const doneCount = todayGoals.filter((g) => g.done).length
      const pct = todayGoals.length ? Math.round((doneCount / todayGoals.length) * 100) : 0
      const res = await getMotivation({
        examName: nextExamSubject?.name,
        daysRemaining: nextExam?.days,
        todayProgressPct: pct,
        style: data.settings.motivationStyle,
      })
      setCoachMessage(res.message)
      setCoachLoading(false)
    }
    loadCoach()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function buildTodayGoals() {
    if (data.subjects.length === 0) return []
    return [
      { label: '10 MCQs', done: false },
      { label: '2 × 2-mark questions', done: false },
      { label: '1 × 4-mark question', done: false },
    ]
  }

  function handleAddSubject({ name, date, time, priority }) {
    const subjectResult = addSubject({ name })
    const newSubject = subjectResult.subjects[subjectResult.subjects.length - 1]
    const updated = addExam({ subjectId: newSubject.id, name, date, time, priority })
    setData(updated)
    setModalOpen(false)
    toast.success(`${name} added — now upload your PDF to get started.`)
    navigate('/study', { state: { subjectId: newSubject.id } })
  }

  function handleDeleteSubject(id) {
    const updated = deleteSubject(id)
    setData(updated)
  }

  async function handleCommand(command) {
    try {
      const routed = await classifyCommand(command)
      const subjectId = data.subjects[0]?.id
      if (!subjectId) {
        toast.error('Add a subject and upload a PDF first.')
        return
      }
      const params = new URLSearchParams({
        action: routed.action,
        count: routed.count || '',
        topic: routed.topic || '',
        unit: routed.unit || '',
      })
      navigate(`/questions?subjectId=${subjectId}&${params.toString()}`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const goals = buildTodayGoals()

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-400">Let's make today's study session count.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus size={16} /> Add Subject
        </button>
      </div>

      <CoachMessage message={coachMessage} loading={coachLoading} />

      <AICommandBox onSubmit={handleCommand} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ExamCountdownCard exam={nextExam} subjectName={nextExamSubject?.name} />
        <TodayGoalCard goals={goals} onStart={() => navigate('/study')} />
        <ProgressCard progress={data.progress} />
      </div>

      <div className="card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">🔗 Useful Resources</p>
            <p className="text-xs text-slate-400">{(data.resources || []).length} saved resources</p>
          </div>
          <button type="button" onClick={() => navigate('/resources')} className="btn-secondary text-sm">View Resources</button>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">Your Subjects</h2>
        {data.subjects.length === 0 ? (
          <div className="card text-center text-slate-400 text-sm py-10">
            No subjects yet. Add one to upload your first PDF and start generating questions.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.subjects.map((s) => {
              const exam = data.exams.find((e) => e.subjectId === s.id)
              return (
                <SubjectCard
                  key={s.id}
                  subject={s}
                  exam={exam ? { ...exam, days: daysRemaining(exam.date) } : null}
                  onOpen={() => navigate('/study', { state: { subjectId: s.id } })}
                  onDelete={handleDeleteSubject}
                />
              )
            })}
          </div>
        )}
      </div>

      <AddSubjectModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleAddSubject} />
    </div>
  )
}
