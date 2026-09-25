import { NavLink } from 'react-router-dom'
import { LayoutDashboard, BookOpen, ListChecks, Mic, LineChart, Settings, GraduationCap, Link2 } from 'lucide-react'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/study', label: 'Study', icon: BookOpen },
  { to: '/questions', label: 'Questions', icon: ListChecks },
  { to: '/voice-practice', label: 'Voice Practice', icon: Mic },
  { to: '/resources', label: 'Resources', icon: Link2 },
  { to: '/progress', label: 'Progress', icon: LineChart },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-slate-100 bg-white h-screen sticky top-0 p-4 dark:bg-slate-800 dark:border-slate-700">
        <div className="flex items-center gap-2 px-2 py-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100 leading-tight">Study Buddy</p>
            <p className="text-xs text-slate-400 leading-tight">AI Exam Companion</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 flex justify-around py-2 z-30 dark:bg-slate-800 dark:border-slate-700">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium ${
                isActive ? 'text-brand-600' : 'text-slate-400'
              }`
            }
          >
            <Icon size={20} />
            {label.split(' ')[0]}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
