import { Plus, Trash2, Link2, GitMerge, X } from 'lucide-react'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export const GROUP_STYLES = {
  superset: {
    label: 'Superset',
    border: 'border-blue-500/40',
    headerBg: 'bg-blue-500/10',
    badge: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    letterBg: 'bg-blue-500',
    divider: 'divide-blue-500/20',
    addText: 'text-blue-400 hover:bg-blue-500/10',
  },
  circuit: {
    label: 'Circuit',
    border: 'border-purple-500/40',
    headerBg: 'bg-purple-500/10',
    badge: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    letterBg: 'bg-purple-500',
    divider: 'divide-purple-500/20',
    addText: 'text-purple-400 hover:bg-purple-500/10',
  },
}

// ─── Utility: group a flat exercises array for display ────────────────────────
export const groupExercises = (exercises = []) => {
  const seen = new Set()
  const result = []
  for (const ex of exercises) {
    if (!ex.groupId) {
      result.push({ kind: 'single', exercise: ex })
    } else if (!seen.has(ex.groupId)) {
      seen.add(ex.groupId)
      result.push({
        kind: ex.groupType || 'superset',
        groupId: ex.groupId,
        exercises: exercises.filter(e => e.groupId === ex.groupId),
      })
    }
  }
  return result
}

// ─── New blank set row ────────────────────────────────────────────────────────
const newSetRow = (prev = {}) => ({
  id: Math.random(),
  reps: prev.reps || '',
  weight: prev.weight || '',
})

// ─── New blank exercise — always starts with 3 set rows ───────────────────────
export const newEx = (extra = {}) => ({
  id: Date.now() + Math.random(),
  name: '',
  setsData: [newSetRow(), newSetRow(), newSetRow()],
  demoUrl: '',
  notes: '',
  groupId: null,
  groupType: null,
  // legacy fields kept for backward compat with old workouts
  sets: '',
  reps: '',
  targetWeight: '',
  ...extra,
})

// ─── Single exercise field block ──────────────────────────────────────────────
function ExerciseFields({ ex, onUpdate }) {
  const setsData = Array.isArray(ex.setsData) ? ex.setsData : []

  const addSet = () => {
    const last = setsData[setsData.length - 1]
    onUpdate('setsData', [...setsData, newSetRow(last)])
  }

  const removeSet = (setId) => {
    if (setsData.length <= 1) return
    onUpdate('setsData', setsData.filter(s => s.id !== setId))
  }

  const updateSet = (setId, field, val) => {
    onUpdate('setsData', setsData.map(s => s.id === setId ? { ...s, [field]: val } : s))
  }

  return (
    <div className="grid grid-cols-2 gap-2">

      {/* Exercise name */}
      <div className="col-span-2">
        <input
          className="input text-sm"
          placeholder="Exercise Name *"
          value={ex.name}
          onChange={e => onUpdate('name', e.target.value)}
          required
        />
      </div>

      {/* Per-set breakdown */}
      <div className="col-span-2 space-y-2">
        {/* Column headers */}
        <div className="grid grid-cols-[2.5rem_1fr_1fr_1.5rem] gap-2">
          <div />
          <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Reps</span>
          <span className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Weight</span>
          <div />
        </div>

        {/* Set rows */}
        {setsData.map((set, i) => (
          <div key={set.id} className="grid grid-cols-[2.5rem_1fr_1fr_1.5rem] gap-2 items-center">
            <span className="text-xs font-bold text-orange-400 tabular-nums">S{i + 1}</span>
            <input
              className="input text-sm"
              placeholder="e.g. 8-10"
              value={set.reps}
              onChange={e => updateSet(set.id, 'reps', e.target.value)}
            />
            <input
              className="input text-sm"
              placeholder="e.g. 135"
              value={set.weight}
              onChange={e => updateSet(set.id, 'weight', e.target.value)}
            />
            <button
              type="button"
              onClick={() => removeSet(set.id)}
              disabled={setsData.length <= 1}
              className="text-gray-600 hover:text-red-400 disabled:opacity-20 transition-colors flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {/* Add set */}
        <button
          type="button"
          onClick={addSet}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-orange-400 transition-colors pt-0.5"
        >
          <Plus className="w-3 h-3" /> Add set
        </button>
      </div>

      {/* Demo URL */}
      <div className="col-span-2">
        <input
          className="input text-sm"
          placeholder="Demo URL (optional)"
          value={ex.demoUrl}
          onChange={e => onUpdate('demoUrl', e.target.value)}
        />
      </div>

      {/* Notes */}
      <div className="col-span-2">
        <textarea
          className="input resize-none text-sm"
          rows={1}
          placeholder="Coach notes..."
          value={ex.notes}
          onChange={e => onUpdate('notes', e.target.value)}
        />
      </div>
    </div>
  )
}

// ─── Main ExerciseBuilder component ──────────────────────────────────────────
export default function ExerciseBuilder({ exercises, setExercises }) {
  const update = (id, field, val) =>
    setExercises(exs => exs.map(e => e.id === id ? { ...e, [field]: val } : e))

  const remove = (id) =>
    setExercises(exs => exs.filter(e => e.id !== id))

  const ungroup = (groupId) =>
    setExercises(exs => exs.map(e =>
      e.groupId === groupId ? { ...e, groupId: null, groupType: null } : e
    ))

  const addToGroup = (groupId, groupType) =>
    setExercises(exs => [...exs, newEx({ groupId, groupType })])

  const addStandalone = () =>
    setExercises(exs => [...exs, newEx()])

  const addSuperset = () => {
    const groupId = 'grp-' + Date.now()
    setExercises(exs => [
      ...exs,
      newEx({ groupId, groupType: 'superset' }),
      newEx({ groupId, groupType: 'superset' }),
    ])
  }

  const addCircuit = () => {
    const groupId = 'grp-' + Date.now()
    setExercises(exs => [
      ...exs,
      newEx({ groupId, groupType: 'circuit' }),
      newEx({ groupId, groupType: 'circuit' }),
      newEx({ groupId, groupType: 'circuit' }),
    ])
  }

  const grouped = groupExercises(exercises)
  let standaloneIdx = 0

  return (
    <div>
      <div className="space-y-3">
        {grouped.map(item => {
          // ── Standalone ──
          if (item.kind === 'single') {
            standaloneIdx++
            const ex = item.exercise
            return (
              <div key={ex.id} className="bg-gray-800/60 rounded-xl p-3 border border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-orange-400">Exercise {standaloneIdx}</span>
                  {exercises.length > 1 && (
                    <button type="button" onClick={() => remove(ex.id)}
                      className="text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <ExerciseFields ex={ex} onUpdate={(field, val) => update(ex.id, field, val)} />
              </div>
            )
          }

          // ── Superset / Circuit ──
          const style = GROUP_STYLES[item.kind] || GROUP_STYLES.superset
          return (
            <div key={item.groupId}
              className={`rounded-xl border ${style.border} overflow-hidden`}>
              {/* Group header */}
              <div className={`flex items-center justify-between px-3 py-2 ${style.headerBg}`}>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                  {style.label} · {item.exercises.length} exercises
                </span>
                <button type="button" onClick={() => ungroup(item.groupId)}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors flex items-center gap-1">
                  <X className="w-3 h-3" /> Ungroup
                </button>
              </div>

              {/* Exercises */}
              <div className={`divide-y ${style.divider}`}>
                {item.exercises.map((ex, i) => (
                  <div key={ex.id} className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-5 h-5 rounded-full text-[10px] font-black text-white flex items-center justify-center flex-shrink-0 ${style.letterBg}`}>
                        {LETTERS[i]}
                      </div>
                      {item.exercises.length > 2 && (
                        <button type="button" onClick={() => remove(ex.id)}
                          className="text-gray-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <ExerciseFields ex={ex} onUpdate={(field, val) => update(ex.id, field, val)} />
                  </div>
                ))}
              </div>

              {/* Add to group */}
              <button type="button" onClick={() => addToGroup(item.groupId, item.kind)}
                className={`w-full py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${style.addText}`}>
                <Plus className="w-3 h-3" />
                Add exercise to {style.label.toLowerCase()}
              </button>
            </div>
          )
        })}
      </div>

      {/* Add row */}
      <div className="flex gap-2 mt-3 flex-wrap">
        <button type="button" onClick={addStandalone}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-orange-400 border border-dashed border-gray-700 hover:border-orange-500/40 rounded-lg px-3 py-1.5 transition-colors">
          <Plus className="w-3 h-3" /> Exercise
        </button>
        <button type="button" onClick={addSuperset}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-400 border border-dashed border-gray-700 hover:border-blue-500/40 rounded-lg px-3 py-1.5 transition-colors">
          <Link2 className="w-3 h-3" /> Superset
        </button>
        <button type="button" onClick={addCircuit}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-400 border border-dashed border-gray-700 hover:border-purple-500/40 rounded-lg px-3 py-1.5 transition-colors">
          <GitMerge className="w-3 h-3" /> Circuit
        </button>
      </div>
    </div>
  )
}
