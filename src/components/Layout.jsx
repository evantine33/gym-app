import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Dumbbell, LayoutDashboard, Users, Mail, UserCircle, ClipboardList, Layers, Copy, Check, UsersRound, TrendingUp, BookOpen, Bell, X, Target } from 'lucide-react'
import { useState } from 'react'

export default function Layout({ children }) {
  const { currentUser, currentGym, dispatch } = useApp()
  const navigate = useNavigate()
  const [codeCopied, setCodeCopied] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

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

  // Notifications for this user
  const myNotifs = (state.notifications || [])
    .filter(n =>
      n.gymId === currentUser?.gymId &&
      n.forRole === currentUser.role &&
      (n.forUserId === null || n.forUserId === currentUser.id)
    )
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const unreadNotifs = myNotifs.filter(n => !n.read).length

  const openNotifs = () => {
    setNotifOpen(true)
    if (unreadNotifs > 0) {
      dispatch({ type: 'MARK_NOTIFS_READ', gymId: currentUser.gymId, userId: currentUser.id, forRole: currentUser.role })
    }
  }

  const memberNav = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Workouts' },
    { to: '/my-programs', icon: BookOpen, label: 'Programs' },
    { to: '/benchmarks', icon: Target, label: 'Benchmarks' },
    { to: '/stats', icon: TrendingUp, label: 'Volume' },
    { to: '/community', icon: Users, label: 'Community' },
    { to: '/messages', icon: Mail, label: 'Messages', badge: unreadDMs },
    { to: '/profile', icon: UserCircle, label: 'Profile' },
  ]

  const coachNav = [
    { to: '/coach', icon: ClipboardList, label: 'Dashboard' },
    { to: '/members', icon: UsersRound, label: 'Members' },
    { to: '/benchmarks', icon: Target, label: 'Benchmarks' },
    { to: '/stats', icon: TrendingUp, label: 'Volume' },
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

        {/* Notifications bell — members only */}
        {currentUser.role !== 'coach' && (
          <div className="px-3 pb-2 border-t border-gray-700 pt-3">
            <button
              onClick={openNotifs}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <div className="relative">
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                    {unreadNotifs}
                  </span>
                )}
              </div>
              Notifications
              {unreadNotifs > 0 && (
                <span className="ml-auto text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full font-bold">
                  {unreadNotifs}
                </span>
              )}
            </button>
          </div>
        )}

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
          {/* Bell button in mobile nav — members only */}
          {currentUser.role !== 'coach' && (
            <button
              onClick={openNotifs}
              className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium text-gray-500"
            >
              <div className="relative">
                <Bell className="w-5 h-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                    {unreadNotifs}
                  </span>
                )}
              </div>
              Alerts
            </button>
          )}
        </div>
      </nav>

      {/* Notification panel */}
      {notifOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-end md:justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setNotifOpen(false)} />
          {/* Panel */}
          <div className="relative z-10 w-full max-w-sm h-full md:h-auto md:max-h-[80vh] bg-gray-900 border-l border-gray-700 md:border md:rounded-xl md:mt-4 md:mr-4 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800 flex-shrink-0">
              <h2 className="font-black text-white text-lg">Notifications</h2>
              <button onClick={() => setNotifOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {myNotifs.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-10 h-10 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No notifications yet</p>
                  <p className="text-gray-600 text-xs mt-1">You'll be notified when new workouts are posted</p>
                </div>
              ) : (
                myNotifs.map(n => (
                  <div key={n.id}
                    className={`rounded-xl px-4 py-3 border ${n.read ? 'bg-gray-800/50 border-gray-800' : 'bg-orange-500/5 border-orange-500/20'}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />}
                      <div className={!n.read ? '' : 'ml-4'}>
                        <p className={`text-sm font-semibold ${n.read ? 'text-gray-300' : 'text-white'}`}>{n.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{n.body}</p>
                        <p className="text-[10px] text-gray-600 mt-1">
                          {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
