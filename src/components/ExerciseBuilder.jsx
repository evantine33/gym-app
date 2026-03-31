import { useState } from 'react'
import { Plus, Trash2, Link2, GitMerge, X, Play, Upload, Timer } from 'lucide-react'
import { EXERCISE_LIBRARY, CATEGORY_COLORS } from '../data/exerciseLibrary'
import { saveVideo } from '../utils/videoStore'

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
  emom: {
    label: 'EMOM',
    border: 'border-emerald-500/40',
    headerBg: 'bg-emerald-500/10',
    badge: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    letterBg: 'bg-emerald-600',
    divider: 'divide-emerald-500/20',
    addText: 'text-emerald-400 hover:bg-emerald-500/10',
  },
  amrap: {
    label: 'AMRAP',
    border: 'border-amber-500/40',
    headerBg: 'bg-amber-500/10',
    badge: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    letterBg: 'bg-amber-600',
    divider: 'divide-amber-500/20',
    addText: 'text-amber-400 hover:bg-amber-500/10',
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

// ─── New blank exercise ───────────────────────────────────────────────────────
export const newEx = (extra = {}) => ({
  id: Date.now() + Math.random(),
  name: '',
  setsData: [newSetRow(), newSetRow(), newSetRow()],
  demoUrl: '',
  notes: '',
  groupId: null,
  groupType: null,
  groupDuration: null,
  // legacy fields kept for backward compat
  sets: '',
  reps: '',
  targetWeight: '',
  ...extra,
})

// ─── Highlight matching text in suggestions ───────────────────────────────────
function HighlightMatch({ text, query }) {
  if (!query) return <span>{text}</span>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <span>{text}</span>
  return (
    <span>
      {text.slice(0, idx)}
      <span className="text-orange-400 font-bold">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </span>
  )
}

// ─── Exercise name autocomplete ───────────────────────────────────────────────
function ExerciseNameInput({ value, onChangeName, onSelectLibrary }) {
  const [open, setOpen] = useState(false)

  const matches = value.trim().length >= 1
    ? EXERCISE_LIBRARY
        .filter(e => e.name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 8)
    : []

  const handleSelect = (libEx) => {
    onSelectLibrary(libEx)
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        className="input text-sm"
        placeholder="Search or type exercise name *"
        value={value}
        onChange={e => { onChangeName(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 130)}
        required
      />

      {open && matches.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-gray-850 border border-gray-700 rounded-xl overflow-hidden shadow-2xl"
          style={{ background: '#181818' }}>
          {matches.map(ex => (
            <button
              key={ex.name}
              type="button"
              onMouseDown={() => handleSelect(ex)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-700/70 text-left transition-colors border-b border-gray-800 last:border-0 gap-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm text-white">
                  <HighlightMatch text={ex.name} query={value} />
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${CATEGORY_COLORS[ex.category] || 'bg-gray-700 text-gray-400'}`}>
                  {ex.category}
                </span>
              </div>
              <span className="flex items-center gap-1 text-[10px] text-gray-500 flex-shrink-0">
                <Play className="w-2.5 h-2.5" /> video
              </span>
            </button>
          ))}
          <div className="px-3 py-2 border-t border-gray-800">
            <p className="text-[10px] text-gray-600">
              Not listed? Keep typing to use your own name — you can add a custom video link or upload below.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Single exercise field block ──────────────────────────────────────────────
function ExerciseFields({ ex, onUpdate }) {
  const setsData = Array.isArray(ex.setsData) ? ex.setsData : []
  const [uploading, setUploading] = useState(false)

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

  const handleLibrarySelect = (libEx) => {
    onUpdate('name', libEx.name)
    onUpdate('demoUrl', libEx.demoUrl)
  }

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const key = `video-${Date.now()}-${Math.random().toString(36).slice(2)}`
      await saveVideo(key, file)
      onUpdate('demoUrl', `local://${key}`)
    } catch (err) {
      console.error('Video save failed', err)
      alert('Could not save video. Try a shorter clip or use a URL instead.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2">

      {/* Exercise name — with autocomplete */}
      <div className="col-span-2">
        <ExerciseNameInput
          value={ex.name}
          onChangeName={(name) => onUpdate('name', name)}
          onSelectLibrary={handleLibrarySelect}
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

      {/* Demo video — URL input or device upload */}
      <div className="col-span-2">
        {ex.demoUrl?.startsWith('local://') ? (
          /* Uploaded video indicator */
          <div className="flex items-center gap-2 bg-gray-800/60 border border-emerald-700/40 rounded-xl px-3 py-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            <span className="text-xs text-emerald-400 flex-1 truncate">Video saved on this device</span>
            <button
              type="button"
              onClick={() => onUpdate('demoUrl', '')}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors flex-shrink-0"
            >
              Remove
            </button>
          </div>
        ) : (
          /* URL field + upload button */
          <div className="flex gap-2">
            <input
              className="input text-sm flex-1 min-w-0"
              placeholder="Demo video URL (YouTube…)"
              value={ex.demoUrl}
              onChange={e => onUpdate('demoUrl', e.target.value)}
            />
            <label
              className={`flex items-center gap-1 px-2.5 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl text-xs text-gray-400 cursor-pointer transition-colors flex-shrink-0 whitespace-nowrap ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
              title="Upload video from your device"
            >
              {uploading
                ? <span className="text-orange-400 animate-pulse text-[11px]">Saving…</span>
                : <><Upload className="w-3.5 h-3.5" /><span className="hidden sm:inline">Upload</span></>
              }
              <input
                type="file"
                accept="video/*"
                capture="environment"
                className="sr-only"
                onChange={handleVideoUpload}
                disabled={uploading}
              />
            </label>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="col-span-2">
        <textarea
          className="input resize-none text-sm"
          rows={1}
          placeholder="Coach notes…"
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
      e.groupId === groupId ? { ...e, groupId: null, groupType: null, groupDuration: null } : e
    ))

  const addToGroup = (groupId, groupType) =>
    setExercises(exs => [...exs, newEx({ groupId, groupType })])

  const updateGroupConfig = (groupId, field, val) =>
    setExercises(exs => exs.map(e =>
      e.groupId === groupId ? { ...e, [field]: val } : e
    ))

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

  const addEMOM = () => {
    const groupId = 'grp-' + Date.now()
    setExercises(exs => [
      ...exs,
      newEx({ groupId, groupType: 'emom', groupDuration: 20, setsData: [newSetRow()] }),
      newEx({ groupId, groupType: 'emom', groupDuration: 20, setsData: [newSetRow()] }),
    ])
  }

  const addAMRAP = () => {
    const groupId = 'grp-' + Date.now()
    setExercises(exs => [
      ...exs,
      newEx({ groupId, groupType: 'amrap', groupDuration: 10, setsData: [newSetRow()] }),
      newEx({ groupId, groupType: 'amrap', groupDuration: 10, setsData: [newSetRow()] }),
      newEx({ groupId, groupType: 'amrap', groupDuration: 10, setsData: [newSetRow()] }),
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

          // ── Superset / Circuit / EMOM / AMRAP ──
          const style = GROUP_STYLES[item.kind] || GROUP_STYLES.superset
          const isTimedGroup = item.kind === 'emom' || item.kind === 'amrap'
          const groupDuration = item.exercises[0]?.groupDuration ?? (item.kind === 'emom' ? 20 : 10)

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

              {/* Duration config for EMOM / AMRAP */}
              {isTimedGroup && (
                <div className={`flex items-center gap-2.5 px-3 py-2 border-b ${style.border} bg-black/20`}>
                  <Timer className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <input
                    type="number"
                    min="1"
                    max="999"
                    className="w-14 bg-transparent border-b border-gray-600 text-white text-sm font-bold text-center outline-none focus:border-orange-500 transition-colors"
                    value={groupDuration}
                    onChange={e => updateGroupConfig(item.groupId, 'groupDuration', parseInt(e.target.value) || 1)}
                    onClick={e => e.stopPropagation()}
                  />
                  <span className="text-xs text-gray-500">
                    {item.kind === 'emom'
                      ? `min · every minute on the minute`
                      : `min · as many rounds as possible`}
                  </span>
                </div>
              )}

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
                Add exercise to {style.label}
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
        <button type="button" onClick={addEMOM}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-400 border border-dashed border-gray-700 hover:border-emerald-500/40 rounded-lg px-3 py-1.5 transition-colors">
          <Timer className="w-3 h-3" /> EMOM
        </button>
        <button type="button" onClick={addAMRAP}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-amber-400 border border-dashed border-gray-700 hover:border-amber-500/40 rounded-lg px-3 py-1.5 transition-colors">
          <Timer className="w-3 h-3" /> AMRAP
        </button>
      </div>
    </div>
  )
}
