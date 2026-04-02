import { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'
import {
  ShoppingBag, Plus, X, ChevronDown, ChevronUp, Tag, Users,
  Calendar, Dumbbell, Lock, Unlock, Check, Pencil, Trash2,
  Star, ArrowLeft, Eye, EyeOff, ChevronRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import ExerciseBuilder, { newEx } from '../components/ExerciseBuilder'

// ─── Config ───────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { value: 'all',          label: 'All',          emoji: '🏪' },
  { value: 'strength',     label: 'Strength',     emoji: '🏋️' },
  { value: 'muscle',       label: 'Muscle',       emoji: '💪' },
  { value: 'conditioning', label: 'Conditioning', emoji: '🔥' },
  { value: 'fat-loss',     label: 'Fat Loss',     emoji: '⚡' },
  { value: 'endurance',    label: 'Endurance',    emoji: '🏃' },
  { value: 'beginner',     label: 'Beginner',     emoji: '🌱' },
]

const LEVEL_STYLES = {
  beginner:     'bg-green-500/15 text-green-400 border-green-500/30',
  intermediate: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  advanced:     'bg-red-500/15 text-red-400 border-red-500/30',
}

const THUMBNAIL_OPTIONS = ['🏋️','💪','🔥','⚡','🏃','🌱','🎯','🏆','💥','🧠','🦾','🚀']
const FULL_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const SHORT_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const WEEK_OPTIONS = [4,6,8,10,12,16,20,24]

// ─── Program Card ─────────────────────────────────────────────────────────────
function ProgramCard({ listing, onSelect, purchased, isCoach, onEdit }) {
  const cat = CATEGORIES.find(c => c.value === listing.category)
  return (
    <div
      onClick={() => onSelect(listing)}
      className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden cursor-pointer hover:border-orange-500/40 hover:bg-gray-900/80 transition-all group"
    >
      {/* Thumbnail */}
      <div className="h-28 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-5xl relative">
        {listing.thumbnail}
        {/* Price badge */}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-black ${listing.price === 0 ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
          {listing.price === 0 ? 'FREE' : `$${listing.price}`}
        </div>
        {/* Purchased check */}
        {purchased && (
          <div className="absolute top-3 left-3 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}
        {/* Coach edit button */}
        {isCoach && (
          <button
            onClick={e => { e.stopPropagation(); onEdit(listing) }}
            className="absolute bottom-2 right-2 w-7 h-7 bg-black/60 hover:bg-black rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pencil className="w-3.5 h-3.5 text-white" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start gap-2 mb-1">
          <h3 className="font-black text-white text-sm leading-tight flex-1">{listing.title}</h3>
        </div>
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">{listing.shortDesc}</p>

        {/* Stats row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border capitalize ${LEVEL_STYLES[listing.level] || LEVEL_STYLES.beginner}`}>
            {listing.level}
          </span>
          <span className="text-[10px] text-gray-500">{listing.durationWeeks}wk</span>
          <span className="text-[10px] text-gray-500">·</span>
          <span className="text-[10px] text-gray-500">{listing.daysPerWeek}d/wk</span>
          {cat && cat.value !== 'all' && (
            <span className="text-[10px] text-gray-600 ml-auto">{cat.emoji}</span>
          )}
        </div>

        <p className="text-[11px] text-gray-600 mt-2">by {listing.coachName}</p>
      </div>
    </div>
  )
}

// ─── Program Detail + Buy Modal ────────────────────────────────────────────────
function DetailModal({ listing, onClose, purchased, loggedIn, onPurchase }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [openWeeks, setOpenWeeks] = useState({ 0: true })
  const navigate = useNavigate()

  const toggleWeek = (i) => setOpenWeeks(prev => ({ ...prev, [i]: !prev[i] }))

  const handleBuy = () => {
    if (!loggedIn) { navigate('/register'); return }
    if (listing.price === 0) { onPurchase(); return }
    setConfirmOpen(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 rounded-t-2xl sm:rounded-2xl border border-gray-800 shadow-2xl z-10 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-5 pb-4 border-b border-gray-800">
          <div className="flex items-start gap-4">
            <div className="text-4xl">{listing.thumbnail}</div>
            <div className="flex-1 min-w-0">
              <h2 className="font-black text-white text-lg leading-tight">{listing.title}</h2>
              <p className="text-xs text-gray-500 mt-0.5">by {listing.coachName}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border capitalize ${LEVEL_STYLES[listing.level] || LEVEL_STYLES.beginner}`}>
                  {listing.level}
                </span>
                <span className="text-xs text-gray-500">{listing.durationWeeks} weeks</span>
                <span className="text-xs text-gray-500">·</span>
                <span className="text-xs text-gray-500">{listing.daysPerWeek} days/wk</span>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Description */}
          <div>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">{listing.description}</p>
          </div>

          {/* Week overview */}
          <div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-3">
              Program Content · {listing.weeks?.length || 0} of {listing.durationWeeks} weeks shown
            </h3>
            <div className="space-y-2">
              {(listing.weeks || []).map((week, wi) => (
                <div key={wi} className="border border-gray-800 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleWeek(wi)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-800/40 hover:bg-gray-800/70 transition-colors"
                  >
                    <span className="text-sm font-bold text-white">Week {week.weekNum}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{week.workouts?.length || 0} workouts</span>
                      {openWeeks[wi]
                        ? <ChevronUp className="w-4 h-4 text-gray-500" />
                        : <ChevronDown className="w-4 h-4 text-gray-500" />
                      }
                    </div>
                  </button>
                  {openWeeks[wi] && (
                    <div className="divide-y divide-gray-800">
                      {(week.workouts || []).map((wo, woi) => (
                        <div key={woi} className="px-4 py-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500">{wo.day}</p>
                              <p className="text-sm font-semibold text-white">{wo.title}</p>
                            </div>
                            {purchased ? (
                              <Unlock className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-gray-600" />
                            )}
                          </div>
                          {/* Exercises — only if purchased */}
                          {purchased && wo.exercises?.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {wo.exercises.map((exr, ei) => (
                                <div key={ei} className="flex items-center gap-2 text-xs text-gray-400">
                                  <span className="w-1 h-1 rounded-full bg-orange-500 flex-shrink-0" />
                                  <span>{exr.name}</span>
                                  <span className="text-gray-600">
                                    {exr.setsData?.length || exr.sets} sets × {exr.setsData?.[0]?.reps || exr.reps} reps
                                    {exr.setsData?.[0]?.weight ? ` @ ${exr.setsData[0].weight}` : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          {!purchased && (
                            <p className="text-xs text-gray-600 mt-1">Purchase to see exercises</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Remaining locked weeks */}
              {listing.durationWeeks > (listing.weeks?.length || 0) && !purchased && (
                <div className="border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    + {listing.durationWeeks - (listing.weeks?.length || 0)} more weeks
                  </span>
                  <Lock className="w-4 h-4 text-gray-700" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Buy footer */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-gray-800">
          {purchased ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Check className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-bold">In your library</span>
              </div>
              <button onClick={() => { onClose(); navigate('/my-programs') }}
                className="btn-primary px-5 py-2.5 text-sm font-bold flex items-center gap-1">
                View Program <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={handleBuy}
              className="w-full btn-primary py-3.5 font-black text-base flex items-center justify-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              {listing.price === 0
                ? 'Add to My Library — Free'
                : `Purchase for $${listing.price}`}
            </button>
          )}
          {!loggedIn && (
            <p className="text-xs text-gray-600 text-center mt-2">You'll be asked to create a free account</p>
          )}
        </div>
      </div>

      {/* Confirm Purchase modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmOpen(false)} />
          <div className="relative w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-10 p-6">
            <div className="text-4xl text-center mb-4">{listing.thumbnail}</div>
            <h3 className="font-black text-white text-lg text-center mb-1">{listing.title}</h3>
            <p className="text-3xl font-black text-orange-400 text-center mb-4">${listing.price}</p>

            {/* Demo notice */}
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-yellow-400 text-center">
                <span className="font-bold">Demo Mode</span> — No real payment is processed.
                In production this connects to Stripe.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => { onPurchase(); setConfirmOpen(false) }}
                className="w-full btn-primary py-3 font-bold"
              >
                Complete Purchase
              </button>
              <button onClick={() => setConfirmOpen(false)}
                className="w-full py-2.5 text-gray-500 hover:text-white text-sm transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Day workout editor (full-screen modal) ───────────────────────────────────
function DayWorkoutModal({ weekNum, day, workout, onSave, onClose, onDelete }) {
  const [title, setTitle] = useState(workout?.title || '')
  const [exercises, setExercises] = useState(
    workout?.exercises?.length ? workout.exercises : [newEx()]
  )

  const handleSave = () => {
    if (!title.trim()) { alert('Please add a workout title'); return }
    onSave({ id: workout?.id || 'lw-' + Date.now(), day, title: title.trim(), exercises })
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900">
        <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium">Week {weekNum}</p>
          <p className="text-sm font-black text-white">{day}</p>
        </div>
        {onDelete && (
          <button onClick={onDelete}
            className="p-2 text-gray-600 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <button onClick={handleSave} className="btn-primary px-4 py-2 text-sm font-bold">
          Save
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full">
        <div>
          <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 block">
            Workout Title
          </label>
          <input
            className="input text-sm w-full"
            placeholder="e.g. Upper Body — Press Focus"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
        </div>
        <ExerciseBuilder exercises={exercises} setExercises={setExercises} />
      </div>
    </div>
  )
}

// ─── Week calendar grid ───────────────────────────────────────────────────────
function WeekCalendarView({ week, onChange }) {
  const [editingDay, setEditingDay] = useState(null)

  const getWorkout = (day) => week.workouts.find(w => w.day === day) || null

  const handleSave = (saved) => {
    const exists = week.workouts.some(w => w.day === editingDay)
    const newWorkouts = exists
      ? week.workouts.map(w => w.day === editingDay ? saved : w)
      : [...week.workouts, saved]
    onChange({ ...week, workouts: newWorkouts })
    setEditingDay(null)
  }

  const handleDelete = () => {
    onChange({ ...week, workouts: week.workouts.filter(w => w.day !== editingDay) })
    setEditingDay(null)
  }

  return (
    <>
      {/* 7-column calendar grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {FULL_DAYS.map((day, i) => {
          const wo = getWorkout(day)
          return (
            <div key={day} className="flex flex-col items-center gap-1">
              {/* Day label */}
              <span className="text-[10px] text-gray-600 font-semibold uppercase tracking-wide">
                {SHORT_DAYS[i]}
              </span>
              {/* Day cell */}
              <button
                type="button"
                onClick={() => setEditingDay(day)}
                className={`w-full rounded-xl flex flex-col items-center justify-center p-1.5 transition-all border min-h-[64px] ${
                  wo
                    ? 'bg-orange-500/10 border-orange-500/40 hover:border-orange-400/70 hover:bg-orange-500/15'
                    : 'bg-gray-800/30 border-gray-700/40 border-dashed hover:border-gray-600 hover:bg-gray-800/60'
                }`}
              >
                {wo ? (
                  <>
                    <span className="text-[9px] font-bold text-orange-300 leading-tight text-center line-clamp-3 w-full">
                      {wo.title}
                    </span>
                    <span className="text-[8px] text-gray-500 mt-1">
                      {wo.exercises?.length || 0} ex
                    </span>
                  </>
                ) : (
                  <Plus className="w-3.5 h-3.5 text-gray-600" />
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Workout list summary below calendar */}
      {week.workouts.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
            {week.workouts.length} workout{week.workouts.length !== 1 ? 's' : ''} this week
          </p>
          {FULL_DAYS.filter(d => getWorkout(d)).map(day => {
            const wo = getWorkout(day)
            return (
              <button
                key={day}
                type="button"
                onClick={() => setEditingDay(day)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-xl text-left transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-black text-orange-400">{day.slice(0, 3).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{wo.title}</p>
                  <p className="text-xs text-gray-500">
                    {wo.exercises?.length || 0} exercise{(wo.exercises?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>
                <Pencil className="w-3.5 h-3.5 text-gray-600 flex-shrink-0" />
              </button>
            )
          })}
        </div>
      )}

      {/* Day editor */}
      {editingDay && (
        <DayWorkoutModal
          weekNum={week.weekNum}
          day={editingDay}
          workout={getWorkout(editingDay)}
          onSave={handleSave}
          onClose={() => setEditingDay(null)}
          onDelete={getWorkout(editingDay) ? handleDelete : null}
        />
      )}
    </>
  )
}

// ─── Listing Editor (full-screen) ─────────────────────────────────────────────
function ListingEditor({ existing, onClose, onSave }) {
  const [title, setTitle] = useState(existing?.title || '')
  const [shortDesc, setShortDesc] = useState(existing?.shortDesc || '')
  const [description, setDescription] = useState(existing?.description || '')
  const [price, setPrice] = useState(existing?.price ?? '')
  const [category, setCategory] = useState(existing?.category || 'strength')
  const [level, setLevel] = useState(existing?.level || 'beginner')
  const [durationWeeks, setDurationWeeks] = useState(existing?.durationWeeks || 8)
  const [daysPerWeek, setDaysPerWeek] = useState(existing?.daysPerWeek || 3)
  const [thumbnail, setThumbnail] = useState(existing?.thumbnail || '🏋️')
  const [isPublished, setIsPublished] = useState(existing?.isPublished ?? false)
  const [weeks, setWeeks] = useState(existing?.weeks || [
    { weekNum: 1, workouts: [] }
  ])
  const [tab, setTab] = useState('info')
  const [activeWeekIdx, setActiveWeekIdx] = useState(0)

  const addWeek = () => {
    const nextNum = (weeks[weeks.length - 1]?.weekNum || 0) + 1
    setWeeks(prev => [...prev, { weekNum: nextNum, workouts: [] }])
    setActiveWeekIdx(weeks.length) // jump to newly added week
  }

  const deleteWeek = (idx) => {
    if (weeks.length <= 1) { alert('You need at least 1 week'); return }
    setWeeks(ws => ws.filter((_, i) => i !== idx))
    setActiveWeekIdx(Math.max(0, idx - 1))
  }

  const handleSave = (publish = null) => {
    if (!title.trim()) { alert('Please enter a title'); return }
    const listing = {
      title: title.trim(), shortDesc: shortDesc.trim(), description: description.trim(),
      price: parseFloat(price) || 0, category, level,
      durationWeeks: parseInt(durationWeeks) || 8, daysPerWeek: parseInt(daysPerWeek) || 3,
      thumbnail, weeks,
      isPublished: publish !== null ? publish : isPublished,
      gymId: null,
    }
    onSave(listing, existing?.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-800 bg-gray-900">
        <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">{existing ? 'Edit Program' : 'Create Program'}</p>
          <p className="text-sm font-bold text-white truncate">{title || 'Untitled Program'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="btn-ghost text-xs px-3 py-1.5"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="btn-primary text-xs px-3 py-1.5 font-bold flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            {existing?.isPublished ? 'Update' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex border-b border-gray-800 bg-gray-900">
        {['info', 'content'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-bold capitalize transition-colors ${tab === t ? 'text-orange-400 border-b-2 border-orange-500' : 'text-gray-500 hover:text-white'}`}
          >
            {t === 'info' ? '📋 Info & Pricing' : '🏋️ Program Content'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── Info tab ── */}
        {tab === 'info' && (
          <div className="p-5 space-y-5 max-w-lg mx-auto">

            {/* Thumbnail */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2 block">Cover Icon</label>
              <div className="flex flex-wrap gap-2">
                {THUMBNAIL_OPTIONS.map(e => (
                  <button key={e} type="button" onClick={() => setThumbnail(e)}
                    className={`w-10 h-10 rounded-xl text-2xl flex items-center justify-center border transition-all ${thumbnail === e ? 'border-orange-500 bg-orange-500/20' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 block">Program Title *</label>
              <input className="input text-sm w-full" placeholder="e.g. 8-Week Strength Foundation"
                value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            {/* Short description */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 block">Short Description (shown on card)</label>
              <input className="input text-sm w-full" placeholder="One-liner that sells the program…"
                value={shortDesc} onChange={e => setShortDesc(e.target.value)} />
            </div>

            {/* Full description */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 block">Full Description</label>
              <textarea className="input resize-none text-sm w-full" rows={5}
                placeholder="Full details, what's included, who it's for…"
                value={description} onChange={e => setDescription(e.target.value)} />
            </div>

            {/* Price */}
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 block">Price (USD) — enter 0 for free</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                <input type="number" min="0" step="1" className="input text-sm w-full pl-7"
                  placeholder="49" value={price} onChange={e => setPrice(e.target.value)} />
              </div>
            </div>

            {/* Grid: category, level, duration, days */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 block">Category</label>
                <select className="input text-sm w-full" value={category} onChange={e => setCategory(e.target.value)}>
                  {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                    <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 block">Level</label>
                <select className="input text-sm w-full" value={level} onChange={e => setLevel(e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 block">Duration (weeks)</label>
                <select className="input text-sm w-full" value={durationWeeks} onChange={e => setDurationWeeks(e.target.value)}>
                  {WEEK_OPTIONS.map(w => <option key={w} value={w}>{w} weeks</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 block">Days / week</label>
                <select className="input text-sm w-full" value={daysPerWeek} onChange={e => setDaysPerWeek(e.target.value)}>
                  {[2,3,4,5,6].map(d => <option key={d} value={d}>{d} days</option>)}
                </select>
              </div>
            </div>

          </div>
        )}

        {/* ── Content tab ── */}
        {tab === 'content' && (
          <div>

            {/* Week selector bar */}
            <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-3 border-b border-gray-800 bg-gray-900 overflow-x-auto">
              {weeks.map((week, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActiveWeekIdx(i)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                    activeWeekIdx === i
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                      : 'bg-gray-800 border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
                >
                  W{week.weekNum}
                  {week.workouts.length > 0 && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeWeekIdx === i ? 'bg-white/20' : 'bg-gray-700 text-gray-400'}`}>
                      {week.workouts.length}
                    </span>
                  )}
                </button>
              ))}
              {/* Add week */}
              <button
                type="button"
                onClick={addWeek}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-bold bg-gray-800 border border-dashed border-gray-600 text-gray-500 hover:text-orange-400 hover:border-orange-500/40 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Week
              </button>
            </div>

            {/* Active week calendar */}
            <div className="p-4 max-w-lg mx-auto w-full">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-white text-base">Week {weeks[activeWeekIdx]?.weekNum}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Tap a day to add or edit a workout</p>
                </div>
                {weeks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteWeek(activeWeekIdx)}
                    className="text-xs text-gray-600 hover:text-red-400 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove week
                  </button>
                )}
              </div>

              <WeekCalendarView
                week={weeks[activeWeekIdx]}
                onChange={(updated) => setWeeks(ws => ws.map((w, i) => i === activeWeekIdx ? updated : w))}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Store Page ──────────────────────────────────────────────────────────
export default function Store() {
  const { state, dispatch, currentUser } = useApp()
  const navigate = useNavigate()
  const [catFilter, setCatFilter] = useState('all')
  const [selectedListing, setSelectedListing] = useState(null)
  const [editingListing, setEditingListing] = useState(null)
  const [creatingNew, setCreatingNew] = useState(false)
  const [successId, setSuccessId] = useState(null)

  const listings = (state.programListings || []).filter(l => l.isPublished || l.coachId === currentUser?.id)
  const myPurchases = (state.purchases || []).filter(p => p.buyerId === currentUser?.id)
  const isCoach = currentUser?.role === 'coach'

  const filtered = useMemo(() =>
    catFilter === 'all' ? listings : listings.filter(l => l.category === catFilter),
    [listings, catFilter]
  )

  const isPurchased = (listingId) => myPurchases.some(p => p.listingId === listingId)

  const handlePurchase = (listing) => {
    if (!currentUser) { navigate('/register'); return }
    dispatch({ type: 'PURCHASE_LISTING', listingId: listing.id, price: listing.price })
    setSelectedListing(null)
    setSuccessId(listing.id)
    setTimeout(() => setSuccessId(null), 3500)
  }

  const handleSaveListing = (data, existingId) => {
    if (existingId) {
      dispatch({ type: 'UPDATE_PROGRAM_LISTING', listingId: existingId, updates: data })
    } else {
      dispatch({ type: 'ADD_PROGRAM_LISTING', listing: data })
    }
  }

  const handleDeleteListing = (listingId) => {
    if (window.confirm('Delete this program and all purchases? This cannot be undone.')) {
      dispatch({ type: 'DELETE_PROGRAM_LISTING', listingId })
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-16">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-5 h-5 text-orange-400" />
            <h1 className="text-2xl font-black text-white">Program Store</h1>
          </div>
          <p className="text-gray-500 text-sm">Coach-designed programs for every goal</p>
        </div>
        {isCoach && (
          <button
            onClick={() => setCreatingNew(true)}
            className="btn-primary flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> Create
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCatFilter(cat.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${catFilter === cat.value ? 'bg-orange-500 text-white' : 'bg-gray-900 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'}`}
          >
            <span>{cat.emoji}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* Coach: unpublished programs management */}
      {isCoach && (() => {
        const myListings = (state.programListings || []).filter(l => l.coachId === currentUser.id)
        if (!myListings.length) return null
        const unpublished = myListings.filter(l => !l.isPublished)
        if (!unpublished.length) return null
        return (
          <div className="mb-5">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">Your Drafts</p>
            <div className="space-y-2">
              {unpublished.map(listing => (
                <div key={listing.id} className="flex items-center gap-3 bg-gray-900 border border-gray-800 border-dashed rounded-xl px-4 py-3">
                  <span className="text-2xl">{listing.thumbnail}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{listing.title}</p>
                    <p className="text-xs text-gray-500">Draft · {listing.weeks?.length || 0} weeks built</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setEditingListing(listing)}
                      className="p-1.5 text-gray-500 hover:text-white transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteListing(listing.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Success toast */}
      {successId && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 font-bold text-sm">
          <Check className="w-4 h-4" /> Added to your library!
        </div>
      )}

      {/* Program grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🏪</p>
          <p className="text-white font-bold text-lg mb-1">No programs found</p>
          <p className="text-gray-500 text-sm">
            {isCoach ? 'Create your first program to get started' : 'Check back soon — programs are coming!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map(listing => (
            <ProgramCard
              key={listing.id}
              listing={listing}
              purchased={isPurchased(listing.id)}
              isCoach={isCoach && listing.coachId === currentUser?.id}
              onSelect={setSelectedListing}
              onEdit={setEditingListing}
            />
          ))}
        </div>
      )}

      {/* My purchases summary (logged-in member) */}
      {currentUser && !isCoach && myPurchases.length > 0 && (
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-white text-sm">Your Library</p>
            <span className="text-xs text-gray-500">{myPurchases.length} program{myPurchases.length !== 1 ? 's' : ''}</span>
          </div>
          <button onClick={() => navigate('/my-programs')}
            className="text-orange-400 text-sm font-medium hover:text-orange-300 transition-colors flex items-center gap-1 mt-1">
            View in My Programs <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Not logged in CTA */}
      {!currentUser && (
        <div className="mt-10 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 text-center">
          <p className="font-black text-white text-lg mb-2">Ready to start training?</p>
          <p className="text-gray-400 text-sm mb-4">Create a free account to purchase programs and track your progress</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/register')} className="btn-primary px-6 py-2.5 font-bold">
              Sign Up Free
            </button>
            <button onClick={() => navigate('/login')} className="btn-ghost px-6 py-2.5">
              Log In
            </button>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selectedListing && (
        <DetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          purchased={isPurchased(selectedListing.id)}
          loggedIn={!!currentUser}
          onPurchase={() => handlePurchase(selectedListing)}
        />
      )}

      {/* Create/Edit editor */}
      {(creatingNew || editingListing) && (
        <ListingEditor
          existing={editingListing || null}
          onClose={() => { setCreatingNew(false); setEditingListing(null) }}
          onSave={handleSaveListing}
        />
      )}
    </div>
  )
}
