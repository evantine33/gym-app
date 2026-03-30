import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { Search, UserCheck, Users, UserX, Mail, Phone, CalendarDays, Dumbbell, TrendingUp } from 'lucide-react'

const ROLE_META = {
  member:    { label: 'Gym Member',   color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
  nonmember: { label: 'Non-Member',   color: 'text-gray-400 bg-gray-800 border-gray-700' },
}

function MemberCard({ member, logs, workouts }) {
  const [expanded, setExpanded] = useState(false)
  const meta = ROLE_META[member.role] || ROLE_META.member

  // Stats
  const memberLogs = logs.filter(l => l.userId === member.id)
  const uniqueWorkoutsLogged = new Set(memberLogs.map(l => l.workoutId)).size
  const totalSetsLogged = memberLogs.reduce((n, l) => n + (l.sets?.length || 0), 0)

  // Assigned programs (workouts with assignedTo = this member)
  const assignedWorkouts = workouts.filter(w => w.assignedTo === member.id)
  const hasOwnProgram = assignedWorkouts.length > 0

  const joinDate = new Date(member.joinDate + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })

  return (
    <div className="card">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-sm font-black text-orange-400 flex-shrink-0">
          {member.initials}
        </div>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-white">{member.name}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>
              {meta.label}
            </span>
            {hasOwnProgram && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-blue-400 bg-blue-500/10 border-blue-500/30">
                Custom Program
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <CalendarDays className="w-3 h-3" /> Joined {joinDate}
          </p>
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-3 text-right flex-shrink-0">
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-white">{uniqueWorkoutsLogged}</p>
            <p className="text-[10px] text-gray-500">workouts</p>
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-white">{totalSetsLogged}</p>
            <p className="text-[10px] text-gray-500">sets</p>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-gray-500 hover:text-orange-400 transition-colors font-medium"
          >
            {expanded ? 'Less' : 'More'}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-800 space-y-3">
          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <a
              href={`mailto:${member.email}`}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-orange-400 transition-colors"
            >
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{member.email}</span>
            </a>
            {member.phone && (
              <a
                href={`tel:${member.phone}`}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-orange-400 transition-colors"
              >
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span>{member.phone}</span>
              </a>
            )}
          </div>

          {/* Activity */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
              <p className="text-lg font-black text-orange-400">{uniqueWorkoutsLogged}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Workouts logged</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
              <p className="text-lg font-black text-orange-400">{totalSetsLogged}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Total sets</p>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
              <p className="text-lg font-black text-orange-400">{assignedWorkouts.length}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">Assigned WODs</p>
            </div>
          </div>

          {/* Recent logs — grouped by workout */}
          {memberLogs.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Recent Workout Logs</p>
              <div className="space-y-3">
                {/* Get last 3 unique workouts logged */}
                {[...new Set(memberLogs.map(l => l.workoutId))]
                  .slice(-3).reverse()
                  .map(workoutId => {
                    const workout = workouts.find(w => w.id === workoutId)
                    const exLogs = memberLogs.filter(l => l.workoutId === workoutId)
                    const logDate = exLogs[0]?.date
                      ? new Date(exLogs[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : ''
                    return (
                      <div key={workoutId} className="bg-gray-800/60 border border-gray-700 rounded-xl overflow-hidden">
                        {/* Workout header */}
                        <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
                          <div className="flex items-center gap-2">
                            <Dumbbell className="w-3.5 h-3.5 text-orange-400" />
                            <span className="text-sm font-semibold text-white">{workout?.title || 'Workout'}</span>
                          </div>
                          <span className="text-[10px] text-gray-500">{logDate}</span>
                        </div>
                        {/* Exercise rows */}
                        <div className="divide-y divide-gray-800">
                          {exLogs.map(log => {
                            const maxWeight = Math.max(0, ...(log.sets || []).map(s => parseFloat(s.weight) || 0))
                            return (
                              <div key={log.id} className="px-3 py-2.5">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-sm text-orange-400 font-semibold">
                                    {log.exerciseName || '—'}
                                  </span>
                                  {maxWeight > 0 && (
                                    <span className="text-xs text-gray-400 font-medium">
                                      Top: {maxWeight} lbs
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {(log.sets || []).map((s, i) => (
                                    <span key={i}
                                      className="text-[11px] bg-gray-700 border border-gray-600 rounded-md px-2 py-0.5 text-gray-300">
                                      <span className="text-gray-500">S{i + 1}: </span>
                                      {s.reps || '—'}
                                      {s.weight ? <span className="text-gray-400"> @ {s.weight}</span> : ''}
                                    </span>
                                  ))}
                                </div>
                                {log.notes && (
                                  <p className="text-[11px] text-gray-500 mt-1.5 italic">"{log.notes}"</p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Members() {
  const { state, currentUser } = useApp()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'member' | 'nonmember'

  const gymId = currentUser?.gymId
  const gymMembers = state.users.filter(u =>
    u.gymId === gymId && (u.role === 'member' || u.role === 'nonmember')
  )
  const gymLogs = state.workoutLogs.filter(l => l.gymId === gymId)
  const gymWorkouts = state.workouts.filter(w => w.gymId === gymId)

  const filtered = gymMembers
    .filter(m => filter === 'all' || m.role === filter)
    .filter(m =>
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  const memberCount = gymMembers.filter(m => m.role === 'member').length
  const nonMemberCount = gymMembers.filter(m => m.role === 'nonmember').length
  const activeCount = gymMembers.filter(m => gymLogs.some(l => l.userId === m.id)).length

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Members</h1>
        <p className="text-gray-400 text-sm mt-0.5">{gymMembers.length} total in your gym</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center py-3">
          <UserCheck className="w-5 h-5 text-orange-400 mx-auto mb-1" />
          <p className="text-xl font-black text-white">{memberCount}</p>
          <p className="text-[11px] text-gray-500">Gym Members</p>
        </div>
        <div className="card text-center py-3">
          <Users className="w-5 h-5 text-gray-400 mx-auto mb-1" />
          <p className="text-xl font-black text-white">{nonMemberCount}</p>
          <p className="text-[11px] text-gray-500">Non-Members</p>
        </div>
        <div className="card text-center py-3">
          <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <p className="text-xl font-black text-white">{activeCount}</p>
          <p className="text-[11px] text-gray-500">Have Logged</p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className="input pl-9"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="input w-auto bg-gray-800 cursor-pointer"
        >
          <option value="all">All</option>
          <option value="member">Gym Members</option>
          <option value="nonmember">Non-Members</option>
        </select>
      </div>

      {/* Member list */}
      {gymMembers.length === 0 ? (
        <div className="card text-center py-14">
          <UserX className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-300 font-semibold">No members yet</p>
          <p className="text-gray-500 text-sm mt-1">Share your join code so members can sign up</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2">
            <span className="text-xs text-gray-500">Join Code</span>
            <span className="font-mono font-bold text-orange-400 tracking-widest text-lg">
              {state.gyms.find(g => g.id === gymId)?.joinCode}
            </span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-10">
          <p className="text-gray-400">No members match your search</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              logs={gymLogs}
              workouts={gymWorkouts}
            />
          ))}
        </div>
      )}
    </div>
  )
}
