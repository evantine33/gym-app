import { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  Plus, Trash2, ExternalLink, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, Users, ClipboardList, X, CalendarDays, Copy, Pencil,
  TrendingUp, DollarSign, ShoppingBag, Bell, CheckCircle2, Activity,
} from 'lucide-react'
import ExerciseBuilder, { newEx, groupExercises, GROUP_STYLES } from '../components/ExerciseBuilder'
import WarmupSection from '../components/WarmupSection'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const TODAY = new Date().toISOString().split('T')[0]

function formatDateLabel(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function timeAgo(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Add Workout Modal ────────────────────────────────────────────────────────
function AddWorkoutModal({ date, onClose }) {
  const { dispatch } = useApp()
  const [title, setTitle] = useState('')
  const [warmup, setWarmup] = useState([])
  const [exercises, setExercises] = useState([newEx()])

  const handleSubmit = (e) => {
    e.preventDefault()
    const validExercises = exercises
      .filter(ex => ex.name.trim())
      .map(ex => ({ ...ex, id: 'ex-' + Math.random().toString(36).slice(2), sets: Number(ex.sets) || 1 }))
    if (!validExercises.length) return
    const validWarmup = warmup.filter(w => w.name.trim())
    dispatch({ type: 'ADD_WORKOUT', workout: { title, date, warmup: validWarmup, exercises: validExercises } })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold">Add Workout</h2>
            <p className="text-sm text-orange-400 mt-0.5">{formatDateLabel(date)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Workout Title</label>
            <input className="input" placeholder="e.g. Strength Block, Conditioning Day..."
              value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <WarmupSection warmup={warmup} setWarmup={setWarmup} />

          <div>
            <h3 className="font-semibold text-gray-300 mb-3">Exercises</h3>
            <ExerciseBuilder exercises={exercises} setExercises={setExercises} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Post Workout</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Edit Workout Modal ───────────────────────────────────────────────────────
function EditWorkoutModal({ workout, onClose }) {
  const { dispatch } = useApp()
  const [title, setTitle] = useState(workout.title || '')
  const [warmup, setWarmup] = useState(workout.warmup?.length ? workout.warmup : [])
  const [exercises, setExercises] = useState(
    workout.exercises?.length
      ? workout.exercises.map(ex => ({
          ...newEx(),
          ...ex,
          setsData: ex.setsData?.length
            ? ex.setsData
            : Array.from({ length: Number(ex.sets) || 3 }, () => ({
                id: Math.random(),
                reps: ex.reps || '',
                weight: ex.targetWeight || '',
              })),
        }))
      : [newEx()]
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    const validExercises = exercises
      .filter(ex => ex.name.trim())
      .map(ex => ({ ...ex, id: ex.id || 'ex-' + Math.random().toString(36).slice(2) }))
    if (!validExercises.length) return
    const validWarmup = warmup.filter(w => w.name.trim())
    dispatch({
      type: 'UPDATE_WORKOUT',
      workoutId: workout.id,
      data: { title, warmup: validWarmup, exercises: validExercises },
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="text-lg font-bold">Edit Workout</h2>
            <p className="text-sm text-orange-400 mt-0.5">{formatDateLabel(workout.date)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Workout Title</label>
            <input className="input" placeholder="e.g. Strength Block, Conditioning Day..."
              value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <WarmupSection warmup={warmup} setWarmup={setWarmup} />

          <div>
            <h3 className="font-semibold text-gray-300 mb-3">Exercises</h3>
            <ExerciseBuilder exercises={exercises} setExercises={setExercises} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Calendar ─────────────────────────────────────────────────────────────────
function Calendar({ workouts, selectedDate, onSelectDate }) {
  const [viewDate, setViewDate] = useState(new Date())
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1

  const cells = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const toDateStr = (day) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const workoutsByDate = workouts.reduce((acc, w) => {
    if (!acc[w.date]) acc[w.date] = []
    acc[w.date].push(w)
    return acc
  }, {})

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-white">
          {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <div key={d} className="text-center text-xs text-gray-600 font-semibold py-1 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const dateStr = toDateStr(day)
          const dayWorkouts = workoutsByDate[dateStr] || []
          const isToday = dateStr === TODAY
          const isSelected = dateStr === selectedDate
          const isPast = dateStr < TODAY

          return (
            <button
              key={i}
              onClick={() => onSelectDate(isSelected ? null : dateStr)}
              className={`relative flex flex-col items-center justify-start pt-1.5 pb-1 rounded-xl min-h-[52px] transition-all border ${
                isSelected
                  ? 'bg-orange-500 border-orange-400 text-white'
                  : isToday
                  ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                  : isPast
                  ? 'border-transparent hover:bg-gray-800 text-gray-600 hover:text-gray-400'
                  : 'border-transparent hover:bg-gray-800 text-gray-300'
              }`}
            >
              <span className={`text-sm font-semibold leading-none ${isToday && !isSelected ? 'text-orange-400' : ''}`}>
                {day}
              </span>
              {dayWorkouts.length > 0 && (
                <div className="flex gap-0.5 mt-1.5 flex-wrap justify-center px-1">
                  {dayWorkouts.slice(0, 3).map((w, wi) => (
                    <div key={wi} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-orange-400'}`} />
                  ))}
                  {dayWorkouts.length > 3 && (
                    <span className={`text-[9px] leading-none ${isSelected ? 'text-white/70' : 'text-orange-400/70'}`}>
                      +{dayWorkouts.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-800">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-2 h-2 rounded-full bg-orange-400" />
          Workout posted
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <div className="w-4 h-4 rounded-md bg-orange-500/15 border border-orange-500/40" />
          Today
        </div>
      </div>
    </div>
  )
}

// ─── Day Detail Panel ─────────────────────────────────────────────────────────
function DayDetail({ date, workouts, members, logs, onDelete, onDuplicate, onAddWorkout, onEdit }) {
  const [expandedId, setExpandedId] = useState(null)
  const [tab, setTab] = useState({})

  const dayWorkouts = workouts.filter(w => w.date === date)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">{formatDateLabel(date)}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {dayWorkouts.length === 0
              ? 'No workouts — rest day or add one below'
              : `${dayWorkouts.length} workout${dayWorkouts.length > 1 ? 's' : ''} scheduled`}
          </p>
        </div>
        <button onClick={onAddWorkout} className="btn-primary flex items-center gap-1.5 text-sm">
          <Plus className="w-4 h-4" /> Add Workout
        </button>
      </div>

      {dayWorkouts.length === 0 ? (
        <div className="card text-center py-8 border-dashed">
          <CalendarDays className="w-8 h-8 text-gray-700 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No workout for this day yet</p>
        </div>
      ) : (
        dayWorkouts.map(workout => {
          const currentTab = tab[workout.id] || 'program'
          const isOpen = expandedId !== workout.id + '-closed'

          return (
            <div key={workout.id} className="card">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-white">{workout.title}</h4>
                <div className="flex items-center gap-1">
                  <button onClick={() => onEdit(workout)} title="Edit workout" className="p-1.5 text-gray-600 hover:text-orange-400 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDuplicate(workout.id)} title="Duplicate to next week" className="p-1.5 text-gray-600 hover:text-blue-400 transition-colors">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(workout.id)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setExpandedId(expandedId === workout.id + '-closed' ? null : workout.id + '-closed')}
                    className="p-1.5 text-gray-400 hover:text-white"
                  >
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isOpen && (
                <>
                  <div className="flex gap-1 mt-3 mb-3 bg-gray-800 rounded-lg p-1">
                    {['program', 'members'].map(t => (
                      <button
                        key={t}
                        onClick={() => setTab(prev => ({ ...prev, [workout.id]: t }))}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition ${
                          currentTab === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {t === 'program' ? <ClipboardList className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                        {t === 'program' ? 'Program' : 'Member Logs'}
                      </button>
                    ))}
                  </div>

                  {currentTab === 'program' ? (
                    <div className="space-y-2">
                      {groupExercises(workout.exercises).map((item, gi) => {
                        if (item.kind === 'single') {
                          const ex = item.exercise
                          return (
                            <div key={ex.id} className="bg-gray-800 rounded-xl p-3 border border-gray-700">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full font-medium">#{gi + 1}</span>
                                    <span className="font-semibold text-sm text-white">{ex.name}</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-1">
                                    <span><span className="text-white font-medium">{ex.sets}</span> × <span className="text-white font-medium">{ex.reps}</span></span>
                                    {ex.targetWeight && <span>@ <span className="text-white font-medium">{ex.targetWeight}</span></span>}
                                  </div>
                                  {ex.notes && <p className="text-xs text-gray-500 italic">"{ex.notes}"</p>}
                                </div>
                                {ex.demoUrl && (
                                  <a href={ex.demoUrl} target="_blank" rel="noreferrer" className="text-orange-400 hover:text-orange-300 flex-shrink-0">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          )
                        }
                        const style = GROUP_STYLES[item.kind] || GROUP_STYLES.superset
                        return (
                          <div key={item.groupId} className={`rounded-xl border ${style.border} overflow-hidden`}>
                            <div className={`px-3 py-1.5 ${style.headerBg}`}>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>{style.label}</span>
                            </div>
                            <div className="divide-y divide-gray-800">
                              {item.exercises.map((ex, i) => (
                                <div key={ex.id} className="p-3 flex items-start justify-between gap-2">
                                  <div className="flex items-start gap-2">
                                    <div className={`w-5 h-5 rounded-full text-[10px] font-black text-white flex items-center justify-center flex-shrink-0 mt-0.5 ${style.letterBg}`}>
                                      {LETTERS[i]}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-sm text-white">{ex.name}</p>
                                      <div className="flex flex-wrap gap-2 text-xs text-gray-400 mt-0.5">
                                        <span><span className="text-white font-medium">{ex.sets}</span> × <span className="text-white font-medium">{ex.reps}</span></span>
                                        {ex.targetWeight && <span>@ <span className="text-white font-medium">{ex.targetWeight}</span></span>}
                                      </div>
                                      {ex.notes && <p className="text-xs text-gray-500 italic mt-0.5">"{ex.notes}"</p>}
                                    </div>
                                  </div>
                                  {ex.demoUrl && (
                                    <a href={ex.demoUrl} target="_blank" rel="noreferrer" className="text-orange-400 hover:text-orange-300 flex-shrink-0">
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div>
                      {members.filter(m => m.role === 'member').map(member => {
                        const loggedCount = workout.exercises.filter(ex =>
                          logs.some(l => l.userId === member.id && l.exerciseId === ex.id)
                        ).length
                        const total = workout.exercises.length
                        const pct = total ? Math.round((loggedCount / total) * 100) : 0
                        return (
                          <div key={member.id} className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-orange-400">
                                {member.initials}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{member.name}</p>
                                <p className="text-xs text-gray-500">{loggedCount}/{total} logged</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-orange-500' : 'bg-gray-600'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className={`text-xs font-medium w-8 text-right ${pct === 100 ? 'text-green-400' : pct > 0 ? 'text-orange-400' : 'text-gray-500'}`}>
                                {pct}%
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

// ─── Overview / Analytics Tab ─────────────────────────────────────────────────
function OverviewTab({ gymWorkouts, gymUsers, gymLogs, state, currentUser }) {
  const gymId = currentUser?.gymId
  const members = gymUsers.filter(u => u.role === 'member')

  // Sales analytics — purchases of listings created by this coach
  const myListings = (state.programListings || []).filter(l => l.coachId === currentUser?.id)
  const myListingIds = new Set(myListings.map(l => l.id))
  const myPurchases = (state.purchases || []).filter(p => myListingIds.has(p.listingId))

  const totalRevenue = myPurchases.reduce((sum, p) => {
    const listing = myListings.find(l => l.id === p.listingId)
    return sum + (listing?.price || 0)
  }, 0)

  // Clients on paid programs (purchased one of this coach's listings)
  const clientsOnPrograms = myPurchases.reduce((acc, p) => {
    if (!acc.find(x => x.buyerId === p.buyerId)) {
      const listing = myListings.find(l => l.id === p.listingId)
      const user = state.users.find(u => u.id === p.buyerId)
      if (user) acc.push({ ...p, listing, user })
    }
    return acc
  }, [])

  // Today's WOD completion by gym members
  const todayWorkouts = gymWorkouts.filter(w => w.date === TODAY)
  const memberCompletionToday = members.map(member => {
    let logged = 0
    let total = 0
    todayWorkouts.forEach(workout => {
      total += workout.exercises.length
      logged += workout.exercises.filter(ex =>
        gymLogs.some(l => l.userId === member.id && l.exerciseId === ex.id)
      ).length
    })
    return { member, logged, total, pct: total ? Math.round((logged / total) * 100) : 0 }
  })

  // Activity feed — recent workout logs in the gym
  const recentLogs = [...gymLogs]
    .sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt))
    .slice(0, 15)

  const enrichedLogs = recentLogs.map(log => {
    const member = gymUsers.find(u => u.id === log.userId)
    const workout = gymWorkouts.find(w => w.exercises?.some(ex => ex.id === log.exerciseId))
    const exercise = workout?.exercises.find(ex => ex.id === log.exerciseId)
    return { ...log, member, workout, exercise }
  }).filter(l => l.member && l.exercise)

  return (
    <div className="space-y-5">

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-green-500/15 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Total Revenue</span>
          </div>
          <p className="text-2xl font-black text-white">${totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-0.5">{myPurchases.length} sale{myPurchases.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-blue-500/15 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Gym Members</span>
          </div>
          <p className="text-2xl font-black text-white">{members.length}</p>
          <p className="text-xs text-gray-600 mt-0.5">{gymWorkouts.length} workouts posted</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-orange-500/15 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-orange-400" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Programs Listed</span>
          </div>
          <p className="text-2xl font-black text-white">{myListings.length}</p>
          <p className="text-xs text-gray-600 mt-0.5">{myListings.filter(l => l.isPublished).length} published</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-purple-500/15 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-xs text-gray-500 font-medium">Program Clients</span>
          </div>
          <p className="text-2xl font-black text-white">{clientsOnPrograms.length}</p>
          <p className="text-xs text-gray-600 mt-0.5">on paid programs</p>
        </div>
      </div>

      {/* Clients on paid programs */}
      {clientsOnPrograms.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="w-4 h-4 text-orange-400" />
            <h3 className="font-bold text-white text-sm">Clients on Paid Programs</h3>
          </div>
          <div className="space-y-2.5">
            {clientsOnPrograms.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-orange-400 flex-shrink-0">
                  {p.user.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{p.listing?.title || 'Unknown program'}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-green-400">${p.listing?.price || 0}</p>
                  <p className="text-[10px] text-gray-600">{p.purchasedAt ? new Date(p.purchasedAt).toLocaleDateString() : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's WOD completion */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-orange-400" />
            <h3 className="font-bold text-white text-sm">Today's WOD Completion</h3>
          </div>
          <span className="text-xs text-gray-600">{todayWorkouts.length} workout{todayWorkouts.length !== 1 ? 's' : ''} today</span>
        </div>

        {members.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-4">No members yet</p>
        ) : todayWorkouts.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-4">No workout posted for today</p>
        ) : (
          <div className="space-y-2.5">
            {memberCompletionToday.map(({ member, logged, total, pct }) => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-orange-400 flex-shrink-0">
                  {member.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{member.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-orange-500' : 'bg-gray-600'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-bold w-10 text-right flex-shrink-0 ${pct === 100 ? 'text-green-400' : pct > 0 ? 'text-orange-400' : 'text-gray-600'}`}>
                      {total === 0 ? '—' : `${logged}/${total}`}
                    </span>
                  </div>
                </div>
                {pct === 100 && (
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Member activity feed */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-orange-400" />
          <h3 className="font-bold text-white text-sm">Member Activity Feed</h3>
        </div>

        {enrichedLogs.length === 0 ? (
          <div className="text-center py-6">
            <Bell className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">No logs yet — members haven't logged any workouts</p>
          </div>
        ) : (
          <div className="space-y-0 divide-y divide-gray-800">
            {enrichedLogs.map((log, i) => (
              <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-[11px] font-bold text-orange-400 flex-shrink-0 mt-0.5">
                  {log.member.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300">
                    <span className="font-semibold text-white">{log.member.name}</span>
                    {' logged '}
                    <span className="text-orange-400 font-medium">{log.exercise.name}</span>
                  </p>
                  {(log.reps || log.weight) && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {log.weight && <span>{log.weight} · </span>}
                      {log.reps && <span>{log.reps} reps</span>}
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-gray-600 flex-shrink-0 mt-0.5">
                  {log.loggedAt ? timeAgo(log.loggedAt) : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function CoachDashboard() {
  const { state, dispatch, currentUser, currentGym } = useApp()
  const [selectedDate, setSelectedDate] = useState(TODAY)
  const [showAdd, setShowAdd] = useState(false)
  const [editingWorkout, setEditingWorkout] = useState(null)
  const [mainTab, setMainTab] = useState('schedule')

  const gymId = currentUser?.gymId
  const gymWorkouts = state.workouts.filter(w => w.gymId === gymId)
  const gymUsers = state.users.filter(u => u.gymId === gymId)
  const gymLogs = state.workoutLogs.filter(l => l.gymId === gymId)
  const memberCount = gymUsers.filter(u => u.role === 'member').length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">{currentGym?.name ?? 'Dashboard'}</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {gymWorkouts.length} workout{gymWorkouts.length !== 1 ? 's' : ''} scheduled · {memberCount} members
        </p>
      </div>

      {/* Main tab bar */}
      <div className="flex bg-gray-800 rounded-xl p-1 mb-5 gap-1">
        {[
          { key: 'schedule', label: 'Schedule', icon: CalendarDays },
          { key: 'overview', label: 'Overview', icon: TrendingUp },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setMainTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
              mainTab === key ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {mainTab === 'schedule' && (
        <>
          <div className="mb-5">
            <Calendar
              workouts={gymWorkouts}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>

          {selectedDate && (
            <DayDetail
              date={selectedDate}
              workouts={gymWorkouts}
              members={gymUsers}
              logs={gymLogs}
              onDelete={(id) => dispatch({ type: 'DELETE_WORKOUT', workoutId: id })}
              onDuplicate={(id) => dispatch({ type: 'DUPLICATE_WORKOUT', workoutId: id })}
              onAddWorkout={() => setShowAdd(true)}
              onEdit={(workout) => setEditingWorkout(workout)}
            />
          )}
        </>
      )}

      {mainTab === 'overview' && (
        <OverviewTab
          gymWorkouts={gymWorkouts}
          gymUsers={gymUsers}
          gymLogs={gymLogs}
          state={state}
          currentUser={currentUser}
        />
      )}

      {showAdd && selectedDate && (
        <AddWorkoutModal date={selectedDate} onClose={() => setShowAdd(false)} />
      )}

      {editingWorkout && (
        <EditWorkoutModal workout={editingWorkout} onClose={() => setEditingWorkout(null)} />
      )}
    </div>
  )
}
