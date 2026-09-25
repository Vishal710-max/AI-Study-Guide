import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Study from './pages/Study'
import Questions from './pages/Questions'
import VoicePractice from './pages/VoicePractice'
import Progress from './pages/Progress'
import Settings from './pages/Settings'
import Resources from './pages/Resources'
import { getData } from './services/storage'

function useDarkModeSync() {
  useEffect(() => {
    function applyTheme() {
      const dark = !!getData().settings.darkMode
      document.documentElement.classList.toggle('dark', dark)
    }
    applyTheme()
    // Settings page updates localStorage directly (no global state store),
    // so re-check whenever the tab regains focus or storage changes elsewhere.
    window.addEventListener('storage', applyTheme)
    window.addEventListener('focus', applyTheme)
    const interval = setInterval(applyTheme, 1000)
    return () => {
      window.removeEventListener('storage', applyTheme)
      window.removeEventListener('focus', applyTheme)
      clearInterval(interval)
    }
  }, [])
}

export default function App() {
  useDarkModeSync()
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 min-w-0">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/study" element={<Study />} />
          <Route path="/questions" element={<Questions />} />
          <Route path="/voice-practice" element={<VoicePractice />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}
