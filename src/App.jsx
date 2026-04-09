import { Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import CreateGym from './pages/CreateGym'
import JoinGym from './pages/JoinGym'
import MemberDashboard from './pages/MemberDashboard'
import CoachDashboard from './pages/CoachDashboard'
import Community from './pages/Community'
import DirectMessages from './pages/DirectMessages'
import Profile from './pages/Profile'
import Programs from './pages/Programs'
import Members from './pages/Members'
import Stats from './pages/Stats'
import MyPrograms from './pages/MyPrograms'
import Benchmarks from './pages/Benchmarks'
import Journal from './pages/Journal'
import Store from './pages/Store'
import Health from './pages/Health'
import { Dumbbell } from 'lucide-react'

// ─── Loading Screen ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 gap-4">
      <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center animate-pulse">
        <Dumbbell className="w-9 h-9 text-white" />
      </div>
      <p className="text-gray-500 text-sm">Loading…</p>
    </div>
  )
}

// ─── Route Guard ──────────────────────────────────────────────────────────────
function AppRoutes() {
  const { currentUser, authReady } = useApp()

  // Wait for Supabase session check before rendering anything
  if (!authReady) return <LoadingScreen />

  // Not logged in → public pages only
  if (!currentUser) {
    // Root "/" sends visitors to the marketing landing page
    if (window.location.pathname === '/') {
      window.location.replace('/landing.html')
      return null
    }
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/store" element={<Store />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Logged in but not yet in a gym → setup flow
  if (!currentUser.gymId) {
    return (
      <Routes>
        <Route
          path="/create-gym"
          element={currentUser.role === 'coach' ? <CreateGym /> : <Navigate to="/join-gym" replace />}
        />
        <Route
          path="/join-gym"
          element={currentUser.role !== 'coach' ? <JoinGym /> : <Navigate to="/create-gym" replace />}
        />
        <Route
          path="*"
          element={<Navigate to={currentUser.role === 'coach' ? '/create-gym' : '/join-gym'} replace />}
        />
      </Routes>
    )
  }

  // Fully set up → main app
  const isCoachLike = currentUser.role === 'coach' || currentUser.role === 'staff'
  const defaultRoute = isCoachLike ? '/coach' : '/dashboard'

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<MemberDashboard />} />
        <Route path="/coach" element={<CoachDashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/my-programs" element={<MyPrograms />} />
        <Route path="/benchmarks" element={<Benchmarks />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/store" element={<Store />} />
        <Route path="/community" element={<Community />} />
        <Route path="/messages" element={<DirectMessages />} />
        <Route path="/health" element={<Health />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  )
}
