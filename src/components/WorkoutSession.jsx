import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'
import {
  X, ChevronRight, ChevronLeft, CheckCircle2, Trophy,
  Plus, Minus, Flame, Play, Star,
} from 'lucide-react'
import { groupExercises, GROUP_STYLES } from './ExerciseBuilder'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

// ─── Extract YouTube video ID from URL ────────────────────────────────────────
function getYouTubeId(url) {
  if (!url) return null
  const match = url.match(/(?:v=|youtu\.be\/)([^&\s?]+)/)
  return match ? match[1] : null
}

// ─── Tappable video tile ──────────────────────────────────────────────────────
function VideoTile({ url, name }) {
  const [open, setOpen] = useState(false)
  if (!url) return null
  const ytId = getYouTubeId(url)

  // Non-embeddable URL (e.g. YouTube search) → open in new tab
  if (!ytId) {
    return (
      <a href={url} target="_blank" rel="noreferrer"
        className="w-14 h-14 flex-shrink-0 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center hover:border-orange-500/50 hover:bg-gray-700 transition-all"
        title="Watch demo">
        <Play className="w-5 h-5 text-orange-400 fill-orange-400" />
      </a>
    )
  }

  return (
    <>
      {/* Thumbnail tile */}
      <button onClick={() => setOpen(true)}
        className="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden relative border border-gray-700 hover:border-orange-500/60 transition-all group"
        title="Watch demo">
        <img
          src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
          alt={name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/25 transition-all flex items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
            <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
          </div>
        </div>
      </button>

      {/* Video modal — z-[60] sits above the session overlay (z-50) */}
      {open && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white truncate pr-4">{name}</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white flex-shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video rounded-2xl overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                title={name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">Tap outside to close</p>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Seed log rows from existing log or exercise targets ──────────────────────
function seedLog(ex, existingLog) {
  if (existingLog?.sets?.length) {
    return { sets: existingLog.sets.map(s => ({ ...s })), notes: existingLog.notes || '' }
  }
  if (ex.setsData?.length) {
    return { sets: ex.setsData.map(s => ({ reps: s.reps || '', weight: s.weight || '' })), notes: '' }
  }
  return {
    sets: Array.from({ length: parseInt(ex.sets) || 1 }, () => ({
      reps: ex.reps || '', weight: ex.targetWeight || '',
    })),
    notes: '',
  }
}

// ─── Logging inputs for one exercise ─────────────────────────────────────────
function ExerciseLogger({ exercise, log, onUpdateSet, onAddSet, onRemoveSet, onUpdateNotes }) {
  const sets = log?.sets || []

  return (
    <div>
      {/* Video tile + name */}
      <div className="flex items-center gap-3 mb-3">
        <VideoTile url={exercise.demoUrl} name={exercise.name} />
        <h3 className="text-xl font-black text-white leading-tight">{exercise.name}</h3>
      </div>

      {/* Target tags */}
      {exercise.setsData?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {exercise.setsData.map((s, i) => (
            <span key={i} className="text-xs bg-gray-800 border border-gray-700 rounded-md px-2 py-0.5">
              <span className="text-orange-400 font-semibold">S{i + 1}:</span>
              <span className="text-gray-300"> {s.reps || '—'}{s.weight ? ` @ ${s.weight}` : ''}</span>
            </span>
          ))}
        </div>
      )}

      {/* Column headers */}
      <div className="grid grid-cols-[3rem_1fr_1fr_2rem] gap-3 mb-2 px-1">
        <span className="text-[11px] text-gray-600 uppercase tracking-wide font-medium">Set</span>
        <span className="text-[11px] text-gray-600 uppercase tracking-wide font-medium">Reps</span>
        <span className="text-[11px] text-gray-600 uppercase tracking-wide font-medium">Weight</span>
        <span />
      </div>

      {/* Set rows */}
      <div className="space-y-2.5">
        {sets.map((s, i) => (
          <div key={i} className="grid grid-cols-[3rem_1fr_1fr_2rem] gap-3 items-center">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-sm font-bold text-orange-400">
              {i + 1}
            </div>
            <input
              className="input text-center text-lg font-bold h-12"
              placeholder="—"
              value={s.reps}
              onChange={e => onUpdateSet(i, 'reps', e.target.value)}
            />
            <input
              className="input text-center text-lg font-bold h-12"
              placeholder="lbs"
              value={s.weight}
              onChange={e => onUpdateSet(i, 'weight', e.target.value)}
            />
            {sets.length > 1 ? (
              <button onClick={() => onRemoveSet(i)}
                className="text-gray-700 hover:text-red-400 transition-colors">
                <Minus className="w-4 h-4" />
              </button>
            ) : <span />}
          </div>
        ))}
      </div>

      {/* Add set */}
      <button onClick={onAddSet}
        className="mt-3 flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-400 transition-colors">
        <Plus className="w-3.5 h-3.5" /> Add set
      </button>

      {/* Notes */}
      {exercise.notes && (
        <div className="mt-4 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-400">
            <span className="text-orange-400 font-medium">Coach note: </span>
            {exercise.notes}
          </p>
        </div>
      )}

      <textarea
        className="input resize-none text-sm mt-3"
        rows={2}
        placeholder="How did it feel? Any notes..."
        value={log?.notes || ''}
        onChange={e => onUpdateNotes(e.target.value)}
      />
    </div>
  )
}

// ─── Main WorkoutSession ──────────────────────────────────────────────────────
export default function WorkoutSession({ workout, myLogs, onClose }) {
  const { dispatch } = useApp()
  const contentRef = useRef(null)

  // Snapshot pre-session logs for PR comparison (before any saves happen)
  const [initialLogs] = useState(() => myLogs)

  const blocks = groupExercises(workout.exercises)
  const hasWarmup = workout.warmup?.length > 0

  // Prepend warmup as block 0 if present
  const allBlocks = [
    ...(hasWarmup ? [{ kind: 'warmup', items: workout.warmup }] : []),
    ...blocks,
  ]

  const [blockIdx, setBlockIdx] = useState(0)
  const [done, setDone] = useState(false)
  const [prList, setPrList] = useState([])

  // Initialize log data from existing logs or exercise targets
  const [logData, setLogData] = useState(() => {
    const data = {}
    workout.exercises.forEach(ex => {
      const existing = myLogs.find(l => l.exerciseId === ex.id)
      data[ex.id] = seedLog(ex, existing)
    })
    return data
  })

  const currentBlock = allBlocks[blockIdx]
  const isFirst = blockIdx === 0
  const isLast = blockIdx === allBlocks.length - 1
  const exerciseBlockCount = allBlocks.filter(b => b.kind !== 'warmup').length
  const currentExerciseBlock = allBlocks.slice(0, blockIdx + 1).filter(b => b.kind !== 'warmup').length

  // ── Log data updaters ────────────────────────────────────────────────────
  const updateSet = (exId, i, field, val) =>
    setLogData(prev => ({
      ...prev,
      [exId]: {
        ...prev[exId],
        sets: prev[exId].sets.map((s, idx) => idx === i ? { ...s, [field]: val } : s),
      },
    }))

  const addSet = (exId) =>
    setLogData(prev => {
      const last = prev[exId].sets.at(-1)
      return {
        ...prev,
        [exId]: {
          ...prev[exId],
          sets: [...prev[exId].sets, { reps: last?.reps || '', weight: last?.weight || '' }],
        },
      }
    })

  const removeSet = (exId, i) => {
    if (logData[exId].sets.length <= 1) return
    setLogData(prev => ({
      ...prev,
      [exId]: { ...prev[exId], sets: prev[exId].sets.filter((_, idx) => idx !== i) },
    }))
  }

  const updateNotes = (exId, notes) =>
    setLogData(prev => ({ ...prev, [exId]: { ...prev[exId], notes } }))

  // ── Save current block's logs ────────────────────────────────────────────
  const saveBlock = (block) => {
    if (block.kind === 'warmup') return
    const exs = block.kind === 'single' ? [block.exercise] : block.exercises
    exs.forEach(ex => {
      const log = logData[ex.id]
      dispatch({
        type: 'LOG_EXERCISE',
        log: { workoutId: workout.id, exerciseId: ex.id, exerciseName: ex.name, sets: log.sets, notes: log.notes },
      })
    })
  }

  // ── PR detection ─────────────────────────────────────────────────────────
  const computePRs = () => {
    const prs = []
    workout.exercises.forEach(ex => {
      const sessionSets = logData[ex.id]?.sets || []
      const newMax = Math.max(0, ...sessionSets.map(s => parseFloat(s.weight) || 0))
      if (newMax <= 0) return
      const histLogs = initialLogs.filter(l => l.exerciseName === ex.name || l.exerciseId === ex.id)
      const prevMax = histLogs.length === 0
        ? 0
        : Math.max(0, ...histLogs.flatMap(l => (l.sets || []).map(s => parseFloat(s.weight) || 0)))
      if (newMax > prevMax) prs.push({ name: ex.name, weight: newMax })
    })
    return prs
  }

  const handleNext = () => {
    if (isLast) {
      const prs = computePRs()
      saveBlock(currentBlock)
      setPrList(prs)
      setDone(true)
    } else {
      saveBlock(currentBlock)
      setBlockIdx(i => i + 1)
      contentRef.current?.scrollTo(0, 0)
    }
  }

  const handlePrev = () => setBlockIdx(i => i - 1)

  const progress = Math.round((blockIdx / allBlocks.length) * 100)

  // ── Completion screen ────────────────────────────────────────────────────
  if (done) {
    const loggedCount = workout.exercises.filter(ex => {
      const log = logData[ex.id]
      return log?.sets?.some(s => s.reps || s.weight)
    }).length

    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
        <div className="w-24 h-24 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center mb-6 animate-pulse">
          <Trophy className="w-12 h-12 text-green-400" />
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Workout Done!</h2>
        <p className="text-orange-400 font-semibold text-lg mb-1">{workout.title}</p>
        <p className="text-gray-500 text-sm mb-6">
          {loggedCount} of {workout.exercises.length} exercises logged
        </p>

        {/* PR callouts */}
        {prList.length > 0 && (
          <div className="w-full max-w-sm mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="text-yellow-400 font-black text-sm uppercase tracking-wide">
                Personal Records!
              </span>
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            </div>
            <div className="space-y-2">
              {prList.map((pr, i) => (
                <div key={i}
                  className="flex items-center justify-between bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
                  <span className="text-white font-semibold text-sm">{pr.name}</span>
                  <span className="text-yellow-400 font-black">{pr.weight} lbs 🏆</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={onClose} className="btn-primary px-12 py-3.5 text-base font-bold">
          Finish
        </button>
      </div>
    )
  }

  // ── Session screen ───────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-4 pt-4 bg-black border-b border-gray-900">
        {/* Progress bar */}
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between pb-3">
          <div>
            <p className="text-xs text-gray-500 truncate max-w-[220px]">{workout.title}</p>
            <p className="text-sm font-bold text-white mt-0.5">
              {currentBlock.kind === 'warmup'
                ? '🔥 Warm Up'
                : `Block ${currentExerciseBlock} of ${exerciseBlockCount}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div ref={contentRef} className="flex-1 overflow-y-auto px-4 py-6">

        {/* Warmup block */}
        {currentBlock.kind === 'warmup' && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Flame className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Warm Up</h2>
                <p className="text-xs text-gray-500">{currentBlock.items.length} items</p>
              </div>
            </div>
            <div className="space-y-3">
              {currentBlock.items.map((item, i) => (
                <div key={item.id ?? i}
                  className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-4">
                  <span className="font-semibold text-white">{item.name}</span>
                  <span className="text-sm text-orange-400 font-bold">{item.detail}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Single exercise */}
        {currentBlock.kind === 'single' && (
          <ExerciseLogger
            exercise={currentBlock.exercise}
            log={logData[currentBlock.exercise.id]}
            onUpdateSet={(i, f, v) => updateSet(currentBlock.exercise.id, i, f, v)}
            onAddSet={() => addSet(currentBlock.exercise.id)}
            onRemoveSet={(i) => removeSet(currentBlock.exercise.id, i)}
            onUpdateNotes={(n) => updateNotes(currentBlock.exercise.id, n)}
          />
        )}

        {/* Superset / Circuit */}
        {(currentBlock.kind === 'superset' || currentBlock.kind === 'circuit') && (() => {
          const style = GROUP_STYLES[currentBlock.kind]
          return (
            <div>
              <span className={`inline-flex items-center text-xs font-bold px-3 py-1 rounded-full mb-6 ${style.badge}`}>
                {style.label} · {currentBlock.exercises.length} exercises
              </span>

              <div className="space-y-10">
                {currentBlock.exercises.map((ex, i) => (
                  <div key={ex.id}>
                    {/* Letter divider */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className={`w-8 h-8 rounded-full text-sm font-black text-white flex items-center justify-center flex-shrink-0 ${style.letterBg}`}>
                        {LETTERS[i]}
                      </div>
                      <div className="h-px flex-1 bg-gray-800" />
                    </div>
                    <ExerciseLogger
                      exercise={ex}
                      log={logData[ex.id]}
                      onUpdateSet={(si, f, v) => updateSet(ex.id, si, f, v)}
                      onAddSet={() => addSet(ex.id)}
                      onRemoveSet={(si) => removeSet(ex.id, si)}
                      onUpdateNotes={(n) => updateNotes(ex.id, n)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </div>

      {/* ── Footer nav ── */}
      <div className="flex-shrink-0 px-4 pt-4 pb-10 bg-black border-t border-gray-900 flex gap-3">
        {!isFirst && (
          <button onClick={handlePrev}
            className="btn-ghost flex items-center gap-2 px-5 py-3">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        )}
        <button onClick={handleNext}
          className="btn-primary flex-1 flex items-center justify-center gap-2 py-3.5 text-base font-bold">
          {isLast
            ? <><CheckCircle2 className="w-5 h-5" /> Finish Workout</>
            : currentBlock.kind === 'warmup'
            ? <><Play className="w-4 h-4" /> Start Workout</>
            : <><ChevronRight className="w-4 h-4" /> Next Block</>}
        </button>
      </div>
    </div>
  )
}
