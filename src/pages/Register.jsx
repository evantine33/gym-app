import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Dumbbell, Users, UserCheck, ShieldCheck, Loader2, Clipboard } from 'lucide-react'

export default function Register() {
  const { register, authLoading } = useApp()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' })
  const [accountType, setAccountType] = useState('member')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }

    setLoading(true)
    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: accountType,
      })
      // After register, user is logged in — go straight to gym setup
      navigate(accountType === 'coach' ? '/create-gym' : '/join-gym')
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const accountTypes = [
    { role: 'coach',     icon: ShieldCheck, label: 'Coach / Owner',  sub: 'Create & manage your gym' },
    { role: 'staff',     icon: Clipboard,   label: 'Staff Coach',     sub: 'Edit workouts & view members' },
    { role: 'member',    icon: UserCheck,   label: 'Gym Member',      sub: 'WOD + assigned programs' },
    { role: 'nonmember', icon: Users,       label: 'Non-Member',      sub: 'Assigned programs only' },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mb-3">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Gymi</h1>
          <p className="text-gray-400 text-sm mt-1">Create your account</p>
        </div>

        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
          {/* Account type */}
          <div className="mb-5">
            <label className="block text-sm text-gray-400 mb-2">I am a...</label>
            <div className="space-y-2">
              {accountTypes.map(({ role, icon: Icon, label, sub }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setAccountType(role)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                    accountType === role
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${accountType === role ? 'text-orange-400' : 'text-gray-500'}`} />
                  <div>
                    <p className={`text-sm font-bold ${accountType === role ? 'text-orange-400' : 'text-gray-300'}`}>{label}</p>
                    <p className="text-[11px] text-gray-500">{sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Full Name</label>
              <input className="input" placeholder="Jane Smith" value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input type="email" className="input" placeholder="you@email.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Phone</label>
              <input type="tel" className="input" placeholder="555-000-0000" value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Password</label>
              <input type="password" className="input" placeholder="••••••••" value={form.password} onChange={set('password')} required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Confirm Password</label>
              <input type="password" className="input" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} required />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading || authLoading} className="btn-primary w-full py-2.5 mt-1 flex items-center justify-center gap-2">
              {(loading || authLoading) ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-orange-400 hover:text-orange-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
