import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
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

// ─── Route Guard ──────────────────────────────────────────────────────────────
function AppRoutes() {
  const { currentUser } = useApp()

  // Not logged in → public pages only
  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
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
  const defaultRoute = currentUser.role === 'coach' ? '/coach' : '/dashboard'

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<MemberDashboard />} />
        <Route path="/coach" element={<CoachDashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/stats" element={<Stats />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/my-programs" element={<MyPrograms />} />
        <Route path="/community" element={<Community />} />
        <Route path="/messages" element={<DirectMessages />} />
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
