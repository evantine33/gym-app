import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Dumbbell, LayoutDashboard, Users, MessageCircle, Mail, UserCircle, ClipboardList, Layers } from 'lucide-react'
import { useEffect } from 'react'

export default function Layout({ children }) {
  const { currentUser, state } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    if (!currentUser) navigate('/login')
  }, [currentUser])

  if (!currentUser) return null

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
    { to: '/programs', icon: Layers, label: 'Programs' },
    { to: '/community', icon: Users, label: 'Community' },
    { to: '/messages', icon: Mail, label: 'Messages', badge: unreadDMs },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
  ]

  const navItems = currentUser.role === 'coach' ? coachNav : memberNav

  const activeClass = 'text-orange-400'
  const inactiveClass = 'text-gray-500 hover:text-gray-300'

  return (
    <div className="min-h-screen bg-gray-950 pb-20 md:pb-0 md:flex">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen bg-gray-900 border-r border-gray-800 fixed left-0 top-0 bottom-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-gray-700">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm tracking-tight">SC</span>
          </div>
          <div className="min-w-0">
            <span className="font-black text-sm uppercase tracking-wide leading-none block">Stretch</span>
            <span className="font-black text-sm uppercase tracking-wide leading-none text-orange-500 block">Collective</span>
          </div>
        </div>

        {/* User pill */}
        <div className="px-4 py-3 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-orange-400">
              {currentUser.initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
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
                <Icon className="w-4.5 h-4.5 w-5 h-5" />
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
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-56">
        {children}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-40">
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
