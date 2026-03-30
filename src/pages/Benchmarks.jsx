import { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  Target, Plus, Trash2, X, ChevronDown, ChevronUp,
  Star, TrendingUp, TrendingDown, Minus,
} from 'lucide-react'

const BENCHMARK_TYPES = [
  { value: 'weight', label: 'Weight', units: ['lbs', 'kg'], higherIsBetter: true, placeholder: '225' },
  { value: 'reps',   label: 'Reps',   units: ['reps'],      higherIsBetter: true, placeholder: '20'  },
  { value: 'time',   label: 'Time',   units: ['sec'],        higherIsBetter: false, placeholder: '300' },
  { value: 'distance', label: 'Distance', units: ['ft', 'm', 'in'], higherIsBetter: true, placeholder: '8' },
]

const TYPE_COLORS = {
  weight:   'text-blue-400 bg-blue-900/40 border-blue-700/40',
  reps:     'text-green-400 bg-green-900/40 border-green-700/40',
  time:     'text-purple-400 bg-purple-900/40 border-purple-700/40',
  distance: 'text-yellow-400 bg-yellow-900/40 border-yellow-700/40',
}

function formatValue(value, type, unit) {
  if (type === 'time') {
    const total = Math.round(value)
    const mins = Math.floor(total / 60)
    const secs = total % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }
  return `${value} ${unit}`
}

function getBest(entries, higherIsBetter) {
  if (!entries.length) return null
  return entries.reduce((best, e) =>
    best === null ? e.value : (higherIsBetter ? Math.max(best, e.value) : Math.min(best, e.value))
  , null)
}

function getTrend(sorted, higherIsBetter) {
  if (sorted.length < 2) return null
  const diff = sorted[sorted.length - 1].value - sorted[sorted.length - 2].value
  if (diff === 0) return 'same'
  return higherIsBetter ? (diff > 0 ? 'up' : 'down') : (diff < 0 ? 'up' : 'down')
}

// ─── New Benchmark Modal ──────────────────────────────────────────────────────
function NewBenchmarkModal({ isPersonal, onClose }) {
  const { dispatch, currentUser } = useApp()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('weight')
  const [unit, setUnit] = useState('lbs')

  const typeInfo = BENCHMARK_TYPES.find(t => t.value === type)

  const handleTypeChange = (v) => {
    setType(v)
    setUnit(BENCHMARK_TYPES.find(t => t.value === v).units[0])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    dispatch({
      type: 'ADD_BENCHMARK_DEF',
      def: {
        name: name.trim(),
        description: description.trim(),
        type,
        unit,
        higherIsBetter: typeInfo.higherIsBetter,
        scope: isPersonal ? 'personal' : 'gym',
      },
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="font-bold text-lg">{isPersonal ? 'Add Personal Benchmark' : 'New Benchmark'}</h2>
            {isPersonal && <p className="text-xs text-gray-500 mt-0.5">Only visible to you</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input className="input" placeholder="e.g. Back Squat 1RM, Mile Run..."
              value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
            <input className="input" placeholder="e.g. Max effort, no belt"
              value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Type</label>
            <div className="grid grid-cols-2 gap-2">
              {BENCHMARK_TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => handleTypeChange(t.value)}
                  className={`py-2.5 rounded-xl text-sm font-medium border transition ${
                    type === t.value
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {typeInfo.units.length > 1 && (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Unit</label>
              <div className="flex gap-2">
                {typeInfo.units.map(u => (
                  <button key={u} type="button" onClick={() => setUnit(u)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition ${
                      unit === u
                        ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                        : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
                    }`}>
                    {u}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-600">
            {typeInfo.higherIsBetter ? '↑ Higher score is better' : '↓ Lower score is better'} · logged in {unit}
            {type === 'time' && ' (enter seconds — e.g. 3:45 = 225)'}
          </p>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Create</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Log Result Modal ─────────────────────────────────────────────────────────
function LogResultModal({ def, myEntries, onClose }) {
  const { dispatch } = useApp()
  const [value, setValue] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const typeInfo = BENCHMARK_TYPES.find(t => t.value === def.type)
  const pr = getBest(myEntries, def.higherIsBetter)
  const numVal = parseFloat(value)
  const wouldBePR = !isNaN(numVal) && numVal > 0 && pr !== null &&
    (def.higherIsBetter ? numVal > pr : numVal < pr)
  const isFirst = pr === null && !isNaN(numVal) && numVal > 0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isNaN(numVal) || numVal <= 0) return
    dispatch({
      type: 'LOG_BENCHMARK',
      entry: { benchmarkId: def.id, value: numVal, notes: notes.trim(), date },
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="font-bold">Log Result</h2>
            <p className="text-sm text-orange-400 mt-0.5">{def.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {pr !== null && (
            <div className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5">
              <span className="text-xs text-gray-500">Current PR</span>
              <span className="font-bold text-orange-400">{formatValue(pr, def.type, def.unit)}</span>
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Result
              <span className="text-gray-600 ml-1">
                ({def.type === 'time' ? 'seconds — e.g. 3:45 = 225' : def.unit})
              </span>
            </label>
            <input className="input text-lg font-bold" type="number" step="any" min="0"
              placeholder={typeInfo.placeholder}
              value={value} onChange={e => setValue(e.target.value)} required />
            {(wouldBePR || isFirst) && (
              <p className="text-xs text-yellow-400 mt-1.5 flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400" />
                {isFirst ? 'First entry — sets your baseline!' : 'New PR! 🏆'}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Date</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Notes (optional)</label>
            <input className="input" placeholder="e.g. No belt, fresh legs..."
              value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Member Benchmark Card ────────────────────────────────────────────────────
function MemberBenchmarkCard({ def, myEntries, isPersonal }) {
  const { dispatch } = useApp()
  const [expanded, setExpanded] = useState(false)
  const [logging, setLogging] = useState(false)

  const sorted = [...myEntries].sort((a, b) => new Date(a.date) - new Date(b.date))
  const pr = getBest(myEntries, def.higherIsBetter)
  const latest = sorted[sorted.length - 1]
  const trend = getTrend(sorted, def.higherIsBetter)
  const latestIsPR = latest && pr !== null && Math.abs(latest.value - pr) < 0.001

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-500'

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-white">{def.name}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_COLORS[def.type] || ''}`}>
              {BENCHMARK_TYPES.find(t => t.value === def.type)?.label} · {def.unit}
            </span>
            {isPersonal && (
              <span className="text-[10px] text-gray-500 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full">Personal</span>
            )}
          </div>
          {def.description && <p className="text-xs text-gray-500 mb-2">{def.description}</p>}

          {pr !== null ? (
            <div className="flex items-start gap-4">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Best</p>
                <p className="text-2xl font-black text-orange-400">{formatValue(pr, def.type, def.unit)}</p>
              </div>
              {latest && (
                <div className="border-l border-gray-700 pl-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Last tested</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-white">{formatValue(latest.value, def.type, def.unit)}</p>
                    {latestIsPR && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
                    {trend && <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />}
                  </div>
                  <p className="text-[10px] text-gray-600">
                    {new Date(latest.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              )}
              <div className="border-l border-gray-700 pl-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Tests</p>
                <p className="text-sm font-bold text-white">{myEntries.length}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 italic">No results logged yet — be the first!</p>
          )}
        </div>
        {isPersonal && (
          <button onClick={() => dispatch({ type: 'DELETE_BENCHMARK_DEF', defId: def.id })}
            className="text-gray-700 hover:text-red-400 transition-colors flex-shrink-0 p-1">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex gap-2 mt-3">
        <button onClick={() => setLogging(true)}
          className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Log Result
        </button>
        {sorted.length > 0 && (
          <button onClick={() => setExpanded(!expanded)}
            className="btn-ghost text-sm py-2 px-4 flex items-center gap-1">
            History {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">History</p>
          <div className="space-y-2">
            {[...sorted].reverse().map((entry, i) => {
              const isPREntry = Math.abs(entry.value - pr) < 0.001
              return (
                <div key={entry.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 w-20">
                      {new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </span>
                    {isPREntry && <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />}
                    {entry.notes && <span className="text-[10px] text-gray-600 italic truncate max-w-[120px]">"{entry.notes}"</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold ${isPREntry ? 'text-orange-400' : 'text-white'}`}>
                      {formatValue(entry.value, def.type, def.unit)}
                    </span>
                    <button onClick={() => dispatch({ type: 'DELETE_BENCHMARK_ENTRY', entryId: entry.id })}
                      className="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {logging && <LogResultModal def={def} myEntries={myEntries} onClose={() => setLogging(false)} />}
    </div>
  )
}

// ─── Coach Benchmark Card ─────────────────────────────────────────────────────
function CoachBenchmarkCard({ def, allEntries, members }) {
  const { dispatch } = useApp()
  const [expanded, setExpanded] = useState(false)

  const defEntries = allEntries.filter(e => e.benchmarkId === def.id)
  const membersLoggedCount = new Set(defEntries.map(e => e.userId)).size
  const gymBestEntry = defEntries.length
    ? defEntries.reduce((best, e) =>
        !best ? e : (def.higherIsBetter ? (e.value > best.value ? e : best) : (e.value < best.value ? e : best))
      , null)
    : null
  const gymBestMember = gymBestEntry ? members.find(m => m.id === gymBestEntry.userId) : null

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-white">{def.name}</h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_COLORS[def.type] || ''}`}>
              {BENCHMARK_TYPES.find(t => t.value === def.type)?.label} · {def.unit}
            </span>
          </div>
          {def.description && <p className="text-xs text-gray-500 mb-2">{def.description}</p>}

          <div className="flex items-start gap-4">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Members logged</p>
              <p className="text-xl font-black text-white">{membersLoggedCount}<span className="text-sm text-gray-500 font-normal"> / {members.filter(m => m.role === 'member').length}</span></p>
            </div>
            {gymBestEntry && gymBestMember && (
              <div className="border-l border-gray-700 pl-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">Gym Best</p>
                <p className="text-xl font-black text-orange-400">{formatValue(gymBestEntry.value, def.type, def.unit)}</p>
                <p className="text-[10px] text-gray-500">{gymBestMember.name}</p>
              </div>
            )}
          </div>
        </div>
        <button onClick={() => dispatch({ type: 'DELETE_BENCHMARK_DEF', defId: def.id })}
          className="text-gray-600 hover:text-red-400 transition-colors p-1 flex-shrink-0">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <button onClick={() => setExpanded(!expanded)}
        className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-white py-2 border-t border-gray-800 transition-colors">
        {expanded ? 'Hide' : 'View'} member results
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {expanded && (
        <div className="mt-1 space-y-2">
          {members.filter(m => m.role === 'member').map(member => {
            const mEntries = defEntries.filter(e => e.userId === member.id)
            const mPR = getBest(mEntries, def.higherIsBetter)
            const mLatest = mEntries.sort((a, b) => new Date(b.date) - new Date(a.date))[0]
            return (
              <div key={member.id} className="flex items-center justify-between bg-gray-800 rounded-xl px-3 py-2.5 border border-gray-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-orange-400 flex-shrink-0">
                    {member.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{member.name}</p>
                    {mLatest && (
                      <p className="text-[10px] text-gray-500">
                        Last: {new Date(mLatest.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {mEntries.length} test{mEntries.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {mPR !== null ? (
                    <p className="text-sm font-bold text-orange-400">{formatValue(mPR, def.type, def.unit)}</p>
                  ) : (
                    <p className="text-xs text-gray-600 italic">Not logged</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Main Benchmarks Page ─────────────────────────────────────────────────────
export default function Benchmarks() {
  const { state, currentUser } = useApp()
  const [showNew, setShowNew] = useState(false)
  const [showPersonal, setShowPersonal] = useState(false)

  const gymId = currentUser?.gymId
  const isCoach = currentUser?.role === 'coach'

  const gymDefs = (state.benchmarkDefs || []).filter(d => d.gymId === gymId && d.scope === 'gym')
  const personalDefs = (state.benchmarkDefs || []).filter(
    d => d.scope === 'personal' && d.createdBy === currentUser?.id
  )
  const gymEntries = (state.benchmarkEntries || []).filter(e => e.gymId === gymId)
  const myEntries = gymEntries.filter(e => e.userId === currentUser?.id)
  const gymMembers = state.users.filter(u => u.gymId === gymId && (u.role === 'member' || u.role === 'nonmember'))

  const allMemberDefs = [...gymDefs, ...personalDefs]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Benchmarks</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {isCoach
              ? 'Set tests for your members to track across each cycle'
              : 'Track your PRs and progress across each training cycle'}
          </p>
        </div>
        <div className="flex gap-2">
          {!isCoach && (
            <button onClick={() => setShowPersonal(true)}
              className="btn-ghost text-sm flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Personal
            </button>
          )}
          <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> {isCoach ? 'New Benchmark' : 'Log'}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {(isCoach ? gymDefs : allMemberDefs).length === 0 && (
        <div className="card text-center py-14">
          <Target className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-300 font-semibold">No benchmarks yet</p>
          <p className="text-gray-500 text-sm mt-1 mb-5">
            {isCoach
              ? 'Create benchmarks for your gym — weight PRs, max reps, time trials, and more'
              : 'Your coach will add benchmarks here. You can also add personal ones to track yourself.'}
          </p>
          <button onClick={() => setShowNew(true)}
            className="btn-primary mx-auto flex items-center gap-2 w-fit">
            <Plus className="w-4 h-4" /> {isCoach ? 'Create First Benchmark' : 'Add Personal Benchmark'}
          </button>
        </div>
      )}

      {/* Coach view */}
      {isCoach && gymDefs.length > 0 && (
        <div className="space-y-4">
          {gymDefs.map(def => (
            <CoachBenchmarkCard key={def.id} def={def} allEntries={gymEntries} members={gymMembers} />
          ))}
        </div>
      )}

      {/* Member view */}
      {!isCoach && allMemberDefs.length > 0 && (
        <div className="space-y-6">
          {gymDefs.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Gym Benchmarks</p>
              {gymDefs.map(def => (
                <MemberBenchmarkCard key={def.id} def={def}
                  myEntries={myEntries.filter(e => e.benchmarkId === def.id)}
                  isPersonal={false} />
              ))}
            </div>
          )}
          {personalDefs.length > 0 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Personal</p>
              {personalDefs.map(def => (
                <MemberBenchmarkCard key={def.id} def={def}
                  myEntries={myEntries.filter(e => e.benchmarkId === def.id)}
                  isPersonal={true} />
              ))}
            </div>
          )}
        </div>
      )}

      {showNew && <NewBenchmarkModal isPersonal={!isCoach} onClose={() => setShowNew(false)} />}
      {showPersonal && <NewBenchmarkModal isPersonal={true} onClose={() => setShowPersonal(false)} />}
    </div>
  )
}
