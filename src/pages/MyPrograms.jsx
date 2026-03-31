import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { BookOpen, ChevronDown, ChevronUp, CheckCircle2, Circle, ExternalLink, Flame, Play, ShoppingBag, Lock } from 'lucide-react'
import { groupExercises, GROUP_STYLES } from '../components/ExerciseBuilder'
import WorkoutSession from '../components/WorkoutSession'
import { useNavigate } from 'react-router-dom'

function WarmupDisplay({ warmup }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-sm font-semibold text-orange-300">Warm Up</span>
          <span className="text-xs text-orange-400/70">{warmup.length} items</span>
        </div>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
      </button>
      {open && (
        <ul className="px-4 pb-3 space-y-1.5 border-t border-orange-500/10">
          {warmup.map((item, i) => (
            <li key={item.id ?? i} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-gray-200">{item.name}</span>
              {item.detail && <span className="text-xs text-gray-500 flex-shrink-0">{item.detail}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const TODAY = new Date().toISOString().split('T')[0]

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

// ─── Single exercise row (display only — logging handled by WorkoutSession) ───
function ExRow({ exercise, myLogs }) {
  const log = myLogs.find(l => l.exerciseId === exercise.id)
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`rounded-xl border p-3 transition-all ${log ? 'bg-green-900/10 border-green-800/40' : 'bg-gray-800 border-gray-700'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {log ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Circle className="w-5 h-5 text-gray-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-semibold text-white text-sm">{exercise.name}</h4>
            <div className="flex items-center gap-2">
              {exercise.demoUrl && (
                <a href={exercise.demoUrl} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-orange-400">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {exercise.notes && (
                <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-white">
                  {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>
          {exercise.setsData?.length ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {exercise.setsData.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs bg-gray-700/60 border border-gray-600/50 rounded px-1.5 py-0.5">
                  <span className="text-orange-400 font-semibold">S{i + 1}</span>
                  <span className="text-gray-200">{s.reps || '—'}{s.weight ? ` @ ${s.weight}` : ''}</span>
                </span>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 text-xs mt-0.5">
              <span className="text-gray-400"><span className="text-white font-medium">{exercise.sets}</span> sets</span>
              <span className="text-gray-400">× <span className="text-white font-medium">{exercise.reps}</span></span>
              {exercise.targetWeight && <span className="text-gray-400">@ <span className="text-white font-medium">{exercise.targetWeight}</span></span>}
            </div>
          )}
          {log?.sets && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {log.sets.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-green-900/30 border border-green-800/40 rounded-md px-1.5 py-0.5 text-xs text-green-300">
                  <span className="text-green-500 font-medium">S{i + 1}</span> {s.reps}×{s.weight}
                </span>
              ))}
            </div>
          )}
          {expanded && exercise.notes && (
            <div className="mt-2 bg-gray-900 rounded-lg px-3 py-2 border border-gray-700">
              <p className="text-xs text-gray-400"><span className="text-orange-400 font-medium">Coach note:</span> {exercise.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Workout card inside a program ───────────────────────────────────────────
function ProgramWorkoutCard({ workout, myLogs }) {
  const [open, setOpen] = useState(false)
  const [sessionOpen, setSessionOpen] = useState(false)
  const loggedCount = workout.exercises.filter(ex => myLogs.some(l => l.exerciseId === ex.id)).length
  const total = workout.exercises.length
  const pct = total ? Math.round((loggedCount / total) * 100) : 0
  const isToday = workout.date === TODAY
  const isPast = workout.date < TODAY
  const isFuture = workout.date > TODAY

  const startLabel = pct === 0 ? 'Start Workout' : pct === 100 ? 'Edit Workout' : `Continue · ${pct}%`

  return (
    <div className={`rounded-xl border ${isToday ? 'border-orange-500/40 bg-orange-500/5' : isPast ? 'border-gray-800 bg-gray-900/30' : 'border-gray-700 bg-gray-900'}`}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left">
        <div>
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            {isToday && <span className="text-[10px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full font-bold">Today</span>}
            {isPast && pct === 100 && <span className="text-[10px] text-green-400 font-semibold">✓ Done</span>}
            {isFuture && <span className="text-[10px] text-gray-600 font-medium">Upcoming</span>}
            <span className="text-xs text-gray-500">{formatDate(workout.date)}</span>
          </div>
          <p className="text-sm font-semibold text-white">{workout.title}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <p className="text-xs text-gray-500">{loggedCount}/{total}</p>
            {total > 0 && (
              <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden mt-1">
                <div className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${pct}%` }} />
              </div>
            )}
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {/* Start Workout button */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setSessionOpen(true)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            pct === 100
              ? 'bg-green-900/30 text-green-400 border border-green-800/50 hover:bg-green-900/50'
              : 'btn-primary'
          }`}
        >
          <Play className="w-4 h-4" /> {startLabel}
        </button>
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-gray-800 pt-3">
          {workout.warmup?.length > 0 && <WarmupDisplay warmup={workout.warmup} />}
          {groupExercises(workout.exercises).map((item) => {
            if (item.kind === 'single') {
              return <ExRow key={item.exercise.id} exercise={item.exercise} myLogs={myLogs} />
            }
            const style = GROUP_STYLES[item.kind] || GROUP_STYLES.superset
            const allLogged = item.exercises.every(ex => myLogs.some(l => l.exerciseId === ex.id))
            return (
              <div key={item.groupId} className={`rounded-xl border ${style.border} overflow-hidden`}>
                <div className={`flex items-center justify-between px-3 py-1.5 ${style.headerBg}`}>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>{style.label}</span>
                  {allLogged && <span className="text-[10px] text-green-400 font-semibold">✓ Done</span>}
                </div>
                <div className="divide-y divide-gray-800 bg-gray-900/40">
                  {item.exercises.map((ex, i) => (
                    <div key={ex.id} className="relative">
                      <div className={`absolute left-3 top-3 w-5 h-5 rounded-full text-[10px] font-black text-white flex items-center justify-center z-10 ${style.letterBg}`}>
                        {LETTERS[i]}
                      </div>
                      <div className="pl-10">
                        <ExRow exercise={ex} myLogs={myLogs} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {sessionOpen && (
        <WorkoutSession workout={workout} myLogs={myLogs} onClose={() => setSessionOpen(false)} />
      )}
    </div>
  )
}

// ─── Program card ─────────────────────────────────────────────────────────────
function ProgramCard({ program }) {
  const { state, currentUser } = useApp()
  const [weekFilter, setWeekFilter] = useState('current')
  const myLogs = state.workoutLogs.filter(l => l.userId === currentUser.id)

  const allWorkouts = program.workouts.sort((a, b) => a.date.localeCompare(b.date))
  const totalExercises = allWorkouts.reduce((n, w) => n + w.exercises.length, 0)
  const loggedExercises = allWorkouts.reduce((n, w) =>
    n + w.exercises.filter(ex => myLogs.some(l => l.exerciseId === ex.id)).length, 0)
  const pct = totalExercises ? Math.round((loggedExercises / totalExercises) * 100) : 0

  // Group workouts by week number
  const byWeek = {}
  allWorkouts.forEach(w => {
    const wk = w.weekNumber || 1
    if (!byWeek[wk]) byWeek[wk] = []
    byWeek[wk].push(w)
  })
  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => a - b)

  // Find current week (workouts closest to today)
  const currentWeekNum = (() => {
    const future = allWorkouts.filter(w => w.date >= TODAY)
    if (future.length) return future[0].weekNumber || 1
    const past = allWorkouts.filter(w => w.date < TODAY)
    if (past.length) return past[past.length - 1].weekNumber || 1
    return weeks[0] || 1
  })()

  const activeWeek = weekFilter === 'current' ? currentWeekNum : Number(weekFilter)
  const visibleWorkouts = byWeek[activeWeek] || []

  return (
    <div className="card">
      {/* Program header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-bold text-white text-lg leading-tight">{program.name}</h2>
          {program.description && <p className="text-sm text-gray-400 mt-0.5">{program.description}</p>}
          <p className="text-xs text-gray-500 mt-1">{program.totalWeeks}-week program · {allWorkouts.length} workouts</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-2xl font-black text-orange-400">{pct}%</p>
          <p className="text-xs text-gray-500">complete</p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-orange-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Week selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
        <button
          onClick={() => setWeekFilter('current')}
          className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
            weekFilter === 'current' ? 'bg-orange-500 border-orange-400 text-white' : 'border-gray-700 text-gray-400 hover:text-white'
          }`}
        >
          Current
        </button>
        {weeks.map(wk => {
          const wkWorkouts = byWeek[wk] || []
          const wkLogged = wkWorkouts.reduce((n, w) =>
            n + w.exercises.filter(ex => myLogs.some(l => l.exerciseId === ex.id)).length, 0)
          const wkTotal = wkWorkouts.reduce((n, w) => n + w.exercises.length, 0)
          const wkDone = wkTotal > 0 && wkLogged === wkTotal
          return (
            <button
              key={wk}
              onClick={() => setWeekFilter(String(wk))}
              className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                weekFilter === String(wk)
                  ? 'bg-orange-500 border-orange-400 text-white'
                  : wkDone
                  ? 'border-green-800 text-green-400 bg-green-900/20'
                  : 'border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              W{wk} {wkDone ? '✓' : ''}
            </button>
          )
        })}
      </div>

      {/* Workouts for selected week */}
      {visibleWorkouts.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">No workouts in this week</p>
      ) : (
        <div className="space-y-2">
          {visibleWorkouts.map(workout => (
            <ProgramWorkoutCard key={workout.id} workout={workout} myLogs={myLogs} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Purchased Program Card ────────────────────────────────────────────────────
function PurchasedCard({ listing }) {
  const [openWeek, setOpenWeek] = useState(null)

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <div className="text-4xl">{listing.thumbnail}</div>
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-white text-lg leading-tight">{listing.title}</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            by {listing.coachName} · {listing.durationWeeks} weeks · {listing.daysPerWeek} days/wk
          </p>
          {listing.shortDesc && (
            <p className="text-sm text-gray-400 mt-1">{listing.shortDesc}</p>
          )}
        </div>
      </div>

      {/* Week list */}
      <div className="space-y-2">
        {(listing.weeks || []).map((week, wi) => (
          <div key={wi} className="border border-gray-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setOpenWeek(openWeek === wi ? null : wi)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/40 hover:bg-gray-800/60 transition-colors text-left"
            >
              <span className="text-sm font-bold text-white">Week {week.weekNum}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">{week.workouts?.length || 0} workouts</span>
                {openWeek === wi
                  ? <ChevronUp className="w-4 h-4 text-gray-500" />
                  : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </div>
            </button>
            {openWeek === wi && (
              <div className="divide-y divide-gray-800">
                {(week.workouts || []).map((wo, woi) => (
                  <div key={woi} className="px-4 py-3">
                    <p className="text-xs text-gray-500">{wo.day}</p>
                    <p className="text-sm font-semibold text-white mb-2">{wo.title}</p>
                    <div className="space-y-1">
                      {(wo.exercises || []).map((exr, ei) => (
                        <div key={ei} className="flex items-center gap-2 text-xs text-gray-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0" />
                          <span className="text-white">{exr.name}</span>
                          <span className="text-gray-600">
                            {exr.setsData?.length || exr.sets}×{exr.setsData?.[0]?.reps || exr.reps}
                            {exr.setsData?.[0]?.weight ? ` @ ${exr.setsData[0].weight}` : ''}
                          </span>
                          {exr.notes ? <span className="text-gray-600 italic truncate">{exr.notes}</span> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Remaining locked weeks */}
        {listing.durationWeeks > (listing.weeks?.length || 0) && (
          <div className="flex items-center justify-between px-4 py-3 border border-gray-800 border-dashed rounded-xl">
            <span className="text-sm text-gray-600">
              + {listing.durationWeeks - (listing.weeks?.length || 0)} more weeks (content being added)
            </span>
            <Lock className="w-4 h-4 text-gray-700" />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MyPrograms() {
  const { state, currentUser } = useApp()
  const navigate = useNavigate()
  const [tab, setTab] = useState('assigned')

  const gymId = currentUser?.gymId
  const gymWorkouts = state.workouts.filter(w => w.gymId === gymId)

  // Find workouts assigned specifically to this member that came from a program
  const assignedWorkouts = gymWorkouts.filter(w =>
    w.assignedTo === currentUser?.id && w.fromProgram
  )

  // Group by program
  const programMap = {}
  assignedWorkouts.forEach(w => {
    if (!programMap[w.fromProgram]) programMap[w.fromProgram] = []
    programMap[w.fromProgram].push(w)
  })

  // Build program objects with details
  const programs = Object.entries(programMap).map(([progId, workouts]) => {
    const prog = state.programs.find(p => p.id === progId)
    return {
      id: progId,
      name: prog?.name || 'Assigned Program',
      description: prog?.description || '',
      totalWeeks: prog?.totalWeeks || Math.max(...workouts.map(w => w.weekNumber || 1)),
      workouts,
    }
  })

  // Purchased store programs
  const myPurchases = (state.purchases || []).filter(p => p.buyerId === currentUser?.id)
  const purchasedListings = myPurchases
    .map(p => (state.programListings || []).find(l => l.id === p.listingId))
    .filter(Boolean)

  const purchasedCount = purchasedListings.length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-orange-400" /> My Programs
        </h1>
      </div>

      {/* Tab toggle */}
      <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 mb-5">
        <button
          onClick={() => setTab('assigned')}
          className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'assigned' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'}`}
        >
          Gym Programs
        </button>
        <button
          onClick={() => setTab('purchased')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-bold transition-all ${tab === 'purchased' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:text-white'}`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Purchased
          {purchasedCount > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${tab === 'purchased' ? 'bg-white/20' : 'bg-orange-500/20 text-orange-400'}`}>
              {purchasedCount}
            </span>
          )}
        </button>
      </div>

      {/* Assigned tab */}
      {tab === 'assigned' && (
        programs.length === 0 ? (
          <div className="card text-center py-14">
            <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-300 font-semibold">No programs assigned yet</p>
            <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
              Your coach will assign a program to your account. Check back soon or message them directly.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {programs.map(prog => (
              <ProgramCard key={prog.id} program={prog} />
            ))}
          </div>
        )
      )}

      {/* Purchased tab */}
      {tab === 'purchased' && (
        purchasedListings.length === 0 ? (
          <div className="card text-center py-14">
            <ShoppingBag className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-300 font-semibold">No purchased programs yet</p>
            <p className="text-gray-500 text-sm mt-1 mb-5">
              Browse the store to find coach-designed programs for every goal
            </p>
            <button
              onClick={() => navigate('/store')}
              className="btn-primary px-6 py-2.5 font-bold inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" /> Browse the Store
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {purchasedListings.map(listing => (
              <PurchasedCard key={listing.id} listing={listing} />
            ))}
            <button
              onClick={() => navigate('/store')}
              className="w-full py-3 border border-dashed border-gray-700 hover:border-orange-500/40 hover:text-orange-400 text-gray-500 rounded-2xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" /> Browse More Programs
            </button>
          </div>
        )
      )}
    </div>
  )
}
