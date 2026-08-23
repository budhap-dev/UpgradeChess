import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Layout } from './Layout'

const Home = lazy(() => import('@/features/home/HomePage'))
const Puzzles = lazy(() => import('@/features/puzzles/PuzzlesPage'))
const Progress = lazy(() => import('@/features/progress/ProgressPage'))
const Path = lazy(() => import('@/features/path/PathPage'))
const Lesson = lazy(() => import('@/features/path/LessonPage'))
const Openings = lazy(() => import('@/features/openings/OpeningsPage'))
const Play = lazy(() => import('@/features/play/PlayPage'))
const Library = lazy(() => import('@/features/library/LibraryPage'))
const Settings = lazy(() => import('@/features/settings/SettingsPage'))

const Loading = () => <p className="muted" style={{ padding: 24 }}>Loading…</p>

export function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="puzzles" element={<Puzzles />} />
          <Route path="puzzles/:theme" element={<Puzzles />} />
          <Route path="progress" element={<Progress />} />
          <Route path="path" element={<Path />} />
          <Route path="path/:nodeId" element={<Lesson />} />
          <Route path="openings" element={<Openings />} />
          <Route path="openings/:repId" element={<Openings />} />
          <Route path="play" element={<Play />} />
          <Route path="library" element={<Library />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
