import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Dumbbell, LayoutDashboard, Users, Mail, UserCircle, ClipboardList, Layers, Copy, Check, UsersRound } from 'lucide-react'
import { useState } from 'react'

export default function Layout({ children }) {
  const { currentUser, currentGym, dispatch } = useApp()
  const navigate = useNavigate()
  const [codeCopied, setCodeCopied] = useState(false)

  const handleLogout = () => {
    dispatch({ type: 'LOGOUT' })
    navigate('/login')
  }

  const copyCode = () => {
    if (!currentGym?.joinCode) return
    navigator.clipboard.writeText(currentGym.joinCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  if (!currentUser) return null

  const { state } = useApp()
  const unreadDMs = state.directMessages.filter(
    dm => dm.toId === currentUser.id && !dm.read
  ).length

  const memberNav = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Workouts' },
    { to: '/community', icon: Users, label: 'Community' },
    { to: '/messages', icon: Mail, label: 'Messages', badge: unreadDMs },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
  ]

  const coachNav = [
    { to: '/coach', icon: ClipboardList, label: 'Dashboard' },
    { to: '/members', icon: UsersRound, label: 'Members' },
    { to: '/programs', icon: Layers, label: 'Programs' },
    { to: '/community', icon: Users, label: 'Community' },
    { to: '/messages', icon: Mail, label: 'Messages', badge: unreadDMs },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
  ]

  const navItems = currentUser.role === 'coach' ? coachNav : memberNav

  return (
    <div className="min-h-screen bg-black pb-20 md:pb-0 md:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-gray-900 border-r border-gray-700 fixed left-0 top-0 bottom-0">

        {/* Gym name */}
        <div className="px-5 py-4 border-b border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-black text-sm uppercase tracking-wide truncate leading-tight">
                {currentGym?.name ?? 'Gymi'}
              </p>
              <p className="text-[10px] text-gray-500 leading-tight">powered by Gymi</p>
            </div>
          </div>

          {/* Join code — coach only */}
          {currentUser.role === 'coach' && currentGym && (
            <button
              onClick={copyCode}
              className="mt-2.5 w-full flex items-center justify-between bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-1.5 transition-colors group"
              title="Copy join code"
            >
              <div className="text-left">
                <p className="text-[10px] text-gray-500 leading-none mb-0.5">Member Join Code</p>
                <p className="font-mono font-bold text-orange-400 tracking-widest text-sm">
                  {currentGym.joinCode}
                </p>
              </div>
              <div className="text-gray-500 group-hover:text-white transition-colors">
                {codeCopied
                  ? <Check className="w-3.5 h-3.5 text-green-400" />
                  : <Copy className="w-3.5 h-3.5" />
                }
              </div>
            </button>
          )}
        </div>

        {/* User pill */}
        <div className="px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-orange-400 flex-shrink-0">
              {currentUser.initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500">
                {currentUser.role === 'coach' ? 'Coach' : currentUser.role === 'nonmember' ? 'Non-Member' : 'Gym Member'}
              </p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-orange-500/10 text-orange-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                    {badge}
                  </span>
                )}
              </div>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-4 border-t border-gray-700 pt-3">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-56">
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 z-40">
        <div className="flex">
          {navItems.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${isActive ? 'text-orange-400' : 'text-gray-500'}`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                    {badge}
                  </span>
                )}
              </div>
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
