import { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  Plus, Trash2, ChevronLeft, ChevronRight, X, Copy,
  Layers, Rocket, BookOpen, Users, User, Check, ExternalLink, Pencil
} from 'lucide-react'
import ExerciseBuilder, { newEx, groupExercises, GROUP_STYLES } from '../components/ExerciseBuilder'
import WarmupSection, { newWarmupItem } from '../components/WarmupSection'
import { insertWorkout, isSupabaseEnabled } from '../lib/supabase'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

// ─── New Program Modal ────────────────────────────────────────────────────────
function NewProgramModal({ onClose }) {
  const { dispatch } = useApp()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [totalWeeks, setTotalWeeks] = useState(12)

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch({ type: 'ADD_PROGRAM', name, description, totalWeeks: Number(totalWeeks) })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-bold">New Program</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Program Name</label>
            <input className="input" placeholder="e.g. 12-Week Strength Block" value={name}
              onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
            <textarea className="input resize-none" rows={2} placeholder="What is this program about?"
              value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Total Weeks</label>
            <div className="flex gap-2 flex-wrap">
              {[4, 6, 8, 10, 12, 16].map(w => (
                <button key={w} type="button" onClick={() => setTotalWeeks(w)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                    totalWeeks === w
                      ? 'bg-orange-500 border-orange-400 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                  }`}>
                  {w}w
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Create Program</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Add Workout to Program Modal ─────────────────────────────────────────────
function AddProgramWorkoutModal({ programId, week, day, onClose }) {
  const { dispatch } = useApp()
  const [title, setTitle] = useState('')
  const [warmup, setWarmup] = useState([])
  const [exercises, setExercises] = useState([newEx()])

  const handleSubmit = (e) => {
    e.preventDefault()
    const valid = exercises
      .filter(ex => ex.name.trim())
      .map(ex => ({ ...ex, id: 'ex-' + Math.random().toString(36).slice(2), sets: Number(ex.sets) || 1 }))
    if (!valid.length) return
    const validWarmup = warmup.filter(w => w.name.trim())
    dispatch({ type: 'ADD_PROGRAM_WORKOUT', programId, week, day, title, warmup: validWarmup, exercises: valid })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h3 className="font-bold">Add Workout</h3>
            <p className="text-sm text-orange-400 mt-0.5">Week {week} · {day}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Workout Title</label>
            <input className="input" placeholder="e.g. Lower Body Strength" value={title}
              onChange={e => setTitle(e.target.value)} required />
          </div>
          <WarmupSection warmup={warmup} setWarmup={setWarmup} />
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Exercises</h3>
            <ExerciseBuilder exercises={exercises} setExercises={setExercises} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Add to Program</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Edit Program Workout Modal ───────────────────────────────────────────────
function EditProgramWorkoutModal({ programId, week, pw, onClose }) {
  const { dispatch } = useApp()
  const [title, setTitle] = useState(pw.title || '')
  const [warmup, setWarmup] = useState(pw.warmup?.length ? pw.warmup : [])
  const [exercises, setExercises] = useState(
    pw.exercises?.length
      ? pw.exercises.map(ex => ({
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
    const valid = exercises
      .filter(ex => ex.name.trim())
      .map(ex => ({ ...ex, id: ex.id || 'ex-' + Math.random().toString(36).slice(2) }))
    if (!valid.length) return
    const validWarmup = warmup.filter(w => w.name.trim())
    dispatch({
      type: 'UPDATE_PROGRAM_WORKOUT',
      programId,
      week,
      pwId: pw.id,
      title,
      warmup: validWarmup,
      exercises: valid,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h3 className="font-bold">Edit Workout</h3>
            <p className="text-sm text-orange-400 mt-0.5">Week {week} · {pw.day}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Workout Title</label>
            <input className="input" placeholder="e.g. Lower Body Strength" value={title}
              onChange={e => setTitle(e.target.value)} required />
          </div>
          <WarmupSection warmup={warmup} setWarmup={setWarmup} />
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Exercises</h3>
            <ExerciseBuilder exercises={exercises} setExercises={setExercises} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Mini Calendar Picker ─────────────────────────────────────────────────────
const CAL_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function CalendarPicker({ value, onChange }) {
  const today = new Date()
  const selected = value ? new Date(value + 'T12:00:00') : null

  const [viewYear, setViewYear] = useState(selected ? selected.getFullYear() : today.getFullYear())
  const [viewMonth, setViewMonth] = useState(selected ? selected.getMonth() : today.getMonth())

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const handleDay = (day) => {
    const d = new Date(viewYear, viewMonth, day)
    onChange(d.toISOString().split('T')[0])
  }

  const isSelected = (day) => {
    if (!selected) return false
    return selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === day
  }
  const isToday = (day) => {
    return today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day
  }

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-white">{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {CAL_DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-500 py-1">{d}</div>
        ))}
      </div>
      {/* Cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => (
          <div key={i} className="flex items-center justify-center">
            {day ? (
              <button
                onClick={() => handleDay(day)}
                className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                  isSelected(day)
                    ? 'bg-orange-500 text-white font-bold shadow-lg shadow-orange-500/30'
                    : isToday(day)
                    ? 'bg-gray-700 text-orange-400 font-bold'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {day}
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {selected && (
        <p className="text-center text-xs text-orange-400 mt-3 font-medium">
          {selected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      )}
    </div>
  )
}

// ─── Deploy Modal ─────────────────────────────────────────────────────────────
const DAY_OFFSETS = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 }

function DeployModal({ program, onClose }) {
  const { state, dispatch } = useApp()
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) + 7
    d.setDate(diff)
    return d.toISOString().split('T')[0]
  })
  const [assignTo, setAssignTo] = useState('all') // 'all' | userId
  const [deployed, setDeployed] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [deployError, setDeployError] = useState(null)

  // Both gym members and non-members in this gym can be assigned programs
  const currentUser = state.users.find(u => u.id === state.currentUserId)
  const gymId = currentUser?.gymId
  const members = state.users.filter(u =>
    u.gymId === gymId && (u.role === 'member' || u.role === 'nonmember')
  )

  // Count total workouts that will be created
  const totalWorkouts = Object.values(program.weeks).reduce((n, w) => n + w.length, 0)
  const weeksWithContent = Object.keys(program.weeks).filter(k => program.weeks[k].length > 0).length

  // Preview first week
  const firstWeekWorkouts = program.weeks['1'] || []
  const previewDates = firstWeekWorkouts.map(pw => {
    const d = new Date(startDate + 'T12:00:00')
    d.setDate(d.getDate() + (DAY_OFFSETS[pw.day] ?? 0))
    return { day: pw.day, title: pw.title, date: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) }
  })

  const endDate = (() => {
    const d = new Date(startDate + 'T12:00:00')
    d.setDate(d.getDate() + (program.totalWeeks - 1) * 7 + 6)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  })()

  const handleDeploy = async () => {
    setDeploying(true)
    setDeployError(null)

    const assignToId = assignTo === 'all' ? null : assignTo
    const start = new Date(startDate + 'T12:00:00')

    // Pre-build workouts so we can save them to Supabase with matching IDs
    const builtWorkouts = []
    for (let week = 1; week <= program.totalWeeks; week++) {
      for (const pw of program.weeks[String(week)] || []) {
        const d = new Date(start)
        d.setDate(start.getDate() + (week - 1) * 7 + (DAY_OFFSETS[pw.day] ?? 0))
        builtWorkouts.push({
          id: 'workout-' + Date.now() + '-' + Math.random().toString(36).slice(2),
          title: pw.title,
          date: d.toISOString().split('T')[0],
          gymId: gymId || null,
          createdBy: state.currentUserId,
          createdAt: new Date().toISOString(),
          exercises: pw.exercises.map(ex => ({ ...ex, id: 'ex-' + Math.random().toString(36).slice(2) })),
          warmup: pw.warmup || [],
          fromProgram: program.id,
          weekNumber: week,
          assignedTo: assignToId,
        })
      }
    }

    // Dispatch to local state first (instant UI update)
    dispatch({
      type: 'DEPLOY_PROGRAM',
      programId: program.id,
      startDate,
      assignTo: assignToId,
      workouts: builtWorkouts,
    })

    // Save each workout to Supabase so all members can see them
    if (isSupabaseEnabled) {
      try {
        for (const w of builtWorkouts) {
          const { error } = await insertWorkout(w)
          if (error) console.error('Failed to save workout to Supabase:', error.message)
        }
      } catch (err) {
        console.error('Supabase deploy error:', err)
        setDeployError('Saved locally, but cloud sync had an issue. Members may need to refresh.')
      }
    }

    setDeploying(false)
    setDeployed(true)
  }

  if (deployed) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm text-center p-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">Program Deployed!</h3>
          <p className="text-gray-400 text-sm mb-1">
            {totalWorkouts} workouts added to the calendar
          </p>
          <p className="text-gray-500 text-xs mb-1">
            {new Date(startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {endDate}
          </p>
          {isSupabaseEnabled && (
            <p className="text-xs text-green-500/70 mb-4">✓ Synced to cloud — members can see it now</p>
          )}
          {deployError && (
            <p className="text-xs text-yellow-500 mb-4">{deployError}</p>
          )}
          <button onClick={onClose} className="btn-primary w-full">Done</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md my-4">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h3 className="font-bold">Deploy Program</h3>
            <p className="text-sm text-orange-400 mt-0.5">{program.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-5">

          {/* Summary */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-lg font-bold text-orange-400">{program.totalWeeks}</p>
              <p className="text-xs text-gray-500">Weeks</p>
            </div>
            <div>
              <p className="text-lg font-bold text-orange-400">{weeksWithContent}</p>
              <p className="text-xs text-gray-500">Built</p>
            </div>
            <div>
              <p className="text-lg font-bold text-orange-400">{totalWorkouts}</p>
              <p className="text-xs text-gray-500">Workouts</p>
            </div>
          </div>

          {/* Start date — calendar picker */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Start Date
              <span className="text-gray-600 ml-1">— pick any date to begin Week 1</span>
            </label>
            <CalendarPicker value={startDate} onChange={setStartDate} />
            {startDate && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Program runs {new Date(startDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → {endDate}
              </p>
            )}
          </div>

          {/* Assign to */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Assign To</label>
            <div className="space-y-2">
              <button
                onClick={() => setAssignTo('all')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition ${
                  assignTo === 'all' ? 'bg-orange-500/10 border-orange-500/40' : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                }`}
              >
                <Users className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium">All Gym Members</p>
                  <p className="text-xs text-gray-500">Visible to all gym members only</p>
                </div>
                {assignTo === 'all' && <Check className="w-4 h-4 text-orange-400 ml-auto" />}
              </button>
              {members.map(m => (
                <button
                  key={m.id}
                  onClick={() => setAssignTo(m.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition ${
                    assignTo === m.id ? 'bg-orange-500/10 border-orange-500/40' : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-orange-400 flex-shrink-0">
                    {m.initials}
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-gray-500">
                      {m.role === 'nonmember' ? 'Non-Member' : 'Gym Member'} · Individual program
                    </p>
                  </div>
                  {assignTo === m.id && <Check className="w-4 h-4 text-orange-400 ml-auto" />}
                </button>
              ))}
            </div>
          </div>

          {/* Week 1 preview */}
          {previewDates.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Week 1 Preview</p>
              <div className="space-y-1.5">
                {previewDates.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-500 w-8">{p.date.split(',')[0]}</span>
                    <span className="text-gray-400">{p.date}</span>
                    <span className="text-white font-medium ml-auto">{p.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button
              onClick={handleDeploy}
              disabled={weeksWithContent === 0 || deploying}
              className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {deploying ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  Deploying…
                </>
              ) : (
                <><Rocket className="w-4 h-4" /> Deploy</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Program Editor ───────────────────────────────────────────────────────────
function ProgramEditor({ programId, onBack }) {
  const { state, dispatch } = useApp()
  const program = state.programs.find(p => p.id === programId)
  const [selectedWeek, setSelectedWeek] = useState(1)
  const [addWorkout, setAddWorkout] = useState(null) // { day }
  const [editWorkout, setEditWorkout] = useState(null) // pw object
  const [copyFrom, setCopyFrom] = useState('')

  if (!program) { onBack(); return null }

  const weekWorkouts = program.weeks[String(selectedWeek)] || []
  const workoutsByDay = DAYS.reduce((acc, d) => {
    acc[d] = weekWorkouts.filter(w => w.day === d)
    return acc
  }, {})

  const totalExercises = Object.values(program.weeks).flat().reduce((n, w) => n + w.exercises.length, 0)

  const handleCopyWeek = () => {
    if (!copyFrom || Number(copyFrom) === selectedWeek) return
    dispatch({ type: 'COPY_PROGRAM_WEEK', programId, fromWeek: Number(copyFrom), toWeek: selectedWeek })
    setCopyFrom('')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{program.name}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{program.totalWeeks} weeks · {totalExercises} exercises total</p>
        </div>
      </div>

      {/* Week tabs */}
      <div className="overflow-x-auto pb-2 mb-4">
        <div className="flex gap-1.5 min-w-max">
          {Array.from({ length: program.totalWeeks }, (_, i) => i + 1).map(w => {
            const hasContent = (program.weeks[String(w)] || []).length > 0
            return (
              <button
                key={w}
                onClick={() => setSelectedWeek(w)}
                className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all min-w-[44px] ${
                  selectedWeek === w
                    ? 'bg-orange-500 text-white'
                    : hasContent
                    ? 'bg-gray-800 text-white border border-orange-500/30'
                    : 'bg-gray-800 text-gray-500 hover:text-white'
                }`}
              >
                W{w}
                {hasContent && selectedWeek !== w && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-orange-400" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Copy week from */}
      <div className="flex items-center gap-2 mb-4">
        <select
          className="input flex-1 text-sm"
          value={copyFrom}
          onChange={e => setCopyFrom(e.target.value)}
        >
          <option value="">Copy workouts from week...</option>
          {Array.from({ length: program.totalWeeks }, (_, i) => i + 1)
            .filter(w => w !== selectedWeek && (program.weeks[String(w)] || []).length > 0)
            .map(w => (
              <option key={w} value={w}>Week {w} ({(program.weeks[String(w)] || []).length} workouts)</option>
            ))}
        </select>
        <button
          onClick={handleCopyWeek}
          disabled={!copyFrom}
          className="btn-ghost flex items-center gap-1.5 text-sm flex-shrink-0"
        >
          <Copy className="w-3.5 h-3.5" /> Copy
        </button>
      </div>

      {/* Day slots */}
      <div className="space-y-3">
        {DAYS.map(day => {
          const dayWorkouts = workoutsByDay[day]
          return (
            <div key={day} className="card">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-gray-300">{day}</span>
                <button
                  onClick={() => setAddWorkout({ day })}
                  className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300"
                >
                  <Plus className="w-3.5 h-3.5" /> Add workout
                </button>
              </div>

              {dayWorkouts.length === 0 ? (
                <p className="text-xs text-gray-600 italic">Rest day</p>
              ) : (
                <div className="space-y-2">
                  {dayWorkouts.map(w => (
                    <div key={w.id} className="bg-gray-800 rounded-xl p-3 border border-gray-700 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm text-white truncate">{w.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {w.exercises.length} exercise{w.exercises.length !== 1 ? 's' : ''} · {' '}
                          {w.exercises.slice(0, 3).map(e => e.name).join(', ')}
                          {w.exercises.length > 3 ? '...' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditWorkout(w)}
                          className="text-gray-500 hover:text-orange-400 transition-colors"
                          title="Edit workout"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => dispatch({ type: 'DELETE_PROGRAM_WORKOUT', programId, week: selectedWeek, pwId: w.id })}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                          title="Delete workout"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {addWorkout && (
        <AddProgramWorkoutModal
          programId={programId}
          week={selectedWeek}
          day={addWorkout.day}
          onClose={() => setAddWorkout(null)}
        />
      )}

      {editWorkout && (
        <EditProgramWorkoutModal
          programId={programId}
          week={selectedWeek}
          pw={editWorkout}
          onClose={() => setEditWorkout(null)}
        />
      )}
    </div>
  )
}

// ─── Program List ─────────────────────────────────────────────────────────────
function ProgramList({ onEdit }) {
  const { state, dispatch, currentUser } = useApp()
  const [showNew, setShowNew] = useState(false)
  const [deploying, setDeploying] = useState(null)

  const gymPrograms = state.programs.filter(p => p.gymId === currentUser?.gymId)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Programs</h1>
          <p className="text-gray-400 text-sm mt-0.5">Build and deploy training cycles</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Program
        </button>
      </div>

      {gymPrograms.length === 0 ? (
        <div className="card text-center py-14">
          <Layers className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-300 font-semibold">No programs yet</p>
          <p className="text-gray-500 text-sm mt-1 mb-5">Create a program to build and deploy a full training cycle to your members</p>
          <button onClick={() => setShowNew(true)} className="btn-primary mx-auto flex items-center gap-2 w-fit">
            <Plus className="w-4 h-4" /> Create Your First Program
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {gymPrograms.map(prog => {
            const totalWorkouts = Object.values(prog.weeks).reduce((n, w) => n + w.length, 0)
            const builtWeeks = Object.keys(prog.weeks).filter(k => prog.weeks[k].length > 0).length
            const totalExercises = Object.values(prog.weeks).flat().reduce((n, w) => n + w.exercises.length, 0)
            const pct = Math.round((builtWeeks / prog.totalWeeks) * 100)

            return (
              <div key={prog.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <BookOpen className="w-4 h-4 text-orange-400 flex-shrink-0" />
                      <h3 className="font-bold truncate">{prog.name}</h3>
                    </div>
                    {prog.description && <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{prog.description}</p>}
                  </div>
                  <button
                    onClick={() => dispatch({ type: 'DELETE_PROGRAM', programId: prog.id })}
                    className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mt-3 mb-3">
                  {[
                    { label: 'Weeks', value: prog.totalWeeks },
                    { label: 'Workouts', value: totalWorkouts },
                    { label: 'Exercises', value: totalExercises },
                  ].map(s => (
                    <div key={s.label} className="bg-gray-800 rounded-lg px-3 py-2 text-center">
                      <p className="text-base font-bold text-white">{s.value}</p>
                      <p className="text-xs text-gray-500">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Build progress */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Build progress</span>
                    <span>{builtWeeks}/{prog.totalWeeks} weeks</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-orange-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onEdit(prog.id)}
                    className="btn-ghost flex-1 flex items-center justify-center gap-1.5 text-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setDeploying(prog)}
                    disabled={totalWorkouts === 0}
                    className="btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm disabled:opacity-40"
                  >
                    <Rocket className="w-3.5 h-3.5" /> Deploy
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showNew && <NewProgramModal onClose={() => setShowNew(false)} />}
      {deploying && <DeployModal program={deploying} onClose={() => setDeploying(null)} />}
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function Programs() {
  const [mode, setMode] = useState('list')
  const [editingId, setEditingId] = useState(null)

  if (mode === 'edit' && editingId) {
    return (
      <ProgramEditor
        programId={editingId}
        onBack={() => { setMode('list'); setEditingId(null) }}
      />
    )
  }

  return <ProgramList onEdit={(id) => { setEditingId(id); setMode('edit') }} />
}
