import { useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  Plus, Trash2, X, ChevronLeft, ChevronRight, Flame,
  BookOpen, Check, Pencil, Calendar, Star,
} from 'lucide-react'

// ─── Helpers ─────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0]

const formatDate = (dateStr) =>
  new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })

const getLast7Days = () => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })
}

// Fixed: if today isn't checked yet, start from yesterday so streak
// doesn't collapse to 0 before the member has a chance to check in.
const getStreak = (habitId, habitLogs) => {
  let streak = 0
  const d = new Date()
  const todayStr = d.toISOString().split('T')[0]
  const todayDone = habitLogs.some(
    l => l.habitId === habitId && l.date === todayStr && l.completed
  )
  if (!todayDone) d.setDate(d.getDate() - 1) // start counting from yesterday
  while (true) {
    const dateStr = d.toISOString().split('T')[0]
    const log = habitLogs.find(l => l.habitId === habitId && l.date === dateStr && l.completed)
    if (!log) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

// ─── Streak milestones ────────────────────────────────────────────────────────
const MILESTONES = [
  { days: 7,   emoji: '🔥', label: 'Week Warrior',  color: 'text-orange-400 bg-orange-500/15 border-orange-500/40' },
  { days: 10,  emoji: '⚡', label: '10-Day Streak', color: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/40' },
  { days: 20,  emoji: '💪', label: '20-Day Streak', color: 'text-blue-400 bg-blue-500/15 border-blue-500/40' },
  { days: 50,  emoji: '🏆', label: '50-Day Streak', color: 'text-purple-400 bg-purple-500/15 border-purple-500/40' },
  { days: 100, emoji: '🌟', label: 'Legend',        color: 'text-yellow-300 bg-yellow-400/15 border-yellow-400/40' },
]

// Highest milestone the current streak has reached
const getEarnedMilestone = (streak) =>
  [...MILESTONES].reverse().find(m => streak >= m.days) || null

// Next milestone the member is working toward
const getNextMilestone = (streak) =>
  MILESTONES.find(m => streak < m.days) || null

// ─── Mood config ─────────────────────────────────────────────────────────────
const MOODS = [
  { value: 'great',   emoji: '💪', label: 'Crushing It',  color: 'border-orange-500 bg-orange-500/15 text-orange-400' },
  { value: 'good',    emoji: '😊', label: 'Good',         color: 'border-green-500 bg-green-500/15 text-green-400' },
  { value: 'okay',    emoji: '😐', label: 'Okay',         color: 'border-yellow-500 bg-yellow-500/15 text-yellow-400' },
  { value: 'tired',   emoji: '😴', label: 'Tired',        color: 'border-blue-400 bg-blue-400/15 text-blue-400' },
  { value: 'tough',   emoji: '😤', label: 'Tough Day',    color: 'border-red-400 bg-red-400/15 text-red-400' },
]

const getMood = (val) => MOODS.find(m => m.value === val) || null

// ─── Preset habit emojis ──────────────────────────────────────────────────────
const EMOJI_OPTIONS = ['💧', '🥗', '🧘', '😴', '📖', '🏃', '🧘', '💊', '🚶', '✅', '🎯', '💪']

// ─── Add Habit Modal ──────────────────────────────────────────────────────────
function AddHabitModal({ onClose, onAdd }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [emoji, setEmoji] = useState('✅')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ name: name.trim(), description: description.trim(), emoji })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="font-black text-white">New Habit</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Emoji picker */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all ${emoji === e ? 'border-orange-500 bg-orange-500/20' : 'border-gray-700 bg-gray-800 hover:border-gray-600'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 block">Habit Name *</label>
            <input
              className="input text-sm w-full"
              placeholder="e.g. Drink 64oz of water"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 block">Note (optional)</label>
            <input
              className="input text-sm w-full"
              placeholder="e.g. First thing in the morning"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-primary w-full py-3 font-bold">
            Add Habit
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Journal Entry Modal ──────────────────────────────────────────────────────
function JournalModal({ existing, onClose, onSave }) {
  const [title, setTitle] = useState(existing?.title || '')
  const [content, setContent] = useState(existing?.content || '')
  const [mood, setMood] = useState(existing?.mood || null)
  const [date, setDate] = useState(existing?.date || today())

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!content.trim()) return
    onSave({ title: title.trim(), content: content.trim(), mood, date })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl z-10 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-shrink-0">
          <h2 className="font-black text-white">{existing ? 'Edit Entry' : 'New Entry'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Date */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 block">Date</label>
            <input
              type="date"
              className="input text-sm w-full"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>

          {/* Mood */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2 block">How are you feeling?</label>
            <div className="flex gap-2 flex-wrap">
              {MOODS.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(mood === m.value ? null : m.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${mood === m.value ? m.color : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600'}`}
                >
                  <span>{m.emoji}</span> {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 block">Title (optional)</label>
            <input
              className="input text-sm w-full"
              placeholder="Give this entry a title…"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Content */}
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1 block">Entry *</label>
            <textarea
              className="input resize-none text-sm w-full"
              rows={6}
              placeholder="What's on your mind? How did training feel? What are you grateful for today?"
              value={content}
              onChange={e => setContent(e.target.value)}
              required
              autoFocus={!existing}
            />
          </div>

          <button type="submit" className="btn-primary w-full py-3 font-bold">
            {existing ? 'Save Changes' : 'Save Entry'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Milestone celebration overlay ───────────────────────────────────────────
function MilestoneCelebration({ habit, milestone, onClose }) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-gray-900 border border-gray-700 rounded-3xl p-8 max-w-xs w-full text-center shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Sparkle ring */}
        <div className="w-24 h-24 rounded-full bg-orange-500/10 border-2 border-orange-500/40 flex items-center justify-center mx-auto mb-5">
          <span className="text-5xl">{milestone.emoji}</span>
        </div>

        <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-2">Badge Unlocked!</p>
        <h2 className="text-2xl font-black text-white mb-1">{milestone.label}</h2>
        <p className="text-gray-400 text-sm mb-1">
          <span className="text-white font-semibold">{habit.emoji} {habit.name}</span>
        </p>
        <p className="text-gray-500 text-sm mb-6">
          {milestone.days} days in a row — keep it going!
        </p>

        {/* Stars */}
        <div className="flex justify-center gap-1 mb-6">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
          ))}
        </div>

        <button
          onClick={onClose}
          className="btn-primary w-full py-3 font-bold"
        >
          Let's Go! 💪
        </button>
      </div>
    </div>
  )
}

// ─── Habits Tab ───────────────────────────────────────────────────────────────
function HabitsTab({ userId }) {
  const { state, dispatch } = useApp()
  const [showAdd, setShowAdd] = useState(false)
  const [celebrating, setCelebrating] = useState(null) // { habit, milestone }

  const myHabits = (state.habitDefs || []).filter(h => h.userId === userId)
  const myLogs = (state.habitLogs || []).filter(l => l.userId === userId)
  const last7 = getLast7Days()
  const todayStr = today()

  const isCompleted = (habitId, date) =>
    myLogs.some(l => l.habitId === habitId && l.date === date && l.completed)

  const toggle = (habit) => {
    const wasDone = isCompleted(habit.id, todayStr)

    // If we're checking it off, see if we're hitting a milestone
    if (!wasDone) {
      const currentStreak = getStreak(habit.id, myLogs) // streak before today
      const newStreak = currentStreak + 1
      const milestone = MILESTONES.find(m => m.days === newStreak)
      if (milestone) {
        setTimeout(() => setCelebrating({ habit, milestone }), 300)
      }
    }

    dispatch({ type: 'TOGGLE_HABIT_LOG', habitId: habit.id, date: todayStr })
  }

  const deleteHabit = (defId) => {
    if (window.confirm('Delete this habit and all its history?')) {
      dispatch({ type: 'DELETE_HABIT_DEF', defId })
    }
  }

  const addHabit = ({ name, description, emoji }) => {
    dispatch({ type: 'ADD_HABIT_DEF', name, description, emoji })
  }

  // Today completion %
  const doneToday = myHabits.filter(h => isCompleted(h.id, todayStr)).length
  const pct = myHabits.length ? Math.round((doneToday / myHabits.length) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Today summary */}
      {myHabits.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Today's Progress</p>
              <p className="text-2xl font-black text-white mt-0.5">{doneToday}/{myHabits.length} habits</p>
            </div>
            {pct === 100 && (
              <div className="flex items-center gap-1 bg-orange-500/15 border border-orange-500/30 rounded-xl px-3 py-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-orange-400 text-sm font-bold">Perfect day!</span>
              </div>
            )}
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Habit list */}
      {myHabits.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-white font-bold text-lg mb-1">No habits yet</p>
          <p className="text-gray-500 text-sm mb-6">Add habits you want to build — check them off daily to build streaks and unlock badges</p>
          <button onClick={() => setShowAdd(true)} className="btn-primary px-6 py-2.5">
            <Plus className="w-4 h-4 inline mr-1" /> Add Your First Habit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {myHabits.map(habit => {
            const streak = getStreak(habit.id, myLogs)
            const done = isCompleted(habit.id, todayStr)
            const earnedMilestone = getEarnedMilestone(streak)
            const nextMilestone = getNextMilestone(streak)
            const daysToNext = nextMilestone ? nextMilestone.days - streak : 0

            return (
              <div key={habit.id} className={`rounded-2xl border transition-all ${done ? 'bg-orange-500/5 border-orange-500/20' : 'bg-gray-900 border-gray-800'}`}>
                {/* Main row */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  {/* Check button */}
                  <button
                    onClick={() => toggle(habit)}
                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-orange-500 border-orange-500' : 'border-gray-600 hover:border-orange-500/50'}`}
                  >
                    {done && <Check className="w-5 h-5 text-white font-bold" />}
                  </button>

                  {/* Emoji + name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{habit.emoji}</span>
                      <div className="min-w-0">
                        <p className={`font-bold text-sm leading-tight ${done ? 'text-white' : 'text-gray-200'}`}>
                          {habit.name}
                        </p>
                        {habit.description && (
                          <p className="text-xs text-gray-500 truncate">{habit.description}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Streak + badge */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {streak > 0 && (
                      <div className="flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-sm font-black text-orange-400">{streak}</span>
                        <span className="text-[10px] text-gray-600">days</span>
                      </div>
                    )}
                    {earnedMilestone && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${earnedMilestone.color}`}>
                        {earnedMilestone.emoji} {earnedMilestone.label}
                      </span>
                    )}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => deleteHabit(habit.id)}
                    className="text-gray-700 hover:text-red-400 transition-colors flex-shrink-0 ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 7-day history dots */}
                <div className="flex items-center gap-1 px-4 pb-2.5">
                  {last7.map(date => {
                    const checked = isCompleted(habit.id, date)
                    const isToday = date === todayStr
                    return (
                      <div key={date} className="flex-1 flex flex-col items-center gap-1">
                        <div className={`w-full h-1.5 rounded-full ${checked ? 'bg-orange-500' : 'bg-gray-800'}`} />
                        <span className={`text-[9px] font-medium ${isToday ? 'text-orange-400' : 'text-gray-700'}`}>
                          {new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Progress to next milestone */}
                {nextMilestone && streak > 0 && (
                  <div className="px-4 pb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-600">
                        {daysToNext} day{daysToNext !== 1 ? 's' : ''} to {nextMilestone.emoji} {nextMilestone.label}
                      </span>
                      <span className="text-[10px] text-gray-700">{streak}/{nextMilestone.days}</span>
                    </div>
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round((streak / nextMilestone.days) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* All milestones unlocked message */}
                {!nextMilestone && streak >= 100 && (
                  <div className="px-4 pb-3">
                    <p className="text-[10px] text-yellow-400/70 text-center">🌟 All badges unlocked — you're a legend!</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add button */}
      {myHabits.length > 0 && (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 border border-dashed border-gray-700 hover:border-orange-500/40 hover:text-orange-400 text-gray-500 rounded-2xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Habit
        </button>
      )}

      {/* Milestone badges legend */}
      {myHabits.length > 0 && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl px-4 py-3">
          <p className="text-[10px] text-gray-600 uppercase tracking-wide font-semibold mb-2.5">Streak Badges</p>
          <div className="flex flex-wrap gap-2">
            {MILESTONES.map(m => (
              <span key={m.days} className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${m.color} opacity-70`}>
                {m.emoji} {m.days}d · {m.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {showAdd && <AddHabitModal onClose={() => setShowAdd(false)} onAdd={addHabit} />}

      {/* Milestone celebration */}
      {celebrating && (
        <MilestoneCelebration
          habit={celebrating.habit}
          milestone={celebrating.milestone}
          onClose={() => setCelebrating(null)}
        />
      )}
    </div>
  )
}

// ─── Journal Tab ──────────────────────────────────────────────────────────────
function JournalTab({ userId }) {
  const { state, dispatch } = useApp()
  const [showNew, setShowNew] = useState(false)
  const [editing, setEditing] = useState(null)
  const [expanded, setExpanded] = useState(null)

  const myEntries = (state.journalEntries || [])
    .filter(e => e.userId === userId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const saveEntry = (data) => {
    dispatch({ type: 'ADD_JOURNAL_ENTRY', entry: data })
  }

  const updateEntry = (entryId, data) => {
    dispatch({ type: 'UPDATE_JOURNAL_ENTRY', entryId, entry: data })
  }

  const deleteEntry = (entryId) => {
    if (window.confirm('Delete this journal entry?')) {
      dispatch({ type: 'DELETE_JOURNAL_ENTRY', entryId })
      if (expanded === entryId) setExpanded(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* New entry button */}
      <button
        onClick={() => setShowNew(true)}
        className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500 hover:bg-orange-600 rounded-2xl text-white font-bold text-sm transition-colors shadow-lg shadow-orange-500/20"
      >
        <Plus className="w-4 h-4" /> Write Today's Entry
      </button>

      {/* Entries */}
      {myEntries.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📓</div>
          <p className="text-white font-bold text-lg mb-1">Your journal is empty</p>
          <p className="text-gray-500 text-sm">Start documenting your fitness journey — how you feel, what you're learning, what you're grateful for</p>
        </div>
      ) : (
        myEntries.map(entry => {
          const mood = getMood(entry.mood)
          const isOpen = expanded === entry.id

          return (
            <div key={entry.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              {/* Header row */}
              <button
                className="w-full flex items-start gap-3 px-4 py-4 text-left hover:bg-gray-800/40 transition-colors"
                onClick={() => setExpanded(isOpen ? null : entry.id)}
              >
                {/* Mood circle */}
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-xl flex-shrink-0 mt-0.5">
                  {mood ? mood.emoji : '📝'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">{formatDate(entry.date)}</span>
                    {mood && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${mood.color}`}>
                        {mood.label}
                      </span>
                    )}
                  </div>
                  <p className="text-white font-semibold text-sm mt-0.5 truncate">
                    {entry.title || entry.content.slice(0, 60) + (entry.content.length > 60 ? '…' : '')}
                  </p>
                  {!isOpen && entry.title && (
                    <p className="text-gray-500 text-xs mt-0.5 truncate">{entry.content.slice(0, 80)}</p>
                  )}
                </div>

                <ChevronRight className={`w-4 h-4 text-gray-600 flex-shrink-0 mt-1 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              </button>

              {/* Expanded body */}
              {isOpen && (
                <div className="px-4 pb-4 border-t border-gray-800">
                  <p className="text-gray-300 text-sm leading-relaxed mt-3 whitespace-pre-wrap">{entry.content}</p>
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-800">
                    <span className="text-[10px] text-gray-600 flex-1">
                      {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      onClick={() => setEditing(entry)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-gray-800"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-gray-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}

      {showNew && (
        <JournalModal onClose={() => setShowNew(false)} onSave={saveEntry} />
      )}
      {editing && (
        <JournalModal
          existing={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => { updateEntry(editing.id, data); setEditing(null) }}
        />
      )}
    </div>
  )
}

// ─── Main Journal Page ────────────────────────────────────────────────────────
export default function Journal() {
  const { currentUser } = useApp()
  const [tab, setTab] = useState('habits')

  if (!currentUser) return null

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Habits & Journal</h1>
        <p className="text-gray-500 text-sm mt-1">Track your daily habits and document your journey</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-900 border border-gray-800 rounded-xl p-1 mb-6">
        <button
          onClick={() => setTab('habits')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'habits' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:text-white'}`}
        >
          <Flame className="w-4 h-4" /> Habits
        </button>
        <button
          onClick={() => setTab('journal')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === 'journal' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-gray-500 hover:text-white'}`}
        >
          <BookOpen className="w-4 h-4" /> Journal
        </button>
      </div>

      {/* Tab content */}
      {tab === 'habits' ? (
        <HabitsTab userId={currentUser.id} />
      ) : (
        <JournalTab userId={currentUser.id} />
      )}
    </div>
  )
}
