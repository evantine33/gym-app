import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { ExternalLink, CheckCircle2, Circle, ChevronDown, ChevronUp, X, Flame, Trophy, Plus, Minus } from 'lucide-react'
import { groupExercises, GROUP_STYLES } from '../components/ExerciseBuilder'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

const TODAY = new Date().toISOString().split('T')[0]

function formatDayLabel(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  })
}

function formatShortDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function getWeekRange() {
  const d = new Date()
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  }
}

// Build initial per-set rows from existing log, setsData, or legacy fields
function buildInitialSets(exercise, existingLog) {
  if (existingLog?.sets?.length) return existingLog.sets.map(s => ({ ...s }))
  if (exercise.setsData?.length) {
    return exercise.setsData.map(s => ({ reps: s.reps || '', weight: s.weight || '' }))
  }
  return Array.from({ length: parseInt(exercise.sets) || 1 }, () => ({
    reps: exercise.reps || '',
    weight: exercise.targetWeight || '',
  }))
}

function LogModal({ exercise, workoutId, existingLog, onClose }) {
  const { dispatch } = useApp()
  const [sets, setSets] = useState(() => buildInitialSets(exercise, existingLog))
  const [notes, setNotes] = useState(existingLog?.notes || '')

  const updateSet = (i, field, value) =>
    setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))

  const addSet = () => {
    const last = sets[sets.length - 1]
    setSets(prev => [...prev, { reps: last?.reps || '', weight: last?.weight || '' }])
  }

  const removeSet = (i) =>
    setSets(prev => prev.filter((_, idx) => idx !== i))

  const handleSave = () => {
    dispatch({
      type: 'LOG_EXERCISE',
      log: { workoutId, exerciseId: exercise.id, sets, notes },
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800 flex-shrink-0">
          <div>
            <h3 className="font-bold text-white">{exercise.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {exercise.setsData?.length
                ? `${exercise.setsData.length} sets · log your actual reps & weight`
                : `Target: ${exercise.sets} × ${exercise.reps}${exercise.targetWeight ? ` @ ${exercise.targetWeight}` : ''}`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Set rows */}
        <div className="overflow-y-auto flex-1 p-5">
          {/* Column headers */}
          <div className="grid grid-cols-[40px_1fr_1fr_32px] gap-2 mb-2 px-1">
            <span className="text-xs text-gray-500 font-medium">Set</span>
            <span className="text-xs text-gray-500 font-medium">Reps</span>
            <span className="text-xs text-gray-500 font-medium">Weight</span>
            <span />
          </div>

          <div className="space-y-2">
            {sets.map((s, i) => (
              <div key={i} className="grid grid-cols-[40px_1fr_1fr_32px] gap-2 items-center">
                {/* Set number badge */}
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${i < (exercise.setsData?.length ?? exercise.sets) ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-700 text-gray-400'}`}>
                  {i + 1}
                </div>
                <input
                  className="input h-9 text-center text-sm"
                  placeholder="Reps"
                  value={s.reps}
                  onChange={e => updateSet(i, 'reps', e.target.value)}
                />
                <input
                  className="input h-9 text-center text-sm"
                  placeholder="Weight"
                  value={s.weight}
                  onChange={e => updateSet(i, 'weight', e.target.value)}
                />
                {sets.length > 1 ? (
                  <button
                    onClick={() => removeSet(i)}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-red-400 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                ) : <span />}
              </div>
            ))}
          </div>

          {/* Add set */}
          <button
            onClick={addSet}
            className="mt-3 w-full flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-orange-400 border border-dashed border-gray-700 hover:border-orange-500/50 rounded-lg py-2 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Set
          </button>

          {/* Notes */}
          <div className="mt-4">
            <label className="block text-xs text-gray-500 mb-1.5">Notes (optional)</label>
            <textarea
              className="input resize-none text-sm"
              rows={2}
              placeholder="How did it feel? Any PRs?"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-gray-800 flex-shrink-0">
          <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1">Save Log</button>
        </div>
      </div>
    </div>
  )
}

function ExerciseRow({ exercise, workoutId, myLogs }) {
  const log = myLogs.find(l => l.exerciseId === exercise.id)
  const [showLog, setShowLog] = useState(false)
  const [expanded, setExpanded] = useState(false)

  // Best set: highest weight logged
  const bestSet = log?.sets?.reduce((best, s) => {
    const w = parseFloat(s.weight) || 0
    return w > (parseFloat(best?.weight) || 0) ? s : best
  }, null)

  return (
    <>
      <div className={`rounded-xl border transition-all ${log ? 'bg-green-900/10 border-green-800/40' : 'bg-gray-800 border-gray-700'} p-4`}>
        <div className="flex items-start gap-3">
          <button onClick={() => setShowLog(true)} className="flex-shrink-0 mt-0.5">
            {log
              ? <CheckCircle2 className="w-5 h-5 text-green-400" />
              : <Circle className="w-5 h-5 text-gray-500 hover:text-orange-400 transition-colors" />
            }
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-semibold text-white">{exercise.name}</h4>
              <div className="flex items-center gap-2">
                {exercise.demoUrl && (
                  <a href={exercise.demoUrl} target="_blank" rel="noreferrer" className="text-gray-500 hover:text-orange-400 transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                {exercise.notes && (
                  <button onClick={() => setExpanded(!expanded)} className="text-gray-500 hover:text-white">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Target — per-set or legacy simple display */}
            {exercise.setsData?.length ? (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {exercise.setsData.map((s, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-xs bg-gray-700/60 border border-gray-600/50 rounded px-1.5 py-0.5">
                    <span className="text-orange-400 font-semibold">S{i + 1}</span>
                    <span className="text-gray-200">{s.reps || '—'}{s.weight ? ` @ ${s.weight}` : ''}</span>
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 text-sm mt-1">
                <span className="text-gray-400"><span className="text-white font-medium">{exercise.sets}</span> sets</span>
                <span className="text-gray-400">× <span className="text-white font-medium">{exercise.reps}</span> reps</span>
                {exercise.targetWeight && (
                  <span className="text-gray-400">@ <span className="text-white font-medium">{exercise.targetWeight}</span></span>
                )}
              </div>
            )}

            {/* Per-set log summary */}
            {log?.sets && (
              <div className="mt-2 space-y-1">
                <div className="flex flex-wrap gap-1.5">
                  {log.sets.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-green-900/30 border border-green-800/40 rounded-md px-2 py-0.5 text-xs text-green-300">
                      <span className="text-green-500 font-medium">S{i + 1}</span>
                      {s.reps} × {s.weight}
                    </span>
                  ))}
                </div>
                {log.notes && <p className="text-xs text-gray-500 italic mt-1">"{log.notes}"</p>}
              </div>
            )}

            {/* Coach note */}
            {expanded && exercise.notes && (
              <div className="mt-2 bg-gray-900 rounded-lg px-3 py-2 border border-gray-700">
                <p className="text-xs text-gray-400"><span className="text-orange-400 font-medium">Coach note:</span> {exercise.notes}</p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowLog(true)}
          className={`mt-3 w-full text-sm rounded-lg py-1.5 transition-colors border ${
            log
              ? 'text-gray-500 hover:text-gray-300 border-gray-700 hover:border-gray-600'
              : 'text-orange-400 hover:text-orange-300 border-orange-500/30 hover:border-orange-400/50'
          }`}
        >
          {log ? 'Edit log' : 'Log my sets'}
        </button>
      </div>

      {showLog && (
        <LogModal
          exercise={exercise}
          workoutId={workoutId}
          existingLog={log}
          onClose={() => setShowLog(false)}
        />
      )}
    </>
  )
}

function DayWorkoutCard({ workout, myLogs }) {
  const [open, setOpen] = useState(true)
  const loggedCount = workout.exercises.filter(ex => myLogs.some(l => l.exerciseId === ex.id)).length
  const total = workout.exercises.length
  const pct = total ? Math.round((loggedCount / total) * 100) : 0
  const isToday = workout.date === TODAY

  return (
    <div className={`card ${isToday ? 'border-orange-500/30' : ''}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            {isToday && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-medium">Today</span>}
            <p className="text-xs text-gray-400">{formatDayLabel(workout.date)}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white">{workout.title}</p>
            <p className="text-xs text-gray-500">{loggedCount}/{total} exercises</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pct === 100 && <span className="text-xs text-green-400 font-medium">✓ Done</span>}
          <button onClick={() => setOpen(!open)} className="text-gray-400 hover:text-white">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mini progress bar */}
      {total > 0 && (
        <div className="mt-2 h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-orange-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {open && (
        <div className="mt-4 space-y-3">
          {groupExercises(workout.exercises).map((item, gi) => {
            if (item.kind === 'single') {
              return (
                <ExerciseRow key={item.exercise.id} exercise={item.exercise} workoutId={workout.id} myLogs={myLogs} />
              )
            }
            // Superset or Circuit group
            const style = GROUP_STYLES[item.kind] || GROUP_STYLES.superset
            const allLogged = item.exercises.every(ex => myLogs.some(l => l.exerciseId === ex.id))
            return (
              <div key={item.groupId} className={`rounded-xl border ${style.border} overflow-hidden`}>
                <div className={`flex items-center justify-between px-3 py-1.5 ${style.headerBg}`}>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                    {style.label} · {item.exercises.length} exercises
                  </span>
                  {allLogged && <span className="text-[10px] text-green-400 font-semibold">✓ Done</span>}
                </div>
                <div className="divide-y divide-gray-800 bg-gray-900/40">
                  {item.exercises.map((ex, i) => (
                    <div key={ex.id} className="relative">
                      <div className={`absolute left-3 top-3 w-5 h-5 rounded-full text-[10px] font-black text-white flex items-center justify-center flex-shrink-0 z-10 ${style.letterBg}`}>
                        {LETTERS[i]}
                      </div>
                      <div className="pl-10">
                        <ExerciseRow exercise={ex} workoutId={workout.id} myLogs={myLogs} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function MemberDashboard() {
  const { state, currentUser } = useApp()
  const myLogs = state.workoutLogs.filter(l => l.userId === currentUser.id)

  const { start, end } = getWeekRange()

  const isNonMember = currentUser.role === 'nonmember'
  const gymId = currentUser.gymId

  // Scope to this gym, then apply member/nonmember visibility rules
  const myWorkouts = state.workouts.filter(w => {
    if (w.gymId !== gymId) return false
    if (isNonMember) return w.assignedTo === currentUser.id
    return w.assignedTo === null || w.assignedTo === undefined || w.assignedTo === currentUser.id
  })

  const thisWeekWorkouts = myWorkouts
    .filter(w => w.date >= start && w.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date))

  const upcomingWorkouts = myWorkouts
    .filter(w => w.date > end)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  const pastWorkouts = myWorkouts
    .filter(w => w.date < start)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5)

  const totalExercises = thisWeekWorkouts.reduce((n, w) => n + w.exercises.length, 0)
  const loggedExercises = thisWeekWorkouts.reduce((n, w) =>
    n + w.exercises.filter(ex => myLogs.some(l => l.exerciseId === ex.id)).length, 0)
  const overallPct = totalExercises ? Math.round((loggedExercises / totalExercises) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-0.5">
          <h1 className="text-2xl font-bold">Hey, {currentUser.name.split(' ')[0]} 👊</h1>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isNonMember
              ? 'bg-gray-800 text-gray-400 border border-gray-700'
              : 'bg-orange-500/15 text-orange-400 border border-orange-500/30'
          }`}>
            {isNonMember ? 'Non-Member' : 'Gym Member'}
          </span>
        </div>
        <p className="text-gray-400 text-sm">
          {isNonMember ? 'Your assigned programs will appear here.' : "Let's get to work."}
        </p>
      </div>

      {/* Weekly progress */}
      {thisWeekWorkouts.length > 0 && (
        <div className="card mb-6 bg-gradient-to-br from-orange-900/30 to-gray-900 border-orange-800/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="font-semibold">This Week's Progress</span>
            </div>
            {overallPct === 100 && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-400 bg-green-900/30 px-2 py-0.5 rounded-full">
                <Trophy className="w-3 h-3" /> Complete!
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${overallPct === 100 ? 'bg-green-500' : 'bg-orange-500'}`}
                style={{ width: `${overallPct}%` }}
              />
            </div>
            <span className="text-sm font-bold text-white w-16 text-right">{loggedExercises}/{totalExercises}</span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {thisWeekWorkouts.map(w => {
              const wLogged = w.exercises.filter(ex => myLogs.some(l => l.exerciseId === ex.id)).length
              const wDone = wLogged === w.exercises.length
              const isToday = w.date === TODAY
              return (
                <span key={w.id} className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                  wDone ? 'bg-green-900/30 text-green-400 border-green-800/40'
                  : isToday ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  : 'bg-gray-800 text-gray-400 border-gray-700'
                }`}>
                  {new Date(w.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })} {wDone ? '✓' : `${wLogged}/${w.exercises.length}`}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* This week */}
      {thisWeekWorkouts.length > 0 ? (
        <div>
          <h2 className="font-bold text-gray-300 mb-3">This Week</h2>
          <div className="space-y-4">
            {thisWeekWorkouts.map(workout => (
              <DayWorkoutCard key={workout.id} workout={workout} myLogs={myLogs} />
            ))}
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <Flame className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          {isNonMember ? (
            <>
              <p className="text-gray-400 font-medium">No programs assigned yet</p>
              <p className="text-gray-600 text-sm mt-1">Your coach will assign a program to your account</p>
            </>
          ) : (
            <>
              <p className="text-gray-400 font-medium">No workouts this week</p>
              <p className="text-gray-600 text-sm mt-1">Your coach hasn't posted this week's program yet</p>
            </>
          )}
        </div>
      )}

      {/* Coming up */}
      {upcomingWorkouts.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold text-gray-300 mb-3">Coming Up</h2>
          <div className="space-y-2">
            {upcomingWorkouts.map(w => (
              <div key={w.id} className="card flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-sm">{w.title}</p>
                  <p className="text-xs text-gray-500">{formatShortDate(w.date)}</p>
                </div>
                <span className="text-xs text-gray-500">{w.exercises.length} exercises</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {pastWorkouts.length > 0 && (
        <div className="mt-8">
          <h2 className="font-bold text-gray-300 mb-3">Past Workouts</h2>
          <div className="space-y-2">
            {pastWorkouts.map(w => {
              const wLogs = myLogs.filter(l => l.workoutId === w.id).length
              return (
                <div key={w.id} className="card flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-sm">{w.title}</p>
                    <p className="text-xs text-gray-500">{formatShortDate(w.date)}</p>
                  </div>
                  <span className="text-xs text-gray-400">{wLogs}/{w.exercises.length} logged</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
