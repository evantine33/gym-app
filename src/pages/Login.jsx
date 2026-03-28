import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Dumbbell, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    setError('')
    const user = state.users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    )
    if (!user) {
      setError('Invalid email or password.')
      return
    }
    dispatch({ type: 'LOGIN', userId: user.id })
    navigate(user.role === 'coach' ? '/coach' : '/dashboard')
  }

  const quickLogin = (role) => {
    const user = state.users.find(u => u.role === role)
    if (user) {
      dispatch({ type: 'LOGIN', userId: user.id })
      navigate(role === 'coach' ? '/coach' : '/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mb-4">
            <span className="text-white font-black text-xl tracking-tight">SC</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-wide text-white leading-tight">Stretch</h1>
          <h1 className="text-3xl font-black uppercase tracking-wide text-orange-500 leading-tight">Collective</h1>
          <p className="text-gray-500 text-sm mt-2">EST. 2024</p>
        </div>

        {/* Form */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Sign in</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full py-2.5">
              Sign In
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            New member?{' '}
            <Link to="/register" className="text-orange-400 hover:text-orange-300 font-medium">
              Create account
            </Link>
          </p>
        </div>

        {/* Demo shortcuts */}
        <div className="mt-4 card">
          <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Demo quick login</p>
          <div className="flex gap-2">
            <button
              onClick={() => quickLogin('coach')}
              className="flex-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm font-medium py-2 rounded-lg transition"
            >
              Coach View
            </button>
            <button
              onClick={() => quickLogin('member')}
              className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-medium py-2 rounded-lg transition"
            >
              Member View
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
